/// <reference types="vitest/config" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Lenkeforhåndsvisninger (og:image) krever full adresse. Sett SITE_URL ved bygging,
    // f.eks. SITE_URL=https://resumark.example npm run build. Uten den blir stien relativ.
    {
      name: 'site-url',
      transformIndexHtml: (html) => html.replaceAll('%SITE_URL%', (process.env.SITE_URL ?? '').replace(/\/$/, '')),
    },
  ],
  test: {
    // structureCv bruker DOMParser, så testene trenger en DOM. jsdom gir oss det i Node.
    environment: 'jsdom',
  },
})
