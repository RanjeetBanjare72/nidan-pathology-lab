"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./lib/supabase";

export default function Home() {
  const router = useRouter();

  const [patients, setPatients] = useState([]);
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

  useEffect(() => {
    fetchPatients();
  }, []);

  // =========================================================
  // LOAD PATIENTS
  // =========================================================

  async function fetchPatients() {
    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Patients load error:", error);
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error("Patients load error:", error);
    }
  }

  // =========================================================
  // PATIENT ID
  // =========================================================

  function generatePatientId() {
    const now = new Date();

    const y = now.getFullYear();

    const m = String(now.getMonth() + 1).padStart(2, "0");

    const d = String(now.getDate()).padStart(2, "0");

    const n = Math.floor(1000 + Math.random() * 9000);

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
    const { name, value } = e.target;

    setPatient((previous) => ({
      ...previous,
      [name]: value,
    }));
  }

  // =========================================================
  // SAVE PATIENT + CONTINUE
  // =========================================================

  async function continueToTests(e) {
    e.preventDefault();

    if (!patient.name.trim()) {
      alert("Patient Name enter karein.");
      return;
    }

    if (!patient.age) {
      alert("Patient Age enter karein.");
      return;
    }

    if (!patient.id) {
      alert("Patient ID generate nahi hua.");
      return;
    }

    try {
      setSaving(true);

      const { error } = await supabase.from("patients").insert([
        {
          patient_id: patient.id,
          name: patient.name,
          age: Number(patient.age),
          age_unit: patient.ageUnit,
          gender: patient.gender,
          mobile: patient.mobile,
          referring_doctor: patient.doctor,
          address: patient.address,
        },
      ]);

      if (error) {
        console.error(error);

        alert("Patient save nahi hua: " + error.message);

        setSaving(false);
        return;
      }

      // -------------------------------------------------------
      // IMPORTANT:
      // Existing Tests/Billing/Results pages isi patient data
      // ko localStorage se use kar sakte hain.
      // -------------------------------------------------------

      localStorage.setItem(
        "nidanPatient",
        JSON.stringify({
          ...patient,

          patientId: patient.id,

          refDoctor: patient.doctor,

          sex: patient.gender,
        })
      );

      // Old selected tests remove so new patient starts clean
      localStorage.removeItem("nidanSelectedTests");
      localStorage.removeItem("nidanBilling");
      localStorage.removeItem("nidanResults");

      router.push("/tests");
    } catch (error) {
      console.error(error);

      alert("Patient save karte waqt error aaya.");

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
            <p>PATHOLOGY LAB</p>
          </div>

        </div>

        <div className="menuLabel">
          MAIN MENU
        </div>

        <button
          className={
            active === "dashboard"
              ? "menu active"
              : "menu"
          }
          onClick={goDashboard}
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          className={
            active === "newPatient"
              ? "menu active"
              : "menu"
          }
          onClick={openNewPatient}
        >
          <span>＋</span>
          New Patient
        </button>

        <button
          className="menu"
          onClick={goPatients}
        >
          <span>♙</span>
          Patients
        </button>

        <button
          className="menu"
          onClick={goBilling}
        >
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={goSamples}
        >
          <span>⌁</span>
          Samples
        </button>

        <button
          className="menu"
          onClick={goResults}
        >
          <span>▤</span>
          Result Entry
        </button>

        <button
          className="menu"
          onClick={goReports}
        >
          <span>▣</span>
          Reports
        </button>

        <div className="menuLabel second">
          MANAGEMENT
        </div>

        <button
          className="menu"
          onClick={goTestMaster}
        >
          <span>⚗</span>
          Test Master
        </button>

        <button
          className="menu"
          onClick={goDoctors}
        >
          <span>♧</span>
          Doctors
        </button>

        <button
          className="menu"
          onClick={goSettings}
        >
          <span>⚙</span>
          Settings
        </button>

      </aside>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="mainArea">

        {/* ===================================================
            TOP BAR
        =================================================== */}

        <header className="topbar">

          <div>

            <h3>
              {active === "dashboard"
                ? "Dashboard"
                : "New Patient Registration"}
            </h3>

            <p>
              NIDAN Pathology Laboratory Management System
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

        {active === "dashboard" && (

          <div className="content">

            {/* WELCOME */}

            <div className="welcome">

              <div>

                <span className="smallTitle">
                  LABORATORY DASHBOARD
                </span>

                <h1>
                  Welcome to NIDAN Pathology Lab
                </h1>

                <p>
                  Patients, billing, samples, test results aur
                  laboratory reports ko ek jagah manage karein.
                </p>

              </div>

              <button
                className="primaryBtn"
                onClick={openNewPatient}
              >
                + New Patient
              </button>

            </div>

            {/* =================================================
                STAT CARDS
            ================================================= */}

            <div className="stats">

              <div className="statCard">

                <div className="statIcon">
                  ♙
                </div>

                <div>
                  <p>Total Patients</p>
                  <h2>{patients.length}</h2>
                </div>

              </div>

              <div className="statCard">

                <div className="statIcon">
                  ₹
                </div>

                <div>
                  <p>Today's Collection</p>
                  <h2>₹0</h2>
                </div>

              </div>

              <div className="statCard">

                <div className="statIcon">
                  ⌁
                </div>

                <div>
                  <p>Total Patients</p>
                  <h2>{patients.length}</h2>
                </div>

              </div>

              <div className="statCard">

                <div className="statIcon">
                  ▤
                </div>

                <div>
                  <p>Pending Reports</p>
                  <h2>0</h2>
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
                      Latest registered patients
                    </p>

                  </div>

                  <button onClick={goPatients}>
                    View All
                  </button>

                </div>

                {patients.length === 0 ? (

                  <div className="emptyState">

                    <div>♙</div>

                    <h3>
                      No registered patients
                    </h3>

                    <p>
                      Patient registration shuru karne ke liye
                      New Patient par click karein.
                    </p>

                    <button onClick={openNewPatient}>
                      Register Patient
                    </button>

                  </div>

                ) : (

                  <div>

                    {patients
                      .slice(0, 5)
                      .map((p) => (

                        <div
                          key={p.id}
                          style={{
                            padding: "10px",
                            borderBottom:
                              "1px solid #edf1f5",
                          }}
                        >

                          <b>
                            {p.name}
                          </b>

                          <div>
                            {p.patient_id}
                          </div>

                          <small>

                            {p.mobile || "No mobile"}

                            {" • "}

                            {p.age}

                            {" "}

                            {p.age_unit || "Years"}

                          </small>

                        </div>

                      ))}

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
                      Frequently used options
                    </p>

                  </div>

                </div>

                <button onClick={openNewPatient}>

                  <span>＋</span>

                  <div>
                    <b>New Patient</b>
                    <small>
                      Register new patient
                    </small>
                  </div>

                </button>

                <button onClick={goBilling}>

                  <span>₹</span>

                  <div>
                    <b>Create Bill</b>
                    <small>
                      Patient billing
                    </small>
                  </div>

                </button>

                <button onClick={goResults}>

                  <span>▤</span>

                  <div>
                    <b>Result Entry</b>
                    <small>
                      Enter test results
                    </small>
                  </div>

                </button>

                <button onClick={goReports}>

                  <span>▣</span>

                  <div>
                    <b>Reports</b>
                    <small>
                      View final reports
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

        {active === "newPatient" && (

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
                  Patient ki basic details enter karein.
                  Iske baad tests select kiye jayenge.
                </p>

              </div>

              <button
                className="backBtn"
                onClick={goDashboard}
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
                  <b>Patient</b>
                  <small>Registration</small>
                </div>

              </div>

              <div className="step">

                <span>2</span>

                <div>
                  <b>Tests</b>
                  <small>Select tests</small>
                </div>

              </div>

              <div className="step">

                <span>3</span>

                <div>
                  <b>Billing</b>
                  <small>Create bill</small>
                </div>

              </div>

              <div className="step">

                <span>4</span>

                <div>
                  <b>Results</b>
                  <small>Enter results</small>
                </div>

              </div>

              <div className="step">

                <span>5</span>

                <div>
                  <b>Report</b>
                  <small>Print / PDF</small>
                </div>

              </div>

            </div>

            {/* =================================================
                REGISTRATION FORM
            ================================================= */}

            <form
              className="registrationCard"
              onSubmit={continueToTests}
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
                    Fields marked with * are required.
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
                    value={patient.id}
                    readOnly
                    className="readonly"
                  />

                </div>

                {/* NAME */}

                <div className="field">

                  <label>
                    Patient Name <b>*</b>
                  </label>

                  <input
                    name="name"
                    value={patient.name}
                    onChange={change}
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
                      value={patient.age}
                      onChange={change}
                      placeholder="Age"
                      required
                    />

                    <select
                      name="ageUnit"
                      value={patient.ageUnit}
                      onChange={change}
                    >
                      <option>Years</option>
                      <option>Months</option>
                      <option>Days</option>
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
                    value={patient.gender}
                    onChange={change}
                  >
                    <option>Male</option>
                    <option>Female</option>
                    <option>Other</option>
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
                    value={patient.mobile}
                    onChange={change}
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
                    value={patient.doctor}
                    onChange={change}
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
                    value={patient.address}
                    onChange={change}
                    placeholder="Patient address"
                  />

                </div>

              </div>

              {/* =================================================
                  FORM FOOTER
              ================================================= */}

              <div className="formFooter">

                <button
                  type="button"
                  className="cancelBtn"
                  onClick={goDashboard}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primaryBtn"
                  disabled={saving}
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
