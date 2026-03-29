import { Navigate } from "react-router-dom";

export default function SetupGuard({ children }) {
  const isSetupDone = localStorage.getItem("agrosmart_setup_complete") === "1";

  if (!isSetupDone) {
    return <Navigate to="/" replace />;
  }

  return children;
}
