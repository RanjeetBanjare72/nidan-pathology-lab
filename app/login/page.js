"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  /* =====================================================
     CHECK EXISTING LOGIN SESSION
  ===================================================== */

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!mounted) return;

        if (session?.user) {
          router.replace("/");
          return;
        }
      } catch (err) {
        console.error("Session check error:", err);
      } finally {
        if (mounted) {
          setCheckingSession(false);
        }
      }
    }

    checkSession();

    /* Listen for authentication changes */

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!mounted) return;

        if (
          event === "SIGNED_IN" &&
          session?.user
        ) {
          router.replace("/");
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  /* =====================================================
     LOGIN
  ===================================================== */

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

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (loginError) {
        throw loginError;
      }

      if (!data?.user) {
        throw new Error(
          "Login successful nahi hua."
        );
      }

      setMessage(
        "Login successful. Dashboard open ho raha hai..."
      );

      /* Dashboard */

      router.replace("/");
      router.refresh();
    } catch (err) {
      console.error("Login error:", err);

      let errorMessage =
        "Login failed. Email aur password check karein.";

      if (
        err?.message
          ?.toLowerCase()
          .includes("invalid login credentials")
      ) {
        errorMessage =
          "Email ya password galat hai.";
      } else if (
        err?.message
          ?.toLowerCase()
          .includes("email not confirmed")
      ) {
        errorMessage =
          "Email confirm nahi hua hai. Supabase Authentication me email verify karein.";
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     FORGOT PASSWORD
  ===================================================== */

  async function handleForgotPassword() {
    setError("");
    setMessage("");

    const cleanEmail = email.trim();

    if (!cleanEmail) {
      setError(
        "Password reset ke liye pehle email enter karein."
      );
      return;
    }

    try {
      setLoading(true);

      const siteUrl =
        window.location.origin;

      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          cleanEmail,
          {
            redirectTo:
              `${siteUrl}/reset-password`,
          }
        );

      if (resetError) {
        throw resetError;
      }

      setMessage(
        "Password reset link aapke email par bhej diya gaya hai."
      );
    } catch (err) {
      console.error(
        "Password reset error:",
        err
      );

      setError(
        err?.message ||
          "Password reset email send nahi hua."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
     LOADING SCREEN
  ===================================================== */

  if (checkingSession) {
    return (
      <main style={pageStyle}>
        <div style={loadingCard}>
          <div style={logoCircle}>
            🧪
          </div>

          <h2 style={loadingTitle}>
            NIDAN PATHOLOGY LAB
          </h2>

          <p style={loadingText}>
            Checking secure login...
          </p>

          <div style={spinner}></div>
        </div>
      </main>
    );
  }

  /* =====================================================
     LOGIN UI
  ===================================================== */

  return (
    <main style={pageStyle}>
      <div style={backgroundCircleOne}></div>
      <div style={backgroundCircleTwo}></div>

      <section style={loginCard}>
        {/* LOGO */}

        <div style={logoWrapper}>
          <div style={logoCircle}>
            🧪
          </div>
        </div>

        {/* BRAND */}

        <div style={brandBlock}>
          <div style={brandSmall}>
            NIDAN
          </div>

          <h1 style={brandTitle}>
            PATHOLOGY LAB
          </h1>

          <p style={brandSubtitle}>
            Laboratory Management Software
          </p>
        </div>

        {/* LOGIN HEADER */}

        <div style={loginHeader}>
          <h2 style={loginTitle}>
            Welcome Back
          </h2>

          <p style={loginSubtitle}>
            Software use karne ke liye
            apne account se login karein.
          </p>
        </div>

        {/* ERROR */}

        {error && (
          <div style={errorBox}>
            <span style={messageIcon}>
              ⚠️
            </span>

            <span>{error}</span>
          </div>
        )}

        {/* SUCCESS */}

        {message && (
          <div style={successBox}>
            <span style={messageIcon}>
              ✓
            </span>

            <span>{message}</span>
          </div>
        )}

        {/* LOGIN FORM */}

        <form
          onSubmit={handleLogin}
          style={formStyle}
        >
          {/* EMAIL */}

          <div style={fieldWrapper}>
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
                disabled={loading}
                style={inputStyleWithIcon}
              />
            </div>
          </div>

          {/* PASSWORD */}

          <div style={fieldWrapper}>
            <label style={labelStyle}>
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
                disabled={loading}
                style={
                  inputStyleWithIconAndButton
                }
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    !showPassword
                  )
                }
                disabled={loading}
                style={
                  passwordButton
                }
              >
                {showPassword
                  ? "🙈"
                  : "👁️"}
              </button>
            </div>
          </div>

          {/* FORGOT PASSWORD */}

          <div
            style={{
              display: "flex",
              justifyContent:
                "flex-end",
              marginTop: "-3px",
            }}
          >
            <button
              type="button"
              onClick={
                handleForgotPassword
              }
              disabled={loading}
              style={
                forgotButton
              }
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
            {loading ? (
              <>
                <span
                  style={
                    buttonSpinner
                  }
                ></span>

                Signing in...
              </>
            ) : (
              <>
                🔐 Login to Software
              </>
            )}
          </button>
        </form>

        {/* SECURITY INFO */}

        <div style={securityBox}>
          <div style={securityIcon}>
            🛡️
          </div>

          <div>
            <strong
              style={
                securityTitle
              }
            >
              Secure Laboratory Access
            </strong>

            <p
              style={
                securityText
              }
            >
              Your laboratory data is
              protected with secure
              authentication.
            </p>
          </div>
        </div>

        {/* FOOTER */}

        <div style={footer}>
          <strong>
            NIDAN PATHOLOGY LAB
          </strong>

          <span>
            © {new Date().getFullYear()}
          </span>
        </div>
      </section>
    </main>
  );
}

/* =========================================================
   STYLES
========================================================= */

const pageStyle = {
  minHeight: "100vh",
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  boxSizing: "border-box",
  background:
    "linear-gradient(135deg, #eefbf9 0%, #f7faff 50%, #eef5ff 100%)",
  fontFamily:
    "Arial, Helvetica, sans-serif",
  position: "relative",
  overflow: "hidden",
};

const backgroundCircleOne = {
  position: "fixed",
  width: "350px",
  height: "350px",
  borderRadius: "50%",
  background:
    "rgba(14,159,153,0.08)",
  top: "-150px",
  right: "-120px",
  pointerEvents: "none",
};

const backgroundCircleTwo = {
  position: "fixed",
  width: "300px",
  height: "300px",
  borderRadius: "50%",
  background:
    "rgba(37,99,235,0.06)",
  bottom: "-150px",
  left: "-120px",
  pointerEvents: "none",
};

const loginCard = {
  width: "100%",
  maxWidth: "430px",
  background: "#ffffff",
  border:
    "1px solid #e2e8f0",
  borderRadius: "18px",
  padding: "28px",
  boxSizing: "border-box",
  boxShadow:
    "0 20px 70px rgba(15,23,42,0.12)",
  position: "relative",
  zIndex: 2,
};

const logoWrapper = {
  display: "flex",
  justifyContent:
    "center",
  marginBottom: "10px",
};

const logoCircle = {
  width: "68px",
  height: "68px",
  borderRadius: "18px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "34px",
  background:
    "linear-gradient(135deg, #0e9f99, #087f68)",
  boxShadow:
    "0 10px 25px rgba(14,159,153,0.25)",
};

const brandBlock = {
  textAlign: "center",
};

const brandSmall = {
  color: "#0e9f99",
  fontSize: "10px",
  fontWeight: "900",
  letterSpacing: "3px",
};

const brandTitle = {
  margin:
    "3px 0 2px",
  fontSize: "22px",
  fontWeight: "900",
  color: "#172536",
  letterSpacing: "1px",
};

const brandSubtitle = {
  margin: 0,
  fontSize: "10px",
  color: "#718096",
};

const loginHeader = {
  marginTop: "25px",
  marginBottom: "18px",
  textAlign: "left",
};

const loginTitle = {
  margin: 0,
  fontSize: "20px",
  color: "#172536",
};

const loginSubtitle = {
  margin:
    "5px 0 0",
  fontSize: "11px",
  lineHeight: "1.5",
  color: "#718096",
};

const formStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "14px",
};

