import { defineConfig } from 'vite';

export default defineConfig({
  // IMPORTANT: Configure this for GitHub Pages deployment!
  // If deploying to username.github.io/repo-name/, set base: '/repo-name/'
  // If deploying to username.github.io (root), set base: '/'
  base: '/', // Defaulting to root, CHANGE IF NEEDED!

  build: {
    target: 'esnext' // Enable top-level await and other modern features
  }
}); 