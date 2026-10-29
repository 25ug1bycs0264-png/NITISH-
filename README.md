# BMSIT&M College Website

A responsive, single-page website concept for BMS Institute of Technology & Management (BMSIT&M), built with React, TypeScript and Vite. Navigation links move between page sections, and the layout adapts to mobile, tablet and desktop screens.

## Requirements

- Node.js 20 or newer
- npm

## Run locally

1. Install the project dependencies:

   ```sh
   npm install
   ```

2. Start the development server:

   ```sh
   npm run dev
   ```

3. Open the local URL printed by Vite in your terminal.

To check the production build:

```sh
npm run build
```

The generated static site is written to `dist/`. Preview it locally with:

```sh
npm run preview
```

## Deploy to GitHub Pages

This repository includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

1. Push the project to a GitHub repository.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Push to the repository's default branch. The workflow installs dependencies, builds the site and publishes `dist/` to GitHub Pages.
5. View the deployed URL shown under **Settings → Pages** or in the completed deployment workflow.

Vite uses a relative asset base (`./`) so the build works both at a project-page URL such as `https://username.github.io/repository/` and at a custom domain.

## Content and source notes

- Institutional history, vision, mission, degree pathways, department names, address and phone/email details were checked against the official BMSIT&M website on 29 October 2026:
  - [Official website](https://bmsit.ac.in/)
  - [History, vision and mission](https://bmsit.ac.in/our-founders.php)
  - [Admissions and program information](https://bmsit.ac.in/admissions.php)
  - [Department information](https://bmsit.ac.in/departments.php)
  - [Contact details](https://bmsit.ac.in/contact-details.php)
- Admissions dates and eligibility can change. The site directs applicants to verify current requirements with official sources and intentionally does not present potentially stale cutoffs or dates as current.
- News and event cards are explicitly sample placeholders. Confirm and replace them before publishing real announcements.
- Campus-life descriptions are limited to general information on the official site. Specific club names, facilities and social accounts are not invented; verify them before adding them.
- Campus imagery is loaded from image URLs used by the official BMSIT&M website. An internet connection is required to display those images and Google Fonts.
- The contact form opens a prefilled email draft to the verified published address. It has no server-side submission or storage.
- The map is a labeled placeholder with a link to search for the verified campus address.

This is an informational website concept, not an official BMSIT&M service. Review all content and obtain permission for any institutional branding or imagery before public use.
