import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { clearAllCaches } from './utils/cache'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

// Clear all API caches on full page load/refresh
if (typeof window !== 'undefined') {
  clearAllCaches()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <>
      <App />
      <ToastContainer
        position="top-right"
        autoClose={3000}
        theme="dark"
        newestOnTop
      />
    </>
  </StrictMode>,
)
