import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { authApi, User, WhiteLabelConfig, whiteLabelApi, setUnauthorizedHandler } from "./api";
import { colors } from "./theme";
import { registerForPushNotifications } from "./notifications";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  branding: WhiteLabelConfig;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const defaultBranding: WhiteLabelConfig = {
  app_name: "Nexzoneo",
  logo_url: null,
  primary_color: colors.deepNavy,
  secondary_color: colors.softRoyalBlue,
  welcome_text: "Discover local products near you",
  marketplace_mode_enabled: true,
};

const AuthContext = createContext<AuthContextType | null>(null);

async function syncPushToken() {
  try {
    const token = await registerForPushNotifications();
    if (token) await authApi.pushToken(token);
  } catch {
    // notifications optional in dev/simulator
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<WhiteLabelConfig>(defaultBranding);

  const logout = async () => {
    await AsyncStorage.removeItem("token");
    setUser(null);
  };

  useEffect(() => {
    setUnauthorizedHandler(() => {
      setUser(null);
    });
    whiteLabelApi.config().then((r) => setBranding(r.data)).catch(() => {});
    AsyncStorage.getItem("token").then((token) => {
      if (token) {
        authApi.me().then((r) => {
          setUser(r.data);
          syncPushToken();
        }).catch(() => AsyncStorage.removeItem("token"));
      }
      setLoading(false);
    });
  }, []);

  const login = async (email: string, password: string) => {
    const { data } = await authApi.login(email, password);
    await AsyncStorage.setItem("token", data.access_token);
    const me = await authApi.me();
    setUser(me.data);
    syncPushToken();
  };

  const register = async (name: string, email: string, password: string) => {
    await authApi.register({ name, email, password });
    await login(email, password);
  };

  const refreshUser = async () => {
    const me = await authApi.me();
    setUser(me.data);
  };

  return (
    <AuthContext.Provider value={{ user, loading, branding, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
