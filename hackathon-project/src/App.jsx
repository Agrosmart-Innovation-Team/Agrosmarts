import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./Layouts/Layout";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Alerts from "./Pages/Alerts";
import Library from "./Pages/Library";
import Support from "./Pages/Support";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import ForgotPassword from "./Pages/ForgotPassword";
import ResetPassword from "./Pages/ResetPassword";
import AuthRedirectHandler from "./security/AuthRedirectHandler";
import ProtectedRoute from "./security/ProtectedRoute";
import SetupGuard from "./security/SetupGuard";

const BACKEND_ORIGIN =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/api\/?$/, "") ||
  (import.meta.env.PROD ?
    "https://hackathon-project-production-05d6.up.railway.app"
  : "http://127.0.0.1:8000");

function AdminRedirect() {
  window.location.replace(`${BACKEND_ORIGIN}/admin/`);
  return null;
}

function App() {
  return (
    <BrowserRouter>
      <AuthRedirectHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route
          path="/reset-password/:uidb64/:token"
          element={<ResetPassword />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route
            path="dashboard"
            element={
              <SetupGuard>
                <Dashboard />
              </SetupGuard>
            }
          />
          <Route
            path="alerts"
            element={
              <SetupGuard>
                <Alerts />
              </SetupGuard>
            }
          />
          <Route
            path="library"
            element={
              <SetupGuard>
                <Library />
              </SetupGuard>
            }
          />
          <Route
            path="support"
            element={
              <SetupGuard>
                <Support />
              </SetupGuard>
            }
          />
        </Route>
        <Route path="/admin/*" element={<AdminRedirect />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
