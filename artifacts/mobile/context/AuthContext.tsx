import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api, User } from "@/lib/api";

interface AuthState {
  token: string | null;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (phone: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    token: null,
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  useEffect(() => {
    async function restore() {
      try {
        const [token, userJson] = await Promise.all([
          AsyncStorage.getItem("auth_token"),
          AsyncStorage.getItem("auth_user"),
        ]);
        if (token && userJson) {
          setState({
            token,
            user: JSON.parse(userJson) as User,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState((s) => ({ ...s, isLoading: false }));
        }
      } catch {
        setState((s) => ({ ...s, isLoading: false }));
      }
    }
    restore();
  }, []);

  const login = useCallback(async (phone: string, password: string) => {
    const loginData = await api.auth.login(phone, password);
    const user: User = {
      id: loginData.userId,
      name: loginData.fullName,
      phone: loginData.userName,
      grade: loginData.studentGrade,
    };
    await Promise.all([
      AsyncStorage.setItem("auth_token", loginData.token),
      AsyncStorage.setItem("auth_user", JSON.stringify(user)),
    ]);
    setState({ token: loginData.token, user, isLoading: false, isAuthenticated: true });
  }, []);

  const logout = useCallback(async () => {
    await Promise.all([
      AsyncStorage.removeItem("auth_token"),
      AsyncStorage.removeItem("auth_user"),
    ]);
    setState({ token: null, user: null, isLoading: false, isAuthenticated: false });
  }, []);

  const updateUser = useCallback((user: User) => {
    setState((s) => ({ ...s, user }));
    AsyncStorage.setItem("auth_user", JSON.stringify(user));
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