const fieldWrapper = {
  width: "100%",
};

const labelStyle = {
  display: "block",
  marginBottom: "6px",
  fontSize: "11px",
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
  transform:
    "translateY(-50%)",
  fontSize: "14px",
  zIndex: 2,
};

const inputStyleWithIcon = {
  width: "100%",
  boxSizing: "border-box",
  height: "45px",
  padding:
    "0 12px 0 38px",
  border:
    "1px solid #d7e0e8",
  borderRadius: "8px",
  outline: "none",
  fontSize: "12px",
  color: "#172536",
  background: "#fff",
};

const inputStyleWithIconAndButton = {
  width: "100%",
  boxSizing: "border-box",
  height: "45px",
  padding:
    "0 45px 0 38px",
  border:
    "1px solid #d7e0e8",
  borderRadius: "8px",
  outline: "none",
  fontSize: "12px",
  color: "#172536",
  background: "#fff",
};

const passwordButton = {
  position: "absolute",
  right: "5px",
  top: "5px",
  width: "35px",
  height: "35px",
  border: "none",
  background: "#f5f7fa",
  borderRadius: "6px",
  cursor: "pointer",
  fontSize: "14px",
};

const forgotButton = {
  border: "none",
  background: "transparent",
  color: "#087f68",
  fontSize: "10px",
  fontWeight: "800",
  cursor: "pointer",
  padding: "2px",
};

