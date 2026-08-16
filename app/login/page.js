"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] =
    useState(false);

  async function handleLogin(event) {
    event.preventDefault();

    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError("Email address enter karein.");
      return;
    }

    if (!password) {
      setError("Password enter karein.");
      return;
    }

    try {
      setLoading(true);

      const { data, error: loginError } =
        await supabase.auth.signInWithPassword({
          email: cleanEmail,
          password,
        });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "Login user session create nahi hui."
        );
      }

      /*
       * Login successful.
       *
       * Supabase session browser me save hone ke
       * baad complete page reload karenge.
       *
       * Isse middleware ko latest authentication
       * session/cookie mil jayegi.
       */

      setMessage(
        "✓ Login successful. Dashboard open ho raha hai..."
      );

      /*
       * Small delay so browser ko Supabase session
       * persist karne ka time mile.
       */

      setTimeout(() => {
        window.location.replace("/");
      }, 500);

    } catch (err) {
      console.error(
        "LOGIN ERROR:",
        err
      );

      setError(
        err?.message ||
          "Login failed. Email aur password check karein."
      );

      setLoading(false);
    }
  }

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(
        "Pehle apna email address enter karein."
      );
      return;
    }

    try {
      setLoading(true);

      const { error } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${window.location.origin}/reset-password`,
          }
        );

      if (error) {
        throw error;
      }

      setMessage(
        "Password reset link aapke email par bhej diya gaya hai."
      );
    } catch (err) {
      console.error(
        "FORGOT PASSWORD ERROR:",
        err
      );

      setError(
        err?.message ||
          "Password reset request failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={pageStyle}>
      <div style={backgroundCircleTop}></div>
      <div style={backgroundCircleBottom}></div>

      <section style={loginCard}>

        {/* LOGO */}

        <div style={logoBox}>
          🧪
        </div>

        <div style={brandSmall}>
          NIDAN
        </div>

        <h1 style={brandTitle}>
          PATHOLOGY LAB
        </h1>

        <div style={brandSubtitle}>
          Laboratory Management Software
        </div>

        {/* WELCOME */}

        <div style={welcomeSection}>
          <h2 style={welcomeTitle}>
            Welcome Back
          </h2>

          <p style={welcomeText}>
            Software use karne ke liye
            apne account se login karein.
          </p>
        </div>

        {/* SUCCESS */}

        {message && (
          <div style={successBox}>
            ✓ {message}
          </div>
        )}

        {/* ERROR */}

        {error && (
          <div style={errorBox}>
            ⚠ {error}
          </div>
        )}

        {/* LOGIN FORM */}

        <form onSubmit={handleLogin}>

          {/* EMAIL */}

          <label style={labelStyle}>
            Email Address
          </label>

          <div style={inputWrapper}>
            <span style={inputIcon}>
              ✉
            </span>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="Enter your email"
              autoComplete="email"
              style={inputStyle}
              disabled={loading}
            />
          </div>

          {/* PASSWORD */}

          <label
            style={{
              ...labelStyle,
              marginTop: "12px",
            }}
          >
            Password
          </label>

          <div style={inputWrapper}>
            <span style={inputIcon}>
              🔒
            </span>

            <input
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              style={passwordInputStyle}
              disabled={loading}
            />

            <button
              type="button"
              onClick={() =>
                setShowPassword(
                  !showPassword
                )
              }
              style={eyeButton}
              disabled={loading}
            >
              {showPassword
                ? "🙈"
                : "👁️"}
            </button>
          </div>

          {/* FORGOT */}

          <div style={forgotRow}>
            <button
              type="button"
              onClick={
                handleForgotPassword
              }
              style={forgotButton}
              disabled={loading}
            >
              Forgot Password?
            </button>
          </div>

          {/* LOGIN BUTTON */}

          <button
            type="submit"
            disabled={loading}
            style={{
              ...loginButton,
              opacity: loading
                ? 0.7
                : 1,
            }}
          >
            {loading
              ? "🔄 Logging in..."
              : "🔐 Login to Software"}
          </button>
        </form>

        {/* SECURITY */}

        <div style={securityBox}>
          <div style={securityIcon}>
            🛡️
          </div>

          <div>
            <strong
              style={{
                display: "block",
                color: "#087f68",
                fontSize: "11px",
              }}
            >
              Secure Laboratory Access
            </strong>

            <span
              style={{
                display: "block",
                marginTop: "3px",
                color: "#718096",
                fontSize: "9px",
              }}
            >
              Your laboratory data is protected
              with secure authentication.
            </span>
          </div>
        </div>

        {/* FOOTER */}

        <div style={footerStyle}>
          <span>
            NIDAN PATHOLOGY LAB
          </span>

          <span>
            © 2026
          </span>
        </div>

      </section>
    </main>
  );
}

/* =====================================================
   STYLES
===================================================== */

const pageStyle = {
  minHeight: "100vh",
  background:
    "linear-gradient(135deg,#f4fbfc,#f5f8ff)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  position: "relative",
  overflow: "hidden",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  boxSizing: "border-box",
};

const backgroundCircleTop = {
  position: "fixed",
  width: "280px",
  height: "280px",
  borderRadius: "50%",
  background:
    "rgba(14,159,153,0.07)",
  top: "-130px",
  right: "-100px",
};

const backgroundCircleBottom = {
  position: "fixed",
  width: "250px",
  height: "250px",
  borderRadius: "50%",
  background:
    "rgba(59,130,246,0.06)",
  bottom: "-120px",
  left: "-100px",
};

const loginCard = {
  width: "100%",
  maxWidth: "440px",
  background: "#ffffff",
  border: "1px solid #e2e8ef",
  borderRadius: "16px",
  padding: "28px",
  boxSizing: "border-box",
  boxShadow:
    "0 20px 60px rgba(15,23,42,0.10)",
  position: "relative",
  zIndex: 2,
};

const logoBox = {
  width: "70px",
  height: "70px",
  margin: "0 auto 7px",
  borderRadius: "16px",
  background:
    "linear-gradient(135deg,#0e9f99,#087f68)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "35px",
  boxShadow:
    "0 10px 25px rgba(14,159,153,0.25)",
};

const brandSmall = {
  textAlign: "center",
  color: "#079b94",
  fontSize: "9px",
  fontWeight: "900",
  letterSpacing: "4px",
  marginTop: "5px",
};

const brandTitle = {
  textAlign: "center",
  color: "#172536",
  fontSize: "25px",
  margin: "2px 0",
  fontWeight: "900",
  letterSpacing: "0.5px",
};

const brandSubtitle = {
  textAlign: "center",
  color: "#718096",
  fontSize: "10px",
};

const welcomeSection = {
  marginTop: "28px",
  marginBottom: "18px",
};

const welcomeTitle = {
  margin: 0,
  color: "#172536",
  fontSize: "22px",
};

const welcomeText = {
  margin: "6px 0 0",
  color: "#718096",
  fontSize: "11px",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "10px",
  fontWeight: "800",
  color: "#344054",
};

const inputWrapper = {
  position: "relative",
  width: "100%",
};

const inputIcon = {
  position: "absolute",
  left: "12px",
  top: "50%",
  transform: "translateY(-50%)",
  fontSize: "12px",
  zIndex: 2,
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  height: "46px",
  border: "1px solid #d7e0e8",
  borderRadius: "8px",
  padding: "0 12px 0 38px",
  outline: "none",
  fontSize: "12px",
  background: "#fff",
};

const passwordInputStyle = {
  ...inputStyle,
  paddingRight: "45px",
};

const eyeButton = {
  position: "absolute",
  right: "5px",
  top: "5px",
  width: "36px",
  height: "36px",
  border: "none",
  borderRadius: "7px",
  background: "#f8fafc",
  cursor: "pointer",
  fontSize: "15px",
};

const forgotRow = {
  display: "flex",
  justifyContent: "flex-end",
  marginTop: "8px",
};

const forgotButton = {
  border: "none",
  background: "transparent",
  color: "#087f68",
  fontWeight: "800",
  fontSize: "10px",
  cursor: "pointer",
};

const loginButton = {
  width: "100%",
  height: "48px",
  marginTop: "18px",
  border: "none",
  borderRadius: "8px",
  background:
    "linear-gradient(135deg,#0e9f99,#087f68)",
  color: "#fff",
  fontWeight: "900",
  fontSize: "12px",
  cursor: "pointer",
  boxShadow:
    "0 8px 20px rgba(14,159,153,0.20)",
};

const successBox = {
  marginBottom: "14px",
  padding: "11px",
  borderRadius: "8px",
  background: "#ecfdf5",
  border: "1px solid #a7f3d0",
  color: "#087f68",
  fontSize: "11px",
};

const errorBox = {
  marginBottom: "14px",
  padding: "11px",
  borderRadius: "8px",
  background: "#fff1f2",
  border: "1px solid #fecdd3",
  color: "#b42323",
  fontSize: "11px",
};

const securityBox = {
  marginTop: "20px",
  padding: "12px",
  borderRadius: "9px",
  background: "#f0fdfa",
  border: "1px solid #ccfbf1",
  display: "flex",
  gap: "10px",
  alignItems: "center",
};

const securityIcon = {
  fontSize: "22px",
};

const footerStyle = {
  borderTop:
    "1px solid #e8edf2",
  marginTop: "20px",
  paddingTop: "14px",
  display: "flex",
  justifyContent: "space-between",
  color: "#98a2b3",
  fontSize: "8px",
  fontWeight: "800",
};
