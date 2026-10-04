import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Register the service worker so the app qualifies for "Add to Home
// Screen" / install prompts on Chrome and Android. Safe no-op on
// browsers without support (e.g. older iOS Safari still gets a normal
// home-screen icon via the apple-touch-icon meta tags in index.html).
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(() => {});
  });
}
