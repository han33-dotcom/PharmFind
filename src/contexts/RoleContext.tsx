import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { AuthService, type User } from "@/services/auth.service";

export type UserRole = "patient" | "pharmacist" | "driver";

interface RoleContextType {
  role: UserRole;
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isPatient: boolean;
  isPharmacist: boolean;
  isDriver: boolean;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const getDefaultRouteForRole = (role: UserRole) => {
  if (role === "pharmacist") {
    return "/pharmacist/dashboard";
  }

  if (role === "driver") {
    return "/driver/dashboard";
  }

  return "/dashboard";
};

export function RoleProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRole = useCallback(async () => {
    if (!AuthService.isAuthenticated()) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const currentUser = await AuthService.getCurrentUser();
      if (!currentUser) {
        if (AuthService.getToken()) {
          AuthService.logout();
        }
        setUser(null);
        return;
      }

      setUser(currentUser);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshRole();

    const handleAuthChanged = () => {
      void refreshRole();
    };

    window.addEventListener("auth-change", handleAuthChanged);

    return () => {
      window.removeEventListener("auth-change", handleAuthChanged);
    };
  }, [refreshRole]);

  const role = user?.role ?? "patient";

  const value = useMemo(
    () => ({
      role,
      user,
      isLoading,
      isAuthenticated: Boolean(user),
      isPatient: role === "patient",
      isPharmacist: role === "pharmacist",
      isDriver: role === "driver",
      refreshRole,
    }),
    [isLoading, refreshRole, role, user]
  );

  return <RoleContext.Provider value={value}>{children}</RoleContext.Provider>;
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error("useRole must be used within RoleProvider");
  }
  return context;
}
