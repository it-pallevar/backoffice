import { createContext, useContext, useEffect, useState } from "react";
import { api, clearToken, saveToken } from "~/services/api";

interface AdminUser {
  id: string;
  nombres: string;
  apellidos: string;
  email: string;
  rol: string;
}

interface AuthContextValue {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem("admin_user");
    if (stored) {
      try {
        setUser(JSON.parse(stored));
      } catch {
        clearToken();
      }
    }
    setIsLoading(false);
  }, []);

  async function login(email: string, password: string): Promise<void> {
    const res = await api.post<{
      access_token: string;
      user: AdminUser;
    }>("/auth/login", { email, password });

    if (res.user.rol !== "admin") {
      throw new Error("Acceso denegado: se requiere rol de administrador");
    }

    saveToken(res.access_token);
    localStorage.setItem("admin_user", JSON.stringify(res.user));
    setUser(res.user);
  }

  function logout(): void {
    api.post("/auth/logout", {}).catch(() => {});
    clearToken();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth debe usarse dentro de AuthProvider");
  return ctx;
}
