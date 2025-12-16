# File Sharing App (React + Express + MongoDB)

Full-stack sample that supports file upload, per-user sharing, and authenticated link sharing with expiry.

## Stack
- Frontend: React (Vite)
- Backend: Node.js, Express, MongoDB (Mongoose)
- Storage: Local disk (configurable path via env)

## Features (per assignment)
- Upload single or bulk files (PDF, images, CSV) with size/type validation.
- Dashboard lists files with filename, type, size, upload date.
- Share with specific registered users.
- Authenticated share links with optional expiry (bonus feature).
- Access control enforced for owner, shared users, or valid non-expired link; all require a logged-in account.

## Local Setup
1. Clone the repo and install dependencies:
   ```bash
   cd backend && npm install
   cd ../frontend && npm install
   ```
2. Start MongoDB locally (default URI `mongodb://localhost:27017/file_sharing_app`).
3. Backend:
   ```bash
   cd backend
   cp env.example .env   # create and adjust secrets/paths
   npm run dev
   ```
4. Frontend (runs on Vite with proxy to backend):
   ```bash
   cd frontend
   npm run dev
   ```
5. Visit the shown Vite URL (usually http://localhost:5173).

## Environment
Backend `.env` keys:
```
PORT=4000
MONGO_URI=mongodb://localhost:27017/file_sharing_app
JWT_SECRET=change-me
UPLOAD_DIR=uploads
MAX_FILE_SIZE_BYTES=10485760
ALLOWED_MIME_TYPES=application/pdf,image/png,image/jpeg,text/csv
```

Frontend `.env` (optional):
```
VITE_API_URL=http://localhost:4000/api
```

## Deployment Notes
- Backend: deploy to Render/Fly/Railway; set env vars above and serve `npm start`.
- Frontend: deploy to Vercel/Netlify; set `VITE_API_URL` to your backend URL.
- Ensure the backend has persistent storage for the `UPLOAD_DIR` path or switch to cloud storage if needed.

## Tests
- Manual flows: register/login, upload multiple files, share with another user email, generate expiring link, verify unauthorized users cannot download, verify expired link rejects access.


