import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { clearAllCaches } from './utils/cache'

// Clear all API caches on full page load/refresh
if (typeof window !== 'undefined') {
  clearAllCaches()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
