"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const testGroups = [
  {
    id: "cbc",
    name: "Complete Blood Count (CBC)",
    short: "CBC",
    icon: "🩸",
    price: 250,
    category: "Hematology",
    tests: [
      "Hemoglobin",
      "RBC Count",
      "Total WBC Count",
      "Platelet Count",
      "PCV / Hematocrit",
      "MCV",
      "MCH",
      "MCHC",
      "RDW-CV",
      "Neutrophils",
      "Lymphocytes",
      "Monocytes",
      "Eosinophils",
      "Basophils",
    ],
  },

  {
    id: "esr",
    name: "ESR",
    short: "ESR",
    icon: "⏱️",
    price: 100,
    category: "Hematology",
    tests: ["ESR"],
  },

  {
    id: "sugar",
    name: "Blood Glucose",
    short: "Blood Sugar",
    icon: "🩸",
    price: 100,
    category: "Biochemistry",
    tests: [
      "Fasting Blood Sugar",
      "Post Prandial Blood Sugar",
      "Random Blood Sugar",
    ],
  },

  {
    id: "kft",
    name: "Kidney Function Test",
    short: "KFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    tests: [
      "Blood Urea",
      "Serum Creatinine",
      "Uric Acid",
      "Sodium",
      "Potassium",
      "Chloride",
      "BUN",
    ],
  },

  {
    id: "lft",
    name: "Liver Function Test",
    short: "LFT",
    icon: "🧪",
    price: 500,
    category: "Biochemistry",
    tests: [
      "Total Bilirubin",
      "Direct Bilirubin",
      "Indirect Bilirubin",
      "SGOT / AST",
      "SGPT / ALT",
      "Alkaline Phosphatase",
      "Total Protein",
      "Albumin",
      "Globulin",
    ],
  },

  {
    id: "lipid",
    name: "Lipid Profile",
    short: "Lipid Profile",
    icon: "❤️",
    price: 500,
    category: "Biochemistry",
    tests: [
      "Total Cholesterol",
      "Triglycerides",
      "HDL Cholesterol",
      "LDL Cholesterol",
      "VLDL Cholesterol",
    ],
  },

  {
    id: "urine",
    name: "Urine Routine Examination",
    short: "Urine R/M",
    icon: "🔬",
    price: 150,
    category: "Clinical Pathology",
    tests: [
      "Colour",
      "Appearance",
      "Reaction / pH",
      "Specific Gravity",
      "Albumin",
      "Sugar",
      "Pus Cells",
      "Epithelial Cells",
      "RBC",
      "Crystals",
    ],
  },

  {
    id: "hba1c",
    name: "HbA1c",
    short: "HbA1c",
    icon: "💉",
    price: 450,
    category: "Biochemistry",
    tests: ["HbA1c"],
  },

  {
    id: "thyroid",
    name: "Thyroid Profile",
    short: "Thyroid",
    icon: "🧬",
    price: 600,
    category: "Hormone",
    tests: ["T3", "T4", "TSH"],
  },

  {
    id: "widal",
    name: "Widal Test",
    short: "Widal",
    icon: "🧫",
    price: 200,
    category: "Serology",
    tests: ["S. Typhi O", "S. Typhi H", "S. Typhi AH", "S. Typhi BH"],
  },
];

