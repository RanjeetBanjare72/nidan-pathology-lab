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
  const [labOnline, setLabOnline] = useState(true);
  const [error, setError] = useState("");

  // ----------------------------------------------------
  // AUTH + DASHBOARD LOAD
  // ----------------------------------------------------
  useEffect(() => {
    let mounted = true;

    async function initDashboard() {
      try {
        setLoading(true);
        setError("");

        const {
          data: { user: currentUser },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !currentUser) {
          router.replace("/login");
          return;
        }

        if (!mounted) return;

        setUser(currentUser);

        await loadDashboard(currentUser);
      } catch (err) {
        console.error("Dashboard error:", err);

        if (mounted) {
          setError("Dashboard data load nahi ho pa raha hai.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initDashboard();

    // Auth state listener
    const {
      data: { subscription: authSubscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      if (event === "SIGNED_OUT" || !session?.user) {
        router.replace("/login");
      } else {
        setUser(session.user);
      }
    });

    return () => {
      mounted = false;
      authSubscription?.unsubscribe();
    };
  }, [router]);

  // ----------------------------------------------------
  // LOAD DASHBOARD DATA
  // ----------------------------------------------------
  async function loadDashboard(currentUser) {
    try {
      setLoading(true);

      // -----------------------------
      // SUBSCRIPTION
      // -----------------------------
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (!subscriptionError && subscriptionData) {
        setSubscription(subscriptionData);
      }

      // -----------------------------
      // PATIENTS
      // -----------------------------
      let patientCount = 0;
      let patients = [];

      const {
        count: patientsCount,
        data: patientData,
        error: patientsError,
      } = await supabase
        .from("patients")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(10);

      if (!patientsError) {
        patientCount = patientsCount || 0;
        patients = patientData || [];
      } else {
        console.error("Patients error:", patientsError);
      }

      setRecentPatients(patients);

      // -----------------------------
      // BILLS
      // -----------------------------
      let billCount = 0;
      let collection = 0;

      const {
        data: billData,
        count: billsCount,
        error: billsError,
      } = await supabase
        .from("bills")
        .select("*", { count: "exact" })
        .order("created_at", { ascending: false })
        .limit(500);

      if (!billsError) {
        billCount = billsCount || 0;

        collection = (billData || []).reduce((total, bill) => {
          const amount =
            Number(
              bill.total_amount ??
                bill.amount ??
                bill.grand_total ??
                bill.paid_amount ??
                0
            ) || 0;

          return total + amount;
        }, 0);
      } else {
        console.error("Bills error:", billsError);
      }

      // -----------------------------
      // REPORTS
      // -----------------------------
      let pendingReports = 0;

      const {
        data: reportsData,
        error: reportsError,
      } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (!reportsError) {
        pendingReports = (reportsData || []).filter((report) => {
          const status = String(
            report.status ??
              report.report_status ??
              report.result_status ??
              ""
          ).toUpperCase();

          return (
            status === "PENDING" ||
            status === "INCOMPLETE" ||
            status === "DRAFT" ||
            status === "PROCESSING"
          );
        }).length;
      } else {
        console.error("Reports error:", reportsError);
      }

      setStats({
        patients: patientCount,
        collection,
        bills: billCount,
        pendingReports,
      });
    } catch (err) {
      console.error("loadDashboard:", err);
      setError("Dashboard data load karne mein problem hui.");
    } finally {
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // LOGOUT
  // ----------------------------------------------------
  async function logout() {
    try {
      setLoading(true);

      const { error: logoutError } = await supabase.auth.signOut();

      if (logoutError) {
        console.error("Logout error:", logoutError);
        setError("Logout nahi ho paya. Dobara try karein.");
        setLoading(false);
        return;
      }

      router.replace("/login");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Logout mein error aaya.");
      setLoading(false);
    }
  }

  // ----------------------------------------------------
  // REFRESH
  // ----------------------------------------------------
  async function refreshDashboard() {
    if (!user) return;

    setError("");
    await loadDashboard(user);
  }

  // ----------------------------------------------------
  // DATE FORMAT
  // ----------------------------------------------------
  function formatDate(dateValue) {
    if (!dateValue) return "-";

    try {
      return new Date(dateValue).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return "-";
    }
  }

  // ----------------------------------------------------
  // PATIENT NAME
  // ----------------------------------------------------
  function getPatientName(patient) {
    if (!patient) return "Unknown Patient";

    return (
      patient.patient_name ||
      patient.name ||
      patient.full_name ||
      `${patient.first_name || ""} ${patient.last_name || ""}`.trim() ||
      "Unknown Patient"
    );
  }

  // ----------------------------------------------------
  // PATIENT ID
  // ----------------------------------------------------
  function getPatientId(patient) {
    if (!patient) return "-";

    return (
      patient.patient_id ||
      patient.patient_code ||
      patient.registration_no ||
      patient.opd_no ||
      patient.id ||
      "-"
    );
  }

  // ----------------------------------------------------
  // PATIENT AGE
  // ----------------------------------------------------
  function getPatientAge(patient) {
    if (!patient) return "";

    if (patient.age !== null && patient.age !== undefined) {
      return `${patient.age} Years`;
    }

    return "";
  }

  // ----------------------------------------------------
  // SUBSCRIPTION DAYS
  // ----------------------------------------------------
  function getDaysRemaining() {
    if (!subscription?.expiry_date) return null;

    const expiry = new Date(subscription.expiry_date);
    const today = new Date();

    const difference = expiry.getTime() - today.getTime();

    return Math.max(
      0,
      Math.ceil(difference / (1000 * 60 * 60 * 24))
    );
  }

  const daysRemaining = getDaysRemaining();

  // ----------------------------------------------------
  // LOADING SCREEN
  // ----------------------------------------------------
  if (loading && !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-teal-600"></div>
          <p className="font-medium text-slate-700">
            Dashboard loading...
          </p>
          <p className="mt-1 text-sm text-slate-400">
            NIDAN Pathology Lab
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // DASHBOARD UI
  // ----------------------------------------------------
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <div className="flex min-h-screen">

        {/* =================================================
            SIDEBAR
        ================================================= */}
        <aside className="hidden w-64 flex-shrink-0 bg-[#08283a] text-white md:flex md:flex-col">

          {/* Logo */}
          <div className="border-b border-white/10 px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-500 font-bold text-white">
                N+
              </div>

              <div>
                <div className="text-lg font-bold tracking-wide">
                  NIDAN
                </div>

                <div className="text-[9px] uppercase tracking-[2px] text-slate-300">
                  Pathology Lab
                </div>
              </div>
            </div>
          </div>

          {/* Menu */}
          <div className="flex-1 overflow-y-auto px-3 py-5">

            <div className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
              Main Menu
            </div>

            <SidebarLink
              href="/dashboard"
              icon="▦"
              label="Dashboard"
              active
            />

            <SidebarLink
              href="/patients?new=1"
              icon="+"
              label="New Patient"
            />

            <SidebarLink
              href="/patients"
              icon="♙"
              label="Patients"
            />

            <SidebarLink
              href="/billing"
              icon="₹"
              label="Billing"
            />

            <SidebarLink
              href="/results"
              icon="⌁"
              label="Samples"
            />

            <SidebarLink
              href="/results"
              icon="▤"
              label="Result Entry"
            />

            <SidebarLink
              href="/reports"
              icon="▧"
              label="Reports"
            />

            <div className="mb-3 mt-7 px-3 text-[10px] font-semibold uppercase tracking-[2px] text-slate-400">
              Management
            </div>

            <SidebarLink
              href="/test-master"
              icon="♧"
              label="Test Master"
            />

            <SidebarLink
              href="/doctors"
              icon="♧"
              label="Doctors"
            />

            <SidebarLink
              href="/settings"
              icon="⚙"
              label="Settings"
            />
          </div>

          {/* Subscription */}
          {subscription && (
            <div className="mx-3 mb-3 rounded-xl border border-teal-400/20 bg-white/5 p-3">
              <div className="text-xs font-semibold text-teal-300">
                {subscription.plan || "TRIAL"} PLAN
              </div>

              {daysRemaining !== null && (
                <div className="mt-1 text-[11px] text-slate-300">
                  {daysRemaining} days remaining
                </div>
              )}
            </div>
          )}

          {/* LOGOUT */}
          <div className="border-t border-white/10 p-3">
            <button
              type="button"
              onClick={logout}
              disabled={loading}
              className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold text-red-300 transition hover:bg-red-500/10 hover:text-red-200 disabled:opacity-50"
            >
              <span className="text-base">🚪</span>
              <span>
                {loading ? "Logging out..." : "Logout"}
              </span>
            </button>
          </div>
        </aside>

        {/* =================================================
            MAIN CONTENT
        ================================================= */}
        <main className="min-w-0 flex-1">

          {/* Header */}
          <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 shadow-sm md:px-7">

            <div>
              <h1 className="text-lg font-bold text-slate-800">
                Dashboard
              </h1>

              <p className="hidden text-[10px] text-slate-400 sm:block">
                NIDAN Pathology Laboratory Management System
              </p>
            </div>

            <div className="flex items-center gap-3">

              <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 sm:flex">
                <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                {labOnline ? "Lab Online" : "Offline"}
              </div>

              <button
                type="button"
                onClick={logout}
                className="rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 md:hidden"
              >
                Logout
              </button>
            </div>
          </header>

          <div className="p-4 md:p-7">

            {/* Error */}
            {error && (
              <div className="mb-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Welcome */}
            <section className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

              <div>
                <div className="mb-2 text-[10px] font-bold uppercase tracking-[2px] text-teal-600">
                  Laboratory Dashboard
                </div>

                <h2 className="text-2xl font-bold text-slate-800 md:text-3xl">
                  Welcome to NIDAN Pathology Lab
                </h2>

                <p className="mt-2 max-w-2xl text-sm text-slate-500">
                  Patients, billing, samples, test results aur laboratory
                  reports ko ek jagah manage karein.
                </p>
              </div>

              <Link
                href="/patients?new=1"
                className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-teal-600/20 transition hover:bg-teal-700"
              >
                + New Patient
              </Link>
            </section>

            {/* =================================================
                STAT CARDS
            ================================================= */}
            <section className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">

              <StatCard
                icon="♙"
                title="Total Patients"
                value={stats.patients}
                href="/patients"
              />

              <StatCard
                icon="₹"
                title="Today's Collection"
                value={`₹${Number(stats.collection || 0).toLocaleString(
                  "en-IN"
                )}`}
                href="/billing"
              />

              <StatCard
                icon="▣"
                title="Today's Bills"
                value={stats.bills}
                href="/billing"
              />

              <StatCard
                icon="▤"
                title="Pending Reports"
                value={stats.pendingReports}
                href="/reports"
              />
            </section>

            {/* =================================================
                CONTENT GRID
            ================================================= */}
            <section className="grid gap-5 xl:grid-cols-[1fr_330px]">

              {/* Recent Patients */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
                  <div>
                    <h3 className="font-bold text-slate-800">
                      Recent Patients
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      Latest registered patients
                    </p>
                  </div>

                  <Link
                    href="/patients"
                    className="rounded-lg bg-teal-50 px-3 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-100"
                  >
                    View All
                  </Link>
                </div>

                <div className="divide-y divide-slate-100">

                  {recentPatients.length === 0 ? (
                    <div className="px-5 py-12 text-center">
                      <div className="mb-3 text-4xl">♙</div>

                      <p className="font-semibold text-slate-700">
                        No patients found
                      </p>

                      <p className="mt-1 text-xs text-slate-400">
                        New patient register karne ke liye button dabayein.
                      </p>

                      <Link
                        href="/patients?new=1"
                        className="mt-4 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white"
                      >
                        + Add Patient
                      </Link>
                    </div>
                  ) : (
                    recentPatients.slice(0, 8).map((patient, index) => (
                      <div
                        key={
                          patient.id ||
                          patient.patient_id ||
                          `patient-${index}`
                        }
                        className="flex items-center justify-between gap-3 px-5 py-4 transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">

                          <div className="truncate text-sm font-bold text-slate-800">
                            {getPatientName(patient)}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            {getPatientId(patient)}
                          </div>

                          <div className="mt-1 text-[11px] text-slate-400">
                            {patient.mobile ||
                              patient.phone ||
                              "No mobile"}{" "}
                            •{" "}
                            {getPatientAge(patient) || "Age N/A"}
                          </div>
                        </div>

                        <div className="hidden text-right sm:block">
                          <div className="text-[10px] text-slate-400">
                            Registered
                          </div>

                          <div className="mt-1 text-xs font-semibold text-slate-600">
                            {formatDate(patient.created_at)}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">

                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-bold text-slate-800">
                    Quick Actions
                  </h3>

                  <p className="mt-0.5 text-xs text-slate-400">
                    Frequently used options
                  </p>
                </div>

                <div className="p-3">

                  <QuickAction
                    href="/patients?new=1"
                    icon="+"
                    title="New Patient"
                    subtitle="Register new patient"
                  />

                  <QuickAction
                    href="/billing"
                    icon="₹"
                    title="Create Bill"
                    subtitle="Patient billing"
                  />

                  <QuickAction
                    href="/results"
                    icon="▤"
                    title="Result Entry"
                    subtitle="Enter test results"
                  />

                  <QuickAction
                    href="/reports"
                    icon="▣"
                    title="Reports"
                    subtitle="View final reports"
                  />

                  <QuickAction
                    href="/test-master"
                    icon="⚗"
                    title="Test Master"
                    subtitle="Manage laboratory tests"
                  />
                </div>
              </div>
            </section>

            {/* =================================================
                SUBSCRIPTION
            ================================================= */}
            {subscription && (
              <section className="mt-5 rounded-2xl border border-teal-100 bg-gradient-to-r from-teal-50 to-white p-5">

                <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="rounded-full bg-teal-100 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-teal-700">
                        {subscription.plan || "TRIAL"}
                      </span>

                      <span className="text-xs font-medium text-emerald-600">
                        ● {subscription.status || "ACTIVE"}
                      </span>
                    </div>

                    <h3 className="mt-2 font-bold text-slate-800">
                      Laboratory Subscription
                    </h3>

                    <p className="mt-1 text-xs text-slate-500">
                      {subscription.notes ||
                        "Your laboratory subscription is active."}
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    {daysRemaining !== null && (
                      <div className="text-2xl font-bold text-teal-700">
                        {daysRemaining}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-400">
                      Days Remaining
                    </div>

                    {subscription.expiry_date && (
                      <div className="mt-1 text-[10px] text-slate-400">
                        Expires: {formatDate(subscription.expiry_date)}
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* =================================================
                REFRESH
            ================================================= */}
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={refreshDashboard}
                disabled={loading}
                className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 disabled:opacity-50"
              >
                ↻ {loading ? "Refreshing..." : "Refresh Dashboard"}
              </button>
            </div>

            {/* Footer */}
            <footer className="mt-8 border-t border-slate-200 pt-5 text-center text-[10px] text-slate-400">
              NIDAN PATHOLOGY LAB • Laboratory Management Software • © 2026
            </footer>
          </div>
        </main>
      </div>
    </div>
  );
}

// ========================================================
// SIDEBAR LINK
// ========================================================
function SidebarLink({ href, icon, label, active = false }) {
  return (
    <Link
      href={href}
      className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition ${
        active
          ? "bg-teal-600/20 text-white ring-1 ring-teal-400/20"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      <span
        className={`flex h-7 w-7 items-center justify-center rounded-md text-sm ${
          active
            ? "bg-teal-500/20 text-teal-300"
            : "text-slate-400"
        }`}
      >
        {icon}
      </span>

      <span>{label}</span>
    </Link>
  );
}

// ========================================================
// STAT CARD
// ========================================================
function StatCard({ icon, title, value, href }) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-teal-50 text-lg text-teal-600">
          {icon}
        </div>

        <div className="min-w-0">
          <div className="truncate text-[10px] font-medium text-slate-400">
            {title}
          </div>

          <div className="mt-1 text-xl font-bold text-slate-800">
            {value}
          </div>
        </div>
      </div>
    </Link>
  );
}

// ========================================================
// QUICK ACTION
// ========================================================
function QuickAction({ href, icon, title, subtitle }) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 rounded-xl p-3 transition hover:bg-slate-50"
    >
      <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-teal-50 text-lg font-bold text-teal-600 transition group-hover:bg-teal-100">
        {icon}
      </div>

      <div className="min-w-0">
        <div className="text-sm font-bold text-slate-800">
          {title}
        </div>

        <div className="mt-0.5 text-[11px] text-slate-400">
          {subtitle}
        </div>
      </div>
    </Link>
  );
}
