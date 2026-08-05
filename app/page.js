"use client";

import { useMemo, useState } from "react";

const TEST_PANELS = [
  {
    id: "cbc",
    name: "CBC",
    icon: "🩸",
    tests: [
      { id: "hb", name: "Hemoglobin", unit: "g/dL", low: 12, high: 17, range: "12.0 - 17.0" },
      { id: "rbc", name: "RBC Count", unit: "million/µL", low: 4, high: 6, range: "4.0 - 6.0" },
      { id: "wbc", name: "Total WBC Count", unit: "/µL", low: 4000, high: 11000, range: "4,000 - 11,000" },
      { id: "plt", name: "Platelet Count", unit: "/µL", low: 150000, high: 450000, range: "150,000 - 450,000" },
      { id: "hct", name: "Hematocrit / PCV", unit: "%", low: 36, high: 50, range: "36 - 50" },
      { id: "mcv", name: "MCV", unit: "fL", low: 80, high: 100, range: "80 - 100" },
      { id: "mch", name: "MCH", unit: "pg", low: 27, high: 33, range: "27 - 33" },
      { id: "mchc", name: "MCHC", unit: "g/dL", low: 32, high: 36, range: "32 - 36" },
      { id: "rdw", name: "RDW-CV", unit: "%", low: 11.5, high: 14.5, range: "11.5 - 14.5" },
      { id: "neut", name: "Neutrophils", unit: "%", low: 40, high: 75, range: "40 - 75" },
      { id: "lymph", name: "Lymphocytes", unit: "%", low: 20, high: 45, range: "20 - 45" },
      { id: "mono", name: "Monocytes", unit: "%", low: 2, high: 10, range: "2 - 10" },
      { id: "eos", name: "Eosinophils", unit: "%", low: 1, high: 6, range: "1 - 6" },
      { id: "baso", name: "Basophils", unit: "%", low: 0, high: 1, range: "0 - 1" },
    ],
  },

  {
    id: "esr",
    name: "ESR",
    icon: "⏱️",
    tests: [
      { id: "esr1", name: "ESR (1st Hour)", unit: "mm/hr", low: 0, high: 20, range: "0 - 20" },
    ],
  },

  {
    id: "sugar",
    name: "Blood Glucose",
    icon: "🍬",
    tests: [
      { id: "fbs", name: "Fasting Blood Glucose", unit: "mg/dL", low: 70, high: 99, range: "70 - 99" },
      { id: "ppbs", name: "Postprandial Blood Glucose", unit: "mg/dL", low: 70, high: 139, range: "70 - 139" },
      { id: "rbs", name: "Random Blood Glucose", unit: "mg/dL", low: 70, high: 140, range: "70 - 140" },
      { id: "hba1c", name: "HbA1c", unit: "%", low: 4, high: 5.6, range: "4.0 - 5.6" },
    ],
  },

  {
    id: "kft",
    name: "Kidney Function Test",
    icon: "🫘",
    tests: [
      { id: "urea", name: "Blood Urea", unit: "mg/dL", low: 15, high: 40, range: "15 - 40" },
      { id: "bun", name: "BUN", unit: "mg/dL", low: 7, high: 20, range: "7 - 20" },
      { id: "creat", name: "Serum Creatinine", unit: "mg/dL", low: 0.6, high: 1.3, range: "0.6 - 1.3" },
      { id: "uric", name: "Uric Acid", unit: "mg/dL", low: 3.4, high: 7, range: "3.4 - 7.0" },
      { id: "sodium", name: "Sodium", unit: "mmol/L", low: 135, high: 145, range: "135 - 145" },
      { id: "potassium", name: "Potassium", unit: "mmol/L", low: 3.5, high: 5.1, range: "3.5 - 5.1" },
      { id: "chloride", name: "Chloride", unit: "mmol/L", low: 98, high: 107, range: "98 - 107" },
    ],
  },

  {
    id: "lft",
    name: "Liver Function Test",
    icon: "🧪",
    tests: [
      { id: "tbili", name: "Total Bilirubin", unit: "mg/dL", low: 0.2, high: 1.2, range: "0.2 - 1.2" },
      { id: "dbili", name: "Direct Bilirubin", unit: "mg/dL", low: 0, high: 0.3, range: "0.0 - 0.3" },
      { id: "ibili", name: "Indirect Bilirubin", unit: "mg/dL", low: 0.2, high: 0.9, range: "0.2 - 0.9" },
      { id: "ast", name: "AST / SGOT", unit: "U/L", low: 0, high: 40, range: "Up to 40" },
      { id: "alt", name: "ALT / SGPT", unit: "U/L", low: 0, high: 40, range: "Up to 40" },
      { id: "alp", name: "Alkaline Phosphatase", unit: "U/L", low: 44, high: 147, range: "44 - 147" },
      { id: "protein", name: "Total Protein", unit: "g/dL", low: 6.4, high: 8.3, range: "6.4 - 8.3" },
      { id: "albumin", name: "Albumin", unit: "g/dL", low: 3.5, high: 5.2, range: "3.5 - 5.2" },
      { id: "globulin", name: "Globulin", unit: "g/dL", low: 2.3, high: 3.5, range: "2.3 - 3.5" },
    ],
  },

  {
    id: "lipid",
    name: "Lipid Profile",
    icon: "❤️",
    tests: [
      { id: "chol", name: "Total Cholesterol", unit: "mg/dL", low: 0, high: 199, range: "< 200" },
      { id: "tg", name: "Triglycerides", unit: "mg/dL", low: 0, high: 149, range: "< 150" },
      { id: "hdl", name: "HDL Cholesterol", unit: "mg/dL", low: 40, high: null, range: "≥ 40" },
      { id: "ldl", name: "LDL Cholesterol", unit: "mg/dL", low: 0, high: 99, range: "< 100" },
      { id: "vldl", name: "VLDL Cholesterol", unit: "mg/dL", low: 5, high: 40, range: "5 - 40" },
    ],
  },

  {
    id: "thyroid",
    name: "Thyroid Profile",
    icon: "🦋",
    tests: [
      { id: "t3", name: "Total T3", unit: "ng/dL", low: 80, high: 200, range: "80 - 200" },
      { id: "t4", name: "Total T4", unit: "µg/dL", low: 5, high: 12, range: "5 - 12" },
      { id: "tsh", name: "TSH", unit: "µIU/mL", low: 0.4, high: 4, range: "0.4 - 4.0" },
    ],
  },

  {
    id: "urine",
    name: "Urine Routine",
    icon: "💧",
    tests: [
      { id: "urcolor", name: "Colour", unit: "", range: "Pale Yellow", text: true },
      { id: "urappearance", name: "Appearance", unit: "", range: "Clear", text: true },
      { id: "urph", name: "pH", unit: "", low: 4.5, high: 8, range: "4.5 - 8.0" },
      { id: "ursg", name: "Specific Gravity", unit: "", low: 1.005, high: 1.03, range: "1.005 - 1.030" },
      { id: "urprotein", name: "Protein / Albumin", unit: "", range: "Negative", text: true },
      { id: "ursugar", name: "Glucose / Sugar", unit: "", range: "Negative", text: true },
      { id: "urketone", name: "Ketone", unit: "", range: "Negative", text: true },
      { id: "urpuc", name: "Pus Cells", unit: "/HPF", low: 0, high: 5, range: "0 - 5" },
      { id: "urrbc", name: "RBC", unit: "/HPF", low: 0, high: 2, range: "0 - 2" },
      { id: "urepi", name: "Epithelial Cells", unit: "/HPF", low: 0, high: 5, range: "0 - 5" },
    ],
  },
];

