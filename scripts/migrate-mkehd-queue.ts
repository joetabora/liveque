import "dotenv/config";
import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const MKEHD_SLUG = process.env.LEGACY_TENANT_SLUG ?? "mkehd";

function initFirebase() {
  if (getApps().length > 0) return getFirestore();

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
    });
  } else {
    initializeApp({ projectId: projectId ?? "demo" });
  }

  return getFirestore();
}

async function migrate() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });
  const firestore = initFirebase();

  const [tenant] = await db
    .select()
    .from(schema.tenants)
    .where(eq(schema.tenants.slug, MKEHD_SLUG))
    .limit(1);

  if (!tenant) {
    console.error(`Tenant "${MKEHD_SLUG}" not found. Run npm run db:seed first.`);
    process.exit(1);
  }

  console.log(`Migrating queue data to tenant ${tenant.id} (${MKEHD_SLUG})...`);

  const legacySnapshot = await firestore.collection("queue").get();
  console.log(`Found ${legacySnapshot.size} documents in legacy queue collection`);

  if (legacySnapshot.empty) {
    console.log("Nothing to migrate.");
    return;
  }

  const targetCol = firestore
    .collection("tenants")
    .doc(tenant.id)
    .collection("queue");

  let migrated = 0;
  let skipped = 0;

  for (const doc of legacySnapshot.docs) {
    const existing = await targetCol.doc(doc.id).get();
    if (existing.exists) {
      skipped++;
      continue;
    }

    await targetCol.doc(doc.id).set(doc.data());
    migrated++;
  }

  console.log(`Migration complete: ${migrated} migrated, ${skipped} skipped (already exist)`);
}

migrate()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
