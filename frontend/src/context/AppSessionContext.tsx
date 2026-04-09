import React, { createContext, useContext, useEffect, useState } from 'react';
import { ApiError, api, setApiToken } from '../utils/api';
import { storage, storageKeys } from '../utils/storage';
import { HouseholdProfile, SessionState, User } from '../types/app';

interface SessionContextValue extends SessionState {
  ready: boolean;
  signUp: (payload: { name: string; email: string; password: string }) => Promise<HouseholdProfile>;
  logIn: (payload: { email: string; password: string }) => Promise<HouseholdProfile>;
  logOut: () => Promise<void>;
  refreshProfile: () => Promise<HouseholdProfile | null>;
  setProfile: React.Dispatch<React.SetStateAction<HouseholdProfile | null>>;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function AppSessionProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<HouseholdProfile | null>(null);

  useEffect(() => {
    let mounted = true;

    async function bootstrap() {
      const storedToken = await storage.get(storageKeys.authToken);
      if (!storedToken) {
        setApiToken(null);
        if (mounted) setReady(true);
        return;
      }

      try {
        setApiToken(storedToken);
        const data = await api.me();
        if (!mounted) return;
        setToken(storedToken);
        setUser(data.user);
        setProfile(data.profile);
      } catch {
        setApiToken(null);
        await storage.remove(storageKeys.authToken);
      } finally {
        if (mounted) setReady(true);
      }
    }

    bootstrap();
    return () => {
      mounted = false;
    };
  }, []);

  const clearSession = async () => {
    setApiToken(null);
    setToken(null);
    setUser(null);
    setProfile(null);
    await storage.remove(storageKeys.authToken);
  };

  const applySession = async (nextToken: string, nextUser: User, nextProfile: HouseholdProfile) => {
    setApiToken(nextToken);
    setToken(nextToken);
    setUser(nextUser);
    setProfile(nextProfile);
    await storage.set(storageKeys.authToken, nextToken);
  };

  const signUp = async (payload: { name: string; email: string; password: string }) => {
    const data = await api.signup(payload);
    await applySession(data.token, data.user, data.profile);
    return data.profile;
  };

  const logIn = async (payload: { email: string; password: string }) => {
    const data = await api.login(payload);
    await applySession(data.token, data.user, data.profile);
    return data.profile;
  };

  const logOut = async () => {
    try {
      await api.logout();
    } catch {}
    await clearSession();
  };

  const refreshProfile = async () => {
    try {
      const nextProfile = await api.getProfile();
      setProfile(nextProfile);
      return nextProfile;
    } catch (error) {
      if (error instanceof ApiError && error.status === 401) {
        await clearSession();
      }
      return null;
    }
  };

  return (
    <SessionContext.Provider value={{ ready, token, user, profile, signUp, logIn, logOut, refreshProfile, setProfile }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useAppSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useAppSession must be used within AppSessionProvider');
  return ctx;
}