const makePatientId = () =>
  `NPL-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;

const today = () => new Date().toISOString().split("T")[0];

export default function Home() {
  const [patient, setPatient] = useState({
    id: makePatientId(),
    name: "",
    age: "",
    sex: "Male",
    mobile: "",
    doctor: "",
    sampleDate: today(),
  });

  const [search, setSearch] = useState("");
  const [selectedPanel, setSelectedPanel] = useState("cbc");
  const [results, setResults] = useState({});
  const [remarks, setRemarks] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  const [customTests, setCustomTests] = useState([]);
  const [customName, setCustomName] = useState("");
  const [customUnit, setCustomUnit] = useState("");
  const [customRange, setCustomRange] = useState("");

  const panel = TEST_PANELS.find((item) => item.id === selectedPanel);

  const visibleTests = useMemo(() => {
    if (!panel) return [];

    const q = search.trim().toLowerCase();

    if (!q) return panel.tests;

    return panel.tests.filter((test) =>
      `${test.name} ${test.unit} ${test.range}`
        .toLowerCase()
        .includes(q)
    );
  }, [panel, search]);

  const updatePatient = (field, value) => {
    setPatient((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const updateResult = (id, value) => {
    setResults((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const getFlag = (test, value) => {
    if (value === "" || value === undefined || test.text) return "";

    const number = Number(value);

    if (Number.isNaN(number)) return "";

    if (test.low !== null && test.low !== undefined && number < test.low) {
      return "L";
    }

    if (test.high !== null && test.high !== undefined && number > test.high) {
      return "H";
    }

    return "N";
  };

  const addCustomTest = () => {
    if (!customName.trim()) return;

    const id = `custom-${Date.now()}`;

    setCustomTests((prev) => [
      ...prev,
      {
        id,
        name: customName.trim(),
        unit: customUnit.trim(),
        range: customRange.trim() || "-",
        text: true,
      },
    ]);

    setCustomName("");
    setCustomUnit("");
    setCustomRange("");
  };

  const removeCustomTest = (id) => {
    setCustomTests((prev) => prev.filter((test) => test.id !== id));

    setResults((prev) => {
      const copy = { ...prev };
      delete copy[id];
      return copy;
    });
  };

  const reportTests = [
    ...(panel?.tests || []),
    ...customTests,
  ].filter((test) => {
    const value = results[test.id];
    return value !== undefined && String(value).trim() !== "";
  });

  const resetReport = () => {
    setPatient({
      id: makePatientId(),
      name: "",
      age: "",
      sex: "Male",
      mobile: "",
      doctor: "",
      sampleDate: today(),
    });

    setResults({});
    setRemarks("");
    setCustomTests([]);
    setShowPreview(false);
  };

  const printReport = () => {
    setShowPreview(true);

    setTimeout(() => {
      window.print();
    }, 150);
  };

  return (
    <main className="labApp">
      <header className="topbar">
        <div className="brandBlock">
          <div className="brandLogo">N+</div>

          <div>
            <h1>NIDAN PATHOLOGY LAB</h1>
            <p>Pathology Reporting System</p>
          </div>
        </div>

        <div className="topActions">
          <button
            type="button"
            className="secondaryBtn"
            onClick={resetReport}
          >
            + New Patient
          </button>

          <button
            type="button"
            className="primaryBtn"
            onClick={() => setShowPreview(true)}
          >
            Report Preview
          </button>
        </div>
      </header>

      <section className="dashboardHero">
        <div>
          <span className="eyebrow">DIGITAL LAB REPORTING</span>
          <h2>Create Professional Pathology Reports</h2>
          <p>
            Patient details enter karein, test panel select karein aur
            laboratory results ko professional report format mein prepare karein.
          </p>
        </div>

        <div className="heroStat">
          <span>Current Patient ID</span>
          <strong>{patient.id}</strong>
        </div>
      </section>

      <section className="workspace">
        <aside className="panelSidebar">
          <div className="sidebarTitle">
            <span>LAB TESTS</span>
            <h3>Test Panels</h3>
          </div>

          {TEST_PANELS.map((item) => (
            <button
              type="button"
              key={item.id}
              className={
                selectedPanel === item.id
                  ? "panelButton active"
                  : "panelButton"
              }
              onClick={() => {
                setSelectedPanel(item.id);
                setSearch("");
              }}
            >
              <span>{item.icon}</span>

              <div>
                <strong>{item.name}</strong>
                <small>{item.tests.length} parameters</small>
              </div>
            </button>
          ))}
        </aside>

        <div className="mainWorkspace">
          <section className="reportCard patientCard">
            <div className="cardHeading">
              <div>
                <span className="stepNumber">01</span>
                <div>
                  <h3>Patient Registration</h3>
                  <p>Patient aur sample ki basic information.</p>
                </div>
              </div>
            </div>

            <div className="formGrid">
              <label>
                Patient ID
                <input
                  value={patient.id}
                  onChange={(e) =>
                    updatePatient("id", e.target.value)
                  }
                />
              </label>

              <label>
                Patient Name *
                <input
                  placeholder="Patient full name"
                  value={patient.name}
                  onChange={(e) =>
                    updatePatient("name", e.target.value)
                  }
                />
              </label>

              <label>
                Age
                <input
                  type="number"
                  min="0"
                  placeholder="Age"
                  value={patient.age}
                  onChange={(e) =>
                    updatePatient("age", e.target.value)
                  }
                />
              </label>

              <label>
                Sex
                <select
                  value={patient.sex}
                  onChange={(e) =>
                    updatePatient("sex", e.target.value)
                  }
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </label>

              <label>
                Mobile
                <input
                  type="tel"
                  placeholder="Mobile number"
                  value={patient.mobile}
                  onChange={(e) =>
                    updatePatient("mobile", e.target.value)
                  }
                />
              </label>

              <label>
                Ref. Doctor
                <input
                  placeholder="Doctor name"
                  value={patient.doctor}
                  onChange={(e) =>
                    updatePatient("doctor", e.target.value)
                  }
                />
              </label>

              <label>
                Sample Date
                <input
                  type="date"
                  value={patient.sampleDate}
                  onChange={(e) =>
                    updatePatient("sampleDate", e.target.value)
                  }
                />
              </label>
            </div>
          </section>

          <section className="reportCard">
            <div className="cardHeading">
              <div>
                <span className="stepNumber">02</span>

                <div>
                  <h3>
                    {panel?.icon} {panel?.name}
                  </h3>
                  <p>Test results enter karein.</p>
                </div>
              </div>

              <input
                className="testSearch"
                type="search"
                placeholder="Search parameter..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="tableWrap">
              <table className="resultTable">
                <thead>
                  <tr>
                    <th>Test / Parameter</th>
                    <th>Result</th>
                    <th>Flag</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                  </tr>
                </thead>

                <tbody>
                  {visibleTests.map((test) => {
                    const value = results[test.id] ?? "";
                    const flag = getFlag(test, value);

                    return (
                      <tr key={test.id}>
                        <td>
                          <strong>{test.name}</strong>
                        </td>

                        <td>
                          <input
                            className="resultInput"
                            type={test.text ? "text" : "number"}
                            step="any"
                            placeholder="Enter result"
                            value={value}
                            onChange={(e) =>
                              updateResult(test.id, e.target.value)
                            }
                          />
                        </td>

                        <td>
                          {flag && (
                            <span
                              className={`flag flag${flag}`}
                            >
                              {flag}
                            </span>
                          )}
                        </td>

                        <td>{test.unit || "-"}</td>
                        <td>{test.range}</td>
                      </tr>
                    );
                  })}

                  {customTests.map((test) => (
                    <tr key={test.id}>
                      <td>
                        <strong>{test.name}</strong>

                        <button
                          type="button"
                          className="removeTest"
                          onClick={() =>
                            removeCustomTest(test.id)
                          }
                        >
                          ×
                        </button>
                      </td>

                      <td>
                        <input
                          className="resultInput"
                          placeholder="Enter result"
                          value={results[test.id] ?? ""}
                          onChange={(e) =>
                            updateResult(test.id, e.target.value)
                          }
                        />
                      </td>

                      <td>-</td>
                      <td>{test.unit || "-"}</td>
                      <td>{test.range}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="reportCard">
            <div className="cardHeading">
              <div>
                <span className="stepNumber">03</span>

                <div>
                  <h3>Add Custom Test</h3>
                  <p>
                    List mein na hone wala parameter manually add karein.
                  </p>
                </div>
              </div>
            </div>

            <div className="customGrid">
              <input
                placeholder="Test name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
              />

              <input
                placeholder="Unit"
                value={customUnit}
                onChange={(e) => setCustomUnit(e.target.value)}
              />

              <input
                placeholder="Reference range"
                value={customRange}
                onChange={(e) => setCustomRange(e.target.value)}
              />

              <button
                type="button"
                className="primaryBtn"
                onClick={addCustomTest}
              >
                + Add Test
              </button>
            </div>
          </section>

          <section className="reportCard">
            <div className="cardHeading">
              <div>
                <span className="stepNumber">04</span>

                <div>
                  <h3>Report Remarks</h3>
                  <p>Optional laboratory remarks.</p>
                </div>
              </div>
            </div>

            <textarea
              className="remarks"
              placeholder="Enter report remarks..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
            />

            <div className="reportActions">
              <button
                type="button"
                className="secondaryBtn"
                onClick={() => setShowPreview(true)}
              >
                👁 Preview Report
              </button>

              <button
                type="button"
                className="primaryBtn"
                onClick={printReport}
              >
                🖨 Print / Save PDF
              </button>
            </div>
          </section>
        </div>
      </section>

      {showPreview && (
        <div className="previewOverlay">
          <div className="previewWindow">
            <div className="previewControls noPrint">
              <strong>Report Preview</strong>

              <div>
                <button
                  type="button"
                  className="secondaryBtn"
                  onClick={() => setShowPreview(false)}
                >
                  Close
                </button>

                <button
                  type="button"
                  className="primaryBtn"
                  onClick={() => window.print()}
                >
                  Print / Save PDF
                </button>
              </div>
            </div>

            <article className="printReport">
              <header className="reportHeader">
                <div className="reportLogo">N+</div>

                <div>
                  <h1>NIDAN PATHOLOGY LAB</h1>
                  <p>Accurate • Reliable • Professional Laboratory Reporting</p>
                  <small>
                    Pathology Laboratory Report
                  </small>
                </div>
              </header>

              <div className="patientReportInfo">
                <div>
                  <span>Patient Name</span>
                  <strong>{patient.name || "________________"}</strong>
                </div>

                <div>
                  <span>Patient ID</span>
                  <strong>{patient.id}</strong>
                </div>

                <div>
                  <span>Age / Sex</span>
                  <strong>
                    {patient.age || "-"} Years / {patient.sex}
                  </strong>
                </div>

                <div>
                  <span>Sample Date</span>
                  <strong>{patient.sampleDate || "-"}</strong>
                </div>

                <div>
                  <span>Ref. Doctor</span>
                  <strong>{patient.doctor || "-"}</strong>
                </div>

                <div>
                  <span>Mobile</span>
                  <strong>{patient.mobile || "-"}</strong>
                </div>
              </div>

              <div className="reportPanelTitle">
                {panel?.name}
              </div>

              <table className="finalReportTable">
                <thead>
                  <tr>
                    <th>Investigation</th>
                    <th>Result</th>
                    <th>Flag</th>
                    <th>Unit</th>
                    <th>Reference Range</th>
                  </tr>
                </thead>

                <tbody>
                  {reportTests.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="emptyReport">
                        Test results abhi enter nahi kiye gaye hain.
                      </td>
                    </tr>
                  ) : (
                    reportTests.map((test) => {
                      const value = results[test.id];
                      const flag = getFlag(test, value);

                      return (
                        <tr key={test.id}>
                          <td>{test.name}</td>

                          <td>
                            <strong>{value}</strong>
                          </td>

                          <td>
                            {flag === "H"
                              ? "High"
                              : flag === "L"
                              ? "Low"
                              : flag === "N"
                              ? "Normal"
                              : "-"}
                          </td>

                          <td>{test.unit || "-"}</td>
                          <td>{test.range || "-"}</td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>

              {remarks && (
                <div className="reportRemarks">
                  <strong>Remarks:</strong>
                  <p>{remarks}</p>
                </div>
              )}

              <div className="reportFootNote">
                <strong>Note:</strong> Reference intervals can vary with
                laboratory method, age, sex and clinical circumstances.
                Results should be interpreted in appropriate clinical context.
              </div>

              <div className="signatureArea">
                <div>
                  <span>________________________</span>
                  <strong>Lab Technician</strong>
                </div>

                <div>
                  <span>________________________</span>
                  <strong>Authorized Signatory</strong>
                </div>
              </div>

              <footer className="reportFooter">
                <strong>*** END OF REPORT ***</strong>
                <p>NIDAN Pathology Lab Reporting System</p>
              </footer>
            </article>
          </div>
        </div>
      )}
    </main>
  );
}
