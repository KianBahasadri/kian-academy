import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: { port: Number(process.env.ACADEMY_PORT || 5174), strictPort: true, fs: { deny: ['.env', '.env.*', '**/.data/**', '**/.git/**', '**/*.sqlite*', '**/*.tfstate*', '**/*.tfplan'] } },
});
