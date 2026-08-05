"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function ResultsPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [activeTest, setActiveTest] = useState("");

  useEffect(() => {
    try {
      const p = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const tests = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const savedResults = JSON.parse(
        localStorage.getItem("nidanResults") || "{}"
      );

      setPatient(p);
      setSelectedTests(tests);
      setResults(savedResults);

      if (tests.length > 0) {
        setActiveTest(tests[0].id);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const currentTest = useMemo(() => {
    return selectedTests.find(
      (test) => test.id === activeTest
    );
  }, [selectedTests, activeTest]);

  function getParameterKey(testId, parameter, index) {
    return `${testId}-${parameter.name}-${index}`;
  }

  function updateResult(testId, parameter, index, value) {
    const key = getParameterKey(
      testId,
      parameter,
      index
    );

    setResults((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === undefined ||
      value === null
    ) {
      return "";
    }

    const numericValue = Number(value);

    if (Number.isNaN(numericValue)) {
      return "";
    }

    const low = Number(parameter.min);
    const high = Number(parameter.max);

    if (
      parameter.min !== undefined &&
      parameter.min !== "" &&
      !Number.isNaN(low) &&
      numericValue < low
    ) {
      return "LOW";
    }

    if (
      parameter.max !== undefined &&
      parameter.max !== "" &&
      !Number.isNaN(high) &&
      numericValue > high
    ) {
      return "HIGH";
    }

    return "NORMAL";
  }

  function getReference(parameter) {
    if (parameter.range) return parameter.range;

    if (
      parameter.min !== undefined &&
      parameter.max !== undefined
    ) {
      return `${parameter.min} - ${parameter.max}`;
    }

    return parameter.reference || "-";
  }

  function saveResults() {
    localStorage.setItem(
      "nidanResults",
      JSON.stringify(results)
    );

    alert("Results saved successfully.");
  }

  function continueReport() {
    if (selectedTests.length === 0) {
      alert("Koi test selected nahi hai.");
      return;
    }

    localStorage.setItem(
      "nidanResults",
      JSON.stringify(results)
    );

    router.push("/report");
  }

  function nextTest() {
    const index = selectedTests.findIndex(
      (test) => test.id === activeTest
    );

    if (index < selectedTests.length - 1) {
      setActiveTest(selectedTests[index + 1].id);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  function previousTest() {
    const index = selectedTests.findIndex(
      (test) => test.id === activeTest
    );

    if (index > 0) {
      setActiveTest(selectedTests[index - 1].id);
      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }
  }

  const completedResults = Object.values(results).filter(
    (value) => value !== ""
  ).length;

  const totalParameters = selectedTests.reduce(
    (total, test) =>
      total + (test.tests?.length || 0),
    0
  );

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
          <span>⌂</span> Dashboard
        </button>

        <button
          className="menu"
          onClick={() => router.push("/patients")}
        >
          <span>♙</span> Patients
        </button>

        <button
          className="menu"
          onClick={() => router.push("/tests")}
        >
          <span>🧪</span> Test Selection
        </button>

        <button
          className="menu"
          onClick={() => router.push("/billing")}
        >
          <span>₹</span> Billing
        </button>

        <button className="menu active">
          <span>✎</span> Result Entry
        </button>

        <button className="menu">
          <span>▤</span> Reports
        </button>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div>
            <h3>Result Entry</h3>
            <p>
              Enter laboratory investigation results
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
                STEP 4 OF 5
              </div>

              <h1>Laboratory Results</h1>

              <p>
                Selected tests ke results enter karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() => router.push("/billing")}
            >
              ← Back to Billing
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

            <div className="step">
              <span>✓</span>
              <div>
                Tests
                <small>Selected</small>
              </div>
            </div>

            <div className="step">
              <span>✓</span>
              <div>
                Billing
                <small>Completed</small>
              </div>
            </div>

            <div className="step activeStep">
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

          <div className="resultPatientCard">
            <div>
              <small>PATIENT ID</small>
              <strong>
                {patient.patientId ||
                  patient.id ||
                  "-"}
              </strong>
            </div>

            <div>
              <small>PATIENT NAME</small>
              <strong>
                {patient.name || "-"}
              </strong>
            </div>

            <div>
              <small>AGE / SEX</small>
              <strong>
                {patient.age || "-"} /{" "}
                {patient.sex || "-"}
              </strong>
            </div>

            <div>
              <small>REF. DOCTOR</small>
              <strong>
                {patient.doctor ||
                  patient.refDoctor ||
                  "-"}
              </strong>
            </div>
          </div>

          <div className="resultProgressCard">
            <div>
              <div>
                <strong>Result Progress</strong>
                <small>
                  {completedResults} of{" "}
                  {totalParameters} parameters entered
                </small>
              </div>

              <strong className="progressNumber">
                {totalParameters
                  ? Math.round(
                      (completedResults /
                        totalParameters) *
                        100
                    )
                  : 0}
                %
              </strong>
            </div>

            <div className="progressTrack">
              <div
                className="progressFill"
                style={{
                  width: `${
                    totalParameters
                      ? Math.min(
                          (completedResults /
                            totalParameters) *
                            100,
                          100
                        )
                      : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="resultWorkspace">
            <aside className="testResultNav">
              <div className="resultNavHeading">
                Selected Tests
              </div>

              {selectedTests.length === 0 ? (
                <div className="noSelectedTests">
                  No tests selected.
                </div>
              ) : (
                selectedTests.map((test, index) => (
                  <button
                    key={test.id}
                    className={
                      activeTest === test.id
                        ? "resultTestButton activeResultTest"
                        : "resultTestButton"
                    }
                    onClick={() =>
                      setActiveTest(test.id)
                    }
                  >
                    <span className="testNumber">
                      {index + 1}
                    </span>

                    <div>
                      <strong>
                        {test.short || test.name}
                      </strong>

                      <small>
                        {test.tests?.length || 0} parameters
                      </small>
                    </div>
                  </button>
                ))
              )}
            </aside>

            <section className="resultEntryCard">
              {!currentTest ? (
                <div className="emptyResultPage">
                  <div>🧪</div>
                  <h2>No Test Selected</h2>
                  <p>
                    Test Selection page se investigation
                    select karein.
                  </p>

                  <button
                    className="continueBtn"
                    onClick={() =>
                      router.push("/tests")
                    }
                  >
                    Select Tests
                  </button>
                </div>
              ) : (
                <>
                  <div className="resultCardHeader">
                    <div>
                      <div className="smallTitle">
                        INVESTIGATION
                      </div>

                      <h2>
                        {currentTest.name}
                      </h2>

                      <p>
                        Enter patient laboratory results.
                      </p>
                    </div>

                    <div className="parameterBadge">
                      {currentTest.tests?.length || 0}{" "}
                      Parameters
                    </div>
                  </div>

                  <div className="resultTableWrapper">
                    <table className="resultTable">
                      <thead>
                        <tr>
                          <th>Investigation</th>
                          <th>Result</th>
                          <th>Unit</th>
                          <th>Reference Range</th>
                          <th>Flag</th>
                        </tr>
                      </thead>

                      <tbody>
                        {currentTest.tests?.map(
                          (parameter, index) => {
                            const key =
                              getParameterKey(
                                currentTest.id,
                                parameter,
                                index
                              );

                            const value =
                              results[key] || "";

                            const flag = getFlag(
                              value,
                              parameter
                            );

                            return (
                              <tr key={key}>
                                <td>
                                  <strong>
                                    {parameter.name}
                                  </strong>
                                </td>

                                <td>
                                  <input
                                    className="resultInput"
                                    type="text"
                                    inputMode="decimal"
                                    placeholder="Enter result"
                                    value={value}
                                    onChange={(e) =>
                                      updateResult(
                                        currentTest.id,
                                        parameter,
                                        index,
                                        e.target.value
                                      )
                                    }
                                  />
                                </td>

                                <td>
                                  {parameter.unit || "-"}
                                </td>

                                <td>
                                  {getReference(
                                    parameter
                                  )}
                                </td>

                                <td>
                                  {flag && (
                                    <span
                                      className={`resultFlag ${
                                        flag === "HIGH"
                                          ? "flagHigh"
                                          : flag ===
                                            "LOW"
                                          ? "flagLow"
                                          : "flagNormal"
                                      }`}
                                    >
                                      {flag}
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          }
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="resultFooter">
                    <button
                      className="secondaryResultBtn"
                      onClick={previousTest}
                    >
                      ← Previous Test
                    </button>

                    <div className="resultFooterRight">
                      <button
                        className="saveResultBtn"
                        onClick={saveResults}
                      >
                        Save Results
                      </button>

                      <button
                        className="nextResultBtn"
                        onClick={nextTest}
                      >
                        Next Test →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </section>
          </div>

          <div className="resultBottomActions">
            <div>
              <strong>Results ready?</strong>
              <p>
                Save results and create final laboratory
                report.
              </p>
            </div>

            <button
              className="generateReportBtn"
              onClick={continueReport}
            >
              Generate Final Report →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
