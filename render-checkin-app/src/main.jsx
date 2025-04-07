import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Register the service worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/registerSW.js')
      .then((registration) => console.log('Service Worker registered:', registration))
      .catch((error) => console.error('Service Worker registration failed:', error));
  });
}
