# ⚡ Agentic AP Platform

A modern, high-performance Accounts Payable (AP) Automation platform. This application simulates an AI-powered invoice extraction pipeline, allowing users to upload invoices, review extraction status in real-time, manage vendor relationships, and export financial datasets.

---

## 🏛️ Architectural Overview

The project is structured as a decoupled monorepo containing a React client and a Node.js server.

```
Agentic-AP-Platform/
├── backend/                # Node.js + Express API server
│   ├── controllers/        # Business logic controllers
│   ├── middleware/         # Auth guards, file uploads, error handlers
│   ├── models/             # Database access layers (db.js file driver)
│   ├── routes/             # Express API routing endpoints
│   ├── sockets/            # Socket.IO event controllers & async pipeline simulator
│   └── data/               # Persistent database JSON store (db.json)
└── frontend/               # React + Vite client dashboard
    ├── src/
    │   ├── components/     # Layout shells, drawers, portals, dropdowns
    │   ├── hooks/          # React hooks (Socket.IO listeners)
    │   ├── store/          # Zustand global states (UI state, Auth state)
    │   ├── services/       # Axios API connection endpoints
    │   ├── pages/          # Dashboard, Invoices list, Vendors CRUD, Settings
    │   └── utils/          # Formatting helpers, time calculations, CSV exports
```

### Key Technical Patterns
* **Real-time Pipeline Synchronization**: Leverages **Socket.IO** to push live updates from the background processing pipeline (parsing → mask PII → AI extraction → validation → manual review → approval) directly to the user interface.
* **State Management**: Uses **React Query** (`@tanstack/react-query`) for cached server state synchronizations and **Zustand** for local client states (sidebar toggles, active user sessions).
* **Role-Based Access Control (RBAC)**: Supports roles (`Admin` / `User`) via custom validation middlewares on backend paths and route protection components on the frontend.
* **Portal-based Dropdown Systems**: Solved overflow clipping in nested cards by building portals that mount selection lists directly onto `document.body` with absolute coordinates tracking.

---

## ⚙️ Setup & Installation Instructions

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18+ recommended).

### 1. Backend Server Setup
Navigate into the backend directory:
```bash
cd backend
```

Install dependencies:
```bash
npm install
```

Start the backend API server:
```bash
# Run server
npm run start
```
The backend server will run on [http://localhost:5000](http://localhost:5000).

---

### 2. Frontend Client Setup
Open a new terminal window and navigate into the frontend directory:
```bash
cd frontend
```

Install dependencies:
```bash
npm install
```

Start the development build:
```bash
npm run dev
```
The React dashboard will launch at [http://localhost:5173](http://localhost:5173).

---

## 🔑 Demo Account Credentials

Use these pre-seeded profiles to test permissions and role-based views on the dashboard:

| Role Profile | Email Login | Password | Permission Capabilities |
|---|---|---|---|
| **Admin (Finance Manager)** | `admin@ap.com` | `admin` | Full CRUD access to all Invoices, Vendors, and Settings. |
| **User (AP Clerk)** | `user@ap.com` | `user` | Upload invoices and view lists. *Cannot delete, edit invoices, manage vendors, or change system settings.* |
