import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n' // Initialize i18n
import App from './App.tsx'

console.log("main.tsx: Starting application...");
const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error("main.tsx: Root element not found!");
} else {
  console.log("main.tsx: Root element found, rendering app...");
  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
