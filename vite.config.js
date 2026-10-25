import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// The company app runs on 5173; the platform owner app on 5174.
export default defineConfig({
  plugins: [react()],
  server: { port: 5174 },
})
