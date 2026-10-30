# Clearline Complaint Management

A responsive complaint-management prototype built with React, TypeScript, and Vite. It includes public complaint submission and reference-number tracking, plus a staff dashboard for triage and case updates.

## Run locally

Requirements: Node.js 20 or newer and npm.

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Create a production build with `npm run build`.

## Demo behavior and limitations

- The interface is a front-end demo; it does not connect to a complaint-management backend.
- Sample complaints and identities are fictional. New demo complaints are stored in the browser's local storage.
- Use **Preview as** in the sidebar to switch between complainant, staff, and administrator views. This is a visual role switch only, not authentication or authorization.
- Public tracking shows status updates and department, but not complainant contact details or staff-only notes.
- Attachments are not uploaded or persisted; only the selected file names appear in the local demo record.
- Notifications are shown in the interface only. No emails or external notifications are sent.
- Do not enter real, sensitive, or confidential information. This prototype does not provide production security or privacy controls.

Before using this for real complaints, connect a secure backend and implement verified authentication, server-enforced role-based authorization, protected file storage, audit logging, retention controls, and notification delivery.
