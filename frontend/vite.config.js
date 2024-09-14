import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    listener:80,
    server http://13.235.68.130:3000,
    proxy: {
      "/api":{
        target: "http://13.235.68.130:5000",
        changeOrigin: true
      }
    }
  }
})
