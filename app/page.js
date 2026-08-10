"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";

export default function Home() {
  const router = useRouter();

  // =========================================================
  // STATE
  // =========================================================

  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [active, setActive] = useState("dashboard");
  const [saving, setSaving] = useState(false);

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
  // PAGE LOAD
  // =========================================================

  useEffect(() => {
    fetchPatients();
    loadDoctors();

    // Browser storage change listener
    function handleStorageChange() {
      loadDoctors();
    }

    window.addEventListener(
      "storage",
      handleStorageChange
    );

    return () => {
      window.removeEventListener(
        "storage",
        handleStorageChange
      );
    };
  }, []);

  // =========================================================
  // LOAD PATIENTS FROM SUPABASE
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
  // LOAD DOCTORS FROM LOCAL STORAGE
  // =========================================================

  function loadDoctors() {
    try {
      const raw =
        localStorage.getItem(
          "nidanDoctors"
        );

      if (!raw) {
        setDoctors([]);
        return;
      }

      const savedDoctors =
        JSON.parse(raw);

      if (!Array.isArray(savedDoctors)) {
        setDoctors([]);
        return;
      }

      // Only active doctors
      const activeDoctors =
        savedDoctors.filter(
          (doctor) =>
            doctor &&
            doctor.name &&
            doctor.active !== false
        );

      setDoctors(activeDoctors);

      console.log(
        "NIDAN Doctors loaded:",
        activeDoctors
      );
    } catch (error) {
      console.error(
        "Doctors load error:",
        error
      );

      setDoctors([]);
    }
  }

  // =========================================================
  // GENERATE PATIENT ID
  // =========================================================

  function generatePatientId() {
    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(
        now.getMonth() + 1
      ).padStart(2, "0");

    const day =
      String(
        now.getDate()
      ).padStart(2, "0");

    const randomNumber =
      Math.floor(
        1000 +
          Math.random() * 9000
      );

    return `NPL-${year}${month}${day}-${randomNumber}`;
  }

  // =========================================================
  // OPEN NEW PATIENT
  // =========================================================

  function openNewPatient() {
    // IMPORTANT:
    // Doctor list ko fresh load karna
    loadDoctors();

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

    setPatient((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // DOCTOR CHANGE
  // =========================================================

  function changeDoctor(e) {
    const value =
      e.target.value;

    setPatient((previous) => ({
      ...previous,
      doctor: value,
    }));
  }

  // =========================================================
  // SAVE PATIENT
  // =========================================================

  async function continueToTests(e) {
    e.preventDefault();

    // Patient name
    if (!patient.name.trim()) {
      alert(
        "Patient Name enter karein."
      );
      return;
    }

    // Age
    if (!patient.age) {
      alert(
        "Patient Age enter karein."
      );
      return;
    }

    // Patient ID
    if (!patient.id) {
      alert(
        "Patient ID generate nahi hua."
      );
      return;
    }

    try {
      setSaving(true);

      // =====================================================
      // SUPABASE INSERT
      // =====================================================

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
                patient.mobile ||
                "",

              referring_doctor:
                patient.doctor ||
                "",

              address:
                patient.address ||
                "",
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

        return;
      }

      // =====================================================
      // SAVE CURRENT PATIENT FOR OTHER PAGES
      // =====================================================

      const currentPatient = {
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
          currentPatient
        )
      );

      // =====================================================
      // CLEAR PREVIOUS VISIT DATA
      // =====================================================

      localStorage.removeItem(
        "nidanSelectedTests"
      );

      localStorage.removeItem(
        "nidanBilling"
      );

      localStorage.removeItem(
        "nidanResults"
      );

      // =====================================================
      // REFRESH PATIENTS
      // =====================================================

      await fetchPatients();

      // =====================================================
      // GO TO TEST SELECTION
      // =====================================================

      router.push("/tests");
    } catch (error) {
      console.error(
        "Patient save error:",
        error
      );

      alert(
        "Patient save karte waqt error aaya:\n\n" +
          error.message
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
  }

  function goPatients() {
    router.push("/patients");
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
  // REFRESH
  // =========================================================

  async function refreshDashboard() {
    await fetchPatients();
    loadDoctors();
  }

  // =========================================================
  // RENDER
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
            active === "newPatient"
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

        {/* RESULT */}

        <button
          className="menu"
          onClick={
            goResults
          }
        >
          <span>▤</span>
          Result Entry
        </button>

        {/* REPORT */}

        <button
          className="menu"
          onClick={
            goReports
          }
        >
          <span>▣</span>
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

        {/* TOP BAR */}

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

              <div className="welcomeActions">

                <button
                  className="refreshBtn"
                  onClick={
                    refreshDashboard
                  }
                >
                  ↻ Refresh
                </button>

                <button
                  className="primaryBtn"
                  onClick={
                    openNewPatient
                  }
                >
                  + New Patient
                </button>

              </div>

            </div>

            {/* STAT CARDS */}

            <div className="stats">

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

              <div className="statCard">

                <div className="statIcon">
                  ₹
                </div>

                <div>

                  <p>
                    Today's Collection
                  </p>

                  <h2>
                    ₹0
                  </h2>

                </div>

              </div>

              <div className="statCard">

                <div className="statIcon">
                  ♧
                </div>

                <div>

                  <p>
                    Total Doctors
                  </p>

                  <h2>
                    {doctors.length}
                  </h2>

                </div>

              </div>

              <div className="statCard">

                <div className="statIcon">
                  ▤
                </div>

                <div>

                  <p>
                    Pending Reports
                  </p>

                  <h2>
                    0
                  </h2>

                </div>

              </div>

            </div>

            {/* DASHBOARD GRID */}

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

                {patients.length ===
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

                  <div className="recentPatients">

                    {patients
                      .slice(0, 5)
                      .map(
                        (p) => (

                          <div
                            key={
                              p.id ||
                              p.patient_id
                            }
                            className="recentPatient"
                          >

                            <div>

                              <b>
                                {p.name}
                              </b>

                              <div className="patientNumber">
                                {p.patient_id ||
                                  p.id ||
                                  "-"}
                              </div>

                              <small>

                                {p.mobile ||
                                  "No mobile"}

                                {" • "}

                                {p.age ||
                                  "-"}

                                {" "}

                                {p.age_unit ||
                                  "Years"}

                              </small>

                            </div>

                            <div className="recentDoctor">

                              {p.referring_doctor ||
                                "No doctor"}

                            </div>

                          </div>

                        )
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
                      Enter test results
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
                      View final reports
                    </small>
                  </div>

                </button>

                <button
                  onClick={
                    goDoctors
                  }
                >

                  <span>
                    ♧
                  </span>

                  <div>
                    <b>
                      Doctors
                    </b>

                    <small>
                      Manage referring
                      doctors
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

              {/* HEADER */}

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

              {/* FORM */}

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
                    Patient Name
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
                    Age
                    <b>*</b>
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

                      <option value="Years">
                        Years
                      </option>

                      <option value="Months">
                        Months
                      </option>

                      <option value="Days">
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

                    <option value="Male">
                      Male
                    </option>

                    <option value="Female">
                      Female
                    </option>

                    <option value="Other">
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

                {/* =================================================
                    REFERRING DOCTOR
                    IMPORTANT FIX
                ================================================= */}

                <div className="field">

                  <label>
                    Referring Doctor
                  </label>

                  <select
                    name="doctor"
                    value={
                      patient.doctor
                    }
                    onChange={
                      changeDoctor
                    }
                  >

                    <option value="">
                      Select Referring Doctor
                    </option>

                    {doctors.length >
                    0 ? (

                      doctors.map(
                        (doctor) => (

                          <option
                            key={
                              doctor.id ||
                              doctor.name
                            }
                            value={
                              `Dr. ${doctor.name}`
                            }
                          >

                            Dr.{" "}
                            {doctor.name}

                            {doctor.qualification
                              ? ` - ${doctor.qualification}`
                              : ""}

                            {doctor.specialization
                              ? ` - ${doctor.specialization}`
                              : ""}

                          </option>

                        )
                      )

                    ) : (

                      <option
                        value=""
                        disabled
                      >
                        No doctor saved
                      </option>

                    )}

                  </select>

                  {/* DOCTOR STATUS */}

                  {doctors.length >
                  0 ? (

                    <div className="doctorLoaded">

                      ✓{" "}
                      {doctors.length} doctor
                      {doctors.length >
                      1
                        ? "s"
                        : ""}{" "}
                      available

                    </div>

                  ) : (

                    <button
                      type="button"
                      className="doctorHelp"
                      onClick={
                        goDoctors
                      }
                    >
                      + Add Doctor
                    </button>

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
                    rows="4"
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
          CSS
      ===================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
          background: #f4f7fb;
          color: #172033;
        }

        button,
        input,
        select,
        textarea {
          font-family: inherit;
        }

        button {
          cursor: pointer;
        }

        /* ================= APP ================= */

        .labApp {
          min-height: 100vh;
          display: flex;
          background: #f4f7fb;
        }

        /* ================= SIDEBAR ================= */

        .sidebar {
          width: 235px;
          min-height: 100vh;
          background: #092638;
          color: white;
          padding: 18px 12px;
          position: fixed;
          left: 0;
          top: 0;
          bottom: 0;
          overflow-y: auto;
          z-index: 100;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 4px 5px 25px;
        }

        .brandLogo {
          width: 38px;
          height: 38px;
          border-radius: 9px;
          background: #10a7a3;
          display: grid;
          place-items: center;
          font-size: 17px;
          font-weight: 800;
        }

        .brand h2 {
          margin: 0;
          font-size: 16px;
          letter-spacing: .5px;
        }

        .brand p {
          margin: 2px 0 0;
          color: #91a6b5;
          font-size: 8px;
          letter-spacing: .8px;
        }

        .menuLabel {
          color: #718b9b;
          font-size: 9px;
          font-weight: 700;
          letter-spacing: 1.5px;
          padding: 7px 9px;
          margin-top: 3px;
        }

        .menuLabel.second {
          margin-top: 20px;
        }

        .menu {
          width: 100%;
          border: 0;
          background: transparent;
          color: #d4e0e7;
          padding: 11px 10px;
          border-radius: 7px;
          display: flex;
          align-items: center;
          gap: 11px;
          text-align: left;
          font-size: 13px;
          margin: 2px 0;
        }

        .menu span {
          width: 18px;
          text-align: center;
        }

        .menu:hover {
          background: #103c51;
        }

        .menu.active {
          background: #0e5369;
          color: white;
          box-shadow:
            inset 3px 0 0 #13b4ad;
        }

        /* ================= MAIN ================= */

        .mainArea {
          width: calc(100% - 235px);
          margin-left: 235px;
          min-height: 100vh;
        }

        /* ================= TOPBAR ================= */

        .topbar {
          min-height: 72px;
          background: white;
          border-bottom: 1px solid #e4e9ee;
          padding: 15px 25px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .topbar h3 {
          margin: 0;
          font-size: 16px;
        }

        .topbar p {
          margin: 4px 0 0;
          color: #84919e;
          font-size: 10px;
        }

        .topRight {
          color: #526273;
          font-size: 11px;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .statusDot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #20b56c;
        }

        /* ================= CONTENT ================= */

        .content {
          padding: 25px;
          max-width: 1450px;
          margin: auto;
        }

        .smallTitle {
          color: #119b98;
          font-size: 10px;
          font-weight: 800;
          letter-spacing: 1.3px;
        }

        .welcome,
        .pageHeading {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 20px;
          margin-bottom: 20px;
        }

        .welcome h1,
        .pageHeading h1 {
          margin: 5px 0;
          font-size: 26px;
        }

        .welcome p,
        .pageHeading p {
          margin: 0;
          color: #718096;
          font-size: 13px;
        }

        .welcomeActions {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        /* ================= BUTTONS ================= */

        .primaryBtn {
          border: 0;
          background: #0d9f9b;
          color: white;
          font-weight: 700;
          border-radius: 8px;
          padding: 12px 17px;
          white-space: nowrap;
        }

        .primaryBtn:hover {
          background: #078b88;
        }

        .primaryBtn:disabled {
          opacity: .6;
          cursor: not-allowed;
        }

        .refreshBtn {
          border: 1px solid #d9e1e7;
          background: white;
          color: #526273;
          border-radius: 8px;
          padding: 11px 14px;
        }

        .backBtn {
          border: 1px solid #d8e0e7;
          background: white;
          padding: 11px 15px;
          border-radius: 8px;
          color: #526273;
        }

        .cancelBtn {
          border: 1px solid #d8e0e7;
          background: white;
          color: #526273;
          padding: 11px 16px;
          border-radius: 8px;
        }

        /* ================= STATS ================= */

        .stats {
          display: grid;
          grid-template-columns:
            repeat(4, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }

        .statCard {
          background: white;
          border: 1px solid #e4e9ee;
          border-radius: 13px;
          padding: 17px;
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .statIcon {
          width: 42px;
          height: 42px;
          border-radius: 11px;
          background: #e7f8f7;
          color: #079b97;
          display: grid;
          place-items: center;
          font-size: 19px;
        }

        .statCard p {
          margin: 0 0 5px;
          color: #81909d;
          font-size: 11px;
        }

        .statCard h2 {
          margin: 0;
          font-size: 22px;
        }

        /* ================= GRID ================= */

        .dashboardGrid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.7fr)
            minmax(280px, .8fr);
          gap: 18px;
        }

        .panel {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 14px;
          overflow: hidden;
        }

        .panelHead {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 17px 18px;
          border-bottom: 1px solid #edf1f4;
        }

        .panelHead h2 {
          margin: 0;
          font-size: 15px;
        }

        .panelHead p {
          margin: 4px 0 0;
          font-size: 11px;
          color: #8794a1;
        }

        .panelHead button {
          border: 0;
          background: #edf9f8;
          color: #079b97;
          padding: 7px 10px;
          border-radius: 6px;
          font-size: 11px;
        }

        /* ================= RECENT PATIENTS ================= */

        .recentPatient {
          padding: 12px 18px;
          border-bottom: 1px solid #edf1f5;
          display: flex;
          justify-content: space-between;
          gap: 15px;
        }

        .recentPatient:last-child {
          border-bottom: 0;
        }

        .recentPatient b {
          font-size: 13px;
        }

        .patientNumber {
          color: #0c9895;
          font-size: 10px;
          margin-top: 3px;
        }

        .recentPatient small {
          display: block;
          color: #718096;
          font-size: 10px;
          margin-top: 4px;
        }

        .recentDoctor {
          font-size: 10px;
          color: #64748b;
          text-align: right;
          max-width: 180px;
        }

        /* ================= EMPTY ================= */

        .emptyState {
          text-align: center;
          padding: 45px 20px;
          color: #718096;
        }

        .emptyState > div {
          font-size: 32px;
          margin-bottom: 10px;
        }

        .emptyState h3 {
          margin: 0 0 6px;
          color: #27364a;
          font-size: 15px;
        }

        .emptyState p {
          font-size: 12px;
          max-width: 380px;
          margin: 0 auto 15px;
        }

        .emptyState button {
          border: 0;
          background: #0d9f9b;
          color: white;
          padding: 10px 14px;
          border-radius: 7px;
        }

        /* ================= QUICK ================= */

        .quickPanel > button {
          width: calc(100% - 28px);
          margin: 7px 14px;
          border: 1px solid #edf0f3;
          background: white;
          border-radius: 9px;
          padding: 11px;
          display: flex;
          align-items: center;
          gap: 10px;
          text-align: left;
        }

        .quickPanel > button:hover {
          background: #f8fbfc;
        }

        .quickPanel > button > span {
          width: 32px;
          height: 32px;
          border-radius: 8px;
          background: #edf9f8;
          color: #079b97;
          display: grid;
          place-items: center;
        }

        .quickPanel b {
          display: block;
          font-size: 12px;
        }

        .quickPanel small {
          display: block;
          color: #82909c;
          font-size: 9px;
          margin-top: 3px;
        }

        /* ================= STEPS ================= */

        .steps {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 13px;
          padding: 14px;
          display: grid;
          grid-template-columns:
            repeat(5, 1fr);
          margin-bottom: 15px;
        }

        .step {
          display: flex;
          align-items: center;
          gap: 8px;
          color: #8895a1;
        }

        .step span {
          width: 27px;
          height: 27px;
          border-radius: 50%;
          background: #edf1f4;
          display: grid;
          place-items: center;
          font-size: 11px;
          font-weight: 700;
        }

        .step b {
          display: block;
          font-size: 11px;
        }

        .step small {
          display: block;
          font-size: 8px;
          margin-top: 2px;
        }

        .step.activeStep {
          color: #0c9d99;
        }

        .step.activeStep span {
          background: #0c9d99;
          color: white;
        }

        /* ================= REGISTRATION ================= */

        .registrationCard {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 14px;
          overflow: hidden;
        }

        .formHeader {
          display: flex;
          align-items: center;
          gap: 11px;
          padding: 18px;
          border-bottom: 1px solid #edf1f4;
        }

        .formIcon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: #e7f8f7;
          color: #079b97;
          display: grid;
          place-items: center;
        }

        .formHeader h2 {
          margin: 0;
          font-size: 16px;
        }

        .formHeader p {
          margin: 4px 0 0;
          color: #8794a1;
          font-size: 10px;
        }

        .formGrid {
          padding: 20px;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
        }

        .field {
          display: flex;
          flex-direction: column;
        }

        .field label {
          font-size: 11px;
          font-weight: 700;
          color: #344256;
          margin-bottom: 6px;
        }

        .field label b {
          color: #e34c4c;
        }

        .field input,
        .field select,
        .field textarea {
          width: 100%;
          border: 1px solid #d8e0e7;
          border-radius: 8px;
          padding: 11px;
          background: white;
          color: #27364a;
          outline: none;
          font-size: 12px;
        }

        .field input:focus,
        .field select:focus,
        .field textarea:focus {
          border-color: #0ca09c;
          box-shadow:
            0 0 0 2px
            rgba(12,160,156,.08);
        }

        .field textarea {
          resize: vertical;
          min-height: 85px;
        }

        .field .readonly {
          background: #f2f5f7;
          color: #73808c;
        }

        .ageField {
          display: grid;
          grid-template-columns:
            1fr 110px;
          gap: 7px;
        }

        .full {
          grid-column: span 2;
        }

        /* =================================================
           DOCTOR STATUS
        ================================================= */

        .doctorLoaded {
          margin-top: 6px;
          color: #15945f;
          font-size: 10px;
          font-weight: 600;
        }

        .doctorHelp {
          margin-top: 6px;
          border: 0;
          background: #eaf9f8;
          color: #079b97;
          padding: 7px 9px;
          border-radius: 6px;
          text-align: left;
          font-size: 10px;
          width: fit-content;
        }

        /* ================= FOOTER ================= */

        .formFooter {
          padding: 15px 20px;
          border-top: 1px solid #edf1f4;
          display: flex;
          justify-content: flex-end;
          gap: 9px;
        }

        /* ================= TABLET ================= */

        @media (max-width: 900px) {

          .sidebar {
            width: 190px;
          }

          .mainArea {
            width: calc(100% - 190px);
            margin-left: 190px;
          }

          .stats {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .dashboardGrid {
            grid-template-columns: 1fr;
          }

        }

        /* ================= MOBILE ================= */

        @media (max-width: 650px) {

          .sidebar {
            position: fixed;
            width: 70px;
            padding: 10px 7px;
          }

          .brand {
            justify-content: center;
            padding-bottom: 15px;
          }

          .brand > div:last-child,
          .menuLabel {
            display: none;
          }

          .menu {
            justify-content: center;
            padding: 12px 5px;
          }

          .menu span {
            width: auto;
            font-size: 16px;
          }

          .menu {
            font-size: 0;
          }

          .mainArea {
            width: calc(100% - 70px);
            margin-left: 70px;
          }

          .topbar {
            padding: 12px;
          }

          .topRight {
            display: none;
          }

          .content {
            padding: 12px;
          }

          .welcome,
          .pageHeading {
            align-items: flex-start;
            flex-direction: column;
          }

          .welcome h1,
          .pageHeading h1 {
            font-size: 21px;
          }

          .welcomeActions {
            width: 100%;
          }

          .welcomeActions button {
            flex: 1;
          }

          .stats {
            grid-template-columns:
              1fr 1fr;
            gap: 8px;
          }

          .statCard {
            padding: 12px;
          }

          .statIcon {
            width: 34px;
            height: 34px;
          }

          .statCard h2 {
            font-size: 18px;
          }

          .steps {
            overflow-x: auto;
            display: flex;
            gap: 20px;
          }

          .step {
            min-width: 105px;
          }

          .formGrid {
            grid-template-columns: 1fr;
            padding: 14px;
          }

          .full {
            grid-column: auto;
          }

          .ageField {
            grid-template-columns:
              1fr 100px;
          }

          .formFooter {
            padding: 12px 14px;
          }

          .formFooter button {
            flex: 1;
          }

          .recentPatient {
            flex-direction: column;
            gap: 5px;
          }

          .recentDoctor {
            text-align: left;
          }

        }

      `}</style>

    </div>
  );
}
