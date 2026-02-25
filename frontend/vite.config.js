//Vite build aracinin ayar dosyasi. React eklentisini aktif eder ve gelistirme sunucusunu yapilandirir.
// Frontend localhost:5173 portunda bu ayar sayesinde calisir.
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
})
