import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PublicRoute({ children }) {
  try {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;

    if (user && user.token) {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (err) {
    return children;
  }
}
