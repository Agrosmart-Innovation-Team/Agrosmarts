import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./Layouts/Layout";
import Home from "./Pages/Home";
import Dashboard from "./Pages/Dashboard";
import Alerts from "./Pages/Alerts";
import Library from "./Pages/Library";
import Support from "./Pages/Support";
import Login from "./Pages/Login";
import Signup from "./Pages/Signup";
import AuthRedirectHandler from "./security/AuthRedirectHandler";
import ProtectedRoute from "./security/ProtectedRoute";

function App() {
  return (
    <BrowserRouter>
      <AuthRedirectHandler />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Home />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="library" element={<Library />} />
          <Route path="support" element={<Support />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;



