// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }) => {
  const hasAccess = localStorage.getItem("admin_access") === "true";
  return hasAccess ? children : <Navigate to="/" />;
};

export default ProtectedRoute;
