import { useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router-dom";

function ProtectedRoute() {
  let token = useSelector((state) => state?.auth?.token);

  if (!token) {
    return <Navigate to={"/login"} />;
  }

  return <Outlet />;
}
export default ProtectedRoute;
