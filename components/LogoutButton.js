"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAndRedirect } from "../lib/auth";
import { supabase } from "../lib/supabase";

export default function LogoutButton() {
  const pathname = usePathname();
  const [hasSession, setHasSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setHasSession(Boolean(data?.session?.user));
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mounted) {
        setHasSession(Boolean(session?.user));
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  if (pathname === "/login" || !hasSession) {
    return null;
  }

  async function handleLogout() {
    if (loggingOut) return;

    const confirmed = window.confirm(
      "Kya aap NIDAN Pathology Lab se Logout karna chahte hain?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      await logoutAndRedirect("/login");
    } catch (error) {
      console.error("Logout error:", error);
      alert("Logout failed. Please try again.");
      setLoggingOut(false);
    }
  }

  return (
    <button
      type="button"
      className="globalLogoutButton"
      onClick={handleLogout}
      disabled={loggingOut}
      aria-label="Logout and return to login page"
    >
      <span aria-hidden="true">🚪</span>
      <span>{loggingOut ? "Logout..." : "Logout"}</span>
    </button>
  );
}
