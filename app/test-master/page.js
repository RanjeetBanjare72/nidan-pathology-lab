"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const STORAGE_KEY = "nidanTestMaster";

const emptyParameter = {
  name: "",
  unit: "",
  min: "",
  max: "",
  range: "",
  options: "",
};

const emptyTest = {
  id: "",
  name: "",
  short: "",
  category: "Hematology",
  department: "Laboratory",
  sampleType: "Blood",
  price: "",
  method: "",
  active: true,
  parameters: [],
};

export default function TestMasterPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [test, setTest] = useState(emptyTest);

  useEffect(() => {
    loadTests();
  }, []);

  function loadTests() {
    try {
      const data = JSON.parse(
        localStorage.getItem(STORAGE_KEY) || "[]"
      );

      setTests(Array.isArray(data) ? data : []);
    } catch {
      setTests([]);
    }
  }

  function saveTests(data) {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(data)
    );

    setTests(data);
  }

  function openNewTest() {
    setEditingId(null);

    setTest({
      ...emptyTest,
      id: `TEST-${Date.now()}`,
      parameters: [],
    });

    setShowForm(true);
  }

  function editTest(item) {
    setEditingId(item.id);

    setTest({
      ...emptyTest,
      ...item,
      parameters: item.parameters || item.tests || [],
    });

    setShowForm(true);
  }

  function deleteTest(id) {
    const ok = window.confirm(
      "Kya aap ye test delete karna chahte hain?"
    );

    if (!ok) return;

    const updated = tests.filter(
      (item) => item.id !== id
    );

    saveTests(updated);
  }

  function toggleActive(id) {
    const updated = tests.map((item) =>
      item.id === id
        ? {
            ...item,
            active: item.active === false,
          }
        : item
    );

    saveTests(updated);
  }

  function addParameter() {
    setTest((prev) => ({
      ...prev,
      parameters: [
        ...(prev.parameters || []),
        {
          ...emptyParameter,
        },
      ],
    }));
  }

  function updateParameter(index, field, value) {
    setTest((prev) => {
      const parameters = [...prev.parameters];

      parameters[index] = {
        ...parameters[index],
        [field]: value,
      };

      return {
        ...prev,
        parameters,
      };
    });
  }

  function removeParameter(index) {
    setTest((prev) => ({
      ...prev,
      parameters: prev.parameters.filter(
        (_, i) => i !== index
      ),
    }));
  }

  function saveTest() {
    if (!test.name.trim()) {
      alert("Test Name enter karein.");
      return;
    }

    if (!test.short.trim()) {
      alert("Short Name enter karein.");
      return;
    }

    if (!test.price) {
      alert("Test Price enter karein.");
      return;
    }

    if (!test.parameters.length) {
      alert("Kam se kam 1 parameter add karein.");
      return;
    }

    const cleanParameters =
      test.parameters.map((p) => ({
        ...p,
        name: p.name.trim(),
        unit: p.unit.trim(),
        min: p.min,
        max: p.max,
        range:
          p.range ||
          (p.min !== "" && p.max !== ""
            ? `${p.min} - ${p.max}`
            : ""),
        options: p.options
          ? p.options
              .split(",")
              .map((x) => x.trim())
              .filter(Boolean)
          : [],
      }));

    const finalTest = {
      ...test,
      parameters: cleanParameters,
      tests: cleanParameters,
      price: Number(test.price),
      updatedAt: new Date().toISOString(),
    };

    let updated;

    if (editingId) {
      updated = tests.map((item) =>
        item.id === editingId
          ? finalTest
          : item
      );
    } else {
      updated = [
        ...tests,
        {
          ...finalTest,
          createdAt:
            new Date().toISOString(),
        },
      ];
    }

    saveTests(updated);

    setShowForm(false);
    setEditingId(null);
    setTest(emptyTest);
  }

  const filteredTests = tests.filter((item) =>
    `${item.name} ${item.short} ${item.category}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app">

      {/* SIDEBAR */}

      <aside className="sidebar">

        <div className="brand">
          <div className="logo">N+</div>

          <div>
            <b>NIDAN</b>
            <small>PATHOLOGY LAB</small>
          </div>
        </div>

        <div className="menuTitle">
          MAIN MENU
        </div>

        <button onClick={() => router.push("/")}>
          ⌂ Dashboard
        </button>

        <button
          onClick={() =>
            router.push("/patients")
          }
        >
          ♙ Patients
        </button>

        <button
          onClick={() =>
            router.push("/billing")
          }
        >
          ₹ Billing
        </button>

        <button
          onClick={() =>
            router.push("/result")
          }
        >
          ✎ Result Entry
        </button>

        <button
          onClick={() =>
            router.push("/reports")
          }
        >
          ▤ Reports
        </button>

        <div className="menuTitle">
          MANAGEMENT
        </div>

        <button className="active">
          🧪 Test Master
        </button>

        <button
          onClick={() =>
            router.push("/doctors")
          }
        >
          ⚕ Doctors
        </button>

        <button
          onClick={() =>
            router.push("/settings")
          }
        >
          ⚙ Settings
        </button>

      </aside>

      {/* MAIN */}

      <main className="main">

        <header className="topbar">
          <div>
            <h2>Test Master</h2>
            <p>
              Laboratory tests and parameters
              manage karein
            </p>
          </div>

          <button
            className="newBtn"
            onClick={openNewTest}
          >
            + New Test
          </button>
        </header>

        <section className="content">

          <div className="stats">

            <div>
              <small>Total Tests</small>
              <strong>{tests.length}</strong>
            </div>

            <div>
              <small>Active Tests</small>
              <strong>
                {
                  tests.filter(
                    (x) => x.active !== false
                  ).length
                }
              </strong>
            </div>

            <div>
              <small>Inactive Tests</small>
              <strong>
                {
                  tests.filter(
                    (x) => x.active === false
                  ).length
                }
              </strong>
            </div>

          </div>

          <div className="toolbar">

            <input
              placeholder="Search test..."
              value={search}
              onChange={(e) =>
                setSearch(e.target.value)
              }
            />

            <button onClick={openNewTest}>
              + Add New Test
            </button>

          </div>

          <div className="tableCard">

            <table>

              <thead>
                <tr>
                  <th>Test</th>
                  <th>Short</th>
                  <th>Category</th>
                  <th>Sample</th>
                  <th>Price</th>
                  <th>Parameters</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {filteredTests.map((item) => (

                  <tr key={item.id}>

                    <td>
                      <strong>
                        {item.name}
                      </strong>
                    </td>

                    <td>{item.short}</td>

                    <td>{item.category}</td>

                    <td>{item.sampleType}</td>

                    <td>
                      ₹{item.price}
                    </td>

                    <td>
                      {
                        (
                          item.parameters ||
                          item.tests ||
                          []
                        ).length
                      }
                    </td>

                    <td>
                      <span
                        className={
                          item.active === false
                            ? "inactive"
                            : "active"
                        }
                      >
                        {item.active === false
                          ? "Inactive"
                          : "Active"}
                      </span>
                    </td>

                    <td>

                      <button
                        className="edit"
                        onClick={() =>
                          editTest(item)
                        }
                      >
                        Edit
                      </button>

                      <button
                        className="toggle"
                        onClick={() =>
                          toggleActive(item.id)
                        }
                      >
                        {item.active === false
                          ? "Activate"
                          : "Disable"}
                      </button>

                      <button
                        className="delete"
                        onClick={() =>
                          deleteTest(item.id)
                        }
                      >
                        Delete
                      </button>

                    </td>

                  </tr>

                ))}

                {filteredTests.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="empty"
                    >
                      No tests found.
                    </td>
                  </tr>
                )}

              </tbody>

            </table>

          </div>

        </section>

      </main>

      {/* MODAL */}

      {showForm && (

        <div className="modal">

          <div className="modalBox">

            <div className="modalHeader">

              <div>
                <h2>
                  {editingId
                    ? "Edit Test"
                    : "Add New Test"}
                </h2>

                <p>
                  Test information and
                  reference values
                </p>
              </div>

              <button
                onClick={() =>
                  setShowForm(false)
                }
              >
                ×
              </button>

            </div>

            <div className="formGrid">

              <label>
                Test Name *
                <input
                  value={test.name}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      name: e.target.value,
                    })
                  }
                  placeholder="Complete Blood Count"
                />
              </label>

              <label>
                Short Name *
                <input
                  value={test.short}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      short: e.target.value,
                    })
                  }
                  placeholder="CBC"
                />
              </label>

              <label>
                Category
                <select
                  value={test.category}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      category:
                        e.target.value,
                    })
                  }
                >
                  <option>
                    Hematology
                  </option>
                  <option>
                    Biochemistry
                  </option>
                  <option>
                    Clinical Pathology
                  </option>
                  <option>
                    Immunology
                  </option>
                  <option>
                    Serology
                  </option>
                  <option>
                    Microbiology
                  </option>
                  <option>
                    Hormone
                  </option>
                  <option>
                    Histopathology
                  </option>
                  <option>
                    Other
                  </option>
                </select>
              </label>

              <label>
                Sample Type
                <select
                  value={test.sampleType}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      sampleType:
                        e.target.value,
                    })
                  }
                >
                  <option>Blood</option>
                  <option>Serum</option>
                  <option>Plasma</option>
                  <option>Urine</option>
                  <option>Stool</option>
                  <option>CSF</option>
                  <option>Swab</option>
                  <option>Tissue</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Price *
                <input
                  type="number"
                  value={test.price}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      price: e.target.value,
                    })
                  }
                  placeholder="300"
                />
              </label>

              <label>
                Method
                <input
                  value={test.method}
                  onChange={(e) =>
                    setTest({
                      ...test,
                      method: e.target.value,
                    })
                  }
                  placeholder="Automated / Manual"
                />
              </label>

            </div>

            {/* PARAMETERS */}

            <div className="parameterHeader">

              <div>
                <h3>
                  Test Parameters
                </h3>

                <small>
                  Result Entry में यही
                  parameters दिखाई देंगे।
                </small>
              </div>

              <button
                onClick={addParameter}
              >
                + Add Parameter
              </button>

            </div>

            <div className="parameters">

              {test.parameters.map(
                (parameter, index) => (

                  <div
                    className="parameter"
                    key={index}
                  >

                    <div className="parameterTop">
                      <strong>
                        Parameter {index + 1}
                      </strong>

                      <button
                        onClick={() =>
                          removeParameter(
                            index
                          )
                        }
                      >
                        Remove
                      </button>
                    </div>

                    <div className="parameterGrid">

                      <label>
                        Parameter Name
                        <input
                          value={
                            parameter.name
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "name",
                              e.target.value
                            )
                          }
                          placeholder="Hemoglobin"
                        />
                      </label>

                      <label>
                        Unit
                        <input
                          value={
                            parameter.unit
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "unit",
                              e.target.value
                            )
                          }
                          placeholder="g/dL"
                        />
                      </label>

                      <label>
                        Minimum
                        <input
                          type="number"
                          value={
                            parameter.min
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "min",
                              e.target.value
                            )
                          }
                          placeholder="13"
                        />
                      </label>

                      <label>
                        Maximum
                        <input
                          type="number"
                          value={
                            parameter.max
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "max",
                              e.target.value
                            )
                          }
                          placeholder="17"
                        />
                      </label>

                      <label>
                        Reference Range
                        <input
                          value={
                            parameter.range
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "range",
                              e.target.value
                            )
                          }
                          placeholder="13 - 17"
                        />
                      </label>

                      <label>
                        Options
                        <input
                          value={
                            parameter.options
                          }
                          onChange={(e) =>
                            updateParameter(
                              index,
                              "options",
                              e.target.value
                            )
                          }
                          placeholder="Positive, Negative"
                        />

                        <small>
                          Multiple options comma
                          se separate karein.
                        </small>
                      </label>

                    </div>

                  </div>

                )
              )}

            </div>

            <div className="modalFooter">

              <button
                className="cancel"
                onClick={() =>
                  setShowForm(false)
                }
              >
                Cancel
              </button>

              <button
                className="save"
                onClick={saveTest}
              >
                {editingId
                  ? "Update Test"
                  : "Save Test"}
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
          font-family: Arial, sans-serif;
          background: #f5f8fb;
          color: #172033;
        }

        .app {
          display: flex;
          min-height: 100vh;
        }

        .sidebar {
          width: 184px;
          background: #0b293d;
          color: white;
          padding: 18px 10px;
          flex-shrink: 0;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 9px;
          margin-bottom: 30px;
        }

        .logo {
          width: 36px;
          height: 36px;
          border-radius: 9px;
          background: #12a5a0;
          display: grid;
          place-items: center;
          font-weight: 900;
        }

        .brand b {
          display: block;
          font-size: 16px;
        }

        .brand small {
          display: block;
          font-size: 7px;
          opacity: .7;
        }

        .menuTitle {
          font-size: 8px;
          letter-spacing: 2px;
          opacity: .5;
          margin: 18px 8px 8px;
        }

        .sidebar button {
          width: 100%;
          border: 0;
          background: transparent;
          color: #d9e6ed;
          text-align: left;
          padding: 11px 10px;
          border-radius: 7px;
          margin-bottom: 3px;
          cursor: pointer;
          font-size: 12px;
        }

        .sidebar button:hover,
        .sidebar button.active {
          background: #123f55;
          color: white;
        }

        .main {
          flex: 1;
          min-width: 0;
        }

        .topbar {
          background: white;
          border-bottom: 1px solid #e2e8ee;
          padding: 18px 24px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .topbar h2 {
          margin: 0;
          font-size: 20px;
        }

        .topbar p {
          margin: 5px 0 0;
          color: #718096;
          font-size: 12px;
        }

        .newBtn,
        .toolbar button,
        .parameterHeader button,
        .save {
          border: 0;
          background: #0f9d9a;
          color: white;
          padding: 11px 17px;
          border-radius: 8px;
          font-weight: 700;
          cursor: pointer;
        }

        .content {
          padding: 22px;
        }

        .stats {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px;
          margin-bottom: 18px;
        }

        .stats > div {
          background: white;
          border: 1px solid #e4e9ee;
          border-radius: 12px;
          padding: 16px;
        }

        .stats small {
          display: block;
          color: #718096;
        }

        .stats strong {
          display: block;
          font-size: 25px;
          margin-top: 5px;
        }

        .toolbar {
          background: white;
          padding: 14px;
          border-radius: 12px;
          margin-bottom: 14px;
          display: flex;
          gap: 10px;
        }

        .toolbar input {
          flex: 1;
          min-width: 0;
          border: 1px solid #d8e0e6;
          border-radius: 8px;
          padding: 11px;
        }

        .tableCard {
          background: white;
          border: 1px solid #e3e8ed;
          border-radius: 12px;
          overflow-x: auto;
        }

        table {
          width: 100%;
          min-width: 850px;
          border-collapse: collapse;
        }

        th,
        td {
          padding: 13px;
          border-bottom: 1px solid #edf0f2;
          text-align: left;
          font-size: 12px;
        }

        th {
          background: #f8fafc;
          color: #64748b;
        }

        .active,
        .inactive {
          padding: 5px 8px;
          border-radius: 20px;
          font-size: 10px;
          font-weight: 700;
        }

        .active {
          background: #dcfce7;
          color: #15803d;
        }

        .inactive {
          background: #fee2e2;
          color: #b91c1c;
        }

        .edit,
        .toggle,
        .delete {
          border: 0;
          padding: 6px 8px;
          border-radius: 6px;
          margin-right: 4px;
          cursor: pointer;
          font-size: 10px;
        }

        .edit {
          background: #e0f2fe;
          color: #0369a1;
        }

        .toggle {
          background: #fef3c7;
          color: #92400e;
        }

        .delete {
          background: #fee2e2;
          color: #b91c1c;
        }

        .empty {
          text-align: center;
          padding: 40px;
          color: #718096;
        }

        .modal {
          position: fixed;
          inset: 0;
          background: rgba(15,23,42,.55);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 15px;
          z-index: 1000;
        }

        .modalBox {
          width: min(1000px, 100%);
          max-height: 92vh;
          overflow-y: auto;
          background: white;
          border-radius: 16px;
          padding: 20px;
        }

        .modalHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 20px;
        }

        .modalHeader h2 {
          margin: 0;
        }

        .modalHeader p {
          color: #718096;
          font-size: 12px;
        }

        .modalHeader > button {
          border: 0;
          background: #f1f5f9;
          border-radius: 50%;
          width: 32px;
          height: 32px;
          font-size: 20px;
          cursor: pointer;
        }

        .formGrid,
        .parameterGrid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }

        label {
          display: block;
          font-size: 11px;
          font-weight: 700;
          color: #475569;
        }

        label input,
        label select {
          width: 100%;
          margin-top: 6px;
          padding: 10px;
          border: 1px solid #d7e0e7;
          border-radius: 8px;
          outline: none;
        }

        .parameterHeader {
          margin-top: 25px;
          padding: 14px;
          background: #f8fafc;
          border-radius: 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .parameterHeader h3 {
          margin: 0 0 4px;
        }

        .parameterHeader small {
          color: #718096;
        }

        .parameter {
          margin-top: 12px;
          padding: 14px;
          border: 1px solid #dce5eb;
          border-radius: 10px;
        }

        .parameterTop {
          display: flex;
          justify-content: space-between;
          margin-bottom: 12px;
        }

        .parameterTop button {
          border: 0;
          background: #fee2e2;
          color: #b91c1c;
          padding: 5px 9px;
          border-radius: 6px;
          cursor: pointer;
        }

        label small {
          display: block;
          margin-top: 4px;
          color: #94a3b8;
          font-weight: 400;
        }

        .modalFooter {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          margin-top: 20px;
        }

        .cancel {
          border: 1px solid #d7e0e7;
          background: white;
          padding: 11px 18px;
          border-radius: 8px;
          cursor: pointer;
        }

        @media(max-width:800px) {

          .sidebar {
            display: none;
          }

          .content {
            padding: 12px;
          }

          .topbar {
            padding: 14px;
          }

          .stats {
            grid-template-columns: 1fr 1fr;
          }

          .formGrid,
          .parameterGrid {
            grid-template-columns: 1fr;
          }

        }

      `}</style>

    </div>
  );
}
