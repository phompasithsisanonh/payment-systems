import { createContext, useContext, useState, useEffect, useRef } from "react";
import api from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const csrfToken = useRef(null); // เก็บใน memory ไม่ใช่ state

  // อัปเดต axios header ทุกครั้งที่ csrf เปลี่ยน
  const setCsrf = (token) => {
    csrfToken.current = token;
    api.defaults.headers.common["x-csrf-token"] = token;
  };

  useEffect(() => {
    console.log("check auth...");
    api
      .get("/auth/me")
      .then((res) => {
        console.log("auth ok");
        setUser(res.data.user);
        setCsrf(res.data.csrfToken);
      })
      .catch((err) => {
        console.log("auth fail");
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);
  const login = async (username, password) => {
    const res = await api.post("/auth/login", { username, password });
    setUser(res.data.user);
    setCsrf(res.data.csrfToken); // เซ็ต CSRF header ทันทีหลัง login
    return res.data;
  };

  const logout = async () => {
    await api.post("/auth/logout");
    setUser(null);
    setCsrf(null);
    delete api.defaults.headers.common["x-csrf-token"];
  };
  


  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
