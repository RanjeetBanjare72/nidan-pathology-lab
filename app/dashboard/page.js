"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);

  const [stats, setStats] = useState({
    patients: 0,
    collection: 0,
    bills: 0,
    pendingReports: 0,
  });

  const [recentPatients, setRecentPatients] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // ============================================================
  // INITIALIZE
  // ============================================================

  useEffect(() => {
    let mounted = true;

    const initialize = async () => {
      try {
        setLoading(true);

        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (error) {
          console.error("Session error:", error);

          if (mounted) {
            router.replace("/login");
          }

          return;
        }

        if (!session?.user) {
          if (mounted) {
            router.replace("/login");
          }

          return;
        }

        if (!mounted) return;

        setUser(session.user);

        await loadDashboardData(session.user);

      } catch (error) {
        console.error("Dashboard initialization error:", error);

        if (mounted) {
          router.replace("/login");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initialize();

    // ==========================================================
    // AUTH LISTENER
    // ==========================================================

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!mounted) return;

        if (!session?.user) {
          setUser(null);
          setSubscription(null);
          router.replace("/login");
        } else {
          setUser(session.user);
        }
      }
    );

    return () => {
      mounted = false;
      authListener?.unsubscribe();
    };
  }, [router]);

  // ============================================================
  // LOAD DASHBOARD
  // ============================================================

  async function loadDashboardData(currentUser) {
    if (!currentUser?.id) return;

    try {
      // --------------------------------------------------------
      // SUBSCRIPTION
      // --------------------------------------------------------

      const {
        data: subscriptionData,
        error: subscriptionError,
      } = await supabase
        .from("subscriptions")
        .select("*")
        .eq("user_id", currentUser.id)
        .order("start_date", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

      if (subscriptionError) {
        console.error(
          "Subscription error:",
          subscriptionError
        );
      }

      setSubscription(subscriptionData || null);

      // --------------------------------------------------------
      // PATIENTS
      // --------------------------------------------------------

      const {
        data: patientData,
        error: patientError,
      } = await supabase
        .from("patients")
        .select("*");

      if (patientError) {
        console.error(
          "Patients error:",
          patientError
        );
      }

      const patients = patientData || [];

      const sortedPatients = [...patients].sort(
        (a, b) => {
          const dateA = new Date(
            a.created_at ||
            a.createdAt ||
            a.registration_date ||
            a.date ||
            0
          ).getTime();

          const dateB = new Date(
            b.created_at ||
            b.createdAt ||
            b.registration_date ||
            b.date ||
            0
          ).getTime();

          return dateB - dateA;
        }
      );

      setRecentPatients(
        sortedPatients.slice(0, 5)
      );

      // --------------------------------------------------------
      // BILLS
      // --------------------------------------------------------

      const {
        data: billData,
        error: billError,
      } = await supabase
        .from("bills")
        .select("*");

      if (billError) {
        console.error(
          "Bills error:",
          billError
        );
      }

      const bills = billData || [];

      // --------------------------------------------------------
      // REPORTS
      // --------------------------------------------------------

      const {
        data: reportData,
        error: reportError,
      } = await supabase
        .from("reports")
        .select("*");

      if (reportError) {
        console.error(
          "Reports error:",
          reportError
        );
      }

      const reports = reportData || [];

      // --------------------------------------------------------
      // TODAY
      // --------------------------------------------------------

      const today = new Date();

      function isToday(value) {
        if (!value) return false;

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) {
          return false;
        }

        return (
          date.getFullYear() === today.getFullYear() &&
          date.getMonth() === today.getMonth() &&
          date.getDate() === today.getDate()
        );
      }

      const todayBills = bills.filter((bill) =>
        isToday(
          bill.created_at ||
          bill.createdAt ||
          bill.bill_date ||
          bill.date
        )
      );

      // --------------------------------------------------------
      // COLLECTION
      // --------------------------------------------------------

      const todayCollection =
        todayBills.reduce((total, bill) => {
          const amount = Number(
            bill.amount ??
            bill.total ??
            bill.total_amount ??
            bill.paid_amount ??
            bill.net_amount ??
            0
          );

          return total + (
            Number.isFinite(amount)
              ? amount
              : 0
          );
        }, 0);

      // --------------------------------------------------------
      // PENDING REPORTS
      // --------------------------------------------------------

      const pendingReports = reports.filter(
        (report) => {
          const status = String(
            report.status ??
            report.report_status ??
            report.result_status ??
            ""
          ).toLowerCase();

          return [
            "pending",
            "incomplete",
            "processing",
            "draft",
          ].includes(status);
        }
      );

      setStats({
        patients: patients.length,
        collection: todayCollection,
        bills: todayBills.length,
        pendingReports: pendingReports.length,
      });

    } catch (error) {
      console.error(
        "Dashboard data error:",
        error
      );
    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  async function refreshDashboard() {
    if (!user || refreshing) return;

    try {
      setRefreshing(true);

      await loadDashboardData(user);

    } catch (error) {
      console.error(
        "Refresh error:",
        error
      );
    } finally {
      setRefreshing(false);
    }
  }

  // ============================================================
  // LOGOUT
  // ============================================================

  async function logout() {
    if (loggingOut) return;

    const confirmed = window.confirm(
      "Kya aap NIDAN Pathology Lab se Logout karna chahte hain?"
    );

    if (!confirmed) return;

    try {
      setLoggingOut(true);

      // Clear React state
      setUser(null);
      setSubscription(null);

      // Supabase logout
      const { error } =
        await supabase.auth.signOut();

      if (error) {
        console.error(
          "Supabase logout error:",
          error
        );

        alert(
          "Logout failed. Please try again."
        );

        setLoggingOut(false);
        return;
      }

      // Clear browser storage
      try {
        localStorage.clear();
      } catch (e) {
        console.log(
          "localStorage clear skipped"
        );
      }

      try {
        sessionStorage.clear();
      } catch (e) {
        console.log(
          "sessionStorage clear skipped"
        );
      }

      // Force login page
      window.location.replace("/login");

    } catch (error) {
      console.error(
        "Logout error:",
        error
      );

      alert(
        "Logout failed. Please try again."
      );

      setLoggingOut(false);
    }
  }

  // ============================================================
  // HELPERS
  // ============================================================

  function getPatientName(patient) {
    return (
      patient.name ||
      patient.patient_name ||
      patient.full_name ||
      patient.patientName ||
      "Unknown Patient"
    );
  }

  function getPatientId(patient) {
    return (
      patient.patient_id ||
      patient.patientId ||
      patient.registration_no ||
      patient.registration_number ||
      patient.patient_number ||
      patient.id ||
      "N/A"
    );
  }

  function getPatientAge(patient) {
    return (
      patient.age ||
      patient.patient_age ||
      patient.years ||
      "N/A"
    );
  }

  function getPatientMobile(patient) {
    return (
      patient.mobile ||
      patient.phone ||
      patient.mobile_number ||
      patient.phone_number ||
      "No mobile"
    );
  }

  function formatDate(value) {
    if (!value) return "N/A";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "N/A";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
  }

  function getDaysRemaining() {
    if (!subscription?.expiry_date) {
      return null;
    }

    const expiry = new Date(
      subscription.expiry_date
    );

    const now = new Date();

    const difference =
      expiry.getTime() -
      now.getTime();

    return Math.max(
      0,
      Math.ceil(
        difference /
        (1000 * 60 * 60 * 24)
      )
    );
  }

  const daysRemaining =
    getDaysRemaining();

  // ============================================================
  // LOADING
  // ============================================================

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">

        <div className="text-center">

          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600" />

          <h2 className="text-lg font-bold text-slate-800">
            Loading Dashboard...
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            NIDAN Pathology Lab
          </p>

        </div>

      </main>
    );
  }

  // ============================================================
  // DASHBOARD UI
  // ============================================================

  return (
    <main className="min-h-screen bg-slate-50 text-slate-800">

      <div className="flex min-h-screen">

        {/* ======================================================
            SIDEBAR
        ====================================================== */}

        <aside className="hidden w-56 shrink-0 bg-[#082638] text-white md:flex md:flex-col">

          {/* LOGO */}

          <div className="border-b border-white/10 p-5">

            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 text-xl font-bold">
                N+
              </div>

              <div>
                <h1 className="text-sm font-bold">
                  NIDAN
                </h1>

                <p className="text-[9px] tracking-wider text-slate-300">
                  PATHOLOGY LAB
                </p>
              </div>

            </div>

          </div>

          {/* MENU */}

          <div className="flex-1 px-3 py-5">

            <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Main Menu
            </p>

            <nav className="space-y-1">

              <NavItem
                href="/dashboard"
                icon="▦"
                label="Dashboard"
                active
              />

              <NavItem
                href="/patients"
                icon="+"
                label="New Patient"
              />

              <NavItem
                href="/patients"
                icon="♙"
                label="Patients"
              />

              <NavItem
                href="/billing"
                icon="₹"
                label="Billing"
              />

              <NavItem
                href="/results"
                icon="⌁"
                label="Samples"
              />

              <NavItem
                href="/results"
                icon="▤"
                label="Result Entry"
              />

              <NavItem
                href="/reports"
                icon="▧"
                label="Reports"
              />

            </nav>

            <p className="mb-3 mt-8 px-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">
              Management
            </p>

            <nav className="space-y-1">

              <NavItem
                href="/test-master"
                icon="♙"
                label="Test Master"
              />

              <NavItem
                href="/doctors"
                icon="♧"
                label="Doctors"
              />

              <NavItem
                href="/settings"
                icon="⚙"
                label="Settings"
              />

            </nav>

          </div>

          {/* SIDEBAR LOGOUT */}

          <div className="border-t border-white/10 p-3">

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 rounded-xl bg-red-600 px-4 py-3 text-left text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-60"
            >

              <span className="text-lg">
                🚪
              </span>

              <span>
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </span>

            </button>

          </div>

        </aside>

        {/* ======================================================
            MAIN SECTION
        ====================================================== */}

        <section className="min-w-0 flex-1">

          {/* HEADER */}

          <header className="sticky top-0 z-40 flex min-h-[68px] items-center justify-between border-b border-slate-200 bg-white px-3 shadow-sm sm:px-5 md:px-6">

            <div>

              <h2 className="text-lg font-bold">
                Dashboard
              </h2>

              <p className="hidden text-[10px] text-slate-400 sm:block">
                NIDAN Pathology Laboratory Management System
              </p>

            </div>

            <div className="flex items-center gap-2">

              <div className="hidden items-center gap-2 rounded-full bg-green-50 px-3 py-2 text-xs font-semibold text-green-700 sm:flex">

                <span className="h-2 w-2 rounded-full bg-green-500" />

                Lab Online

              </div>

              {/* HEADER LOGOUT */}

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-60 sm:text-sm"
              >
                🚪{" "}
                {loggingOut
                  ? "Logout..."
                  : "Logout"}
              </button>

            </div>

          </header>

          {/* MOBILE NAV */}

          <div className="flex gap-2 overflow-x-auto border-b border-slate-200 bg-white px-3 py-2 md:hidden">

            <MobileNav
              href="/dashboard"
              label="Dashboard"
            />

            <MobileNav
              href="/patients"
              label="Patients"
            />

            <MobileNav
              href="/billing"
              label="Billing"
            />

            <MobileNav
              href="/results"
              label="Results"
            />

            <MobileNav
              href="/reports"
              label="Reports"
            />

            <MobileNav
              href="/settings"
              label="Settings"
            />

            <button
              type="button"
              onClick={logout}
              disabled={loggingOut}
              className="shrink-0 rounded-lg bg-red-600 px-4 py-2 text-xs font-bold text-white"
            >
              🚪 Logout
            </button>

          </div>

          {/* CONTENT */}

          <div className="p-4 md:p-6">

            {/* TITLE */}

            <div className="mb-5 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

              <div>

                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-teal-600">
                  Laboratory Dashboard
                </p>

                <h1 className="mt-1 text-2xl font-extrabold tracking-tight md:text-3xl">
                  Welcome to NIDAN Pathology Lab
                </h1>

                <p className="mt-1 max-w-2xl text-sm text-slate-500">
                  Patients, billing, samples, test results aur laboratory reports ek jagah manage karein.
                </p>

              </div>

              <Link
                href="/patients"
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-md hover:bg-teal-700"
              >
                + New Patient
              </Link>

            </div>

            {/* SUBSCRIPTION */}

            {subscription && (
              <div className="mb-5 rounded-xl border border-teal-100 bg-white p-4 shadow-sm">

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                  <div>

                    <div className="flex items-center gap-2">

                      <span className="rounded-full bg-teal-600 px-3 py-1 text-[10px] font-bold text-white">
                        {subscription.plan || "TRIAL"}
                      </span>

                      <span className="text-xs font-semibold text-green-600">
                        ●{" "}
                        {subscription.status || "ACTIVE"}
                      </span>

                    </div>

                    <p className="mt-2 text-sm font-bold">
                      Laboratory Subscription
                    </p>

                    <p className="text-xs text-slate-500">
                      {subscription.notes ||
                        "Subscription active"}
                    </p>

                  </div>

                  <div className="sm:text-right">

                    {daysRemaining !== null && (
                      <p className="text-xl font-extrabold text-teal-700">
                        {daysRemaining} Days
                      </p>
                    )}

                    <p className="text-[11px] text-slate-500">
                      Expiry:{" "}
                      {formatDate(
                        subscription.expiry_date
                      )}
                    </p>

                  </div>

                </div>

              </div>
            )}

            {/* STATS */}

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">

              <StatCard
                icon="♙"
                label="Total Patients"
                value={stats.patients}
              />

              <StatCard
                icon="₹"
                label="Today's Collection"
                value={`₹${stats.collection.toLocaleString(
                  "en-IN"
                )}`}
              />

              <StatCard
                icon="▣"
                label="Today's Bills"
                value={stats.bills}
              />

              <StatCard
                icon="▤"
                label="Pending Reports"
                value={stats.pendingReports}
              />

            </div>

            {/* RECENT + QUICK */}

            <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_300px]">

              {/* RECENT PATIENTS */}

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">

                  <div>

                    <h2 className="font-bold">
                      Recent Patients
                    </h2>

                    <p className="text-xs text-slate-400">
                      Latest registered patients
                    </p>

                  </div>

                  <Link
                    href="/patients"
                    className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-bold text-teal-700"
                  >
                    View All
                  </Link>

                </div>

                <div className="divide-y divide-slate-100">

                  {recentPatients.length === 0 ? (

                    <div className="px-5 py-10 text-center">

                      <div className="text-3xl">
                        ♙
                      </div>

                      <p className="mt-2 text-sm font-semibold">
                        No patients found
                      </p>

                    </div>

                  ) : (

                    recentPatients.map(
                      (patient, index) => (

                        <div
                          key={
                            patient.id ||
                            patient.patient_id ||
                            index
                          }
                          className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-slate-50"
                        >

                          <div className="min-w-0">

                            <p className="truncate text-sm font-bold">
                              {getPatientName(
                                patient
                              )}
                            </p>

                            <p className="text-xs text-slate-500">
                              {getPatientId(
                                patient
                              )}
                            </p>

                            <p className="text-xs text-slate-400">
                              {getPatientMobile(
                                patient
                              )}
                              {" • "}
                              {getPatientAge(
                                patient
                              )}
                              {" Years"}
                            </p>

                          </div>

                          <span className="hidden rounded-full bg-teal-50 px-2 py-1 text-[10px] font-bold text-teal-700 sm:block">
                            Patient
                          </span>

                        </div>

                      )
                    )

                  )}

                </div>

              </div>

              {/* QUICK ACTIONS */}

              <div className="rounded-xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-4">

                  <h2 className="font-bold">
                    Quick Actions
                  </h2>

                  <p className="text-xs text-slate-400">
                    Frequently used options
                  </p>

                </div>

                <div className="p-3">

                  <QuickAction
                    href="/patients"
                    icon="+"
                    title="New Patient"
                    description="Register new patient"
                  />

                  <QuickAction
                    href="/billing"
                    icon="₹"
                    title="Create Bill"
                    description="Patient billing"
                  />

                  <QuickAction
                    href="/results"
                    icon="▤"
                    title="Result Entry"
                    description="Enter test results"
                  />

                  <QuickAction
                    href="/reports"
                    icon="▣"
                    title="Reports"
                    description="View final reports"
                  />

                </div>

              </div>

            </div>

            {/* BOTTOM BUTTONS */}

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={refreshDashboard}
                disabled={refreshing}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold shadow-sm disabled:opacity-60"
              >
                {refreshing
                  ? "Refreshing..."
                  : "↻ Refresh Dashboard"}
              </button>

              <button
                type="button"
                onClick={logout}
                disabled={loggingOut}
                className="rounded-lg bg-red-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:bg-red-700 disabled:opacity-60"
              >
                🚪{" "}
                {loggingOut
                  ? "Logging out..."
                  : "Logout"}
              </button>

            </div>

            {/* FOOTER */}

            <footer className="mt-8 border-t border-slate-200 py-5 text-center">

              <p className="text-xs font-semibold text-slate-400">
                NIDAN PATHOLOGY LAB • Laboratory Management Software
              </p>

              <p className="mt-1 text-[10px] text-slate-400">
                © {new Date().getFullYear()} NIDAN Pathology Lab
              </p>

            </footer>

          </div>

        </section>

      </div>

    </main>
  );
}

// ============================================================
// NAV ITEM
// ============================================================

function NavItem({
  href,
  icon,
  label,
  active = false,
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold ${
        active
          ? "bg-teal-600/30 text-white ring-1 ring-teal-400/30"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span className="w-5 text-center">
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

// ============================================================
// MOBILE NAV
// ============================================================

function MobileNav({
  href,
  label,
}) {
  return (
    <Link
      href={href}
      className="shrink-0 whitespace-nowrap rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-600"
    >
      {label}
    </Link>
  );
}

// ============================================================
// STAT CARD
// ============================================================

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg font-bold text-teal-600">
          {icon}
        </div>

        <div className="min-w-0">

          <p className="truncate text-[11px] font-medium text-slate-400">
            {label}
          </p>

          <p className="mt-0.5 text-xl font-extrabold">
            {value}
          </p>

        </div>

      </div>

    </div>
  );
}

// ============================================================
// QUICK ACTION
// ============================================================

function QuickAction({
  href,
  icon,
  title,
  description,
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-lg p-3 hover:bg-slate-50"
    >

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-600">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="text-sm font-bold">
          {title}
        </p>

        <p className="truncate text-[11px] text-slate-400">
          {description}
        </p>

      </div>

    </Link>
  );
}
