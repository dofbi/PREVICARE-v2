import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

import netlify from '@astrojs/netlify';

export default defineConfig({
  integrations: [react()],

  vite: {
    css: {
      codeSplit: true,
    },
  },

  server: {
    allowedHosts: true,
    host: '0.0.0.0',
    port: 5000,
  },

  output: 'server',
  adapter: netlify(),
});
