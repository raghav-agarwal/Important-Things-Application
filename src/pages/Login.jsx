import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import VaultDial from "../components/VaultDial";
import "./Login.css";

export default function Login() {
  const { login, register, getLastUsername } = useApp();
  const navigate = useNavigate();

  const [mode, setMode] = useState("login"); // "login" | "register"
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const dialRef = useRef(null);

  const [loginForm, setLoginForm] = useState({ user: "", key: "" });
  const [regForm, setRegForm] = useState({ name: "", user: "", pin: "", pinVerify: "" });

  function sanitizePin(value) {
    return value.replace(/\D/g, "").slice(0, 4);
  }

  useEffect(() => {
    const cached = getLastUsername();
    if (cached) setLoginForm((f) => ({ ...f, user: cached }));
  }, [getLastUsername]);

  async function handleLogin(e) {
    e.preventDefault();
    setError("");
    if (!loginForm.user || !loginForm.key) {
      setError("Username and Pin can't be empty.");
      return;
    }
    setBusy(true);
    setUnlocking(true);
    try {
      await login(loginForm.user, loginForm.key);
      setTimeout(() => navigate("/dashboard"), 350);
    } catch (err) {
      setUnlocking(false);
      setError(err.appMessage || "Authentication failed.");
    } finally {
      setBusy(false);
    }
  }

  async function handleRegister(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const existingUser = await register(regForm);
      if (existingUser) {
        setUnlocking(true);
        setTimeout(() => navigate("/dashboard"), 350);
      } else {
        setMode("login");
        setLoginForm({ user: regForm.user, key: "" });
        setError("");
      }
    } catch (err) {
      setError(err.appMessage || "Registration failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-hero">
          <VaultDial unlocked={unlocking} size={104} />
          <h1>Important Things</h1>
          <p className="login-tagline">Your accounts, applications &amp; notes, kept close.</p>
        </div>

        <div className="login-tabs">
          <button
            className={mode === "login" ? "active" : ""}
            onClick={() => {
              setMode("login");
              setError("");
            }}
          >
            Unlock
          </button>
          <button
            className={mode === "register" ? "active" : ""}
            onClick={() => {
              setMode("register");
              setError("");
            }}
          >
            New Vault
          </button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {mode === "login" ? (
          <form onSubmit={handleLogin}>
            <div className="field">
              <label htmlFor="user">Username</label>
              <input
                id="user"
                autoComplete="username"
                value={loginForm.user}
                onChange={(e) => setLoginForm({ ...loginForm, user: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="key">Pin</label>
              <input
                id="key"
                type="password"
                inputMode="numeric"
                autoComplete="current-password"
                maxLength={4}
                value={loginForm.key}
                onChange={(e) => setLoginForm({ ...loginForm, key: sanitizePin(e.target.value) })}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy} type="submit">
              {busy ? "Unlocking…" : "Unlock Vault"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            <div className="field">
              <label htmlFor="name">Name</label>
              <input
                id="name"
                value={regForm.name}
                onChange={(e) => setRegForm({ ...regForm, name: e.target.value })}
              />
            </div>
            <div className="field">
              <label htmlFor="reg-user">Username</label>
              <input
                id="reg-user"
                autoComplete="username"
                value={regForm.user}
                onChange={(e) => setRegForm({ ...regForm, user: e.target.value })}
              />
            </div>
            <p className="field-hint">
              Tip: use the same value for Name and Username — it keeps this vault's login
              compatible with the original app's data model.
            </p>
            <div className="field">
              <label htmlFor="pin">Pin</label>
              <input
                id="pin"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={regForm.pin}
                onChange={(e) => setRegForm({ ...regForm, pin: sanitizePin(e.target.value) })}
              />
            </div>
            <div className="field">
              <label htmlFor="pinVerify">Confirm Pin</label>
              <input
                id="pinVerify"
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={regForm.pinVerify}
                onChange={(e) => setRegForm({ ...regForm, pinVerify: sanitizePin(e.target.value) })}
              />
            </div>
            <button className="btn btn-primary btn-block" disabled={busy} type="submit">
              {busy ? "Creating…" : "Create Vault"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
