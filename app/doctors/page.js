"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../lib/supabase";

const EMPTY_DOCTOR = {
  name: "",
  qualification: "",
  specialization: "",
  registration_no: "",
  mobile: "",
  clinic: "",
  address: "",
  active: true,
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [doctor, setDoctor] = useState(EMPTY_DOCTOR);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------------
  // LOAD DOCTORS FROM SUPABASE
  // --------------------------------------------------

  useEffect(() => {
    loadDoctors();
  }, []);

  async function loadDoctors() {
    setLoading(true);
    setError("");

    try {
      const { data, error: dbError } = await supabase
        .from("doctors")
        .select("*")
        .order("name", { ascending: true });

      if (dbError) {
        console.error("Supabase doctor load error:", dbError);
        throw dbError;
      }

      const supabaseDoctors = Array.isArray(data) ? data : [];

      setDoctors(supabaseDoctors);
    } catch (err) {
      console.error(err);

      setDoctors([]);

      setError(
        "Supabase se doctors load nahi ho paaye. Connection aur RLS policies check karein."
      );
    } finally {
      setLoading(false);
    }
  }

  // --------------------------------------------------
  // OPEN NEW DOCTOR
  // --------------------------------------------------

  function openNewDoctor() {
    setEditingId(null);

    setDoctor({
      ...EMPTY_DOCTOR,
    });

    setError("");
    setShowModal(true);
  }

  // --------------------------------------------------
  // EDIT DOCTOR
  // --------------------------------------------------

  function openEditDoctor(item) {
    setEditingId(item.id);

    setDoctor({
      name: item.name || "",
      qualification: item.qualification || "",
      specialization: item.specialization || "",
      registration_no:
        item.registration_no ||
        item.registrationNo ||
        "",
      mobile: item.mobile || "",
      clinic: item.clinic || "",
      address: item.address || "",
      active:
        item.active === undefined
          ? true
          : Boolean(item.active),
    });

    setError("");
    setShowModal(true);
  }

  // --------------------------------------------------
  // SAVE / UPDATE DOCTOR
  // --------------------------------------------------

  async function saveDoctor() {
    if (!doctor.name.trim()) {
      alert("Doctor name enter karein.");
      return;
    }

    setSaving(true);
    setError("");

    try {
      if (editingId) {
        // UPDATE EXISTING DOCTOR
        const { data, error: updateError } =
          await supabase
            .from("doctors")
            .update({
              name: doctor.name.trim(),
              qualification:
                doctor.qualification.trim(),
              specialization:
                doctor.specialization.trim(),
              registration_no:
                doctor.registration_no.trim(),
              mobile: doctor.mobile.trim(),
              clinic: doctor.clinic.trim(),
              address: doctor.address.trim(),
              active: doctor.active,
            })
            .eq("id", editingId)
            .select("*")
            .single();

        if (updateError) {
          throw updateError;
        }

        setDoctors((previous) =>
          previous.map((item) =>
            item.id === editingId ? data : item
          )
        );
      } else {
        // INSERT NEW DOCTOR
        const { data, error: insertError } =
          await supabase
            .from("doctors")
            .insert({
              name: doctor.name.trim(),
              qualification:
                doctor.qualification.trim(),
              specialization:
                doctor.specialization.trim(),
              registration_no:
                doctor.registration_no.trim(),
              mobile: doctor.mobile.trim(),
              clinic: doctor.clinic.trim(),
              address: doctor.address.trim(),
              active: doctor.active,
            })
            .select("*")
            .single();

        if (insertError) {
          throw insertError;
        }

        setDoctors((previous) =>
          [...previous, data].sort((a, b) =>
            (a.name || "").localeCompare(
              b.name || ""
            )
          )
        );
      }

      setShowModal(false);
      setEditingId(null);
      setDoctor({
        ...EMPTY_DOCTOR,
      });
    } catch (err) {
      console.error("Save doctor error:", err);

      setError(
        err?.message ||
          "Doctor save nahi ho paaya."
      );

      alert(
        "Doctor save nahi hua.\n\n" +
          (err?.message || "Unknown error")
      );
    } finally {
      setSaving(false);
    }
  }

  // --------------------------------------------------
  // DELETE DOCTOR
  // --------------------------------------------------

  async function deleteDoctor(id) {
    const item = doctors.find(
      (doctor) => doctor.id === id
    );

    if (!item) return;

    const ok = confirm(
      `Kya "${item.name}" doctor delete karna hai?`
    );

    if (!ok) return;

    try {
      const { error: deleteError } =
        await supabase
          .from("doctors")
          .delete()
          .eq("id", id);

      if (deleteError) {
        throw deleteError;
      }

      const updated = doctors.filter(
        (doctor) => doctor.id !== id
      );

      setDoctors(updated);
    } catch (err) {
      console.error(
        "Delete doctor error:",
        err
      );

      alert(
        "Doctor delete nahi hua.\n\n" +
          (err?.message || "Unknown error")
      );
    }
  }

  // --------------------------------------------------
  // SEARCH
  // --------------------------------------------------

  const filteredDoctors = useMemo(() => {
    const query = search
      .trim()
      .toLowerCase();

    if (!query) return doctors;

    return doctors.filter((item) => {
      const text = [
        item.name,
        item.qualification,
        item.specialization,
        item.registration_no,
        item.registrationNo,
        item.mobile,
        item.clinic,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [doctors, search]);

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="doctorPage">
      <header className="pageHeader">
        <div>
          <h1>Doctors</h1>
          <p>
            Referring doctors manage karein
          </p>
        </div>

        <button
          className="primaryButton"
          onClick={openNewDoctor}
        >
          + New Doctor
        </button>
      </header>

      {error && (
        <div className="errorBox">
          ⚠️ {error}
        </div>
      )}

      <div className="doctorToolbar">
        <input
          type="text"
          placeholder="Search doctor..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <button
          className="primaryButton"
          onClick={openNewDoctor}
        >
          + Add Doctor
        </button>
      </div>

      {loading ? (
        <div className="emptyBox">
          <div className="loader"></div>
          <p>Doctors load ho rahe hain...</p>
        </div>
      ) : filteredDoctors.length === 0 ? (
        <div className="emptyBox">
          <div className="emptyIcon">👨‍⚕️</div>

          <h3>
            {search
              ? "Doctor nahi mila"
              : "Abhi koi doctor nahi hai"}
          </h3>

          <p>
            {search
              ? "Search change karke dekhein."
              : "New Doctor button se doctor add karein."}
          </p>

          {!search && (
            <button
              className="primaryButton"
              onClick={openNewDoctor}
            >
              + Add First Doctor
            </button>
          )}
        </div>
      ) : (
        <div className="doctorGrid">
          {filteredDoctors.map((item) => (
            <div
              className="doctorCard"
              key={item.id}
            >
              <div className="doctorAvatar">
                {(item.name || "D")
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <h3>
                Dr. {item.name}
              </h3>

              <p className="qualification">
                {item.qualification ||
                  "Doctor"}
              </p>

              <p>
                {item.specialization ||
                  "General"}
              </p>

              <div className="doctorInfo">
                <span>
                  📱{" "}
                  {item.mobile || "-"}
                </span>

                <span>
                  Reg. No:{" "}
                  {item.registration_no ||
                    item.registrationNo ||
                    "-"}
                </span>

                <span>
                  🏥{" "}
                  {item.clinic || "-"}
                </span>

                {item.address && (
                  <span>
                    📍 {item.address}
                  </span>
                )}
              </div>

              <div className="status">
                <span
                  className={
                    item.active
                      ? "active"
                      : "inactive"
                  }
                >
                  {item.active
                    ? "Active"
                    : "Inactive"}
                </span>
              </div>

              <div className="doctorActions">
                <button
                  className="editButton"
                  onClick={() =>
                    openEditDoctor(item)
                  }
                >
                  Edit
                </button>

                <button
                  className="deleteButton"
                  onClick={() =>
                    deleteDoctor(item.id)
                  }
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* =========================================
          DOCTOR MODAL
          ========================================= */}

      {showModal && (
        <div
          className="modal"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) {
              setShowModal(false);
            }
          }}
        >
          <div className="modalBox">
            <div className="modalTitle">
              <div>
                <h2>
                  {editingId
                    ? "Edit Doctor"
                    : "New Doctor"}
                </h2>

                <p>
                  Doctor ki information enter karein
                </p>
              </div>

              <button
                className="closeButton"
                onClick={() =>
                  setShowModal(false)
                }
              >
                ×
              </button>
            </div>

            <div className="form">
              <label>
                Doctor Name *
                <input
                  type="text"
                  value={doctor.name}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      name: e.target.value,
                    })
                  }
                  placeholder="Dr. Ranjeet Banjare"
                />
              </label>

              <label>
                Qualification
                <input
                  type="text"
                  value={
                    doctor.qualification
                  }
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      qualification:
                        e.target.value,
                    })
                  }
                  placeholder="MBBS, MD"
                />
              </label>

              <label>
                Specialization
                <input
                  type="text"
                  value={
                    doctor.specialization
                  }
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      specialization:
                        e.target.value,
                    })
                  }
                  placeholder="Medicine"
                />
              </label>

              <label>
                Registration No.
                <input
                  type="text"
                  value={
                    doctor.registration_no
                  }
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      registration_no:
                        e.target.value,
                    })
                  }
                  placeholder="Registration number"
                />
              </label>

              <label>
                Mobile
                <input
                  type="tel"
                  value={doctor.mobile}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      mobile:
                        e.target.value,
                    })
                  }
                  placeholder="Mobile number"
                />
              </label>

              <label>
                Clinic / Hospital
                <input
                  type="text"
                  value={doctor.clinic}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      clinic:
                        e.target.value,
                    })
                  }
                  placeholder="Clinic / Hospital name"
                />
              </label>

              <label className="full">
                Address
                <textarea
                  rows="3"
                  value={doctor.address}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      address:
                        e.target.value,
                    })
                  }
                  placeholder="Doctor address"
                />
              </label>

              <label className="activeCheck">
                <input
                  type="checkbox"
                  checked={doctor.active}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      active:
                        e.target.checked,
                    })
                  }
                />

                <span>
                  Doctor Active
                </span>
              </label>
            </div>

            <div className="footer">
              <button
                className="cancelButton"
                onClick={() =>
                  setShowModal(false)
                }
                disabled={saving}
              >
                Cancel
              </button>

              <button
                className="saveButton"
                onClick={saveDoctor}
                disabled={saving}
              >
                {saving
                  ? "Saving..."
                  : editingId
                  ? "Update Doctor"
                  : "Save Doctor"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================
          STYLES
          ========================================= */}

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
          background: #f5f8fb;
        }

        .doctorPage {
          min-height: 100vh;
          padding: 25px;
        }

        .pageHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 15px;
          background: white;
          padding: 20px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .pageHeader h1 {
          margin: 0;
          font-size: 28px;
          color: #172033;
        }

        .pageHeader p {
          margin: 5px 0 0;
          color: #718096;
        }

        button {
          border: 0;
          border-radius: 8px;
          padding: 10px 15px;
          cursor: pointer;
          font-size: 14px;
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .primaryButton {
          background: #0f9d9a;
          color: white;
          font-weight: bold;
        }

        .primaryButton:hover {
          background: #087f7c;
        }

        .errorBox {
          background: #fff1f2;
          color: #b91c1c;
          border: 1px solid #fecdd3;
          padding: 12px 15px;
          border-radius: 10px;
          margin-bottom: 15px;
          font-size: 13px;
        }

        .doctorToolbar {
          background: white;
          padding: 14px;
          display: flex;
          gap: 10px;
          border-radius: 12px;
          margin-bottom: 15px;
        }

        .doctorToolbar input {
          flex: 1;
          min-width: 0;
          padding: 11px;
          border: 1px solid #d8e0e7;
          border-radius: 8px;
          outline: none;
        }

        .doctorToolbar input:focus {
          border-color: #0f9d9a;
        }

        .doctorGrid {
          display: grid;
          grid-template-columns:
            repeat(
              auto-fill,
              minmax(260px, 1fr)
            );
          gap: 15px;
        }

        .doctorCard {
          background: white;
          padding: 18px;
          border: 1px solid #e1e7eb;
          border-radius: 14px;
        }

        .doctorAvatar {
          width: 48px;
          height: 48px;
          border-radius: 50%;
          background: #e6f8f7;
          color: #07817e;
          display: grid;
          place-items: center;
          font-size: 20px;
          font-weight: bold;
        }

        .doctorCard h3 {
          margin: 12px 0 4px;
          color: #172033;
        }

        .doctorCard p {
          margin: 4px 0;
          color: #64748b;
          font-size: 13px;
        }

        .qualification {
          font-weight: bold;
        }

        .doctorInfo {
          margin-top: 15px;
          display: grid;
          gap: 7px;
          font-size: 12px;
          color: #475569;
        }

        .status {
          margin-top: 12px;
        }

        .status span {
          display: inline-block;
          padding: 4px 9px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: bold;
        }

        .status .active {
          background: #dcfce7;
          color: #15803d;
        }

        .status .inactive {
          background: #fee2e2;
          color: #b91c1c;
        }

        .doctorActions {
          margin-top: 15px;
          display: flex;
          gap: 8px;
        }

        .editButton {
          background: #e0f2fe;
          color: #0369a1;
        }

        .deleteButton {
          background: #fee2e2;
          color: #b91c1c;
        }

        .emptyBox {
          background: white;
          border-radius: 14px;
          padding: 50px 20px;
          text-align: center;
          border: 1px solid #e1e7eb;
        }

        .emptyIcon {
          font-size: 45px;
          margin-bottom: 10px;
        }

        .emptyBox h3 {
          margin: 5px 0;
          color: #172033;
        }

        .emptyBox p {
          color: #718096;
          margin-bottom: 20px;
        }

        .loader {
          width: 35px;
          height: 35px;
          border: 4px solid #dceeee;
          border-top-color: #0f9d9a;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin: 0 auto 15px;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(
            15,
            23,
            42,
            0.55
          );
          display: grid;
          place-items: center;
          padding: 15px;
          z-index: 1000;
        }

        .modalBox {
          width: min(700px, 100%);
          max-height: 90vh;
          overflow: auto;
          background: white;
          padding: 20px;
          border-radius: 15px;
          box-shadow:
            0 20px 60px
              rgba(0, 0, 0, 0.2);
        }

        .modalTitle {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 15px;
        }

        .modalTitle h2 {
          margin: 0;
          color: #172033;
        }

        .modalTitle p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 13px;
        }

        .closeButton {
          font-size: 25px;
          background: #f1f5f9;
          color: #334155;
          width: 40px;
          height: 40px;
          padding: 0;
        }

        .form {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
          margin-top: 22px;
        }

        .form label {
          font-size: 12px;
          font-weight: bold;
          color: #334155;
        }

        .form input,
        .form textarea {
          width: 100%;
          margin-top: 6px;
          padding: 11px;
          border: 1px solid #d8e0e7;
          border-radius: 8px;
          outline: none;
          font-family: inherit;
          font-size: 14px;
        }

        .form input:focus,
        .form textarea:focus {
          border-color: #0f9d9a;
        }

        .full {
          grid-column: span 2;
        }

        .activeCheck {
          display: flex !important;
          align-items: center;
          gap: 8px;
        }

        .activeCheck input {
          width: auto;
          margin: 0;
        }

        .footer {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 22px;
        }

        .cancelButton {
          background: #e2e8f0;
          color: #334155;
        }

        .saveButton {
          background: #0f9d9a;
          color: white;
          font-weight: bold;
        }

        @media (max-width: 600px) {
          .doctorPage {
            padding: 10px;
          }

          .pageHeader {
            padding: 15px;
          }

          .pageHeader h1 {
            font-size: 23px;
          }

          .doctorToolbar {
            flex-direction: column;
          }

          .doctorToolbar input {
            width: 100%;
          }

          .form {
            grid-template-columns: 1fr;
          }

          .full {
            grid-column: auto;
          }

          .doctorGrid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
