import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext(null);

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("ipiranga_token"));
  const [loading, setLoading] = useState(true);
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    checkSetupStatus();
  }, []);

  useEffect(() => {
    if (token) {
      axios.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      fetchUser();
    } else {
      setLoading(false);
    }
  }, [token]);

  const checkSetupStatus = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/setup/status`);
      setNeedsSetup(response.data.needs_setup);
    } catch (error) {
      console.error("Error checking setup status:", error);
    }
  };

  const setupAdmin = async () => {
    try {
      const response = await axios.post(`${API_URL}/api/setup/admin`);
      setNeedsSetup(false);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Erro ao criar administrador",
      };
    }
  };

  const fetchUser = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/auth/me`);
      setUser(response.data);
    } catch (error) {
      console.error("Error fetching user:", error);
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (matricula, password) => {
    try {
      const response = await axios.post(`${API_URL}/api/auth/login`, {
        matricula,
        password,
      });
      const { token: newToken, user: userData } = response.data;
      localStorage.setItem("ipiranga_token", newToken);
      axios.defaults.headers.common["Authorization"] = `Bearer ${newToken}`;
      setToken(newToken);
      setUser(userData);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.detail || "Erro ao fazer login",
      };
    }
  };

  const logout = () => {
    localStorage.removeItem("ipiranga_token");
    delete axios.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    needsSetup,
    login,
    logout,
    setupAdmin,
    checkSetupStatus,
    isAuthenticated: !!user,
    isOperator: user?.role === "operator",
    isSupervisor: user?.role === "supervisor" || user?.role === "admin",
    isAdmin: user?.role === "admin",
    canManageUsers: user?.role === "supervisor" || user?.role === "admin",
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
