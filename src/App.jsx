import { Routes, Route, Navigate } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import CategoryView from "./pages/CategoryView";
import DetailFormPage from "./pages/DetailFormPage";
import { isFirebaseConfigured } from "./lib/firebase";
import SetupNotice from "./pages/SetupNotice";

export default function App() {
  if (!isFirebaseConfigured) {
    return <SetupNotice />;
  }

  return (
    <AppProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:key"
          element={
            <ProtectedRoute>
              <CategoryView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:key/new"
          element={
            <ProtectedRoute>
              <DetailFormPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/category/:key/edit/:name"
          element={
            <ProtectedRoute>
              <DetailFormPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </AppProvider>
  );
}
