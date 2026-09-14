# Novix Messenger - Next.js Backend + Admin Dashboard

**Full Backend + Admin Dashboard** for Novix Messenger (WhatsApp-like UI + Telegram features).

This is the **standalone Next.js** part of the project.

## Architecture
- **Framework**: Next.js 16 (App Router)
- **Database**: MongoDB + Mongoose
- **Auth**: JWT + bcrypt
- **Real-time**: Socket.io (via custom HTTP server)
- **Admin Dashboard**: Built-in admin panel at `/admin`
- **API**: REST + Socket.io endpoints

## Features (Full MVP)
- User registration & login (JWT)
- Profile management + avatar upload
- User search
- Friend requests & friends list
- 1:1 real-time messaging
- Group chats (create, add/remove members, group messages)
- Advanced messaging: emoji reactions, replies, delete, pin/unpin, read receipts
- Image/photo messages + gallery
- Typing indicators, presence (online/offline, last seen)
- Privacy settings (last-seen, read receipts, notifications)
- Full Admin Dashboard (users, friends management)

## Project Structure
```
novix-messenger-next.js/
├── app/
│   ├── api/           # REST API routes (auth, users, friends, messages, groups, etc.)
│   ├── admin/         # Admin Dashboard UI
│   ├── auth/          # Login/Register pages
│   ├── layout.tsx
│   └── page.tsx
├── models/            # Mongoose models (User, Message, Friendship, Group)
├── lib/               # Utilities (mongodb, auth, socket)
├── public/uploads/    # Uploaded images served here
├── server.js          # Custom server (Next.js + Socket.io)
├── package.json
├── .env.local
└── README.md
```

## Quick Start

### 1. Environment
```bash
cp .env.example .env.local
```

Edit `.env.local`:
```env
DATABASE_URL=data/novix.db
JWT_SECRET=your-super-secret-key
JWT_REFRESH_SECRET=your-refresh-key
ADMIN_EMAIL=admin@novix.com
ADMIN_PASSWORD=admin123
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Initialize Database
SQLite runs natively in WAL mode with zero external servers required:
```bash
npm run seed
```

### 4. Run the App
```bash
npm run dev
```

The server starts on **http://localhost:3000**

- Admin Dashboard: http://localhost:3000/admin
- Login (admin): admin@novix.com / admin123

### Other Scripts
```bash
npm run dev:next     # Run only Next.js dev server (no socket)
npm run build        # Production build
npm start            # Production server
```

## Important Notes
- Uses `tsx` to run TypeScript `server.js` directly.
- Socket.io is initialized in `server.js` using `initSocketServer()`.
- All uploads go to `public/uploads/` and are served at `/uploads/...`
- The mobile Flutter app connects to this backend.

## API Highlights
- `/api/auth/*` — Register, Login, Me
- `/api/users/*` — Search, list
- `/api/friends/*` — Friend requests
- `/api/messages/*` — Chat messages
- `/api/groups/*` — Group management
- `/api/upload` — Image upload
- `/api/socket` — Socket.io endpoint
- `/api/settings` — User settings & privacy

## Full Features
All features from Parts 1–8 are implemented:
- Real-time messaging + presence
- Groups
- Image messages
- Advanced actions (reactions, reply, pin, delete)
- Profile + avatar
- Telegram-style privacy & notification settings

---

**This is now a completely independent project.**  
See the Flutter project at `novix-messenger-flutter/`.
