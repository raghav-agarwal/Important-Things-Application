import React, { createContext, useContext, useState, useCallback, useMemo, useRef } from "react";
import * as authService from "../lib/authService";
import * as detailsService from "../lib/detailsService";

const AppContext = createContext(null);

const SESSION_KEY = "importantThings.session"; // { username, displayName }
const CACHE_KEY = "importantThings.lastUsername"; // port of CacheHelper (pre-fills login form)

function loadSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function AppProvider({ children }) {
  const [loggedInUser, setLoggedInUser] = useState(loadSession);

  // Cache lives in a ref (not state) on purpose: loadCategory/saveDetail/deleteDetail
  // read and write it, but must NOT change identity every time it updates, or any
  // effect that depends on them re-fires and re-fetches forever (this was the cause
  // of the category list flicker - fixed by moving the cache out of React state).
  const detailsCacheRef = useRef({});

  const secret = loggedInUser?.username || null;

  const cacheLastUsername = (value) => {
    try {
      localStorage.setItem(CACHE_KEY, value);
    } catch {
      /* ignore */
    }
  };

  const getLastUsername = () => {
    try {
      return localStorage.getItem(CACHE_KEY) || "";
    } catch {
      return "";
    }
  };

  const login = useCallback(async (user, pin) => {
    const user_ = await authService.login(user, pin);
    setLoggedInUser(user_);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(user_));
    cacheLastUsername(user);
    detailsCacheRef.current = {};
    return user_;
  }, []);

  const register = useCallback(async (form) => {
    const user_ = await authService.register(form);
    if (user_) {
      // register() returning a user means an existing, matching account was found
      setLoggedInUser(user_);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(user_));
      detailsCacheRef.current = {};
    }
    cacheLastUsername(form.user);
    return user_;
  }, []);

  const logout = useCallback(() => {
    setLoggedInUser(null);
    detailsCacheRef.current = {};
    sessionStorage.removeItem(SESSION_KEY);
  }, []);

  const loadCategory = useCallback(
    async (categoryKey, { force = false } = {}) => {
      if (!secret) return {};
      if (!force && detailsCacheRef.current[categoryKey]) {
        return detailsCacheRef.current[categoryKey];
      }
      const map = await detailsService.getCategoryDetails(loggedInUser.username, secret, categoryKey);
      detailsCacheRef.current = { ...detailsCacheRef.current, [categoryKey]: map };
      return map;
    },
    [secret, loggedInUser]
  );

  const saveDetail = useCallback(
    async (detail, previousName) => {
      const saved = await detailsService.saveDetail(loggedInUser.username, secret, detail);
      const categoryMap = { ...(detailsCacheRef.current[detail.categoryType] || {}) };
      if (previousName && previousName !== detail.name) {
        delete categoryMap[previousName];
      }
      categoryMap[detail.name] = saved;
      detailsCacheRef.current = { ...detailsCacheRef.current, [detail.categoryType]: categoryMap };
      return saved;
    },
    [secret, loggedInUser]
  );

  const deleteDetail = useCallback(
    async (detail) => {
      await detailsService.deleteDetail(loggedInUser.username, secret, detail);
      const categoryMap = { ...(detailsCacheRef.current[detail.categoryType] || {}) };
      delete categoryMap[detail.name];
      detailsCacheRef.current = { ...detailsCacheRef.current, [detail.categoryType]: categoryMap };
    },
    [secret, loggedInUser]
  );

  const value = useMemo(
    () => ({
      loggedInUser,
      isLoggedIn: Boolean(loggedInUser),
      login,
      register,
      logout,
      loadCategory,
      saveDetail,
      deleteDetail,
      getLastUsername,
    }),
    [loggedInUser, login, register, logout, loadCategory, saveDetail, deleteDetail]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within an AppProvider");
  return ctx;
}
