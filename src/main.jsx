// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './context/NotificationContext'; // ✅ Import it
import { backend } from "./config";
console.log("👉 Backend is:", backend);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <GoogleOAuthProvider clientId="928711670793-a1v1fsrsdbs4cbkr7rpb7jqo3c0o5ia9.apps.googleusercontent.com">
    <BrowserRouter>
      <NotificationProvider> {/* ✅ Wrap App here */}
        <App />
      </NotificationProvider>
    </BrowserRouter>
  </GoogleOAuthProvider>
);
