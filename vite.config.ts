import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['vite.svg'],
      manifest: {
        name: 'Burako Scorekeeper',
        short_name: 'Burako',
        description: 'Track Burako canasta games, history, and leaderboard.',
        theme_color: '#2563eb',
        background_color: '#f5f5f5',
        display: 'standalone',
        scope: '/burako_leaderboard/',
        start_url: '/burako_leaderboard/',
        icons: [
          {
            src: 'vite.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
          },
          {
            src: 'vite.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
          },
        ],
      },
    }),
  ],
  base: '/burako_leaderboard/', 
});