export default function TestsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);

  const filteredTests = useMemo(() => {
    const value = search.toLowerCase().trim();

    if (!value) return testGroups;

    return testGroups.filter(
      (item) =>
        item.name.toLowerCase().includes(value) ||
        item.short.toLowerCase().includes(value) ||
        item.category.toLowerCase().includes(value)
    );
  }, [search]);

  function toggleTest(item) {
    const alreadySelected = selected.some(
      (test) => test.id === item.id
    );

    if (alreadySelected) {
      setSelected(
        selected.filter((test) => test.id !== item.id)
      );
    } else {
      setSelected([...selected, item]);
    }
  }

  const totalAmount = selected.reduce(
    (sum, item) => sum + item.price,
    0
  );

  function continueBilling() {
    if (selected.length === 0) {
      alert("Kam se kam ek test select karein.");
      return;
    }

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(selected)
    );

    localStorage.setItem(
      "nidanBillTotal",
      String(totalAmount)
    );

    router.push("/billing");
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

        <div className="menuLabel">MAIN MENU</div>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() => router.push("/patients")}
        >
          <span>♙</span>
          Patients
        </button>

        <button className="menu active">
          <span>🧪</span>
          Test Selection
        </button>

        <button className="menu">
          <span>₹</span>
          Billing
        </button>

        <button className="menu">
          <span>▤</span>
          Reports
        </button>
      </aside>

      <main className="mainArea">

        <header className="topbar">
          <div>
            <h3>Test Selection</h3>
            <p>
              Select laboratory investigations for the patient
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
              <div className="smallTitle">
                STEP 2 OF 5
              </div>

              <h1>Select Laboratory Tests</h1>

              <p>
                Patient ke liye required test ya profile select karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() => router.back()}
            >
              ← Back
            </button>
          </div>

          <div className="steps">

            <div className="step">
              <span>✓</span>
              <div>
                Patient
                <small>Registered</small>
              </div>
            </div>

            <div className="step activeStep">
              <span>2</span>
              <div>
                Tests
                <small>Select Tests</small>
              </div>
            </div>

            <div className="step">
              <span>3</span>
              <div>
                Billing
                <small>Create Bill</small>
              </div>
            </div>

            <div className="step">
              <span>4</span>
              <div>
                Results
                <small>Enter Results</small>
              </div>
            </div>

            <div className="step">
              <span>5</span>
              <div>
                Report
                <small>Print / PDF</small>
              </div>
            </div>

          </div>

          <div className="testWorkspace">

            <section className="testSelectionPanel">

              <div className="testSearchBox">
                <input
                  type="text"
                  placeholder="🔎 Search CBC, LFT, KFT, Sugar, Thyroid..."
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                />
              </div>

              <div className="sectionHeading">
                <div>
                  <h2>Available Tests</h2>
                  <p>
                    Profile select karne par uske sabhi parameters
                    report me add honge.
                  </p>
                </div>
              </div>

              <div className="testCards">

                {filteredTests.map((item) => {
                  const active = selected.some(
                    (test) => test.id === item.id
                  );

                  return (
                    <button
                      key={item.id}
                      className={
                        active
                          ? "testCard selectedTest"
                          : "testCard"
                      }
                      onClick={() => toggleTest(item)}
                    >

                      <div className="testCardTop">
                        <span className="testEmoji">
                          {item.icon}
                        </span>

                        <span className="testCheck">
                          {active ? "✓" : "+"}
                        </span>
                      </div>

                      <h3>{item.short}</h3>

                      <p>{item.name}</p>

                      <div className="testMeta">
                        <span>{item.category}</span>
                        <span>
                          {item.tests.length} Parameters
                        </span>
                      </div>

                      <div className="testPrice">
                        ₹{item.price}
                      </div>

                    </button>
                  );
                })}

              </div>
            </section>

            <aside className="selectedPanel">

              <div className="selectedHeader">
                <div>
                  <h2>Selected Tests</h2>
                  <p>
                    {selected.length} test/profile selected
                  </p>
                </div>

                <div className="selectedCount">
                  {selected.length}
                </div>
              </div>

              {selected.length === 0 ? (

                <div className="noSelectedTest">
                  <div>🧪</div>
                  <h3>No tests selected</h3>
                  <p>
                    Left side se laboratory tests select karein.
                  </p>
                </div>

              ) : (

                <div className="selectedList">

                  {selected.map((item) => (
                    <div
                      className="selectedItem"
                      key={item.id}
                    >

                      <div>
                        <strong>
                          {item.short}
                        </strong>

                        <small>
                          {item.tests.length} parameters
                        </small>
                      </div>

                      <div className="selectedPrice">
                        ₹{item.price}

                        <button
                          onClick={() =>
                            toggleTest(item)
                          }
                        >
                          ×
                        </button>
                      </div>

                    </div>
                  ))}

                </div>
              )}

              <div className="billSummary">

                <div>
                  <span>Selected Tests</span>
                  <strong>
                    {selected.length}
                  </strong>
                </div>

                <div className="grandTotal">
                  <span>Estimated Total</span>
                  <strong>
                    ₹{totalAmount}
                  </strong>
                </div>

              </div>

              <button
                className="continueBtn"
                onClick={continueBilling}
              >
                Continue to Billing →
              </button>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}
