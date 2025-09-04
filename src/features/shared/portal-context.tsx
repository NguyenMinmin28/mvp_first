"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";

type Portal = "client" | "freelancer";

interface PortalContextValue {
  activePortal: Portal;
  setActivePortal: (p: Portal) => void;
  getPortalToken: (portal: Portal) => string | null;
  setPortalToken: (portal: Portal, token: string) => void;
  clearPortalToken: (portal: Portal) => void;
  isLoggedInToPortal: (portal: Portal) => boolean;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  pendingPortal: Portal | null;
  setPendingPortal: (portal: Portal | null) => void;
  logoutFromPortal: (portal: Portal) => void;
  setPortalAsLoggedIn: (portal: Portal) => void;
  showLoginModalForPortal: (portal: Portal) => void;
}

const PortalContext = createContext<PortalContextValue | undefined>(undefined);

const STORAGE_KEY = "dc_active_portal";
const CLIENT_TOKEN_KEY = "dc_client_token";
const FREELANCER_TOKEN_KEY = "dc_freelancer_token";

// Default context value to prevent errors
const defaultContextValue: PortalContextValue = {
  activePortal: "client",
  setActivePortal: () => {},
  getPortalToken: () => null,
  setPortalToken: () => {},
  clearPortalToken: () => {},
  isLoggedInToPortal: () => false,
  showLoginModal: false,
  setShowLoginModal: () => {},
  pendingPortal: null,
  setPendingPortal: () => {},
  logoutFromPortal: () => {},
  setPortalAsLoggedIn: () => {},
  showLoginModalForPortal: () => {},
};

export function PortalProvider({ children }: { children: React.ReactNode }) {
  const [activePortal, setActivePortalState] = useState<Portal>("client");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [pendingPortal, setPendingPortal] = useState<Portal | null>(null);
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  // Always call hooks unconditionally; gate usage with "mounted" checks
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    try {
      const stored = window.localStorage.getItem(STORAGE_KEY) as Portal | null;
      if (stored === "client" || stored === "freelancer") {
        setActivePortalState(stored);
      }
    } catch {}
  }, [mounted]);

  // Auto-set portal based on user role when session changes
  useEffect(() => {
    if (!mounted) return;
    
    // This will be called when session changes
    // The actual portal setting will be handled by useAuthRedirect hook
  }, [mounted]);

  const getPortalToken = (portal: Portal): string | null => {
    if (!mounted) return null;
    try {
      const key = portal === "client" ? CLIENT_TOKEN_KEY : FREELANCER_TOKEN_KEY;
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  };

  const setPortalToken = (portal: Portal, token: string) => {
    if (!mounted) return;
    try {
      const key = portal === "client" ? CLIENT_TOKEN_KEY : FREELANCER_TOKEN_KEY;
      window.localStorage.setItem(key, token);
    } catch {}
  };

  const clearPortalToken = (portal: Portal) => {
    if (!mounted) return;
    try {
      const key = portal === "client" ? CLIENT_TOKEN_KEY : FREELANCER_TOKEN_KEY;
      window.localStorage.removeItem(key);
    } catch {}
  };

  const isLoggedInToPortal = (portal: Portal): boolean => {
    return !!getPortalToken(portal);
  };

  const setActivePortal = async (p: Portal) => {
    if (!mounted) return;
    // Purely set portal without forcing logout to avoid loops
    setActivePortalState(p);
    try {
      window.localStorage.setItem(STORAGE_KEY, p);
    } catch {}
  };

  const logoutFromPortal = (portal: Portal) => {
    if (!mounted) return;
    clearPortalToken(portal);
    // If logging out from current portal, redirect to home
    if (portal === activePortal && mounted && router) {
      router.push('/');
    }
  };

  const setPortalAsLoggedIn = (portal: Portal) => {
    if (!mounted) return;
    setActivePortalState(portal);
    try {
      window.localStorage.setItem(STORAGE_KEY, portal);
    } catch {}
  };

  const showLoginModalForPortal = (portal: Portal) => {
    if (!mounted) return;
    setPendingPortal(portal);
    setShowLoginModal(true);
  };

  // If logging out, return default context to prevent errors
  if (isLoggingOut) {
    return (
      <PortalContext.Provider value={defaultContextValue}>
        {children}
      </PortalContext.Provider>
    );
  }

  return (
    <PortalContext.Provider value={{ 
      activePortal, 
      setActivePortal, 
      getPortalToken, 
      setPortalToken, 
      clearPortalToken,
      isLoggedInToPortal,
      showLoginModal,
      setShowLoginModal,
      pendingPortal,
      setPendingPortal,
      logoutFromPortal,
      setPortalAsLoggedIn,
      showLoginModalForPortal
    }}>
      {children}
    </PortalContext.Provider>
  );
}

export function usePortal() {
  const ctx = useContext(PortalContext);
  if (!ctx) {
    // Return a default context instead of throwing error during SSR or when context is not available
    if (typeof window === 'undefined') {
      return defaultContextValue;
    }
    // If context is not available on client side, return default to prevent crashes
    return defaultContextValue;
  }
  return ctx;
}


