# Personal Portfolio Website

This repository contains the source code for my personal portfolio website, built with Astro, React, and Tailwind CSS. The site serves as a comprehensive showcase of my skills, professional experience, and academic projects, presented in a clean, performant, and bilingual (French/English) interface.

It features a range of interactive components and demos, from a full microservice architecture simulator to live demonstrations of DSLs and multi-threaded applications, all running directly in the browser. The project is automatically built and deployed to GitHub Pages via a CI/CD pipeline.

## Key Features

*   **Static Site Generation:** Built with Astro for optimal performance, SEO, and a fast user experience.
*   **Bilingual Content:** Fully available in both French and English, with a client-side router for seamless language switching.
*   **Interactive Project Demos:** Embedded React and TypeScript components provide live, interactive demonstrations of various projects, including:
    *   A microservice architecture simulator for an AI assistant.
    *   A real-time restaurant operations dashboard using WebSockets.
    *   A custom DSL interpreter and visual robot simulator.
    *   An animated REST API request/response cycle.
*   **Visitor Insights:** An optional welcome modal that uses Firebase Firestore to collect and store visitor information for statistical purposes.
*   **Responsive Design:** Fully responsive layout built with Tailwind CSS, ensuring a polished look on all devices.
*   **Automated Deployment:** A GitHub Actions workflow automates the build and deployment process to GitHub Pages on every push to the `main` branch.

## Tech Stack

*   **Frontend:** Astro, React, TypeScript, Tailwind CSS
*   **Backend Services:** Firebase Firestore (for the visitor welcome modal)
*   **Build & Deployment:** Node.js, Vite, GitHub Actions

## Installation and Local Development

To run this project locally, follow these steps.

### Prerequisites

*   Node.js (version `22.12.0` or higher)
*   npm (or a compatible package manager)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/theoduluard/theoduluard.github.io.git
    cd theoduluard.github.io
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables:**
    The welcome modal feature requires a Firebase project for data storage. Create a `.env` file in the root of the project and add your Firebase project configuration:
    ```env
    PUBLIC_FIREBASE_API_KEY="your-api-key"
    PUBLIC_FIREBASE_AUTH_DOMAIN="your-auth-domain"
    PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
    PUBLIC_FIREBASE_STORAGE_BUCKET="your-storage-bucket"
    PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
    PUBLIC_FIREBASE_APP_ID="your-app-id"
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```
    The site will be available at `http://localhost:4321`.

## Project Structure

The repository is organized as a standard Astro project:

```
├── .github/
│   └── workflows/
│       └── deploy.yml      # CI/CD pipeline for GitHub Pages
├── public/
│   ├── CNAME
│   ├── cv-en.html          # Standalone English CV
│   └── cv-fr.html          # Standalone French CV
├── src/
│   ├── components/
│   │   ├── ArchitectureSimulator.tsx # React component for AI demo
│   │   ├── WelcomeModal.tsx    # React component with Firebase logic
│   │   └── demos/              # Interactive demos for projects
│   ├── layouts/
│   │   └── Layout.astro      # Main page layout
│   ├── pages/
│   │   ├── en/               # English pages
│   │   └── fr/               # French pages
│   └── styles/
│       └── global.css        # Global styles and animations
├── astro.config.mjs          # Astro configuration
└── package.json              # Project dependencies and scripts
```

## Deployment

The website is automatically deployed to GitHub Pages using the workflow defined in `.github/workflows/deploy.yml`.

The pipeline performs the following steps:
1.  Checks out the code from the `main` branch.
2.  Sets up Node.js and installs dependencies using `npm ci`.
3.  Builds the Astro project using `npm run build`. Firebase credentials from repository secrets are injected at build time.
4.  Uploads the generated `dist/` directory as a build artifact.
5.  A separate `deploy` job deploys the artifact to the `github-pages` environment.