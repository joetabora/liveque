# IronQueue

**Premium real-time service queue display system** — built for Harley-Davidson dealerships and high-end service shops.

## Overview

IronQueue provides two core interfaces:

- **`/display`** — Full-screen TV display showing the live queue (who's being served, who's next)
- **`/admin`** — Staff dashboard for managing the queue (add, serve, skip, reorder, remove)

Both update in real-time via Firebase Firestore. Changes made in the admin dashboard instantly reflect on every connected display screen.

---

## Tech Stack

| Layer       | Technology                                  |
| ----------- | ------------------------------------------- |
| Framework   | Next.js 16 (App Router)                     |
| Language    | TypeScript                                  |
| Styling     | Tailwind CSS v4                             |
| Database    | Firebase Firestore (real-time)              |
| Auth        | Firebase Auth (optional)                    |
| Animations  | Framer Motion                               |
| Drag & Drop | @hello-pangea/dnd                           |
| Deployment  | Vercel                                      |

---

## Getting Started

### 1. Clone and install

```bash
git clone <your-repo-url>
cd liveque
npm install
```

### 2. Set up Firebase

1. Go to [Firebase Console](https://console.firebase.google.com) and create a new project
2. Enable **Firestore Database** (start in test mode for development)
3. Go to **Project Settings → General → Your Apps** and add a Web app
4. Copy the Firebase config values

### 3. Configure environment variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase config:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Create Firestore index

The app requires a composite index for the queue collection. When you first run the app and try to load the queue, Firebase will log a URL in the browser console to create the required index. Click it to auto-create, or manually create:

- **Collection:** `queue`
- **Fields:** `status` (Ascending) + `position` (Ascending)

### 5. Run locally

```bash
npm run dev
```

Open:
- [http://localhost:3000](http://localhost:3000) — Landing page
- [http://localhost:3000/display](http://localhost:3000/display) — TV display
- [http://localhost:3000/admin](http://localhost:3000/admin) — Staff dashboard

---

## Deploying to Vercel

1. Push this repo to GitHub
2. Import the repo in [Vercel](https://vercel.com)
3. Add your Firebase environment variables in Vercel's project settings
4. Deploy — that's it

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx            # Root layout + fonts
│   ├── page.tsx              # Landing page
│   ├── globals.css           # Design tokens + custom utilities
│   ├── admin/
│   │   ├── page.tsx          # Admin route (client wrapper)
│   │   └── AdminClient.tsx   # Full admin dashboard
│   └── display/
│       ├── page.tsx          # Display route (client wrapper)
│       └── DisplayClient.tsx # Full TV display
├── components/
│   ├── IronQueueLogo.tsx     # Brand logo component
│   └── ui/
│       ├── Badge.tsx         # Status badges with pulse
│       ├── Button.tsx        # Multi-variant button system
│       ├── Clock.tsx         # Live clock
│       ├── ConfirmModal.tsx  # Confirmation dialog
│       └── Panel.tsx         # Card/panel wrapper
├── hooks/
│   ├── useQueue.ts           # Real-time queue listener
│   └── useAuth.ts            # Firebase Auth hook
└── lib/
    ├── firebase.ts           # Firebase initialization
    ├── types.ts              # TypeScript types + service list
    ├── constants.ts          # Theme + app constants
    └── queue-operations.ts   # All Firestore CRUD operations
```

---

## Firestore Data Model

**Collection: `queue`**

| Field         | Type      | Description                        |
| ------------- | --------- | ---------------------------------- |
| `name`        | string    | Customer name or ticket number     |
| `serviceType` | string?   | Type of service (optional)         |
| `status`      | string    | `"waiting"`, `"serving"`, `"done"` |
| `position`    | number    | Order in the waiting queue         |
| `createdAt`   | timestamp | When the entry was created         |

**Rules:**
- Only one item can have `status: "serving"` at a time
- "Call Next" marks current serving as `done` and promotes the next waiting item
- Positions auto-recalculate on reorder

---

## Features

### Display Screen (`/display`)
- Huge "Now Serving" display optimized for 1080p TVs
- Up to 5 upcoming customers shown
- Estimated wait times
- Live clock
- Fullscreen kiosk mode (click the expand button)
- Sound notification when "Now Serving" changes
- Orange border flash on transitions
- Smooth Framer Motion animations

### Admin Dashboard (`/admin`)
- Add customer with name and optional service type
- "Call Next" button — auto-promotes next in queue
- Per-item actions: Serve, Skip, Remove
- Drag-and-drop reorder
- "Clear Queue" with confirmation modal
- Real-time badge showing queue count
- Works on iPad/tablet
- Direct link to open display in new tab

---

## Optional: Firebase Auth

The `useAuth` hook is pre-built. To protect the admin route:

1. Enable Email/Password auth in Firebase Console
2. Create a staff user account
3. Wrap the admin page with an auth gate that checks `useAuth().user`

---

## License

MIT
