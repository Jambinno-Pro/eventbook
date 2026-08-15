# EventBook — React + Vite MVP

## Features
- Simple customer event registration
- Event booking with capacity
- Registration confirmation
- Admin event creation/deletion
- Search registered people
- Excel-compatible CSV export
- Print registration spreadsheet
- Simple event sharing/link copying
- No payment
- No approve/reject workflow

## Run on Windows

Open PowerShell in this folder:

```powershell
npm install
npm run dev
```

Then open the localhost URL shown by Vite.

## Important
This is still a prototype. Data is stored in the browser's localStorage, so different users/devices do NOT share the same registration database yet.

For the production version, the next step is to connect this React frontend to a real backend/database and add admin authentication.

Vite's current documentation uses the standard `npm run dev` script for the development server and notes current Node.js compatibility requirements. See https://vite.dev/guide/ for the current requirements.
