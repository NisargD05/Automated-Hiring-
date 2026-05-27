import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await api.get("/auth/me");
        if (import.meta.env.DEV) {
          console.debug("[auth] restored session", {
            role: data.user?.role,
            email: data.user?.email
          });
        }
        setUser(data.user);
      } catch (error) {
        if (import.meta.env.DEV) {
          console.warn("[auth] session restore failed", error.response?.data || error.message);
        }
        localStorage.removeItem("token");
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const register = async (formData) => {
    const { data } = await api.post("/auth/register", formData);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    return data.user;
  };

  const login = async (formData) => {
    const { data } = await api.post("/auth/login", formData);
    localStorage.setItem("token", data.token);
    setUser(data.user);
    if (import.meta.env.DEV) {
      console.debug("[auth] login success", {
        role: data.user?.role,
        email: data.user?.email
      });
    }
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
