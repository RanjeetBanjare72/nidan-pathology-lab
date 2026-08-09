"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const KEY = "nidanDoctors";

const blankDoctor = {
  id: "",
  name: "",
  qualification: "",
  specialization: "",
  registrationNo: "",
  mobile: "",
  clinic: "",
  address: "",
  active: true,
};

export default function DoctorsPage() {

  const router = useRouter();

  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [doctor, setDoctor] =
    useState(blankDoctor);
  const [editing, setEditing] =
    useState(null);
  const [show, setShow] =
    useState(false);

  useEffect(() => {
    load();
  }, []);

  function load() {
    try {
      setDoctors(
        JSON.parse(
          localStorage.getItem(KEY) || "[]"
        )
      );
    } catch {
      setDoctors([]);
    }
  }

  function save(data) {
    localStorage.setItem(
      KEY,
      JSON.stringify(data)
    );
    setDoctors(data);
  }

  function addDoctor() {
    setEditing(null);

    setDoctor({
      ...blankDoctor,
      id: `DOC-${Date.now()}`,
    });

    setShow(true);
  }

  function editDoctor(item) {
    setEditing(item.id);
    setDoctor({
      ...blankDoctor,
      ...item,
    });
    setShow(true);
  }

  function saveDoctor() {

    if (!doctor.name.trim()) {
      alert("Doctor name enter karein.");
      return;
    }

    const finalDoctor = {
      ...doctor,
      updatedAt:
        new Date().toISOString(),
    };

    let updated;

    if (editing) {
      updated = doctors.map((x) =>
        x.id === editing
          ? finalDoctor
          : x
      );
    } else {
      updated = [
        ...doctors,
        {
          ...finalDoctor,
          createdAt:
            new Date().toISOString(),
        },
      ];
    }

    save(updated);

    setShow(false);
    setDoctor(blankDoctor);
    setEditing(null);
  }

  function deleteDoctor(id) {

    if (
      !confirm(
        "Kya doctor delete karna hai?"
      )
    ) {
      return;
    }

    save(
      doctors.filter(
        (x) => x.id !== id
      )
    );
  }

  const filtered = doctors.filter(
    (x) =>
      `${x.name} ${x.specialization} ${x.registrationNo}`
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  return (
    <div className="doctorPage">

      <header>
        <div>
          <h1>Doctors</h1>
          <p>
            Referring doctors manage karein
          </p>
        </div>

        <button onClick={addDoctor}>
          + New Doctor
        </button>
      </header>

      <div className="doctorToolbar">

        <input
          placeholder="Search doctor..."
          value={search}
          onChange={(e) =>
            setSearch(e.target.value)
          }
        />

        <button onClick={addDoctor}>
          + Add Doctor
        </button>

      </div>

      <div className="doctorGrid">

        {filtered.map((item) => (

          <div
            className="doctorCard"
            key={item.id}
          >

            <div className="doctorAvatar">
              {item.name
                .charAt(0)
                .toUpperCase()}
            </div>

            <h3>
              Dr. {item.name}
            </h3>

            <p>
              {item.qualification ||
                "Doctor"}
            </p>

            <p>
              {item.specialization ||
                "General"}
            </p>

            <div className="doctorInfo">
              <span>
                📱 {item.mobile || "-"}
              </span>

              <span>
                Reg. No:{" "}
                {item.registrationNo ||
                  "-"}
              </span>

              <span>
                🏥 {item.clinic || "-"}
              </span>
            </div>

            <div className="doctorActions">

              <button
                onClick={() =>
                  editDoctor(item)
                }
              >
                Edit
              </button>

              <button
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

      {show && (

        <div className="modal">

          <div className="box">

            <div className="modalTitle">
              <h2>
                {editing
                  ? "Edit Doctor"
                  : "New Doctor"}
              </h2>

              <button
                onClick={() =>
                  setShow(false)
                }
              >
                ×
              </button>
            </div>

            <div className="form">

              <label>
                Doctor Name *
                <input
                  value={doctor.name}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      name: e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Qualification
                <input
                  placeholder="MBBS, MD"
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
                />
              </label>

              <label>
                Specialization
                <input
                  placeholder="Medicine"
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
                />
              </label>

              <label>
                Registration No.
                <input
                  value={
                    doctor.registrationNo
                  }
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      registrationNo:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Mobile
                <input
                  value={doctor.mobile}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      mobile:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label>
                Clinic / Hospital
                <input
                  value={doctor.clinic}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      clinic:
                        e.target.value,
                    })
                  }
                />
              </label>

              <label className="full">
                Address
                <textarea
                  value={doctor.address}
                  onChange={(e) =>
                    setDoctor({
                      ...doctor,
                      address:
                        e.target.value,
                    })
                  }
                />
              </label>

            </div>

            <div className="footer">

              <button
                onClick={() =>
                  setShow(false)
                }
              >
                Cancel
              </button>

              <button
                className="save"
                onClick={saveDoctor}
              >
                {editing
                  ? "Update Doctor"
                  : "Save Doctor"}
              </button>

            </div>

          </div>

        </div>

      )}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        body {
          margin: 0;
          font-family: Arial,sans-serif;
          background: #f5f8fb;
        }

        .doctorPage {
          min-height: 100vh;
          padding: 25px;
        }

        .doctorPage header {
          display:flex;
          justify-content:space-between;
          align-items:center;
          background:white;
          padding:20px;
          border-radius:12px;
          margin-bottom:15px;
        }

        .doctorPage h1 {
          margin:0;
        }

        .doctorPage header p {
          color:#718096;
        }

        .doctorPage button {
          border:0;
          border-radius:8px;
          padding:10px 15px;
          cursor:pointer;
        }

        .doctorPage header button,
        .doctorToolbar button,
        .save {
          background:#0f9d9a;
          color:white;
          font-weight:bold;
        }

        .doctorToolbar {
          background:white;
          padding:14px;
          display:flex;
          gap:10px;
          border-radius:12px;
          margin-bottom:15px;
        }

        .doctorToolbar input {
          flex:1;
          padding:11px;
          border:1px solid #d8e0e7;
          border-radius:8px;
        }

        .doctorGrid {
          display:grid;
          grid-template-columns:
            repeat(auto-fill,minmax(260px,1fr));
          gap:15px;
        }

        .doctorCard {
          background:white;
          padding:18px;
          border:1px solid #e1e7eb;
          border-radius:14px;
        }

        .doctorAvatar {
          width:48px;
          height:48px;
          border-radius:50%;
          background:#e6f8f7;
          color:#07817e;
          display:grid;
          place-items:center;
          font-size:20px;
          font-weight:bold;
        }

        .doctorCard h3 {
          margin-bottom:4px;
        }

        .doctorCard p {
          margin:4px 0;
          color:#64748b;
          font-size:13px;
        }

        .doctorInfo {
          margin-top:15px;
          display:grid;
          gap:7px;
          font-size:12px;
          color:#475569;
        }

        .doctorActions {
          margin-top:15px;
          display:flex;
          gap:8px;
        }

        .doctorActions button:first-child {
          background:#e0f2fe;
          color:#0369a1;
        }

        .doctorActions button:last-child {
          background:#fee2e2;
          color:#b91c1c;
        }

        .modal {
          position:fixed;
          inset:0;
          background:rgba(15,23,42,.55);
          display:grid;
          place-items:center;
          padding:15px;
          z-index:1000;
        }

        .box {
          width:min(700px,100%);
          max-height:90vh;
          overflow:auto;
          background:white;
          padding:20px;
          border-radius:15px;
        }

        .modalTitle {
          display:flex;
          justify-content:space-between;
          align-items:center;
        }

        .modalTitle button {
          font-size:22px;
        }

        .form {
          display:grid;
          grid-template-columns:1fr 1fr;
          gap:12px;
          margin-top:20px;
        }

        .form label {
          font-size:12px;
          font-weight:bold;
        }

        .form input,
        .form textarea {
          width:100%;
          margin-top:5px;
          padding:10px;
          border:1px solid #d8e0e7;
          border-radius:8px;
        }

        .full {
          grid-column:span 2;
        }

        .footer {
          display:flex;
          justify-content:flex-end;
          gap:10px;
          margin-top:20px;
        }

        @media(max-width:600px) {
          .doctorPage {
            padding:10px;
          }

          .form {
            grid-template-columns:1fr;
          }

          .full {
            grid-column:auto;
          }

          .doctorPage header {
            align-items:flex-start;
            gap:10px;
          }
        }

      `}</style>

    </div>
  );
}
