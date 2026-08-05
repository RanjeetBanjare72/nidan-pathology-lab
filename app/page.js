"use client";

import { useState } from "react";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [active, setActive] = useState("dashboard");
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

  const generatePatientId = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const n = Math.floor(1000 + Math.random() * 9000);
    return `NPL-${y}${m}${d}-${n}`;
  };

  const openNewPatient = () => {
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
  };

  const change = (e) => {
    setPatient({
      ...patient,
      [e.target.name]: e.target.value,
    });
  };

  const continueToTests = (e) => {
    e.preventDefault();

    if (!patient.name.trim()) {
      alert("Patient Name enter karein.");
      return;
    }

    if (!patient.age) {
      alert("Patient Age enter karein.");
      return;
    }


  return (
    <div className="labApp">

      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brandLogo">N+</div>
          <div>
            <h2>NIDAN</h2>
            <p>PATHOLOGY LAB</p>
          </div>
        </div>

        <div className="menuLabel">MAIN MENU</div>

        <button
          className={active === "dashboard" ? "menu active" : "menu"}
          onClick={() => setActive("dashboard")}
        >
          <span>▦</span> Dashboard
        </button>

        <button className="menu" onClick={openNewPatient}>
          <span>＋</span> New Patient
        </button>

        <button className="menu">
          <span>♙</span> Patients
        </button>

        <button className="menu">
          <span>₹</span> Billing
        </button>

        <button className="menu">
          <span>⌁</span> Samples
        </button>

        <button className="menu">
          <span>▤</span> Result Entry
        </button>

        <button className="menu">
          <span>▣</span> Reports
        </button>

        <div className="menuLabel second">MANAGEMENT</div>

        <button className="menu">
          <span>⚗</span> Test Master
        </button>

        <button className="menu">
          <span>♧</span> Doctors
        </button>

        <button className="menu">
          <span>⚙</span> Settings
        </button>
      </aside>

      {/* MAIN */}
      <main className="mainArea">

        <header className="topbar">
          <div>
            <h3>
              {active === "dashboard"
                ? "Dashboard"
                : "New Patient Registration"}
            </h3>
            <p>NIDAN Pathology Laboratory Management System</p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            Lab Online
          </div>
        </header>

        {/* DASHBOARD */}
        {active === "dashboard" && (
          <div className="content">

            <div className="welcome">
              <div>
                <span className="smallTitle">
                  LABORATORY DASHBOARD
                </span>
                <h1>Welcome to NIDAN Pathology Lab</h1>
                <p>
                  Patients, billing, samples, test results aur
                  laboratory reports ko ek jagah manage karein.
                </p>
              </div>

              <button className="primaryBtn" onClick={openNewPatient}>
                ＋ New Patient
              </button>
            </div>

            <div className="stats">
              <div className="statCard">
                <div className="statIcon">♙</div>
                <div>
                  <p>Today's Patients</p>
                  <h2>0</h2>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon">₹</div>
                <div>
                  <p>Today's Collection</p>
                  <h2>₹0</h2>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon">⌁</div>
                <div>
                  <p>Pending Samples</p>
                  <h2>0</h2>
                </div>
              </div>

              <div className="statCard">
                <div className="statIcon">▤</div>
                <div>
                  <p>Pending Reports</p>
                  <h2>0</h2>
                </div>
              </div>
            </div>

            <div className="dashboardGrid">

              <section className="panel">
                <div className="panelHead">
                  <div>
                    <h2>Recent Patients</h2>
                    <p>Latest registered patients</p>
                  </div>
                  <button>View All</button>
                </div>

                <div className="emptyState">
                  <div>♙</div>
                  <h3>No patients registered yet</h3>
                  <p>
                    Patient registration shuru karne ke liye
                    New Patient par click karein.
                  </p>
                  <button onClick={openNewPatient}>
                    Register Patient
                  </button>
                </div>
              </section>

              <section className="panel quickPanel">
                <div className="panelHead">
                  <div>
                    <h2>Quick Actions</h2>
                    <p>Frequently used options</p>
                  </div>
                </div>

                <button onClick={openNewPatient}>
                  <span>＋</span>
                  <div>
                    <b>New Patient</b>
                    <small>Register new patient</small>
                  </div>
                </button>

                <button>
                  <span>₹</span>
                  <div>
                    <b>Create Bill</b>
                    <small>Patient billing</small>
                  </div>
                </button>

                <button>
                  <span>▤</span>
                  <div>
                    <b>Result Entry</b>
                    <small>Enter test results</small>
                  </div>
                </button>

                <button>
                  <span>▣</span>
                  <div>
                    <b>Reports</b>
                    <small>View final reports</small>
                  </div>
                </button>
              </section>

            </div>
          </div>
        )}

        {/* NEW PATIENT */}
        {active === "newPatient" && (
          <div className="content">

            <div className="pageHeading">
              <div>
                <span className="smallTitle">
                  PATIENT REGISTRATION
                </span>
                <h1>Register New Patient</h1>
                <p>
                  Patient ki basic details enter karein. Iske baad
                  tests select kiye jayenge.
                </p>
              </div>

              <button
                className="backBtn"
                onClick={() => setActive("dashboard")}
              >
                ← Dashboard
              </button>
            </div>

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
                  <b>Sample</b>
                  <small>Collection</small>
                </div>
              </div>

              <div className="step">
                <span>5</span>
                <div>
                  <b>Results</b>
                  <small>Report entry</small>
                </div>
              </div>
            </div>

            <form
              className="registrationCard"
              onSubmit={continueToTests}
            >
              <div className="formHeader">
                <div className="formIcon">♙</div>
                <div>
                  <h2>Patient Information</h2>
                  <p>
                    Fields marked with * are required.
                  </p>
                </div>
              </div>

              <div className="formGrid">

                <div className="field">
                  <label>Patient ID</label>
                  <input
                    value={patient.id}
                    readOnly
                    className="readonly"
                  />
                </div>

                <div className="field">
                  <label>
                    Patient Name <b>*</b>
                  </label>
                  <input
                    name="name"
                    value={patient.name}
                    onChange={change}
                    placeholder="Enter patient full name"
                  />
                </div>

                <div className="field">
                  <label>
                    Age <b>*</b>
                  </label>

                  <div className="ageField">
                    <input
                      type="number"
                      name="age"
                      value={patient.age}
                      onChange={change}
                      placeholder="Age"
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

                <div className="field">
                  <label>Gender</label>
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

                <div className="field">
                  <label>Mobile Number</label>
                  <input
                    type="tel"
                    name="mobile"
                    value={patient.mobile}
                    onChange={change}
                    placeholder="Enter mobile number"
                  />
                </div>

                <div className="field">
                  <label>Referring Doctor</label>
                  <input
                    name="doctor"
                    value={patient.doctor}
                    onChange={change}
                    placeholder="Doctor name"
                  />
                </div>

                <div className="field full">
                  <label>Address</label>
                  <textarea
                    name="address"
                    value={patient.address}
                    onChange={change}
                    placeholder="Patient address"
                  />
                </div>

              </div>

              <div className="formFooter">
                <button
                  type="button"
                  className="cancelBtn"
                  onClick={() => setActive("dashboard")}
                >
                  Cancel
                </button>

                <button type="submit" className="primaryBtn">
                  Save & Select Tests →
                </button>
              </div>

            </form>
          </div>
        )}

      </main>
    </div>
  );
}
