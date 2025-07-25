import React from 'react';
import { Navigate } from 'react-router-dom';

export default function PrivateRoute({ children }) {
  try {
    const stored = localStorage.getItem('user');
    const user = stored ? JSON.parse(stored) : null;

    if (!user || !user.token) {
      return <Navigate to="/login" replace />;
    }

    return children;
  } catch (err) {
    return <Navigate to="/login" replace />;
  }
}
