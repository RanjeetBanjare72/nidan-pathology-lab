"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

const EMPTY_PATIENT = {
  id: "",
  name: "",
  age: "",
  ageUnit: "Years",
  gender: "Male",
  mobile: "",
  doctor: "",
  address: "",
};

export default function Home() {
  const router = useRouter();

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [active, setActive] = useState("dashboard");

  const [saving, setSaving] = useState(false);

  const [todayCollection, setTodayCollection] =
    useState(0);

  const [pendingReports, setPendingReports] =
    useState(0);

  const [loadingDashboard, setLoadingDashboard] =
    useState(true);

  const [patient, setPatient] =
    useState(EMPTY_PATIENT);

  // =========================================================
  // INITIAL LOAD
  // =========================================================

  useEffect(() => {
    loadDashboard();
    loadDoctors();
  }, []);

  // =========================================================
  // LOAD DASHBOARD DATA
  // =========================================================

  async function loadDashboard() {
    setLoadingDashboard(true);

    try {
      await Promise.all([
        fetchPatients(),
        fetchTodayCollection(),
        fetchPendingReports(),
      ]);
    } catch (error) {
      console.error(
        "Dashboard loading error:",
        error
      );
    } finally {
      setLoadingDashboard(false);
    }
  }

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

        setPatients([]);

        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error(
        "Patients load error:",
        error
      );

      setPatients([]);
    }
  }

  // =========================================================
  // TODAY'S COLLECTION
  // =========================================================

  async function fetchTodayCollection() {
    try {
      // Start of today
      const start = new Date();

      start.setHours(
        0,
        0,
        0,
        0
      );

      // Start of tomorrow
      const end = new Date(start);

      end.setDate(
        end.getDate() + 1
      );

      const { data, error } =
        await supabase
          .from("bills")
          .select(
            "paid, bill_date, payment_status"
          )
          .gte(
            "bill_date",
            start.toISOString()
          )
          .lt(
            "bill_date",
            end.toISOString()
          );

      if (error) {
        console.error(
          "Today's collection error:",
          error
        );

        setTodayCollection(0);

        return;
      }

      const total = (data || []).reduce(
        (sum, bill) => {
          return (
            sum +
            Number(
              bill.paid || 0
            )
          );
        },
        0
      );

      setTodayCollection(total);
    } catch (error) {
      console.error(
        "Today's collection error:",
        error
      );

      setTodayCollection(0);
    }
  }

  // =========================================================
  // PENDING REPORTS
  // =========================================================

  async function fetchPendingReports() {
    try {
      /*
       * Agar future me reports table me
       * status column hoga to yahan se
       * actual pending reports count kiya ja sakta hai.
       *
       * Abhi safe fallback = 0
       */

      setPendingReports(0);
    } catch (error) {
      console.error(
        "Pending reports error:",
        error
      );

      setPendingReports(0);
    }
  }

  // =========================================================
  // LOAD DOCTORS
  // =========================================================

  async function loadDoctors() {
    let loadedDoctors = [];

    // -------------------------------------------------------
    // SUPABASE DOCTORS
    // -------------------------------------------------------

    try {
      const { data, error } =
        await supabase
          .from("doctors")
          .select("*")
          .order("created_at", {
            ascending: false,
          });

      if (!error && data) {
        loadedDoctors = data;
      }
    } catch (error) {
      console.error(
        "Supabase doctors error:",
        error
      );
    }

    // -------------------------------------------------------
    // LOCAL STORAGE DOCTORS
    // -------------------------------------------------------

    try {
      const localDoctors =
        JSON.parse(
          localStorage.getItem(
            "nidanDoctors"
          ) || "[]"
        );

      if (
        Array.isArray(localDoctors)
      ) {
        loadedDoctors = [
          ...loadedDoctors,
          ...localDoctors,
        ];
      }
    } catch (error) {
      console.error(
        "Local doctors error:",
        error
      );
    }

    // -------------------------------------------------------
    // REMOVE DUPLICATES
    // -------------------------------------------------------

    const uniqueDoctors = [];

    const used = new Set();

    loadedDoctors.forEach(
      (doctor) => {
        const name =
          doctor.name ||
          doctor.doctor_name ||
          "";

        if (!name) return;

        const key =
          `${name}-${doctor.registrationNo || doctor.registration_no || ""}`
            .toLowerCase();

        if (!used.has(key)) {
          used.add(key);

          uniqueDoctors.push(
            doctor
          );
        }
      }
    );

    setDoctors(
      uniqueDoctors
    );
  }

  // =========================================================
  // PATIENT ID
  // =========================================================

  function generatePatientId() {
    const now = new Date();

    const y =
      now.getFullYear();

    const m =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const d =
      String(
        now.getDate()
      ).padStart(2, "0");

    const n =
      Math.floor(
        1000 +
          Math.random() *
            9000
      );

    return `NPL-${y}${m}${d}-${n}`;
  }

  // =========================================================
  // NEW PATIENT
  // =========================================================

  function openNewPatient() {
    setPatient({
      ...EMPTY_PATIENT,
      id: generatePatientId(),
    });

    setActive(
      "newPatient"
    );

    // Refresh doctors whenever form opens
    loadDoctors();
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
  // SAVE PATIENT
  // =========================================================

  async function continueToTests(e) {
    e.preventDefault();

    if (!patient.name.trim()) {
      alert(
        "Patient Name enter karein."
      );

      return;
    }

    if (
      patient.age === "" ||
      patient.age === null
    ) {
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
      // SAVE PATIENT TO SUPABASE
      // -----------------------------------------------------

      const { error } =
        await supabase
          .from("patients")
          .insert([
            {
              patient_id:
                patient.id,

              name:
                patient.name.trim(),

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
          "Patient save nahi hua:\n\n" +
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

        patient_id:
          patient.id,

        refDoctor:
          patient.doctor,

        referring_doctor:
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
      // CLEAR OLD VISIT DATA
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
      // UPDATE DASHBOARD
      // -----------------------------------------------------

      await fetchPatients();

      // -----------------------------------------------------
      // GO TO TESTS
      // -----------------------------------------------------

      router.push(
        "/tests"
      );
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
    setActive(
      "dashboard"
    );

    loadDashboard();
  }

  function goPatients() {
    router.push(
      "/patients"
    );
  }

  function goTests() {
    router.push(
      "/tests"
    );
  }

  function goBilling() {
    router.push(
      "/billing"
    );
  }

  function goSamples() {
    router.push(
      "/samples"
    );
  }

  function goResults() {
    router.push(
      "/results"
    );
  }

  function goReports() {
    router.push(
      "/reports"
    );
  }

  function goTestMaster() {
    router.push(
      "/test-master"
    );
  }

  function goDoctors() {
    router.push(
      "/doctors"
    );
  }

  function goSettings() {
    router.push(
      "/settings"
    );
  }

  // =========================================================
  // FORMAT MONEY
  // =========================================================

  function formatMoney(amount) {
    return Number(
      amount || 0
    ).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 0,
      }
    );
  }

  // =========================================================
  // RECENT PATIENTS
  // =========================================================

  const recentPatients =
    useMemo(() => {
      return patients.slice(
        0,
        5
      );
    }, [patients]);

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
            <h2>
              NIDAN
            </h2>

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
            active ===
            "dashboard"
              ? "menu active"
              : "menu"
          }
          onClick={
            goDashboard
          }
        >
          <span>
            ▦
          </span>

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
          <span>
            ＋
          </span>

          New Patient
        </button>

        {/* PATIENTS */}

        <button
          className="menu"
          onClick={
            goPatients
          }
        >
          <span>
            ♙
          </span>

          Patients
        </button>

        {/* BILLING */}

        <button
          className="menu"
          onClick={
            goBilling
          }
        >
          <span>
            ₹
          </span>

          Billing
        </button>

        {/* SAMPLES */}

        <button
          className="menu"
          onClick={
            goSamples
          }
        >
          <span>
            ⌁
          </span>

          Samples
        </button>

        {/* RESULTS */}

        <button
          className="menu"
          onClick={
            goResults
          }
        >
          <span>
            ▤
          </span>

          Result Entry
        </button>

        {/* REPORTS */}

        <button
          className="menu"
          onClick={
            goReports
          }
        >
          <span>
            ▣
          </span>

          Reports
        </button>

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
          <span>
            ⚗
          </span>

          Test Master
        </button>

        {/* DOCTORS */}

        <button
          className="menu"
          onClick={
            goDoctors
          }
        >
          <span>
            ♧
          </span>

          Doctors
        </button>

        {/* SETTINGS */}

        <button
          className="menu"
          onClick={
            goSettings
          }
        >
          <span>
            ⚙
          </span>

          Settings
        </button>

      </aside>

      {/* =====================================================
          MAIN AREA
      ===================================================== */}

      <main className="mainArea">

        {/* TOPBAR */}

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

            {/* WELCOME */}

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
                  ko ek jagah manage
                  karein.
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
                    {loadingDashboard
                      ? "..."
                      : patients.length}
                  </h2>

                </div>

              </div>

              {/* TODAY COLLECTION */}

              <div className="statCard collectionCard">

                <div className="statIcon">
                  ₹
                </div>

                <div>

                  <p>
                    Today's Collection
                  </p>

                  <h2>
                    ₹
                    {loadingDashboard
                      ? "..."
                      : formatMoney(
                          todayCollection
                        )}
                  </h2>

                </div>

              </div>

              {/* TODAY BILLS */}

              <div className="statCard">

                <div className="statIcon">
                  🧾
                </div>

                <div>

                  <p>
                    Today's Bills
                  </p>

                  <h2>
                    {loadingDashboard
                      ? "..."
                      : "—"}
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
                    {pendingReports}
                  </h2>

                </div>

              </div>

            </div>

            {/* =================================================
                DASHBOARD GRID
            ================================================= */}

            <div className="dashboardGrid">

              {/* RECENT PATIENTS */}

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

                {recentPatients.length ===
                0 ? (

                  <div className="emptyState">

                    <div>
                      ♙
                    </div>

                    <h3>
                      No registered
                      patients
                    </h3>

                    <p>
                      Patient registration
                      shuru karne ke liye
                      New Patient par
                      click karein.
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

                    {recentPatients.map(
                      (p) => {

                        const patientId =
                          p.patient_id ||
                          p.patientId ||
                          p.id ||
                          "-";

                        return (

                          <div
                            key={
                              p.id ||
                              patientId
                            }
                            className="recentPatient"
                          >

                            <div>

                              <b>
                                {p.name ||
                                  "Unknown Patient"}
                              </b>

                              <div>
                                {patientId}
                              </div>

                              <small>

                                {p.mobile ||
                                  "No mobile"}

                                {" • "}

                                {p.age ??
                                  "-"}

                                {" "}

                                {p.age_unit ||
                                  p.ageUnit ||
                                  "Years"}

                              </small>

                            </div>

                          </div>

                        );
                      }
                    )}

                  </div>

                )}

              </section>

              {/* QUICK ACTIONS */}

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

                <button
                  onClick={
                    openNewPatient
                  }
                >

                  <span>
                    ＋
                  </span>

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

                <button
                  onClick={
                    goBilling
                  }
                >

                  <span>
                    ₹
                  </span>

                  <div>
                    <b>
                      Create Bill
                    </b>

                    <small>
                      Patient billing
                    </small>
                  </div>

                </button>

                <button
                  onClick={
                    goResults
                  }
                >

                  <span>
                    ▤
                  </span>

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

                <button
                  onClick={
                    goReports
                  }
                >

                  <span>
                    ▣
                  </span>

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

            <div className="pageHeading">

              <div>

                <span className="smallTitle">
                  PATIENT REGISTRATION
                </span>

                <h1>
                  Register New Patient
                </h1>

                <p>
                  Patient ki basic
                  details enter karein.
                  Iske baad tests
                  select kiye jayenge.
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

            {/* STEPS */}

            <div className="steps">

              <div className="step activeStep">

                <span>
                  1
                </span>

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

                <span>
                  2
                </span>

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

                <span>
                  3
                </span>

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

                <span>
                  4
                </span>

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

                <span>
                  5
                </span>

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

            {/* REGISTRATION CARD */}

            <form
              className="registrationCard"
              onSubmit={
                continueToTests
              }
            >

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

                {/* NAME */}

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

                  {doctors.length >
                  0 ? (

                    <select
                      name="doctor"
                      value={
                        patient.doctor
                      }
                      onChange={
                        change
                      }
                    >

                      <option value="">
                        Select Doctor
                      </option>

                      {doctors.map(
                        (
                          doctor,
                          index
                        ) => {

                          const name =
                            doctor.name ||
                            doctor.doctor_name ||
                            "";

                          const qualification =
                            doctor.qualification ||
                            doctor.qualification_name ||
                            "";

                          const key =
                            doctor.id ||
                            doctor.doctor_id ||
                            `${name}-${index}`;

                          return (

                            <option
                              key={
                                key
                              }
                              value={
                                name
                              }
                            >
                              Dr.{" "}
                              {name}
                              {qualification
                                ? ` (${qualification})`
                                : ""}
                            </option>

                          );
                        }
                      )}

                    </select>

                  ) : (

                    <div>

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

                      <small className="doctorHint">
                        No doctor found.
                        Add doctor from
                        Doctors menu.
                      </small>

                    </div>

                  )}

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

              {/* FOOTER */}

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

      {/* =====================================================
          STYLE
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background:
            #f4f7fb;
          color:
            #1e293b;
        }

        button,
        input,
        select,
        textarea {
          font-family:
            inherit;
        }

        button {
          cursor:
            pointer;
        }

        button:disabled {
          opacity:
            0.65;
          cursor:
            not-allowed;
        }

        /* =====================================================
           APP
        ===================================================== */

        .labApp {
          min-height:
            100vh;
          display:
            flex;
          background:
            #f4f7fb;
        }

        /* =====================================================
           SIDEBAR
        ===================================================== */

        .sidebar {
          width:
            230px;
          min-height:
            100vh;
          background:
            #09263a;
          color:
            white;
          padding:
            18px 12px;
          position:
            fixed;
          left:
            0;
          top:
            0;
          bottom:
            0;
          overflow-y:
            auto;
          z-index:
            20;
        }

        .brand {
          display:
            flex;
          align-items:
            center;
          gap:
            10px;
          padding:
            5px 6px 22px;
        }

        .brandLogo {
          width:
            38px;
          height:
            38px;
          border-radius:
            10px;
          background:
            #0fa5a1;
          display:
            grid;
          place-items:
            center;
          font-weight:
            bold;
          font-size:
            17px;
        }

        .brand h2 {
          margin:
            0;
          font-size:
            17px;
          letter-spacing:
            .5px;
        }

        .brand p {
          margin:
            2px 0 0;
          font-size:
            8px;
          opacity:
            .65;
          letter-spacing:
            .5px;
        }

        .menuLabel {
          font-size:
            9px;
          letter-spacing:
            1.5px;
          color:
            #7e98a9;
          padding:
            12px 8px 7px;
          font-weight:
            bold;
        }

        .menuLabel.second {
          margin-top:
            10px;
        }

        .menu {
          width:
            100%;
          border:
            0;
          background:
            transparent;
          color:
            #d9e5ec;
          padding:
            10px 10px;
          border-radius:
            7px;
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          text-align:
            left;
          font-size:
            12px;
          margin:
            2px 0;
        }

        .menu span {
          width:
            18px;
          text-align:
            center;
        }

        .menu:hover {
          background:
            rgba(255,255,255,.08);
        }

        .menu.active {
          background:
            #105d72;
          color:
            white;
          box-shadow:
            inset 3px 0 0 #18b4ad;
        }

        /* =====================================================
           MAIN
        ===================================================== */

        .mainArea {
          margin-left:
            230px;
          width:
            calc(100% - 230px);
          min-height:
            100vh;
        }

        .topbar {
          min-height:
            70px;
          background:
            white;
          border-bottom:
            1px solid #e5eaf0;
          padding:
            14px 24px;
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            center;
        }

        .topbar h3 {
          margin:
            0 0 3px;
          font-size:
            16px;
        }

        .topbar p {
          margin:
            0;
          font-size:
            11px;
          color:
            #7b8794;
        }

        .topRight {
          font-size:
            11px;
          color:
            #64748b;
          display:
            flex;
          align-items:
            center;
          gap:
            7px;
        }

        .statusDot {
          width:
            7px;
          height:
            7px;
          border-radius:
            50%;
          background:
            #20b779;
        }

        .content {
          padding:
            22px;
        }

        /* =====================================================
           WELCOME
        ===================================================== */

        .welcome {
          background:
            white;
          border:
            1px solid #e5eaf0;
          border-radius:
            14px;
          padding:
            24px;
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            center;
          gap:
            20px;
        }

        .smallTitle {
          display:
            inline-block;
          font-size:
            10px;
          letter-spacing:
            1.3px;
          color:
            #0f9d9a;
          font-weight:
            bold;
        }

        .welcome h1 {
          margin:
            6px 0;
          font-size:
            26px;
        }

        .welcome p {
          margin:
            0;
          color:
            #718096;
          font-size:
            13px;
          max-width:
            700px;
        }

        .primaryBtn,
        .continueBtn {
          border:
            0;
          background:
            #0f9d9a;
          color:
            white;
          border-radius:
            8px;
          padding:
            11px 16px;
          font-weight:
            bold;
        }

        .primaryBtn:hover,
        .continueBtn:hover {
          background:
            #0b8582;
        }

        /* =====================================================
           STATS
        ===================================================== */

        .stats {
          display:
            grid;
          grid-template-columns:
            repeat(4, 1fr);
          gap:
            14px;
          margin-top:
            16px;
        }

        .statCard {
          background:
            white;
          border:
            1px solid #e4e9ef;
          border-radius:
            12px;
          padding:
            18px;
          display:
            flex;
          align-items:
            center;
          gap:
            13px;
          min-height:
            95px;
        }

        .statIcon {
          width:
            44px;
          height:
            44px;
          border-radius:
            11px;
          background:
            #e5f8f7;
          color:
            #078d89;
          display:
            grid;
          place-items:
            center;
          font-size:
            20px;
          font-weight:
            bold;
        }

        .statCard p {
          margin:
            0 0 5px;
          color:
            #64748b;
          font-size:
            12px;
        }

        .statCard h2 {
          margin:
            0;
          font-size:
            22px;
          color:
            #172033;
        }

        /* =====================================================
           DASHBOARD GRID
        ===================================================== */

        .dashboardGrid {
          display:
            grid;
          grid-template-columns:
            1.5fr 1fr;
          gap:
            16px;
          margin-top:
            16px;
        }

        .panel {
          background:
            white;
          border:
            1px solid #e4e9ef;
          border-radius:
            12px;
          overflow:
            hidden;
        }

        .panelHead {
          padding:
            18px;
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            center;
          border-bottom:
            1px solid #edf1f5;
        }

        .panelHead h2 {
          margin:
            0 0 4px;
          font-size:
            16px;
        }

        .panelHead p {
          margin:
            0;
          font-size:
            11px;
          color:
            #718096;
        }

        .panelHead button {
          border:
            0;
          background:
            #e8f7f6;
          color:
            #078d89;
          border-radius:
            7px;
          padding:
            8px 11px;
          font-weight:
            bold;
          font-size:
            11px;
        }

        .recentPatient {
          padding:
            12px 18px;
          border-bottom:
            1px solid #edf1f5;
        }

        .recentPatient b {
          font-size:
            13px;
        }

        .recentPatient div {
          font-size:
            10px;
          color:
            #0f9d9a;
          margin-top:
            3px;
        }

        .recentPatient small {
          color:
            #64748b;
          font-size:
            10px;
        }

        .emptyState {
          text-align:
            center;
          padding:
            35px 20px;
        }

        .emptyState > div {
          font-size:
            30px;
          color:
            #0f9d9a;
        }

        .emptyState h3 {
          margin:
            8px 0;
        }

        .emptyState p {
          color:
            #718096;
          font-size:
            12px;
        }

        .emptyState button {
          border:
            0;
          background:
            #0f9d9a;
          color:
            white;
          padding:
            10px 15px;
          border-radius:
            7px;
          font-weight:
            bold;
        }

        /* =====================================================
           QUICK ACTIONS
        ===================================================== */

        .quickPanel {
          padding-bottom:
            10px;
        }

        .quickPanel > button {
          width:
            calc(100% - 28px);
          margin:
            7px 14px;
          padding:
            11px;
          background:
            #f8fafc;
          border:
            1px solid #e7edf2;
          border-radius:
            9px;
          display:
            flex;
          align-items:
            center;
          gap:
            11px;
          text-align:
            left;
        }

        .quickPanel > button:hover {
          border-color:
            #0f9d9a;
          background:
            #f0fdfa;
        }

        .quickPanel > button > span {
          width:
            34px;
          height:
            34px;
          display:
            grid;
          place-items:
            center;
          background:
            #e5f8f7;
          color:
            #078d89;
          border-radius:
            8px;
          font-weight:
            bold;
        }

        .quickPanel b {
          display:
            block;
          font-size:
            12px;
        }

        .quickPanel small {
          display:
            block;
          margin-top:
            3px;
          color:
            #718096;
          font-size:
            10px;
        }

        /* =====================================================
           PAGE HEADING
        ===================================================== */

        .pageHeading {
          display:
            flex;
          justify-content:
            space-between;
          align-items:
            center;
          gap:
            15px;
          margin-bottom:
            16px;
        }

        .pageHeading h1 {
          margin:
            5px 0;
          font-size:
            24px;
        }

        .pageHeading p {
          margin:
            0;
          color:
            #718096;
          font-size:
            12px;
        }

        .backBtn,
        .cancelBtn {
          border:
            1px solid #d9e1e8;
          background:
            white;
          color:
            #475569;
          border-radius:
            8px;
          padding:
            10px 14px;
          font-weight:
            bold;
        }

        /* =====================================================
           STEPS
        ===================================================== */

        .steps {
          background:
            white;
          border:
            1px solid #e4e9ef;
          border-radius:
            12px;
          padding:
            12px;
          display:
            grid;
          grid-template-columns:
            repeat(5, 1fr);
          gap:
            8px;
          margin-bottom:
            16px;
        }

        .step {
          display:
            flex;
          align-items:
            center;
          gap:
            8px;
          padding:
            8px;
          border-radius:
            8px;
          color:
            #64748b;
        }

        .step > span {
          width:
            24px;
          height:
            24px;
          border-radius:
            50%;
          display:
            grid;
          place-items:
            center;
          background:
            #eef2f6;
          font-size:
            11px;
          font-weight:
            bold;
        }

        .step b {
          display:
            block;
          font-size:
            11px;
        }

        .step small {
          display:
            block;
          font-size:
            8px;
          margin-top:
            2px;
        }

        .activeStep {
          background:
            #eefaf9;
          color:
            #087e7b;
        }

        .activeStep > span {
          background:
            #0f9d9a;
          color:
            white;
        }

        /* =====================================================
           REGISTRATION CARD
        ===================================================== */

        .registrationCard {
          background:
            white;
          border:
            1px solid #e4e9ef;
          border-radius:
            14px;
          overflow:
            hidden;
        }

        .formHeader {
          padding:
            18px;
          display:
            flex;
          align-items:
            center;
          gap:
            12px;
          border-bottom:
            1px solid #edf1f5;
        }

        .formIcon {
          width:
            38px;
          height:
            38px;
          border-radius:
            10px;
          background:
            #e7f8f7;
          color:
            #078d89;
          display:
            grid;
          place-items:
            center;
        }

        .formHeader h2 {
          margin:
            0 0 3px;
          font-size:
            15px;
        }

        .formHeader p {
          margin:
            0;
          color:
            #718096;
          font-size:
            10px;
        }

        .formGrid {
          padding:
            20px;
          display:
            grid;
          grid-template-columns:
            1fr 1fr;
          gap:
            15px;
        }

        .field label {
          display:
            block;
          font-size:
            11px;
          font-weight:
            bold;
          margin-bottom:
            6px;
          color:
            #334155;
        }

        .field label b {
          color:
            #dc2626;
        }

        .field input,
        .field select,
        .field textarea {
          width:
            100%;
          border:
            1px solid #d7e0e8;
          border-radius:
            8px;
          padding:
            11px;
          font-size:
            12px;
          outline:
            none;
          background:
            white;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color:
            #0f9d9a;
          box-shadow:
            0 0 0 2px
            rgba(15,157,154,.08);
        }

        .field textarea {
          min-height:
            80px;
          resize:
            vertical;
        }

        .readonly {
          background:
            #f1f4f7 !important;
          color:
            #64748b;
        }

        .full {
          grid-column:
            span 2;
        }

        .ageField {
          display:
            grid;
          grid-template-columns:
            1fr 100px;
          gap:
            8px;
        }

        .doctorHint {
          display:
            block;
          margin-top:
            5px;
          font-size:
            9px;
          color:
            #dc8a00;
        }

        .formFooter {
          padding:
            14px 20px;
          background:
            #fbfcfd;
          border-top:
            1px solid #edf1f5;
          display:
            flex;
          justify-content:
            flex-end;
          gap:
            10px;
        }

        /* =====================================================
           MOBILE
        ===================================================== */

        @media (
          max-width: 900px
        ) {

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .dashboardGrid {
            grid-template-columns:
              1fr;
          }

        }

        @media (
          max-width: 700px
        ) {

          .sidebar {
            width:
              180px;
          }

          .mainArea {
            margin-left:
              180px;
            width:
              calc(100% - 180px);
          }

          .content {
            padding:
              12px;
          }

          .welcome {
            flex-direction:
              column;
            align-items:
              flex-start;
          }

          .welcome h1 {
            font-size:
              21px;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
          }

          .steps {
            overflow-x:
              auto;
            grid-template-columns:
              repeat(5, 150px);
          }

        }

        @media (
          max-width: 560px
        ) {

          .sidebar {
            width:
              70px;
            padding:
              10px 7px;
          }

          .brand {
            justify-content:
              center;
          }

          .brand > div:last-child {
            display:
              none;
          }

          .menuLabel {
            display:
              none;
          }

          .menu {
            justify-content:
              center;
            padding:
              12px 5px;
          }

          .menu span {
            margin:
              0;
          }

          .menu {
            font-size:
              0;
          }

          .menu span {
            font-size:
              16px;
          }

          .mainArea {
            margin-left:
              70px;
            width:
              calc(100% - 70px);
          }

          .topbar {
            padding:
              12px;
          }

          .topRight {
            display:
              none;
          }

          .content {
            padding:
              9px;
          }

          .stats {
            grid-template-columns:
              1fr;
          }

          .pageHeading {
            align-items:
              flex-start;
            flex-direction:
              column;
          }

          .formGrid {
            grid-template-columns:
              1fr;
            padding:
              14px;
          }

          .full {
            grid-column:
              auto;
          }

          .ageField {
            grid-template-columns:
              1fr 100px;
          }

          .formFooter {
            padding:
              12px;
          }

        }

      `}</style>

    </div>
  );
}