const loginButton = {
  width: "100%",
  height: "46px",
  border: "none",
  borderRadius: "8px",
  background:
    "linear-gradient(135deg, #0e9f99, #087f68)",
  color: "#fff",
  fontSize: "12px",
  fontWeight: "900",
  cursor: "pointer",
  boxShadow:
    "0 8px 20px rgba(14,159,153,0.22)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
};

const errorBox = {
  display: "flex",
  gap: "8px",
  alignItems: "flex-start",
  padding: "10px",
  marginBottom: "14px",
  borderRadius: "8px",
  background: "#fff1f2",
  border:
    "1px solid #fecdd3",
  color: "#be123c",
  fontSize: "10px",
  lineHeight: "1.4",
};

const successBox = {
  display: "flex",
  gap: "8px",
  alignItems: "flex-start",
  padding: "10px",
  marginBottom: "14px",
  borderRadius: "8px",
  background: "#ecfdf5",
  border:
    "1px solid #a7f3d0",
  color: "#047857",
  fontSize: "10px",
  lineHeight: "1.4",
};

const messageIcon = {
  flexShrink: 0,
};

const securityBox = {
  display: "flex",
  gap: "10px",
  marginTop: "20px",
  padding: "11px",
  borderRadius: "9px",
  background: "#f0fdfa",
  border:
    "1px solid #ccfbf1",
};

const securityIcon = {
  fontSize: "20px",
};

const securityTitle = {
  display: "block",
  color: "#087f68",
  fontSize: "10px",
};

const securityText = {
  margin:
    "3px 0 0",
  fontSize: "9px",
  lineHeight: "1.4",
  color: "#64748b",
};

const footer = {
  marginTop: "20px",
  paddingTop: "13px",
  borderTop:
    "1px solid #edf1f5",
  display: "flex",
  justifyContent:
    "space-between",
  color: "#94a3b8",
  fontSize: "8px",
};

const loadingCard = {
  width: "100%",
  maxWidth: "360px",
  background: "#fff",
  borderRadius: "15px",
  padding: "35px 25px",
  textAlign: "center",
  boxShadow:
    "0 20px 60px rgba(15,23,42,0.12)",
};

const loadingTitle = {
  margin:
    "12px 0 4px",
  fontSize: "17px",
  color: "#172536",
};

const loadingText = {
  margin: 0,
  color: "#718096",
  fontSize: "10px",
};

const spinner = {
  width: "22px",
  height: "22px",
  margin:
    "18px auto 0",
  border:
    "3px solid #d7f3ef",
  borderTop:
    "3px solid #0e9f99",
  borderRadius: "50%",
};

const buttonSpinner = {
  width: "12px",
  height: "12px",
  border:
    "2px solid rgba(255,255,255,0.4)",
  borderTop:
    "2px solid #fff",
  borderRadius: "50%",
};
