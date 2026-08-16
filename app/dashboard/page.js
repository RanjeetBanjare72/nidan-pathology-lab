"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [labOnline, setLabOnline] = useState(true);

  const [stats, setStats] = useState({
    patients: 0,
    collection: 0,
    bills: 0,
    pendingReports: 0,
  });

  const [recentPatients, setRecentPatients] = useState([]);

  useEffect(() => {
    loadDashboard();

    const {
      data: { subscription: authListener },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        router.replace("/login");
      }
    });

    return () => {
      authListener?.unsubscribe();
    };
  }, []);

  async function loadDashboard() {
    try {
      setLoading(true);

      // Current logged-in user
      const {
        data: { user: currentUser },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !currentUser) {
        router.replace("/login");
        return;
      }

      setUser(currentUser);

      // -----------------------------------------
      // SUBSCRIPTION
      // -----------------------------------------
      const { data: subscriptionData, error: subscriptionError } =
        await supabase
          .from("subscriptions")
          .select("*")
          .eq("user_id", currentUser.id)
          .order("start_date", { ascending: false })
          .limit(1)
          .maybeSingle();

      if (subscriptionError) {
        console.error("Subscription error:", subscriptionError);
      }

      if (subscriptionData) {
        setSubscription(subscriptionData);
      }

      // -----------------------------------------
      // PATIENT COUNT
      // -----------------------------------------
      try {
        const { count } = await supabase
          .from("patients")
          .select("*", { count: "exact", head: true });

        setStats((old) => ({
          ...old,
          patients: count || 0,
        }));
      } catch (error) {
        console.log("Patient count unavailable");
      }

      // -----------------------------------------
      // RECENT PATIENTS
      // -----------------------------------------
      try {
        const { data: patientsData } = await supabase
          .from("patients")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(5);

        if (patientsData) {
          setRecentPatients(patientsData);
        }
      } catch (error) {
        console.log("Recent patients unavailable");
      }

      // -----------------------------------------
      // BILLS COUNT
      // -----------------------------------------
      try {
        const { count } = await supabase
          .from("bills")
          .select("*", { count: "exact", head: true });

        setStats((old) => ({
          ...old,
          bills: count || 0,
        }));
      } catch (error) {
        console.log("Bills unavailable");
      }

      // -----------------------------------------
      // PENDING REPORTS
      // -----------------------------------------
      try {
        const { count } = await supabase
          .from("reports")
          .select("*", { count: "exact", head: true });

        setStats((old) => ({
          ...old,
          pendingReports: count || 0,
        }));
      } catch (error) {
        console.log("Reports unavailable");
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }

  async function logout() {
    await supabase.auth.signOut();
    router.replace("/login");
  }

  function getDaysRemaining() {
    if (!subscription?.expiry_date) return null;

    const expiry = new Date(subscription.expiry_date);
    const today = new Date();

    const difference = expiry.getTime() - today.getTime();
    return Math.ceil(difference / (1000 * 60 * 60 * 24));
  }

  function formatDate(date) {
    if (!date) return "-";

    return new Date(date).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  }

  const daysRemaining = getDaysRemaining();

  const labName =
    subscription?.lab_name || "NIDAN PATHOLOGY LAB";

  const ownerName =
    subscription?.owner_name || "Ranjeet Banjare";

  const plan =
    subscription?.plan || "TRIAL";

  const subscriptionActive =
    subscription?.status === "ACTIVE" &&
    (daysRemaining === null || daysRemaining > 0);

  if (loading) {
    return (
      <main style={styles.loadingPage}>
        <div style={styles.loadingBox}>
          <div style={styles.logoSmall}>N+</div>
          <h2>NIDAN PATHOLOGY LAB</h2>
          <p>Dashboard loading...</p>
          <div style={styles.loader}></div>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>

      {/* ================= SIDEBAR ================= */}

      <aside style={styles.sidebar}>

        <div style={styles.brand}>
          <div style={styles.brandIcon}>N+</div>

          <div>
            <div style={styles.brandTitle}>NIDAN</div>
            <div style={styles.brandSub}>PATHOLOGY LAB</div>
          </div>
        </div>

        <div style={styles.menuTitle}>MAIN MENU</div>

        <Link href="/dashboard" style={styles.menuActive}>
          <span>▦</span>
          Dashboard
        </Link>

        <Link href="/patients/new" style={styles.menuItem}>
          <span>＋</span>
          New Patient
        </Link>

        <Link href="/patients" style={styles.menuItem}>
          <span>♙</span>
          Patients
        </Link>

        <Link href="/billing" style={styles.menuItem}>
          <span>₹</span>
          Billing
        </Link>

        <Link href="/samples" style={styles.menuItem}>
          <span>⌁</span>
          Samples
        </Link>

        <Link href="/result-entry" style={styles.menuItem}>
          <span>▤</span>
          Result Entry
        </Link>

        <Link href="/reports" style={styles.menuItem}>
          <span>▧</span>
          Reports
        </Link>

        <div style={styles.menuTitleManagement}>
          MANAGEMENT
        </div>

        <Link href="/test-master" style={styles.menuItem}>
          <span>♧</span>
          Test Master
        </Link>

        <Link href="/doctors" style={styles.menuItem}>
          <span>♙</span>
          Doctors
        </Link>

        <Link href="/settings" style={styles.menuItem}>
          <span>⚙</span>
          Settings
        </Link>

        <button onClick={logout} style={styles.logout}>
          ⇥ &nbsp; Logout
        </button>

      </aside>

      {/* ================= MAIN CONTENT ================= */}

      <section style={styles.content}>

        {/* TOP BAR */}

        <header style={styles.header}>

          <div>
            <div style={styles.headerTitle}>Dashboard</div>
            <div style={styles.headerSub}>
              NIDAN Pathology Laboratory Management System
            </div>
          </div>

          <div style={styles.online}>
            <span style={styles.onlineDot}></span>
            {labOnline ? "Lab Online" : "Offline"}
          </div>

        </header>

        <div style={styles.container}>

          {/* ================= WELCOME ================= */}

          <div style={styles.welcomeRow}>

            <div>
              <div style={styles.sectionLabel}>
                LABORATORY DASHBOARD
              </div>

              <h1 style={styles.welcomeTitle}>
                Welcome to {labName}
              </h1>

              <p style={styles.welcomeText}>
                Patients, billing, samples, test results aur laboratory
                reports ko ek jagah manage karein.
              </p>

              <p style={styles.ownerText}>
                Logged in as: <strong>{ownerName}</strong>
              </p>
            </div>

            <Link href="/patients/new" style={styles.newPatientButton}>
              ＋ New
              <br />
              Patient
            </Link>

          </div>

          {/* ================= SUBSCRIPTION ================= */}

          <div
            style={{
              ...styles.subscriptionCard,
              borderColor: subscriptionActive ? "#b9eee4" : "#f5b5b5",
              background: subscriptionActive ? "#f1fffc" : "#fff5f5",
            }}
          >

            <div>
              <div style={styles.subscriptionTitle}>
                {plan === "TRIAL"
                  ? "🎁 30 Days Free Trial"
                  : `💎 ${plan} Plan`}
              </div>

              <div style={styles.subscriptionText}>
                Status:{" "}
                <strong>
                  {subscription?.status || "ACTIVE"}
                </strong>
              </div>

              <div style={styles.subscriptionText}>
                Start:{" "}
                <strong>
                  {formatDate(subscription?.start_date)}
                </strong>
                {"  •  "}
                Expiry:{" "}
                <strong>
                  {formatDate(subscription?.expiry_date)}
                </strong>
              </div>
            </div>

            <div style={styles.daysBox}>
              <strong>
                {daysRemaining !== null
                  ? daysRemaining > 0
                    ? daysRemaining
                    : 0
                  : "-"}
              </strong>
              <span>Days Left</span>
            </div>

          </div>

          {/* ================= STAT CARDS ================= */}

          <div style={styles.statsGrid}>

            <StatCard
              icon="♙"
              title="Total Patients"
              value={stats.patients}
            />

            <StatCard
              icon="₹"
              title="Today's Collection"
              value={`₹${stats.collection}`}
            />

            <StatCard
              icon="▣"
              title="Today's Bills"
              value={stats.bills}
            />

            <StatCard
              icon="▤"
              title="Pending Reports"
              value={stats.pendingReports}
            />

          </div>

          {/* ================= LOWER SECTION ================= */}

          <div style={styles.lowerGrid}>

            {/* RECENT PATIENTS */}

            <div style={styles.panel}>

              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>
                    Recent Patients
                  </h2>

                  <p style={styles.panelSub}>
                    Latest registered patients
                  </p>
                </div>

                <Link href="/patients" style={styles.viewButton}>
                  View All
                </Link>
              </div>

              {recentPatients.length === 0 ? (

                <div style={styles.empty}>
                  <div style={styles.emptyIcon}>♙</div>

                  <strong>No patients found</strong>

                  <p>
                    Start by adding your first patient.
                  </p>

                  <Link
                    href="/patients/new"
                    style={styles.smallButton}
                  >
                    ＋ Add Patient
                  </Link>
                </div>

              ) : (

                recentPatients.map((patient, index) => (

                  <div
                    key={patient.id || index}
                    style={styles.patientRow}
                  >

                    <div style={styles.patientIcon}>
                      ♙
                    </div>

                    <div style={styles.patientInfo}>

                      <strong>
                        {patient.name ||
                          patient.patient_name ||
                          "Patient"}
                      </strong>

                      <span>
                        {patient.patient_id ||
                          patient.registration_no ||
                          `Patient ${index + 1}`}
                      </span>

                      <small>
                        {patient.mobile ||
                          patient.phone ||
                          "No mobile"}
                        {" • "}
                        {patient.age
                          ? `${patient.age} Years`
                          : "Age not available"}
                      </small>

                    </div>

                  </div>

                ))

              )}

            </div>

            {/* QUICK ACTIONS */}

            <div style={styles.panel}>

              <div style={styles.panelHeader}>
                <div>
                  <h2 style={styles.panelTitle}>
                    Quick Actions
                  </h2>

                  <p style={styles.panelSub}>
                    Frequently used options
                  </p>
                </div>
              </div>

              <QuickAction
                icon="＋"
                title="New Patient"
                subtitle="Register new patient"
                href="/patients/new"
              />

              <QuickAction
                icon="₹"
                title="Create Bill"
                subtitle="Patient billing"
                href="/billing"
              />

              <QuickAction
                icon="▤"
                title="Result Entry"
                subtitle="Enter test results"
                href="/result-entry"
              />

              <QuickAction
                icon="▣"
                title="Reports"
                subtitle="View final reports"
                href="/reports"
              />

            </div>

          </div>

          {/* ================= FOOTER INFO ================= */}

          <div style={styles.bottomBar}>

            <div>
              <strong>{labName}</strong>
              <br />
              <span>
                {ownerName}
              </span>
            </div>

            <div>
              <span style={styles.secure}>
                🔒 Secure Login
              </span>
            </div>

            <button
              onClick={loadDashboard}
              style={styles.refreshButton}
            >
              ↻ Refresh Dashboard
            </button>

          </div>

        </div>

      </section>

    </main>
  );
}


/* =====================================================
   STAT CARD
===================================================== */

function StatCard({ icon, title, value }) {
  return (
    <div style={styles.statCard}>

      <div style={styles.statIcon}>
        {icon}
      </div>

      <div>
        <div style={styles.statTitle}>
          {title}
        </div>

        <div style={styles.statValue}>
          {value}
        </div>
      </div>

    </div>
  );
}


/* =====================================================
   QUICK ACTION
===================================================== */

function QuickAction({
  icon,
  title,
  subtitle,
  href,
}) {
  return (
    <Link href={href} style={styles.quickAction}>

      <div style={styles.quickIcon}>
        {icon}
      </div>

      <div>
        <strong>{title}</strong>

        <span>
          {subtitle}
        </span>
      </div>

      <span style={styles.arrow}>
        ›
      </span>

    </Link>
  );
}


/* =====================================================
   STYLES
===================================================== */

const styles = {

  page: {
    minHeight: "100vh",
    display: "flex",
    background: "#f5f8fc",
    color: "#172536",
    fontFamily:
      "Inter, Arial, Helvetica, sans-serif",
  },

  loadingPage: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#f5f8fc",
    fontFamily: "Arial, sans-serif",
  },

  loadingBox: {
    textAlign: "center",
    background: "#ffffff",
    padding: "45px",
    borderRadius: "20px",
    boxShadow:
      "0 15px 50px rgba(20,50,80,0.12)",
  },

  logoSmall: {
    width: "55px",
    height: "55px",
    margin: "0 auto 15px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "14px",
    background: "#10a99d",
    color: "#ffffff",
    fontWeight: "800",
    fontSize: "20px",
  },

  loader: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    border:
      "3px solid #d8eeee",
    borderTopColor: "#0ca496",
    margin: "20px auto 0",
    animation:
      "spin 1s linear infinite",
  },

  sidebar: {
    width: "245px",
    minHeight: "100vh",
    background: "#09283b",
    color: "#ffffff",
    padding: "22px 15px",
    boxSizing: "border-box",
    position: "fixed",
    left: 0,
    top: 0,
    bottom: 0,
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "11px",
    padding: "5px 4px 30px",
  },

  brandIcon: {
    width: "40px",
    height: "40px",
    background: "#10afa3",
    borderRadius: "10px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "800",
  },

  brandTitle: {
    fontSize: "16px",
    fontWeight: "800",
  },

  brandSub: {
    fontSize: "8px",
    opacity: 0.65,
    letterSpacing: "1px",
  },

  menuTitle: {
    fontSize: "9px",
    letterSpacing: "1.5px",
    color: "#87a5b5",
    marginBottom: "9px",
    paddingLeft: "8px",
  },

  menuTitleManagement: {
    fontSize: "9px",
    letterSpacing: "1.5px",
    color: "#87a5b5",
    margin:
      "27px 0 9px",
    paddingLeft: "8px",
  },

  menuItem: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#d9e7ec",
    textDecoration: "none",
    padding: "11px 10px",
    borderRadius: "8px",
    marginBottom: "3px",
    fontSize: "13px",
  },

  menuActive: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#ffffff",
    textDecoration: "none",
    padding: "11px 10px",
    borderRadius: "8px",
    marginBottom: "3px",
    fontSize: "13px",
    background: "#10445b",
    borderLeft: "3px solid #10b7a9",
  },

  logout: {
    position: "absolute",
    bottom: "25px",
    left: "15px",
    right: "15px",
    border: "1px solid #315265",
    background: "transparent",
    color: "#cbdde4",
    padding: "10px",
    borderRadius: "8px",
    cursor: "pointer",
  },

  content: {
    marginLeft: "245px",
    width: "calc(100% - 245px)",
    minHeight: "100vh",
  },

  header: {
    height: "67px",
    background: "#ffffff",
    borderBottom: "1px solid #e3e9ef",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "0 28px",
    boxSizing: "border-box",
  },

  headerTitle: {
    fontSize: "15px",
    fontWeight: "800",
  },

  headerSub: {
    fontSize: "9px",
    color: "#87929e",
    marginTop: "3px",
  },

  online: {
    fontSize: "11px",
    color: "#4b625b",
    display: "flex",
    alignItems: "center",
    gap: "6px",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#25b879",
  },

  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "30px",
  },

  welcomeRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    marginBottom: "22px",
  },

  sectionLabel: {
    color: "#0d9d91",
    fontSize: "9px",
    fontWeight: "800",
    letterSpacing: "1.3px",
    marginBottom: "8px",
  },

  welcomeTitle: {
    fontSize: "25px",
    margin: 0,
    fontWeight: "800",
  },

  welcomeText: {
    color: "#7c8791",
    fontSize: "12px",
    maxWidth: "650px",
    lineHeight: "1.6",
    margin: "7px 0 2px",
  },

  ownerText: {
    fontSize: "11px",
    color: "#60717b",
  },

  newPatientButton: {
    background: "#0ba397",
    color: "#ffffff",
    textDecoration: "none",
    padding: "13px 25px",
    borderRadius: "9px",
    fontSize: "12px",
    fontWeight: "700",
    textAlign: "center",
    boxShadow:
      "0 7px 20px rgba(11,163,151,0.2)",
  },

  subscriptionCard: {
    border: "1px solid",
    borderRadius: "12px",
    padding: "14px 17px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "18px",
  },

  subscriptionTitle: {
    fontSize: "13px",
    fontWeight: "800",
    marginBottom: "5px",
  },

  subscriptionText: {
    fontSize: "10px",
    color: "#63716f",
    marginTop: "3px",
  },

  daysBox: {
    minWidth: "70px",
    textAlign: "center",
    padding: "5px 12px",
  },

  statsGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(4, minmax(0, 1fr))",
    gap: "13px",
    marginBottom: "18px",
  },

  statCard: {
    background: "#ffffff",
    border: "1px solid #e6ebef",
    borderRadius: "11px",
    padding: "17px",
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },

  statIcon: {
    width: "38px",
    height: "38px",
    borderRadius: "9px",
    background: "#ecfaf8",
    color: "#0b9d91",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
  },

  statTitle: {
    fontSize: "9px",
    color: "#87919a",
  },

  statValue: {
    fontSize: "21px",
    fontWeight: "800",
    marginTop: "3px",
  },

  lowerGrid: {
    display: "grid",
    gridTemplateColumns:
      "minmax(0, 1.8fr) minmax(280px, 1fr)",
    gap: "17px",
  },

  panel: {
    background: "#ffffff",
    border: "1px solid #e6ebef",
    borderRadius: "12px",
    padding: "17px",
  },

  panelHeader: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: "13px",
  },

  panelTitle: {
    margin: 0,
    fontSize: "13px",
  },

  panelSub: {
    margin: "3px 0 0",
    fontSize: "9px",
    color: "#89949c",
  },

  viewButton: {
    textDecoration: "none",
    color: "#0b9c91",
    background: "#effaf8",
    padding: "7px 11px",
    borderRadius: "7px",
    fontSize: "9px",
    fontWeight: "700",
  },

  patientRow: {
    display: "flex",
    gap: "10px",
    padding: "10px 0",
    borderTop: "1px solid #edf0f2",
  },

  patientIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#edf9f7",
    color: "#0a9f92",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  patientInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
    fontSize: "10px",
  },

  empty: {
    textAlign: "center",
    padding: "30px 10px",
    color: "#7e8991",
    fontSize: "11px",
  },

  emptyIcon: {
    fontSize: "30px",
    marginBottom: "7px",
  },

  smallButton: {
    display: "inline-block",
    marginTop: "10px",
    background: "#0ca397",
    color: "#ffffff",
    textDecoration: "none",
    padding: "8px 12px",
    borderRadius: "7px",
    fontSize: "10px",
  },

  quickAction: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textDecoration: "none",
    color: "#172536",
    padding: "11px 0",
    borderTop: "1px solid #edf0f2",
  },

  quickIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "8px",
    background: "#edf9f7",
    color: "#0a9f92",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },

  arrow: {
    marginLeft: "auto",
    color: "#a4afb6",
    fontSize: "20px",
  },

  bottomBar: {
    marginTop: "17px",
    padding: "15px 0",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    color: "#839099",
    fontSize: "9px",
  },

  secure: {
    color: "#238c7e",
  },

  refreshButton: {
    background: "#ffffff",
    border: "1px solid #dfe5e9",
    borderRadius: "7px",
    padding: "8px 12px",
    cursor: "pointer",
    fontSize: "9px",
    color: "#52616a",
  },

};
