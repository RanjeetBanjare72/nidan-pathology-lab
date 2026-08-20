"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function NewPatientPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    name: "",
    age: "",
    gender: "",
    mobile: "",
    doctor: "",
    address: "",
  });

  const [doctors, setDoctors] = useState([]);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoadingDoctors(true);

    try {
      const { data, error } = await supabase
        .from("doctors")
        .select("id,name,qualification,specialization,active")
        .eq("active", true)
        .order("name", { ascending: true });

      if (error) throw error;
      setDoctors(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Doctor load error:", error);
      setDoctors([]);
    } finally {
      setLoadingDoctors(false);
    }
  }

  function handleChange(e) {
    const { name, value } = e.target;

    setForm((old) => ({
      ...old,
      [name]: value,
    }));
  }

  async function savePatient(e) {
    e.preventDefault();

    if (!form.name.trim()) {
      alert("Patient name enter karein.");
      return;
    }

    setLoading(true);

    const patientId =
      "NPL-" + Date.now().toString().slice(-8);

    // IMPORTANT:
    // Supabase patients table uses `referring_doctor`,
    // not `doctor`. The old code was inserting into the
    // non-existent `doctor` column and caused the error:
    // "Could not find the 'doctor' column..."
    const { data, error } = await supabase
      .from("patients")
      .insert([
        {
          patient_id: patientId,
          name: form.name.trim(),
          age: form.age ? Number(form.age) : null,
          gender: form.gender || null,
          mobile: form.mobile.trim() || null,
          referring_doctor: form.doctor.trim() || null,
          address: form.address.trim() || null,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Patient save error:", error);
      alert("Patient save nahi hua:\n" + error.message);
      setLoading(false);
      return;
    }

    localStorage.setItem("nidanPatient", JSON.stringify(data));
    localStorage.setItem("nidanCurrentPatientId", data.patient_id || patientId);

    // Do not show a blocking success alert. Continue directly
    // to the patient list so the workflow does not get stuck.
    router.push("/patients");
    router.refresh();
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f4f7fb",
        fontFamily: "Arial, sans-serif",
        color: "#172033",
      }}
    >
      <header
        style={{
          background: "#0f766e",
          color: "#fff",
          padding: "18px 20px",
        }}
      >
        <div style={{ maxWidth: "900px", margin: "auto" }}>
          <div style={{ fontSize: "22px", fontWeight: "700" }}>
            NIDAN PATHOLOGY LAB
          </div>
          <div style={{ fontSize: "13px", marginTop: "4px" }}>
            New Patient Registration
          </div>
        </div>
      </header>

      <main
        style={{
          maxWidth: "900px",
          margin: "auto",
          padding: "20px",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: "14px",
            padding: "22px",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: "10px",
              flexWrap: "wrap",
              marginBottom: "20px",
            }}
          >
            <div>
              <h1 style={{ margin: 0, fontSize: "25px" }}>
                Patient Registration
              </h1>
              <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                Naya patient record create karein
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push("/patients")}
              style={{
                border: "1px solid #cbd5e1",
                background: "#fff",
                borderRadius: "8px",
                padding: "10px 15px",
                cursor: "pointer",
              }}
            >
              ← Back
            </button>
          </div>

          <form onSubmit={savePatient}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                gap: "16px",
              }}
            >
              <div>
                <label style={labelStyle}>Patient Name *</label>
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Patient name"
                  style={inputStyle}
                  required
                />
              </div>

              <div>
                <label style={labelStyle}>Age</label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  max="150"
                  value={form.age}
                  onChange={handleChange}
                  placeholder="Age"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Gender</label>
                <select
                  name="gender"
                  value={form.gender}
                  onChange={handleChange}
                  style={inputStyle}
                >
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label style={labelStyle}>Mobile Number</label>
                <input
                  name="mobile"
                  type="tel"
                  value={form.mobile}
                  onChange={handleChange}
                  placeholder="Mobile number"
                  maxLength="15"
                  style={inputStyle}
                />
              </div>

              <div>
                <label style={labelStyle}>Referring Doctor</label>
                <select
                  name="doctor"
                  value={form.doctor}
                  onChange={handleChange}
                  style={inputStyle}
                  disabled={loadingDoctors}
                >
                  <option value="">
                    {loadingDoctors
                      ? "Loading doctors..."
                      : doctors.length
                        ? "Select Referring Doctor"
                        : "No active doctor found"}
                  </option>

                  {doctors.map((doctor) => (
                    <option key={doctor.id} value={doctor.name}>
                      Dr. {doctor.name}
                      {doctor.qualification
                        ? ` • ${doctor.qualification}`
                        : ""}
                    </option>
                  ))}
                </select>

                {!loadingDoctors && doctors.length === 0 && (
                  <button
                    type="button"
                    onClick={() => router.push("/doctors")}
                    style={smallLinkButton}
                  >
                    + Add Doctor
                  </button>
                )}
              </div>

              <div>
                <label style={labelStyle}>Address</label>
                <input
                  name="address"
                  value={form.address}
                  onChange={handleChange}
                  placeholder="Patient address"
                  style={inputStyle}
                />
              </div>
            </div>

            <div
              style={{
                marginTop: "25px",
                paddingTop: "20px",
                borderTop: "1px solid #e2e8f0",
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                disabled={loading}
                style={{
                  border: "none",
                  borderRadius: "9px",
                  padding: "13px 22px",
                  background: loading ? "#94a3b8" : "#0f766e",
                  color: "#fff",
                  fontWeight: "700",
                  fontSize: "15px",
                  cursor: loading ? "not-allowed" : "pointer",
                }}
              >
                {loading ? "Saving..." : "✓ Register Patient & Continue"}
              </button>

              <button
                type="button"
                onClick={() => router.push("/patients")}
                style={cancelButtonStyle}
                disabled={loading}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "7px",
  fontSize: "14px",
  fontWeight: "600",
  color: "#334155",
};

const inputStyle = {
  width: "100%",
  boxSizing: "border-box",
  padding: "12px 13px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "15px",
  background: "#fff",
  outline: "none",
};

const smallLinkButton = {
  marginTop: "7px",
  border: "none",
  background: "transparent",
  color: "#0f766e",
  fontWeight: "700",
  padding: "0",
  cursor: "pointer",
};

const cancelButtonStyle = {
  border: "1px solid #cbd5e1",
  borderRadius: "9px",
  padding: "13px 22px",
  background: "#fff",
  color: "#334155",
  fontWeight: "600",
  cursor: "pointer",
};
