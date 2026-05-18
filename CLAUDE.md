# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Speak2Vendors** (VendorHub) is a senior living vendor management portal with three user roles: `vendor`, `community_manager`, and `admin`. Vendors apply to serve senior living communities; managers approve/deny applications; admins manage the full platform.

- **Frontend**: React 18 + Vite 5 + Tailwind CSS v3 + React Router v6
- **Backend**: Node.js/Express API in `api/` with Mongoose + MongoDB Atlas
- **Auth**: JWT stored as `vh_jwt` in localStorage; Bearer token on all API requests
- **Deployed**: Frontend → AWS Amplify (speak2vendors.com) | API → Railway | DB → MongoDB Atlas (shared cluster, `vendor-hub` database)

## Commands

### Frontend (root)
```bash
npm run dev       # Vite dev server on :5173 (proxies /api → :4000)
npm run build     # Production build → dist/
```

### API (`api/`)
```bash
npm run dev       # nodemon, port 4000
npm start         # node index.js (production)
npm run seed      # Wipe + re-seed all demo data in Atlas
```

### Both servers for local dev
Terminal 1: `cd api && npm run dev`
Terminal 2: `npm run dev` (from root)

## Architecture

### Request flow
```
Browser → VITE_API_URL (or Vite proxy in dev) → Express → MongoDB Atlas
```

`src/utils/storage.js` is the sole API client. It exports typed async functions (`getApplicationsForVendor`, `saveCommunity`, etc.) that all call through `request(method, path, body)`. The `BASE` constant is empty in dev (Vite proxy handles it) and set to the Railway URL in production via `VITE_API_URL`.

### Auth flow
`AuthContext` (`src/context/AuthContext.jsx`) manages the session:
- On mount: reads `vh_jwt` from localStorage, calls `GET /api/users/me` to restore the user object
- `login()` / `signup()` → hit auth routes → store token via `setToken()` in storage.js
- All API calls attach `Authorization: Bearer <token>` automatically via `authHeaders()`

On the API side, `api/middleware/auth.js` exports `authenticate` (verifies JWT, attaches `req.user`) and `authorize(...roles)` (role guard used after authenticate).

### Role-based routing
`RoleRedirect` in `App.jsx` reads `user.role` after auth resolves and navigates to the appropriate root:
- `vendor` → `/vendor` (or `/vendor/location` if no profile yet)
- `community_manager` → `/manager`
- `admin` → `/admin`

`ProtectedRoute` (`src/components/ProtectedRoute.jsx`) wraps every role-sensitive route.

### API structure (`api/`)
```
index.js          Express app + serverless-http export (supports Lambda if needed)
db.js             Cached mongoose.connect() — safe for Lambda warm starts
middleware/auth.js authenticate + authorize
models/           Mongoose models (User, Community, Application, VendorProfile, CompanyProfile, Review, Message)
routes/           One file per resource, mounted at /api/<resource>
seed.js           Full demo dataset — pre-hashes passwords with bcrypt then uses insertMany to bypass pre-save hook
```

All Mongoose models use UUID strings as `_id` and include a `toJSON` transform that remaps `_id → id` and strips `__v` and `password`.

### Frontend page structure
```
src/pages/vendor/     Dashboard, Location, CompanyProfile, Apply, VendorDashboard
src/pages/manager/    Dashboard, ApplicationDetail, MyVendors, VendorMap, CommunityProfile
src/pages/admin/      AdminDashboard, Communities, Managers, Vendors
src/components/       Layout (navbar + footer), ProtectedRoute
src/context/          AuthContext
src/utils/storage.js  API client (single file — all fetch logic lives here)
```

All `useEffect` data loads follow the pattern:
```js
useEffect(() => {
  async function load() { ... }
  load()
}, [deps])
```
Never `useEffect(async () => ...)`.

## Environment Variables

### `api/.env` (never committed)
```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CORS_ORIGIN=https://www.speak2vendors.com
PORT=4000
NODE_ENV=production
```

### Amplify (build-time, baked in by Vite)
```
VITE_API_URL=https://vendor-hub-production-7063.up.railway.app
```

## Deployment

- **API changes** → push to `main` → Railway auto-deploys from `api/` root directory
- **Frontend changes** → push to `main` → Amplify auto-builds
- **Amplify env var changes** require a manual redeploy (trigger via empty commit: `git commit --allow-empty -m "Trigger rebuild" && git push`)
- **Re-seed production data**: `cd api && npm run seed` (uses the `.env` MONGODB_URI)

## Key Constraints

- MongoDB Atlas Network Access must allow `0.0.0.0/0` (Railway uses dynamic IPs)
- The Amplify SPA rewrite rule `/<*> → /index.html (404 rewrite)` must remain in place or direct-URL navigation breaks
- `VITE_API_URL` must not have a trailing slash
- `api/node_modules/` and `api/.env` are in `.gitignore` — never commit them
