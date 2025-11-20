import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type UserRole = 'patient' | 'pharmacist' | 'driver';

interface RoleContextType {
  role: UserRole;
  setRole: (role: UserRole) => void;
  isPatient: boolean;
  isPharmacist: boolean;
  isDriver: boolean;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export function RoleProvider({ children }: { children: ReactNode }) {
  const [role, setRoleState] = useState<UserRole>(() => {
    const saved = localStorage.getItem('user_role');
    return (saved as UserRole) || 'patient';
  });

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    localStorage.setItem('user_role', newRole);
  };

  useEffect(() => {
    localStorage.setItem('user_role', role);
  }, [role]);

  return (
    <RoleContext.Provider 
      value={{ 
        role, 
        setRole,
        isPatient: role === 'patient',
        isPharmacist: role === 'pharmacist',
        isDriver: role === 'driver',
      }}
    >
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within RoleProvider');
  }
  return context;
}
