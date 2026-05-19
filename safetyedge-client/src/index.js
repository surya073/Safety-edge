import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

if (window.location.pathname.includes("index.html")) {
  const cleanUrl = window.location.href.replace("index.html", "");
  window.history.replaceState({}, "", cleanUrl);
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);