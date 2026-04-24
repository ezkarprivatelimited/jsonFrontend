import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50">
        <div className="w-8 h-8 border-2 border-zinc-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role Based Access Control
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // If user doesn't have permission, redirect to dashboard or a "not authorized" page
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
