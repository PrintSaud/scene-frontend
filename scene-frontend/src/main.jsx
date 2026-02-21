// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import { NotificationProvider } from './context/NotificationContext';
import { LanguageProvider } from './context/LanguageContext';   // ⬅️ add this
import { backend } from "./config";

console.log("BUILD", "2026-02-21-13:45");
console.log("👉 Backend is:", backend);

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <GoogleOAuthProvider clientId="9287...o5ia9.apps.googleusercontent.com">
    <LanguageProvider>                            {/* ⬅️ wrap here */}
      <BrowserRouter>
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </BrowserRouter>
    </LanguageProvider>
  </GoogleOAuthProvider>
);
