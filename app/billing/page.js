"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";

export default function BillingPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [patient, setPatient] = useState({});
  const [patients, setPatients] = useState([]);

  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");

  const [search, setSearch] = useState("");
  const [showPatientSearch, setShowPatientSearch] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);

  // -------------------------------------------------------
  // LOAD LOCAL DATA
  // -------------------------------------------------------

  useEffect(() => {
    try {
      const savedTests = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const savedPatient = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      const savedBilling = JSON.parse(
        localStorage.getItem("nidanBilling") || "{}"
      );

      setTests(Array.isArray(savedTests) ? savedTests : []);
      setPatient(savedPatient || {});

      if (savedBilling?.discount !== undefined) {
        setDiscount(savedBilling.discount || 0);
      }

      if (savedBilling?.paid !== undefined) {
        setPaid(savedBilling.paid || 0);
      }

      if (savedBilling?.paymentMode) {
        setPaymentMode(savedBilling.paymentMode);
      }

      // Agar patient nahi hai to automatically search panel kholo
      if (
        !savedPatient ||
        (!savedPatient.id &&
          !savedPatient.patientId &&
          !savedPatient.patient_id &&
          !savedPatient.name)
      ) {
        setShowPatientSearch(true);
      }
    } catch (error) {
      console.error("Billing local data error:", error);
      setTests([]);
      setPatient({});
      setShowPatientSearch(true);
    }
  }, []);

  // -------------------------------------------------------
  // FETCH PATIENTS
  // -------------------------------------------------------

  async function fetchPatients() {
    setLoadingPatients(true);

    try {
      const { data, error } = await supabase
        .from("patients")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);

      if (error) {
        console.error("Patients fetch error:", error);
        alert("Patients load nahi ho paye: " + error.message);
        return;
      }

      setPatients(data || []);
    } catch (error) {
      console.error("Patients loading error:", error);
      alert("Patients load karte samay error aaya.");
    } finally {
      setLoadingPatients(false);
    }
  }

  useEffect(() => {
    if (showPatientSearch && patients.length === 0) {
      fetchPatients();
    }
  }, [showPatientSearch]);

  // -------------------------------------------------------
  // NORMALIZED PATIENT VALUES
  // -------------------------------------------------------

  const patientId =
    patient.patientId ||
    patient.patient_id ||
    patient.id ||
    "";

  const patientName =
    patient.name ||
    patient.patient_name ||
    "";

  const patientAge =
    patient.age !== undefined && patient.age !== null
      ? patient.age
      : "";

  const patientAgeUnit =
    patient.ageUnit ||
    patient.age_unit ||
    "Years";

  const patientGender =
    patient.gender ||
    patient.sex ||
    "";

  const patientMobile =
    patient.mobile ||
    patient.phone ||
    "";

  const patientDoctor =
    patient.doctor ||
    patient.refDoctor ||
    patient.ref_doctor ||
    patient.referring_doctor ||
    "";

  const hasPatient = Boolean(patientId || patientName);

  // -------------------------------------------------------
  // SEARCH PATIENTS
  // -------------------------------------------------------

  const filteredPatients = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return patients.slice(0, 20);
    }

    return patients
      .filter((item) => {
        const id = String(
          item.patient_id ||
            item.patientId ||
            item.id ||
            ""
        ).toLowerCase();

        const name = String(
          item.name ||
            item.patient_name ||
            ""
        ).toLowerCase();

        const mobile = String(
          item.mobile ||
            item.phone ||
            ""
        ).toLowerCase();

        return (
          id.includes(query) ||
          name.includes(query) ||
          mobile.includes(query)
        );
      })
      .slice(0, 30);
  }, [patients, search]);

  // -------------------------------------------------------
  // SELECT PATIENT
  // -------------------------------------------------------

  function selectPatient(selectedPatient) {
    const normalizedPatient = {
      ...selectedPatient,

      id:
        selectedPatient.id ||
        selectedPatient.patient_id ||
        selectedPatient.patientId ||
        "",

      patientId:
        selectedPatient.patient_id ||
        selectedPatient.patientId ||
        selectedPatient.id ||
        "",

      name:
        selectedPatient.name ||
        selectedPatient.patient_name ||
        "",

      age:
        selectedPatient.age ?? "",

      ageUnit:
        selectedPatient.age_unit ||
        selectedPatient.ageUnit ||
        "Years",

      gender:
        selectedPatient.gender ||
        selectedPatient.sex ||
        "",

      mobile:
        selectedPatient.mobile ||
        selectedPatient.phone ||
        "",

      doctor:
        selectedPatient.referring_doctor ||
        selectedPatient.doctor ||
        selectedPatient.refDoctor ||
        selectedPatient.ref_doctor ||
        "",

      address:
        selectedPatient.address || "",
    };

    setPatient(normalizedPatient);

    localStorage.setItem(
      "nidanPatient",
      JSON.stringify(normalizedPatient)
    );

    // New patient select karne par old test/bill mix na ho
    setTests([]);
    setDiscount(0);
    setPaid(0);
    setPaymentMode("Cash");

    localStorage.removeItem("nidanSelectedTests");
    localStorage.removeItem("nidanBilling");

    setShowPatientSearch(false);
    setSearch("");
  }

  // -------------------------------------------------------
  // BILL CALCULATION
  // -------------------------------------------------------

  const subtotal = useMemo(() => {
    return tests.reduce((total, test) => {
      return total + Number(test.price || test.rate || 0);
    }, 0);
  }, [tests]);

  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const netAmount = Math.max(
    subtotal - discountAmount,
    0
  );

  const paidAmount = Math.min(
    Math.max(Number(paid) || 0, 0),
    netAmount
  );

  const balance = Math.max(
    netAmount - paidAmount,
    0
  );

  const paymentStatus =
    netAmount <= 0
      ? "Not Billed"
      : balance <= 0
      ? "Paid"
      : paidAmount > 0
      ? "Partial"
      : "Unpaid";

  // -------------------------------------------------------
  // REMOVE TEST
  // -------------------------------------------------------

  function removeTest(id, indexToRemove) {
    const updated = tests.filter((test, index) => {
      if (id !== undefined && id !== null) {
        return test.id !== id;
      }

      return index !== indexToRemove;
    });

    setTests(updated);

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(updated)
    );
  }

  // -------------------------------------------------------
  // GO TO TEST SELECTION
  // -------------------------------------------------------

  function goToTests() {
    if (!hasPatient) {
      alert("Pehle patient select karein.");
      setShowPatientSearch(true);
      return;
    }

    localStorage.setItem(
      "nidanPatient",
      JSON.stringify(patient)
    );

    router.push("/tests");
  }

  // -------------------------------------------------------
  // SAVE BILL AND CONTINUE
  // -------------------------------------------------------

  function continueResults() {
    if (!hasPatient) {
      alert("Pehle patient select karein.");
      setShowPatientSearch(true);
      return;
    }

    if (tests.length === 0) {
      alert(
        "Billing ke liye kam se kam ek test select hona chahiye."
      );
      return;
    }

    const bill = {
      billNo: `NPL-BILL-${Date.now()
        .toString()
        .slice(-6)}`,

      date: new Date().toISOString(),

      patient,

      subtotal,
      discount: discountAmount,
      netAmount,
      paid: paidAmount,
      balance,
      paymentMode,
      paymentStatus,
      tests,
    };

    localStorage.setItem(
      "nidanPatient",
      JSON.stringify(patient)
    );

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(tests)
    );

    localStorage.setItem(
      "nidanBilling",
      JSON.stringify(bill)
    );

    router.push("/results");
  }

  // -------------------------------------------------------
  // UI
  // -------------------------------------------------------

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

        <div className="menuLabel">
          MAIN MENU
        </div>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() => router.push("/")}
        >
          <span>♙</span>
          Patients
        </button>

        <button
          className="menu"
          onClick={goToTests}
        >
          <span>🧪</span>
          Test Selection
        </button>

        <button className="menu active">
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={() => router.push("/reports")}
        >
          <span>▤</span>
          Reports
        </button>

      </aside>

      {/* MAIN AREA */}

      <main className="mainArea">

        <header className="topbar">

          <div>
            <h3>Billing</h3>
            <p>
              Create patient bill and payment details
            </p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            NIDAN Lab System
          </div>

        </header>

        <div className="content">

          {/* PAGE HEADING */}

          <div className="pageHeading">

            <div>
              <div className="smallTitle">
                STEP 3 OF 5
              </div>

              <h1>Create Patient Bill</h1>

              <p>
                Patient select karein, tests verify karein
                aur payment details enter karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={goToTests}
            >
              ← Back to Tests
            </button>

          </div>

          {/* STEPS */}

          <div className="steps">

            <div className="step">
              <span>✓</span>
              <div>
                Patient
                <small>
                  {hasPatient
                    ? "Selected"
                    : "Select Patient"}
                </small>
              </div>
            </div>

            <div className="step">
              <span>
                {tests.length > 0 ? "✓" : "2"}
              </span>

              <div>
                Tests
                <small>
                  {tests.length > 0
                    ? `${tests.length} Selected`
                    : "Select Tests"}
                </small>
              </div>
            </div>

            <div className="step activeStep">
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

          {/* PATIENT SEARCH */}

          {showPatientSearch && (

            <section
              className="billingCard"
              style={{ marginBottom: "20px" }}
            >

              <div className="billingTitle">

                <div>
                  <h2>Select Patient</h2>

                  <p>
                    Patient ID, name ya mobile number
                    se search karein.
                  </p>
                </div>

                {hasPatient && (
                  <button
                    className="backBtn"
                    onClick={() =>
                      setShowPatientSearch(false)
                    }
                  >
                    × Close
                  </button>
                )}

              </div>

              <div
                style={{
                  padding: "18px",
                }}
              >

                <div
                  style={{
                    display: "flex",
                    gap: "10px",
                    flexWrap: "wrap",
                    marginBottom: "15px",
                  }}
                >

                  <input
                    type="text"
                    value={search}
                    onChange={(e) =>
                      setSearch(e.target.value)
                    }
                    placeholder="Search Patient ID / Name / Mobile"
                    style={{
                      flex: "1",
                      minWidth: "220px",
                      padding: "12px",
                      border: "1px solid #d9e1e8",
                      borderRadius: "8px",
                    }}
                  />

                  <button
                    className="backBtn"
                    onClick={fetchPatients}
                  >
                    ↻ Refresh
                  </button>

                  <button
                    className="continueBtn"
                    onClick={() => router.push("/")}
                  >
                    + New Patient
                  </button>

                </div>

                {loadingPatients ? (

                  <div
                    style={{
                      padding: "25px",
                      textAlign: "center",
                    }}
                  >
                    Patients loading...
                  </div>

                ) : filteredPatients.length === 0 ? (

                  <div
                    style={{
                      padding: "25px",
                      textAlign: "center",
                    }}
                  >
                    Koi patient nahi mila.
                  </div>

                ) : (

                  <div
                    style={{
                      maxHeight: "350px",
                      overflowY: "auto",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                    }}
                  >

                    {filteredPatients.map(
                      (item, index) => {

                        const id =
                          item.patient_id ||
                          item.patientId ||
                          item.id ||
                          "-";

                        const name =
                          item.name ||
                          item.patient_name ||
                          "Unknown";

                        const mobile =
                          item.mobile ||
                          item.phone ||
                          "-";

                        const age =
                          item.age ?? "-";

                        const gender =
                          item.gender ||
                          item.sex ||
                          "-";

                        return (

                          <div
                            key={`${id}-${index}`}
                            style={{
                              padding: "12px",
                              borderBottom:
                                "1px solid #edf1f4",
                              display: "flex",
                              justifyContent:
                                "space-between",
                              alignItems: "center",
                              gap: "15px",
                              flexWrap: "wrap",
                            }}
                          >

                            <div>
                              <strong>
                                {name}
                              </strong>

                              <div
                                style={{
                                  fontSize: "12px",
                                  color: "#64748b",
                                  marginTop: "4px",
                                }}
                              >
                                {id} • {mobile} •{" "}
                                {age} {gender}
                              </div>
                            </div>

                            <button
                              className="continueBtn"
                              onClick={() =>
                                selectPatient(item)
                              }
                            >
                              Select
                            </button>

                          </div>
                        );
                      }
                    )}

                  </div>
                )}

              </div>

            </section>
          )}

          {/* BILLING GRID */}

          <div className="billingGrid">

            {/* LEFT CARD */}

            <section className="billingCard">

              <div className="billingTitle">

                <div>
                  <h2>Patient & Test Details</h2>

                  <p>
                    Verify patient and selected
                    investigations.
                  </p>
                </div>

                <div className="billBadge">
                  {tests.length} Tests
                </div>

              </div>

              {/* PATIENT */}

              {!hasPatient ? (

                <div
                  style={{
                    padding: "25px",
                    textAlign: "center",
                  }}
                >

                  <h3>
                    No Patient Selected
                  </h3>

                  <p>
                    Billing continue karne ke liye
                    patient select karein.
                  </p>

                  <button
                    className="continueBtn"
                    onClick={() =>
                      setShowPatientSearch(true)
                    }
                  >
                    Search / Select Patient
                  </button>

                </div>

              ) : (

                <>

                  <div
                    style={{
                      padding: "14px 18px",
                      background: "#f0fdfa",
                      borderBottom:
                        "1px solid #d5efea",
                      display: "flex",
                      justifyContent:
                        "space-between",
                      alignItems: "center",
                      gap: "10px",
                      flexWrap: "wrap",
                    }}
                  >

                    <div>
                      <strong>
                        ✓ Patient Selected
                      </strong>

                      <div
                        style={{
                          fontSize: "12px",
                          marginTop: "3px",
                        }}
                      >
                        {patientName}
                      </div>
                    </div>

                    <button
                      className="backBtn"
                      onClick={() =>
                        setShowPatientSearch(true)
                      }
                    >
                      Change Patient
                    </button>

                  </div>

                  <div className="patientBillInfo">

                    <div>
                      <small>Patient ID</small>
                      <strong>
                        {patientId || "-"}
                      </strong>
                    </div>

                    <div>
                      <small>Patient Name</small>
                      <strong>
                        {patientName || "-"}
                      </strong>
                    </div>

                    <div>
                      <small>Age / Sex</small>
                      <strong>
                        {patientAge || "-"}{" "}
                        {patientAgeUnit} /{" "}
                        {patientGender || "-"}
                      </strong>
                    </div>

                    <div>
                      <small>Mobile</small>
                      <strong>
                        {patientMobile || "-"}
                      </strong>
                    </div>

                    <div>
                      <small>Ref. Doctor</small>
                      <strong>
                        {patientDoctor || "-"}
                      </strong>
                    </div>

                  </div>

                </>
              )}

              {/* TEST TABLE */}

              <div className="billTableWrap">

                <table className="billTable">

                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Investigation</th>
                      <th>Category</th>
                      <th>Rate</th>
                      <th></th>
                    </tr>
                  </thead>

                  <tbody>

                    {tests.length === 0 ? (

                      <tr>
                        <td
                          colSpan="5"
                          className="emptyBill"
                        >

                          <div
                            style={{
                              padding: "20px",
                            }}
                          >

                            <div>
                              No tests selected.
                            </div>

                            <button
                              className="continueBtn"
                              style={{
                                marginTop: "12px",
                              }}
                              onClick={goToTests}
                            >
                              + Select Tests
                            </button>

                          </div>

                        </td>
                      </tr>

                    ) : (

                      tests.map((test, index) => (

                        <tr
                          key={
                            test.id ||
                            `${test.name}-${index}`
                          }
                        >

                          <td>
                            {index + 1}
                          </td>

                          <td>
                            <strong>
                              {test.short ||
                                test.name ||
                                "Test"}
                            </strong>

                            <small>
                              {test.tests?.length ||
                                test.parameters?.length ||
                                0}{" "}
                              parameters
                            </small>
                          </td>

                          <td>
                            {test.category || "-"}
                          </td>

                          <td>
                            ₹
                            {Number(
                              test.price ||
                                test.rate ||
                                0
                            ).toFixed(0)}
                          </td>

                          <td>
                            <button
                              className="removeBillTest"
                              onClick={() =>
                                removeTest(
                                  test.id,
                                  index
                                )
                              }
                            >
                              ×
                            </button>
                          </td>

                        </tr>
                      ))
                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* PAYMENT */}

            <aside className="paymentCard">

              <div className="billingTitle">

                <div>
                  <h2>Payment Summary</h2>
                  <p>
                    Bill amount and payment.
                  </p>
                </div>

              </div>

              <div className="paymentRows">

                <div>
                  <span>Subtotal</span>
                  <strong>
                    ₹{subtotal.toFixed(0)}
                  </strong>
                </div>

                <div className="paymentInputRow">

                  <label>
                    Discount ₹
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(e.target.value)
                    }
                  />

                </div>

                <div className="netPayable">

                  <span>
                    Net Payable
                  </span>

                  <strong>
                    ₹{netAmount.toFixed(0)}
                  </strong>

                </div>

                <div className="paymentInputRow">

                  <label>
                    Paid Amount ₹
                  </label>

                  <input
                    type="number"
                    min="0"
                    max={netAmount}
                    value={paid}
                    onChange={(e) =>
                      setPaid(e.target.value)
                    }
                  />

                </div>

                <div className="paymentInputRow">

                  <label>
                    Payment Mode
                  </label>

                  <select
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(
                        e.target.value
                      )
                    }
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>
                      Bank Transfer
                    </option>
                    <option>Credit</option>
                  </select>

                </div>

                <div>

                  <span>
                    Payment Status
                  </span>

                  <strong>
                    {paymentStatus}
                  </strong>

                </div>

                <div className="balanceRow">

                  <span>
                    Balance Due
                  </span>

                  <strong>
                    ₹{balance.toFixed(0)}
                  </strong>

                </div>

              </div>

              <button
                className="fullPaymentBtn"
                disabled={netAmount <= 0}
                onClick={() =>
                  setPaid(netAmount)
                }
              >
                Mark Full Payment
              </button>

              <button
                className="continueBtn billingContinue"
                onClick={continueResults}
              >
                Save Bill & Continue to Results →
              </button>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}
