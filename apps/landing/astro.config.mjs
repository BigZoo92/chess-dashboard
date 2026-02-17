import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

const site = process.env.PUBLIC_SITE_URL ?? 'https://chess-dashboard.enzogivernaud.fr';

export default defineConfig({
  site,
  output: 'static',
  integrations: [tailwind()]
});
