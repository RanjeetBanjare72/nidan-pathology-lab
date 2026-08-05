"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function PatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    try {
      const saved =
        JSON.parse(localStorage.getItem("nidanPatients") || "[]");

      setPatients(saved);
    } catch {
      setPatients([]);
    }
  }, []);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return patients;

    return patients.filter((patient) => {
      return (
        String(patient.id || "")
          .toLowerCase()
          .includes(q) ||
        String(patient.name || "")
          .toLowerCase()
          .includes(q) ||
        String(patient.mobile || "")
          .toLowerCase()
          .includes(q) ||
        String(patient.doctor || "")
          .toLowerCase()
          .includes(q)
      );
    });
  }, [patients, search]);

  function openPatient(patient) {
    localStorage.setItem(
      "nidanPatient",
      JSON.stringify(patient)
    );

    router.push("/tests");
  }

  function deletePatient(id) {
    const ok = window.confirm(
      "Kya aap is patient record ko delete karna chahte hain?"
    );

    if (!ok) return;

    const updated = patients.filter(
      (patient) => patient.id !== id
    );

    setPatients(updated);

    localStorage.setItem(
      "nidanPatients",
      JSON.stringify(updated)
    );
  }

  return (
    <div className="labApp">
      <aside className="sidebar">

        <div className="brand">
          <div className="brandLogo">N+</div>

          <div>
            <h2>NIDAN</h2>
            <p>PATHOLOGY LAB</p>
          </div>
        </div>

        <div className="menuLabel">
          MAIN MENU
        </div>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>▦</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>＋</span>
          New Patient
        </button>

        <button className="menu active">
          <span>♙</span>
          Patients
        </button>

        <button
          className="menu"
          onClick={() => router.push("/billing")}
        >
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={() => router.push("/results")}
        >
          <span>▤</span>
          Result Entry
        </button>

        <button
          className="menu"
          onClick={() => router.push("/report")}
        >
          <span>▣</span>
          Reports
        </button>

      </aside>

      <main className="mainArea">

        <header className="topbar">
          <div>
            <h3>Patients</h3>
            <p>
              Patient registration and history
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            NIDAN Lab System
          </div>
        </header>

        <div className="content">

          <div className="pageHeading">
            <div>
              <span className="smallTitle">
                PATIENT MANAGEMENT
              </span>

              <h1>Patient Records</h1>

              <p>
                Registered patients ko search,
                open aur manage karein.
              </p>
            </div>

            <button
              className="primaryBtn"
              onClick={() => router.push("/")}
            >
              + New Patient
            </button>
          </div>

          <section className="patientsCard">

            <div className="patientsToolbar">

              <div className="patientSearch">
                <span>⌕</span>

                <input
                  type="search"
                  placeholder="Search Patient ID, Name, Mobile or Doctor..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <div className="patientCount">
                Total Patients:
                <strong>{patients.length}</strong>
              </div>

            </div>

            <div className="patientTableWrap">

              <table className="patientTable">

                <thead>
                  <tr>
                    <th>Patient ID</th>
                    <th>Patient Name</th>
                    <th>Age / Sex</th>
                    <th>Mobile</th>
                    <th>Ref. Doctor</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody>

                  {filteredPatients.length === 0 ? (

                    <tr>
                      <td
                        colSpan="6"
                        className="patientsEmpty"
                      >
                        <div>♙</div>

                        <h3>
                          No patient records found
                        </h3>

                        <p>
                          New Patient registration
                          complete karne ke baad
                          records yahan dikhai denge.
                        </p>
                      </td>
                    </tr>

                  ) : (

                    filteredPatients.map(
                      (patient) => (

                        <tr key={patient.id}>

                          <td>
                            <strong className="patientIdText">
                              {patient.id}
                            </strong>
                          </td>

                          <td>
                            <strong>
                              {patient.name}
                            </strong>
                          </td>

                          <td>
                            {patient.age || "-"}{" "}
                            {patient.ageUnit || ""} /{" "}
                            {patient.gender ||
                              patient.sex ||
                              "-"}
                          </td>

                          <td>
                            {patient.mobile || "-"}
                          </td>

                          <td>
                            {patient.doctor || "-"}
                          </td>

                          <td>
                            <div className="patientActions">

                              <button
                                className="patientOpenBtn"
                                onClick={() =>
                                  openPatient(patient)
                                }
                              >
                                New Visit
                              </button>

                              <button
                                className="patientDeleteBtn"
                                onClick={() =>
                                  deletePatient(
                                    patient.id
                                  )
                                }
                              >
                                ×
                              </button>

                            </div>
                          </td>

                        </tr>
                      )
                    )
                  )}

                </tbody>

              </table>

            </div>

          </section>

        </div>
      </main>
    </div>
  );
}
