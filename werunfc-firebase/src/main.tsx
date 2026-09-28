import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { loadFonts } from './lib/fonts'
import './index.css'
import App from './App.tsx'

loadFonts()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
