'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AuthContextType {
  token: string | null;
  apiKey: string | null;
  companyName: string | null;
  login: (token: string, apiKey: string, companyName: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Safely look up persisted data tokens inside local session storage components
    const storedToken = localStorage.getItem('nxr_token');
    const storedApiKey = localStorage.getItem('nxr_apikey');
    const storedCompany = localStorage.getItem('nxr_company');

    if (storedToken && storedApiKey && storedCompany) {
      setToken(storedToken);
      setApiKey(storedApiKey);
      setCompanyName(storedCompany);
    }
    setLoading(false);
  }, []);

  const login = (userToken: string, userApiKey: string, userCompany: string) => {
    localStorage.setItem('nxr_token', userToken);
    localStorage.setItem('nxr_apikey', userApiKey);
    localStorage.setItem('nxr_company', userCompany);
    setToken(userToken);
    setApiKey(userApiKey);
    setCompanyName(userCompany);
  };

  const logout = () => {
    localStorage.clear();
    setToken(null);
    setApiKey(null);
    setCompanyName(null);
  };

  return (
    <AuthContext.Provider value={{ token, apiKey, companyName, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be executed within an AuthProvider capsule context.');
  return context;
}
