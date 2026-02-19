import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import AssistantPage from "./pages/AssistantPage";
import OccurrencesPage from "./pages/OccurrencesPage";
import ReportsPage from "./pages/ReportsPage";
import ChemicalsPage from "./pages/ChemicalsPage";
import SupervisorPage from "./pages/SupervisorPage";
import HistoryPage from "./pages/HistoryPage";
import UsersPage from "./pages/UsersPage";
import WorkOrdersPage from "./pages/WorkOrdersPage";
import "./App.css";

const ProtectedRoute = ({ children, requireSupervisor = false }) => {
  const { isAuthenticated, loading, isSupervisor } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (requireSupervisor && !isSupervisor) {
    return <Navigate to="/dashboard" replace />;
  }

  return <Layout>{children}</Layout>;
};

const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/work-orders"
        element={
          <ProtectedRoute>
            <WorkOrdersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/assistant"
        element={
          <ProtectedRoute>
            <AssistantPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/occurrences"
        element={
          <ProtectedRoute>
            <OccurrencesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/reports"
        element={
          <ProtectedRoute>
            <ReportsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/chemicals"
        element={
          <ProtectedRoute>
            <ChemicalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/supervisor"
        element={
          <ProtectedRoute requireSupervisor>
            <SupervisorPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/users"
        element={
          <ProtectedRoute requireSupervisor>
            <UsersPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/history"
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        }
      />
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
          <Toaster
            position="top-right"
            richColors
            closeButton
            toastOptions={{
              className: "font-sans",
            }}
          />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
