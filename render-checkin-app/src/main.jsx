import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/registerSW.js').then((registration) => {
//       registration.onupdatefound = () => {
//         const installingWorker = registration.installing;
//         installingWorker.onstatechange = () => {
//           if (installingWorker.state === 'installed') {
//             if (navigator.serviceWorker.controller) {
//               console.log("🚨 New version available — reloading...");
//               window.location.reload(); // 🔁 Force refresh when new build is available
//             }
//           }
//         };
//       };
//     }).catch(console.error);
//   });
// }



// Register the service worker
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker
//       .register('/registerSW.js')
//       .then((registration) => console.log('Service Worker registered:', registration))
//       .catch((error) => console.error('Service Worker registration failed:', error));
//   });
// }
