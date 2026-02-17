import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

export default defineConfig({
  site: 'https://chess-dashboard.enzogivernaud.fr',
  output: 'static',
  integrations: [tailwind()]
});
