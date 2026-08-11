"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();

  // =========================================================
  // DASHBOARD DATA
  // =========================================================

  const [patients, setPatients] = useState([]);

  const [todayBills, setTodayBills] = useState(0);
  const [todayCollection, setTodayCollection] = useState(0);
  const [pendingReports, setPendingReports] = useState(0);

  const [active, setActive] = useState("dashboard");
  const [saving, setSaving] = useState(false);

  const [dashboardLoading, setDashboardLoading] =
    useState(false);

  // =========================================================
  // PATIENT FORM
  // =========================================================

  const [patient, setPatient] = useState({
    id: "",
    name: "",
    age: "",
    ageUnit: "Years",
    gender: "Male",
    mobile: "",
    doctor: "",
    address: "",
  });

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    fetchPatients();
    fetchDashboardStats();
  }, []);

  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", {
          ascending: false,
        });

      if (error) {
        console.error(
          "Patients load error:",
          error
        );

        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error(
        "Patients load error:",
        error
      );
    }
  }

  // =========================================================
  // DASHBOARD STATISTICS
  // =========================================================

  async function fetchDashboardStats() {
    setDashboardLoading(true);

    try {
      // -----------------------------------------------------
      // TODAY DATE
      // -----------------------------------------------------

      const now = new Date();

      const start = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0
      );

      const end = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
        0,
        0,
        0,
        0
      );

      const startISO = start.toISOString();
      const endISO = end.toISOString();

      // -----------------------------------------------------
      // TODAY'S BILLS
      // -----------------------------------------------------

      const {
        data: billsData,
        error: billsError,
      } = await supabase
        .from("bills")
        .select(
          "id, bill_no, bill_date, paid, net_amount, payment_status"
        )
        .gte("bill_date", startISO)
        .lt("bill_date", endISO);

      if (billsError) {
        console.error(
          "Today's bills error:",
          billsError
        );

        setTodayBills(0);
        setTodayCollection(0);
      } else {
        const bills = billsData || [];

        // Total bills created today
        setTodayBills(bills.length);

        // Today's actual collection
        const collection = bills.reduce(
          (total, bill) => {
            return (
              total +
              Number(bill.paid || 0)
            );
          },
          0
        );

        setTodayCollection(collection);
      }

      // -----------------------------------------------------
      // PENDING REPORTS
      // -----------------------------------------------------
      //
      // Completed reports ko count nahi karenge.
      // Pending / In Progress / blank status count honge.
      //

      const {
        data: reportsData,
        error: reportsError,
      } = await supabase
        .from("reports")
        .select("id, status");

      if (reportsError) {
        console.error(
          "Pending reports error:",
          reportsError
        );

        setPendingReports(0);
      } else {
        const reports = reportsData || [];

        const pending = reports.filter(
          (report) => {
            const status = String(
              report.status || "Pending"
            )
              .trim()
              .toLowerCase();

            return status !== "completed";
          }
        );

        setPendingReports(
          pending.length
        );
      }
    } catch (error) {
      console.error(
        "Dashboard statistics error:",
        error
      );

      setTodayBills(0);
      setTodayCollection(0);
      setPendingReports(0);
    } finally {
      setDashboardLoading(false);
    }
  }

  // =========================================================
  // PATIENT ID
  // =========================================================

  function generatePatientId() {
    const now = new Date();

    const y =
      now.getFullYear();

    const m = String(
      now.getMonth() + 1
    ).padStart(2, "0");

    const d = String(
      now.getDate()
    ).padStart(2, "0");

    const n = Math.floor(
      1000 +
        Math.random() * 9000
    );

    return `NPL-${y}${m}${d}-${n}`;
  }

  // =========================================================
  // NEW PATIENT
  // =========================================================

  function openNewPatient() {
    setPatient({
      id: generatePatientId(),
      name: "",
      age: "",
      ageUnit: "Years",
      gender: "Male",
      mobile: "",
      doctor: "",
      address: "",
    });

    setActive("newPatient");
  }

  // =========================================================
  // FORM CHANGE
  // =========================================================

  function change(e) {
    const {
      name,
      value,
    } = e.target;

    setPatient(
      (previous) => ({
        ...previous,
        [name]: value,
      })
    );
  }

  // =========================================================
  // SAVE PATIENT + CONTINUE
  // =========================================================

  async function continueToTests(e) {
    e.preventDefault();

    if (!patient.name.trim()) {
      alert(
        "Patient Name enter karein."
      );

      return;
    }

    if (!patient.age) {
      alert(
        "Patient Age enter karein."
      );

      return;
    }

    if (!patient.id) {
      alert(
        "Patient ID generate nahi hua."
      );

      return;
    }

    try {
      setSaving(true);

      // -----------------------------------------------------
      // SUPABASE PATIENT INSERT
      // -----------------------------------------------------

      const { error } =
        await supabase
          .from("patients")
          .insert([
            {
              patient_id:
                patient.id,

              name:
                patient.name,

              age:
                Number(
                  patient.age
                ),

              age_unit:
                patient.ageUnit,

              gender:
                patient.gender,

              mobile:
                patient.mobile,

              referring_doctor:
                patient.doctor,

              address:
                patient.address,
            },
          ]);

      if (error) {
        console.error(
          "Patient save error:",
          error
        );

        alert(
          "Patient save nahi hua: " +
            error.message
        );

        setSaving(false);

        return;
      }

      // -----------------------------------------------------
      // LOCAL PATIENT
      // -----------------------------------------------------

      const localPatient = {
        ...patient,

        patientId:
          patient.id,

        refDoctor:
          patient.doctor,

        sex:
          patient.gender,
      };

      localStorage.setItem(
        "nidanPatient",
        JSON.stringify(
          localPatient
        )
      );

      // -----------------------------------------------------
      // NEW PATIENT = CLEAN TEST/BILL/RESULT DATA
      // -----------------------------------------------------

      localStorage.removeItem(
        "nidanSelectedTests"
      );

      localStorage.removeItem(
        "nidanBilling"
      );

      localStorage.removeItem(
        "nidanResults"
      );

      // -----------------------------------------------------
      // REFRESH DASHBOARD DATA
      // -----------------------------------------------------

      await fetchPatients();

      // -----------------------------------------------------
      // GO TO TESTS
      // -----------------------------------------------------

      router.push("/tests");
    } catch (error) {
      console.error(
        "Patient save error:",
        error
      );

      alert(
        "Patient save karte waqt error aaya."
      );
    } finally {
      setSaving(false);
    }
  }

  // =========================================================
  // NAVIGATION
  // =========================================================

  function goDashboard() {
    setActive("dashboard");

    fetchPatients();
    fetchDashboardStats();
  }

  function goPatients() {
    router.push("/patients");
  }

  function goTests() {
    router.push("/tests");
  }

  function goBilling() {
    router.push("/billing");
  }

  function goSamples() {
    router.push("/samples");
  }

  function goResults() {
    router.push("/results");
  }

  function goReports() {
    router.push("/reports");
  }

  function goTestMaster() {
    router.push("/test-master");
  }

  function goDoctors() {
    router.push("/doctors");
  }

  function goSettings() {
    router.push("/settings");
  }

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  function formatMoney(amount) {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN"
    );
  }

  // =========================================================
  // DASHBOARD
  // =========================================================

  return (
    <div className="labApp">

      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brandLogo">
            N+
          </div>

          <div>
            <h2>NIDAN</h2>
            <p>
              PATHOLOGY LAB
            </p>
          </div>

        </div>

        <div className="menuLabel">
          MAIN MENU
        </div>

        {/* DASHBOARD */}

        <button
          className={
            active === "dashboard"
              ? "menu active"
              : "menu"
          }
          onClick={
            goDashboard
          }
        >
          <span>▦</span>
          Dashboard
        </button>

        {/* NEW PATIENT */}

        <button
          className={
            active ===
            "newPatient"
              ? "menu active"
              : "menu"
          }
          onClick={
            openNewPatient
          }
        >
          <span>＋</span>
          New Patient
        </button>

        {/* PATIENTS */}

        <button
          className="menu"
          onClick={
            goPatients
          }
        >
          <span>♙</span>
          Patients
        </button>

        {/* BILLING */}

        <button
          className="menu"
          onClick={
            goBilling
          }
        >
          <span>₹</span>
          Billing
        </button>

        {/* SAMPLES */}

        <button
          className="menu"
          onClick={
            goSamples
          }
        >
          <span>⌁</span>
          Samples
        </button>

        {/* RESULTS */}

        <button
          className="menu"
          onClick={
            goResults
          }
        >
          <span>▤</span>
          Result Entry
        </button>

        {/* REPORTS */}

        <button
          className="menu"
          onClick={
            goReports
          }
        >
          <span>▣</span>
          Reports
        </button>

        {/* MANAGEMENT */}

        <div className="menuLabel second">
          MANAGEMENT
        </div>

        {/* TEST MASTER */}

        <button
          className="menu"
          onClick={
            goTestMaster
          }
        >
          <span>⚗</span>
          Test Master
        </button>

        {/* DOCTORS */}

        <button
          className="menu"
          onClick={
            goDoctors
          }
        >
          <span>♧</span>
          Doctors
        </button>

        {/* SETTINGS */}

        <button
          className="menu"
          onClick={
            goSettings
          }
        >
          <span>⚙</span>
          Settings
        </button>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <main className="mainArea">

        {/* ===================================================
            TOPBAR
        =================================================== */}

        <header className="topbar">

          <div>

            <h3>
              {active ===
              "dashboard"
                ? "Dashboard"
                : "New Patient Registration"}
            </h3>

            <p>
              NIDAN Pathology Laboratory
              Management System
            </p>

          </div>

          <div className="topRight">

            <span className="statusDot"></span>

            Lab Online

          </div>

        </header>

        {/* ===================================================
            DASHBOARD
        =================================================== */}

        {active ===
          "dashboard" && (

          <div className="content">

            {/* =================================================
                WELCOME
            ================================================= */}

            <div className="welcome">

              <div>

                <span className="smallTitle">
                  LABORATORY DASHBOARD
                </span>

                <h1>
                  Welcome to NIDAN
                  Pathology Lab
                </h1>

                <p>
                  Patients, billing,
                  samples, test results
                  aur laboratory reports
                  ko ek jagah manage karein.
                </p>

              </div>

              <button
                className="primaryBtn"
                onClick={
                  openNewPatient
                }
              >
                + New Patient
              </button>

            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="stats">

              {/* TOTAL PATIENTS */}

              <div className="statCard">

                <div className="statIcon">
                  ♙
                </div>

                <div>

                  <p>
                    Total Patients
                  </p>

                  <h2>
                    {patients.length}
                  </h2>

                </div>

              </div>

              {/* TODAY COLLECTION */}

              <div className="statCard">

                <div className="statIcon">
                  ₹
                </div>

                <div>

                  <p>
                    Today's Collection
                  </p>

                  <h2>
                    ₹
                    {formatMoney(
                      todayCollection
                    )}
                  </h2>

                </div>

              </div>

              {/* TODAY'S BILLS */}

              <div className="statCard">

                <div className="statIcon">
                  ▣
                </div>

                <div>

                  <p>
                    Today's Bills
                  </p>

                  <h2>
                    {dashboardLoading
                      ? "..."
                      : todayBills}
                  </h2>

                </div>

              </div>

              {/* PENDING REPORTS */}

              <div className="statCard">

                <div className="statIcon">
                  ▤
                </div>

                <div>

                  <p>
                    Pending Reports
                  </p>

                  <h2>
                    {dashboardLoading
                      ? "..."
                      : pendingReports}
                  </h2>

                </div>

              </div>

            </div>

            {/* =================================================
                DASHBOARD GRID
            ================================================= */}

            <div className="dashboardGrid">

              {/* =================================================
                  RECENT PATIENTS
              ================================================= */}

              <section className="panel">

                <div className="panelHead">

                  <div>

                    <h2>
                      Recent Patients
                    </h2>

                    <p>
                      Latest registered
                      patients
                    </p>

                  </div>

                  <button
                    onClick={
                      goPatients
                    }
                  >
                    View All
                  </button>

                </div>

                {/* EMPTY */}

                {patients.length ===
                0 ? (

                  <div className="emptyState">

                    <div>♙</div>

                    <h3>
                      No registered
                      patients
                    </h3>

                    <p>
                      Patient registration
                      shuru karne ke liye
                      New Patient par click
                      karein.
                    </p>

                    <button
                      onClick={
                        openNewPatient
                      }
                    >
                      Register Patient
                    </button>

                  </div>

                ) : (

                  <div>

                    {patients
                      .slice(0, 5)
                      .map(
                        (p) => (

                          <div
                            key={
                              p.id
                            }
                            style={{
                              padding:
                                "10px",
                              borderBottom:
                                "1px solid #edf1f5",
                            }}
                          >

                            <b>
                              {
                                p.name
                              }
                            </b>

                            <div>
                              {
                                p.patient_id ||
                                p.patientId ||
                                p.id
                              }
                            </div>

                            <small>

                              {
                                p.mobile ||
                                "No mobile"
                              }

                              {" • "}

                              {
                                p.age
                              }

                              {" "}

                              {
                                p.age_unit ||
                                p.ageUnit ||
                                "Years"
                              }

                            </small>

                          </div>

                        )
                      )}

                  </div>

                )}

              </section>

              {/* =================================================
                  QUICK ACTIONS
              ================================================= */}

              <section className="panel quickPanel">

                <div className="panelHead">

                  <div>

                    <h2>
                      Quick Actions
                    </h2>

                    <p>
                      Frequently used
                      options
                    </p>

                  </div>

                </div>

                {/* NEW PATIENT */}

                <button
                  onClick={
                    openNewPatient
                  }
                >

                  <span>＋</span>

                  <div>

                    <b>
                      New Patient
                    </b>

                    <small>
                      Register new
                      patient
                    </small>

                  </div>

                </button>

                {/* CREATE BILL */}

                <button
                  onClick={
                    goBilling
                  }
                >

                  <span>₹</span>

                  <div>

                    <b>
                      Create Bill
                    </b>

                    <small>
                      Patient billing
                    </small>

                  </div>

                </button>

                {/* RESULT ENTRY */}

                <button
                  onClick={
                    goResults
                  }
                >

                  <span>▤</span>

                  <div>

                    <b>
                      Result Entry
                    </b>

                    <small>
                      Enter test
                      results
                    </small>

                  </div>

                </button>

                {/* REPORTS */}

                <button
                  onClick={
                    goReports
                  }
                >

                  <span>▣</span>

                  <div>

                    <b>
                      Reports
                    </b>

                    <small>
                      View final
                      reports
                    </small>

                  </div>

                </button>

              </section>

            </div>

          </div>

        )}

        {/* ===================================================
            NEW PATIENT
        =================================================== */}

        {active ===
          "newPatient" && (

          <div className="content">

            {/* PAGE HEADING */}

            <div className="pageHeading">

              <div>

                <span className="smallTitle">
                  PATIENT REGISTRATION
                </span>

                <h1>
                  Register New Patient
                </h1>

                <p>
                  Patient ki basic details
                  enter karein. Iske baad
                  tests select kiye jayenge.
                </p>

              </div>

              <button
                className="backBtn"
                onClick={
                  goDashboard
                }
              >
                ← Dashboard
              </button>

            </div>

            {/* =================================================
                STEPS
            ================================================= */}

            <div className="steps">

              <div className="step activeStep">

                <span>1</span>

                <div>

                  <b>
                    Patient
                  </b>

                  <small>
                    Registration
                  </small>

                </div>

              </div>

              <div className="step">

                <span>2</span>

                <div>

                  <b>
                    Tests
                  </b>

                  <small>
                    Select tests
                  </small>

                </div>

              </div>

              <div className="step">

                <span>3</span>

                <div>

                  <b>
                    Billing
                  </b>

                  <small>
                    Create bill
                  </small>

                </div>

              </div>

              <div className="step">

                <span>4</span>

                <div>

                  <b>
                    Results
                  </b>

                  <small>
                    Enter results
                  </small>

                </div>

              </div>

              <div className="step">

                <span>5</span>

                <div>

                  <b>
                    Report
                  </b>

                  <small>
                    Print / PDF
                  </small>

                </div>

              </div>

            </div>

            {/* =================================================
                REGISTRATION FORM
            ================================================= */}

            <form
              className="registrationCard"
              onSubmit={
                continueToTests
              }
            >

              {/* FORM HEADER */}

              <div className="formHeader">

                <div className="formIcon">
                  ♙
                </div>

                <div>

                  <h2>
                    Patient Information
                  </h2>

                  <p>
                    Fields marked with *
                    are required.
                  </p>

                </div>

              </div>

              {/* FORM GRID */}

              <div className="formGrid">

                {/* PATIENT ID */}

                <div className="field">

                  <label>
                    Patient ID
                  </label>

                  <input
                    value={
                      patient.id
                    }
                    readOnly
                    className="readonly"
                  />

                </div>

                {/* PATIENT NAME */}

                <div className="field">

                  <label>
                    Patient Name{" "}
                    <b>*</b>
                  </label>

                  <input
                    name="name"
                    value={
                      patient.name
                    }
                    onChange={
                      change
                    }
                    placeholder="Enter patient full name"
                    required
                  />

                </div>

                {/* AGE */}

                <div className="field">

                  <label>
                    Age <b>*</b>
                  </label>

                  <div className="ageField">

                    <input
                      type="number"
                      name="age"
                      min="0"
                      value={
                        patient.age
                      }
                      onChange={
                        change
                      }
                      placeholder="Age"
                      required
                    />

                    <select
                      name="ageUnit"
                      value={
                        patient.ageUnit
                      }
                      onChange={
                        change
                      }
                    >

                      <option>
                        Years
                      </option>

                      <option>
                        Months
                      </option>

                      <option>
                        Days
                      </option>

                    </select>

                  </div>

                </div>

                {/* GENDER */}

                <div className="field">

                  <label>
                    Gender
                  </label>

                  <select
                    name="gender"
                    value={
                      patient.gender
                    }
                    onChange={
                      change
                    }
                  >

                    <option>
                      Male
                    </option>

                    <option>
                      Female
                    </option>

                    <option>
                      Other
                    </option>

                  </select>

                </div>

                {/* MOBILE */}

                <div className="field">

                  <label>
                    Mobile Number
                  </label>

                  <input
                    type="tel"
                    name="mobile"
                    value={
                      patient.mobile
                    }
                    onChange={
                      change
                    }
                    placeholder="Enter mobile number"
                  />

                </div>

                {/* DOCTOR */}

                <div className="field">

                  <label>
                    Referring Doctor
                  </label>

                  <input
                    name="doctor"
                    value={
                      patient.doctor
                    }
                    onChange={
                      change
                    }
                    placeholder="Doctor name"
                  />

                </div>

                {/* ADDRESS */}

                <div className="field full">

                  <label>
                    Address
                  </label>

                  <textarea
                    name="address"
                    value={
                      patient.address
                    }
                    onChange={
                      change
                    }
                    placeholder="Patient address"
                  />

                </div>

              </div>

              {/* FORM FOOTER */}

              <div className="formFooter">

                <button
                  type="button"
                  className="cancelBtn"
                  onClick={
                    goDashboard
                  }
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={
                    saving
                  }
                >

                  {saving
                    ? "Saving..."
                    : "Save & Select Tests →"}

                </button>

              </div>

            </form>

          </div>

        )}

      </main>

    </div>
  );
}
