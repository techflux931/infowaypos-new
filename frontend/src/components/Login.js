// src/components/Login.js
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo.png";
import "./Login.css";

const USERS = [
  { u: "cashier", p: "Password1", role: "cashier", to: "/pos" },
  { u: "admin", p: "Admin1234", role: "admin", to: "/dashboard" },
  { u: "techfluxsoftware", p: "Techflux1234", role: "developer", to: "/dashboard" },
];

export default function Login() {
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(false);
  const [error, setError] = useState("");

  // Prefill saved username (no password stored)
  useEffect(() => {
    const savedUser = localStorage.getItem("savedUser");
    if (savedUser) {
      setUsername(savedUser);
      setRemember(true);
    }
  }, []);

  const normalizedUser = useMemo(
    () => (username || "").trim().toLowerCase(),
    [username]
  );

  const isAdmin = normalizedUser === "admin";

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    const u = normalizedUser;
    const p = (password || "").trim();

    if (!u || !p) {
      setError("Enter username and password");
      return;
    }

    const match = USERS.find((x) => x.u === u && x.p === p);
    if (!match) {
      setError("Invalid username or password");
      return;
    }

    // Basic auth session (demo)
    localStorage.setItem("authToken", "logged-in");
    localStorage.setItem("username", match.u);
    localStorage.setItem("userRole", match.role);
    localStorage.setItem("lastLogin", new Date().toISOString());

    // Store only username if requested
    if (remember) localStorage.setItem("savedUser", match.u);
    else localStorage.removeItem("savedUser");

    navigate(match.to, { replace: true });
  };

  const handleForgotPassword = () => {
    if (normalizedUser === "admin") {
      alert("📩 Password recovery instructions sent to techfluxsoftware@gmail.com");
      return;
    }
    alert("Forgot Password is only available for Admin users.");
  };

  return (
    <div className="login-background">
      <div className="login-wrapper">
        <img src={logo} alt="Infoways Logo" className="login-main-logo" />
        {/* Removed: <h1 className="login-title">Infoways POS</h1> */}

        <div className="login-box">
          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label className="login-label">
              <span>User Name</span>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                autoComplete="username"
                placeholder="User Name"
                autoFocus
                required
              />
            </label>

            <div className="field">
              <div className="field-head">
                <span>Password</span>

                {isAdmin && (
                  <button
                    type="button"
                    className="forgot-password"
                    onClick={handleForgotPassword}
                  >
                    Forgot Password?
                  </button>
                )}
              </div>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="Password"
                required
              />
            </div>

            <div className="login-options">
              <label className="remember-me">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={() => setRemember((v) => !v)}
                />
                <span>Remember me</span>
              </label>
            </div>

            {error ? (
              <div className="error" role="alert">
                ❌ {error}
              </div>
            ) : null}

            <button type="submit" className="login-button">
              LOG IN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
