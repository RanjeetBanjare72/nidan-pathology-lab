"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function PatientsPage() {
  const router = useRouter();

  const [patients, setPatients] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  async function loadPatients() {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Patients load error:", error);
      setErrorMessage(error.message);
      setPatients([]);
    } else {
      setPatients(data || []);
    }

    setLoading(false);
  }

  useEffect(() => {
    loadPatients();
  }, []);

  const filteredPatients = useMemo(() => {
    const q = search.toLowerCase().trim();

    if (!q) return patients;

    return patients.filter((patient) =>
      [
        patient.id,
        patient.name,
        patient.mobile,
        patient.phone,
        patient.doctor,
        patient.patient_id,
      ]
        .map((value) => String(value || "").toLowerCase())
        .some((value) => value.includes(q))
    );
  }, [patients, search]);

  function openPatient(patient) {
    localStorage.setItem("nidanPatient", JSON.stringify(patient));
    router.push("/tests");
  }

  function addNewPatient() {
    localStorage.removeItem("nidanPatient");
    router.push("/patients/new");
  }

  async function deletePatient(id) {
    const ok = window.confirm(
      "Kya aap is patient record ko delete karna chahte hain?"
    );

    if (!ok) return;

    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete error:", error);
      alert("Patient delete nahi hua: " + error.message);
      return;
    }

    setPatients((currentPatients) =>
      currentPatients.filter((patient) => patient.id !== id)
    );

    alert("Patient record delete ho gaya.");
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        color: "#172033",
        fontFamily: "Arial, sans-serif",
      }}
    >
      {/* HEADER */}
      <header
        style={{
          background: "#0f766e",
          color: "#fff",
          padding: "16px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <div style={{ fontSize: "22px", fontWeight: "700" }}>
            NIDAN PATHOLOGY LAB
          </div>
          <div style={{ fontSize: "13px", opacity: 0.9 }}>
            Patient Management
          </div>
        </div>

        <button
          onClick={() => router.push("/dashboard")}
          style={{
            border: "none",
            borderRadius: "8px",
            padding: "10px 16px",
            background: "#ffffff",
            color: "#0f766e",
            fontWeight: "700",
            cursor: "pointer",
          }}
        >
          Dashboard
        </button>
      </header>

      {/* MAIN */}
      <main
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        {/* TITLE */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "18px",
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: "26px",
              }}
            >
              Patients
            </h1>

            <p
              style={{
                margin: "5px 0 0",
                color: "#64748b",
              }}
            >
              Total Patients: <b>{patients.length}</b>
            </p>
          </div>

          <button
            onClick={addNewPatient}
            style={{
              border: "none",
              borderRadius: "10px",
              padding: "12px 18px",
              background: "#0f766e",
              color: "#fff",
              fontWeight: "700",
              fontSize: "15px",
              cursor: "pointer",
            }}
          >
            + New Patient
          </button>
        </div>

        {/* SEARCH */}
        <div
          style={{
            background: "#fff",
            padding: "15px",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.06)",
            marginBottom: "18px",
          }}
        >
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search patient by name, mobile, ID or doctor..."
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "13px 15px",
              border: "1px solid #dbe3ec",
              borderRadius: "9px",
              fontSize: "15px",
              outline: "none",
            }}
          />
        </div>

        {/* ERROR */}
        {errorMessage && (
          <div
            style={{
              background: "#fee2e2",
              color: "#991b1b",
              padding: "14px",
              borderRadius: "10px",
              marginBottom: "15px",
            }}
          >
            <b>Database Error:</b> {errorMessage}
          </div>
        )}

        {/* LOADING */}
        {loading && (
          <div
            style={{
              background: "#fff",
              padding: "30px",
              borderRadius: "12px",
              textAlign: "center",
            }}
          >
            Loading patients...
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredPatients.length === 0 && (
          <div
            style={{
              background: "#fff",
              padding: "45px 20px",
              borderRadius: "12px",
              textAlign: "center",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <div style={{ fontSize: "45px" }}>👤</div>

            <h3>No patient found</h3>

            <p style={{ color: "#64748b" }}>
              {search
                ? "Search ke according koi patient nahi mila."
                : "Abhi koi patient record available nahi hai."}
            </p>

            {!search && (
              <button
                onClick={addNewPatient}
                style={{
                  border: "none",
                  borderRadius: "8px",
                  padding: "11px 18px",
                  background: "#0f766e",
                  color: "#fff",
                  fontWeight: "700",
                  cursor: "pointer",
                }}
              >
                + Add First Patient
              </button>
            )}
          </div>
        )}

        {/* PATIENT TABLE */}
        {!loading && filteredPatients.length > 0 && (
          <div
            style={{
              background: "#fff",
              borderRadius: "12px",
              overflowX: "auto",
              boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                minWidth: "750px",
              }}
            >
              <thead>
                <tr
                  style={{
                    background: "#ecfdf5",
                    textAlign: "left",
                  }}
                >
                  <th style={thStyle}>Patient ID</th>
                  <th style={thStyle}>Name</th>
                  <th style={thStyle}>Mobile</th>
                  <th style={thStyle}>Doctor</th>
                  <th style={thStyle}>Date</th>
                  <th style={thStyle}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredPatients.map((patient) => (
                  <tr key={patient.id}>
                    <td style={tdStyle}>
                      {patient.patient_id || patient.id || "-"}
                    </td>

                    <td style={tdStyle}>
                      <b>{patient.name || "Unnamed Patient"}</b>
                    </td>

                    <td style={tdStyle}>
                      {patient.mobile || patient.phone || "-"}
                    </td>

                    <td style={tdStyle}>
                      {patient.doctor || "-"}
                    </td>

                    <td style={tdStyle}>
                      {patient.created_at
                        ? new Date(patient.created_at).toLocaleDateString(
                            "en-IN"
                          )
                        : "-"}
                    </td>

                    <td style={tdStyle}>
                      <div
                        style={{
                          display: "flex",
                          gap: "7px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          onClick={() => openPatient(patient)}
                          style={{
                            border: "none",
                            borderRadius: "7px",
                            padding: "8px 11px",
                            background: "#2563eb",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          New Visit
                        </button>

                        <button
                          onClick={() => deletePatient(patient.id)}
                          style={{
                            border: "none",
                            borderRadius: "7px",
                            padding: "8px 11px",
                            background: "#dc2626",
                            color: "#fff",
                            cursor: "pointer",
                            fontWeight: "600",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

const thStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #dbe3ec",
  fontSize: "14px",
  color: "#334155",
};

const tdStyle = {
  padding: "13px 12px",
  borderBottom: "1px solid #edf1f5",
  fontSize: "14px",
};
