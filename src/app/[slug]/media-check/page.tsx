import { notFound } from "next/navigation";
import { getMediaPortraitPlaylist } from "@/lib/media-playlist-server";
import { getTenantBySlugServer } from "@/lib/tenant-server";
import { USE_LEGACY_QUEUE } from "@/lib/constants";
import QueueCheckClient from "./QueueCheckClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * Public no-login checklist page for diagnosing Media playlist on kiosk browsers.
 * Open: /mkehd/media-check
 */
export default async function MediaCheckPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantBySlugServer(slug);
  if (!tenant) notFound();

  const playlist = await getMediaPortraitPlaylist(slug);

  return (
    <div className="min-h-screen bg-iron-black text-white p-6 md:p-10">
      <h1 className="text-3xl font-black">Media playlist check</h1>
      <p className="mt-2 text-gray-400">
        Tenant: <span className="text-white font-semibold">{tenant.name}</span> (
        {slug})
      </p>
      <p className="mt-6 text-2xl font-bold text-brand-primary">
        {playlist.length} active video{playlist.length === 1 ? "" : "s"} for Media
        Portrait
      </p>
      {playlist.length === 0 ? (
        <p className="mt-4 text-red-400">
          No active videos found in the database for this tenant.
        </p>
      ) : (
        <ol className="mt-6 space-y-4 list-decimal list-inside text-lg">
          {playlist.map((item) => (
            <li key={item.id} className="border border-iron-border rounded-xl p-4">
              <div className="font-bold">{item.title}</div>
              <div className="text-sm text-gray-500 break-all mt-1">
                {item.videoUrl}
              </div>
            </li>
          ))}
        </ol>
      )}
      <p className="mt-10 text-sm text-gray-500 max-w-xl">
        If this page shows all videos but Settings → Media does not, scroll down
        on that page (touch screens often need a swipe). If this page also shows
        one/zero, this device is not loading production data — check the URL
        host.
      </p>
      <QueueCheckClient tenantId={tenant.id} useLegacy={USE_LEGACY_QUEUE} />
      <p className="mt-4 text-sm space-x-4">
        <a
          href={`/${slug}/settings/media`}
          className="text-brand-primary hover:underline"
        >
          Open Media settings →
        </a>
        <a
          href={`/${slug}/display/media-portrait?kiosk=1`}
          className="text-brand-primary hover:underline"
        >
          Open Media Portrait →
        </a>
      </p>
    </div>
  );
}
