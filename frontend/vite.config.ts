import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const backendPort = env.VITE_BACKEND_PORT || '8080';
  const target = env.VITE_BACKEND_URL || `http://127.0.0.1:${backendPort}`;

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target,
          changeOrigin: true,
          secure: false,
        },
        '/sanctum': {
          target,
          changeOrigin: true,
          secure: false,
        },
      },
    },
  };
});
