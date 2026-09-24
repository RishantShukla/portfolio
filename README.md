# Rishant Shukla — Portfolio

An interactive, terminal-themed personal portfolio. No framework, no build step — plain HTML/CSS/JS deployed as a static site.

**Live:** [rishant.vercel.app](https://rishant.vercel.app)

## How it works

The whole site is a single page (`index.html`) styled as a fake SSH terminal. Typing a command (or clicking a nav item / underlined command name) calls `runCommandClick()` in `assets/js/script.js`, which renders the matching hidden `<template>`-style block from `index.html` into the terminal history. There's no routing and no backend — `about`, `experience`, `skills`, etc. are all rendered client-side into the same page.

Two decorative effects run alongside the terminal: a `particles.js` background network, and a `matrix-canvas` easter egg toggled with the `m` command.

The contact form submits via [EmailJS](https://www.emailjs.com/) directly from the browser (no server). [Vercel Web Analytics](https://vercel.com/docs/analytics) is wired in for visitor/page-view tracking.

## Project structure

```
index.html                 the entire app: markup + all command templates
404.html                   standalone custom error page (own copy of the terminal styling)
assets/
  css/styles.css           all styling
  js/script.js             all behavior: boot animation, command router, effects
  favicon.svg / .png       terminal-prompt themed favicon
  og-image.png             Open Graph / social share preview image
documents/                 resume + case study PDFs, linked directly from the site
vercel.json                security headers (CSP, X-Frame-Options, etc.)
robots.txt / sitemap.xml   SEO basics
```

## Running locally

No build step — just serve the directory and open it:

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly via `file://` also works, since there's no server-side logic.

## Deployment

Pushes to `main` auto-deploy to Vercel via the GitHub integration. `vercel.json` controls response headers; there's no other build configuration since this is a static deployment.
