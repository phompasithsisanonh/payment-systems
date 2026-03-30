import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ redirectTo = "/login", roles }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="route-loading">
        <span className="route-spinner" />
      </div>
    );
  }

  if (!user) {
    // ✅ จำ path เดิมไว้ หลัง login จะ redirect กลับมา
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  if (roles?.length > 0 && !roles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
