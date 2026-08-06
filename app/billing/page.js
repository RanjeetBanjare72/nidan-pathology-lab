"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function BillingPage() {
  const router = useRouter();

  const [tests, setTests] = useState([]);
  const [discount, setDiscount] = useState(0);
  const [paid, setPaid] = useState(0);
  const [paymentMode, setPaymentMode] = useState("Cash");
  const [patient, setPatient] = useState({});
  const [billNo, setBillNo] = useState("");
  const [loaded, setLoaded] = useState(false);

  // ============================================================
  // LOAD PATIENT + TESTS + EXISTING BILLING
  // ============================================================

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

      // Restore billing only when it belongs to current patient/tests
      if (savedBilling && savedBilling.billNo) {
        setBillNo(savedBilling.billNo);

        if (savedBilling.discount !== undefined) {
          setDiscount(savedBilling.discount);
        }

        if (savedBilling.paid !== undefined) {
          setPaid(savedBilling.paid);
        }

        if (savedBilling.paymentMode) {
          setPaymentMode(savedBilling.paymentMode);
        }
      } else {
        setBillNo(createBillNumber());
      }
    } catch (error) {
      console.error("Billing load error:", error);

      setTests([]);
      setPatient({});
      setBillNo(createBillNumber());
    } finally {
      setLoaded(true);
    }
  }, []);

  // ============================================================
  // BILL NUMBER
  // ============================================================

  function createBillNumber() {
    const now = new Date();

    const year = now.getFullYear().toString().slice(-2);
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    const unique = Date.now().toString().slice(-6);

    return `NPL-BILL-${year}${month}${day}-${unique}`;
  }

  // ============================================================
  // SUBTOTAL
  // ============================================================

  const subtotal = useMemo(() => {
    return tests.reduce((total, test) => {
      const price = Number(test?.price || 0);

      return total + (Number.isFinite(price) ? price : 0);
    }, 0);
  }, [tests]);

  // ============================================================
  // DISCOUNT
  // ============================================================

  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  // ============================================================
  // NET AMOUNT
  // ============================================================

  const netAmount = Math.max(
    subtotal - discountAmount,
    0
  );

  // ============================================================
  // PAID AMOUNT
  // ============================================================

  const paidAmount = Math.min(
    Math.max(Number(paid) || 0, 0),
    netAmount
  );

  // ============================================================
  // BALANCE
  // ============================================================

  const balance = Math.max(
    netAmount - paidAmount,
    0
  );

  // ============================================================
  // PAYMENT STATUS
  // ============================================================

  const paymentStatus =
    netAmount === 0
      ? "Paid"
      : paidAmount <= 0
      ? "Pending"
      : paidAmount >= netAmount
      ? "Paid"
      : "Partial";

  // ============================================================
  // REMOVE TEST
  // ============================================================

  function removeTest(id) {
    const updated = tests.filter(
      (test) => test.id !== id
    );

    setTests(updated);

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(updated)
    );

    // prevent old totals being used
    localStorage.removeItem("nidanBilling");
    setBillNo(createBillNumber());
  }

  // ============================================================
  // FULL PAYMENT
  // ============================================================

  function markFullPayment() {
    setPaid(netAmount);
  }

  // ============================================================
  // SAVE BILL + CONTINUE
  // ============================================================

  function continueResults() {
    if (!patient || Object.keys(patient).length === 0) {
      alert(
        "Patient details nahi mile. Pehle patient select/register karein."
      );

      router.push("/patients");
      return;
    }

    if (tests.length === 0) {
      alert(
        "Billing ke liye kam se kam ek test select hona chahiye."
      );
      return;
    }

    const finalBillNo =
      billNo || createBillNumber();

    const bill = {
      billNo: finalBillNo,

      date: new Date().toISOString(),

      patientId:
        patient.patientId ||
        patient.id ||
        "",

      patientName:
        patient.name ||
        "",

      age:
        patient.age ||
        "",

      gender:
        patient.gender ||
        patient.sex ||
        "",

      doctor:
        patient.doctor ||
        patient.refDoctor ||
        "",

      mobile:
        patient.mobile ||
        patient.phone ||
        "",

      subtotal,

      discount: discountAmount,

      netAmount,

      paid: paidAmount,

      balance,

      paymentMode,

      paymentStatus,

      tests,

      status: "completed",
    };

    try {
      localStorage.setItem(
        "nidanBilling",
        JSON.stringify(bill)
      );

      // Backup billing copy
      localStorage.setItem(
        "nidanCurrentBill",
        JSON.stringify(bill)
      );

      router.push("/results");
    } catch (error) {
      console.error(
        "Billing save error:",
        error
      );

      alert(
        "Bill save nahi ho paya. Dobara try karein."
      );
    }
  }

  // ============================================================
  // FORMAT MONEY
  // ============================================================

  function money(value) {
    return Number(value || 0).toLocaleString(
      "en-IN",
      {
        maximumFractionDigits: 2,
      }
    );
  }

  // ============================================================
  // LOADING
  // ============================================================

  if (!loaded) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Arial, sans-serif",
        }}
      >
        Loading Billing...
      </div>
    );
  }

  // ============================================================
  // UI
  // ============================================================

  return (
    <div className="labApp">

      {/* ======================================================
          SIDEBAR
      ====================================================== */}

      <aside className="sidebar">

        <div className="brand">

          <div className="brandLogo">
            N+
          </div>

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
          onClick={() =>
            router.push("/")
          }
        >
          <span>⌂</span>
          Dashboard
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/patients")
          }
        >
          <span>♙</span>
          Patients
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/tests")
          }
        >
          <span>🧪</span>
          Test Selection
        </button>

        <button
          className="menu active"
        >
          <span>₹</span>
          Billing
        </button>

        <button
          className="menu"
          onClick={() =>
            router.push("/reports")
          }
        >
          <span>▤</span>
          Reports
        </button>

      </aside>

      {/* ======================================================
          MAIN
      ====================================================== */}

      <main className="mainArea">

        {/* TOP BAR */}

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

        {/* CONTENT */}

        <div className="content">

          {/* ==================================================
              PAGE HEADING
          ================================================== */}

          <div className="pageHeading">

            <div>

              <div className="smallTitle">
                STEP 3 OF 5
              </div>

              <h1>
                Create Patient Bill
              </h1>

              <p>
                Selected laboratory tests ka bill
                prepare karein.
              </p>

            </div>

            <button
              className="backBtn"
              onClick={() =>
                router.push("/tests")
              }
            >
              ← Back to Tests
            </button>

          </div>

          {/* ==================================================
              STEPS
          ================================================== */}

          <div className="steps">

            <div className="step">

              <span>✓</span>

              <div>
                Patient
                <small>
                  Registered
                </small>
              </div>

            </div>

            <div className="step">

              <span>✓</span>

              <div>
                Tests
                <small>
                  Selected
                </small>
              </div>

            </div>

            <div className="step activeStep">

              <span>3</span>

              <div>
                Billing
                <small>
                  Create Bill
                </small>
              </div>

            </div>

            <div className="step">

              <span>4</span>

              <div>
                Results
                <small>
                  Enter Results
                </small>
              </div>

            </div>

            <div className="step">

              <span>5</span>

              <div>
                Report
                <small>
                  Print / PDF
                </small>
              </div>

            </div>

          </div>

          {/* ==================================================
              BILLING GRID
          ================================================== */}

          <div className="billingGrid">

            {/* ================================================
                PATIENT + TEST CARD
            ================================================ */}

            <section className="billingCard">

              <div className="billingTitle">

                <div>

                  <h2>
                    Patient & Test Details
                  </h2>

                  <p>
                    Verify patient and selected
                    investigations.
                  </p>

                </div>

                <div className="billBadge">
                  {tests.length}{" "}
                  {tests.length === 1
                    ? "Test"
                    : "Tests"}
                </div>

              </div>

              {/* BILL NUMBER */}

              <div
                style={{
                  padding: "12px 18px",
                  marginBottom: "12px",
                  background: "#f7fafc",
                  border: "1px solid #e5e7eb",
                  borderRadius: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "15px",
                  flexWrap: "wrap",
                }}
              >
                <div>
                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    BILL NUMBER
                  </small>

                  <strong>
                    {billNo}
                  </strong>
                </div>

                <div>
                  <small
                    style={{
                      display: "block",
                      color: "#64748b",
                      marginBottom: "4px",
                    }}
                  >
                    PAYMENT STATUS
                  </small>

                  <strong
                    style={{
                      color:
                        paymentStatus === "Paid"
                          ? "#059669"
                          : paymentStatus === "Partial"
                          ? "#d97706"
                          : "#dc2626",
                    }}
                  >
                    {paymentStatus}
                  </strong>
                </div>

              </div>

              {/* ==============================================
                  PATIENT INFO
              ============================================== */}

              <div className="patientBillInfo">

                <div>

                  <small>
                    Patient ID
                  </small>

                  <strong>
                    {patient.patientId ||
                      patient.id ||
                      "Not available"}
                  </strong>

                </div>

                <div>

                  <small>
                    Patient Name
                  </small>

                  <strong>
                    {patient.name ||
                      "Not available"}
                  </strong>

                </div>

                <div>

                  <small>
                    Age / Sex
                  </small>

                  <strong>
                    {patient.age || "-"} /{" "}
                    {patient.gender ||
                      patient.sex ||
                      "-"}
                  </strong>

                </div>

                <div>

                  <small>
                    Ref. Doctor
                  </small>

                  <strong>
                    {patient.doctor ||
                      patient.refDoctor ||
                      "-"}
                  </strong>

                </div>

              </div>

              {/* ==============================================
                  TEST TABLE
              ============================================== */}

              <div className="billTableWrap">

                <table className="billTable">

                  <thead>

                    <tr>

                      <th>#</th>

                      <th>
                        Investigation
                      </th>

                      <th>
                        Category
                      </th>

                      <th>
                        Rate
                      </th>

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
                          No tests selected.
                        </td>

                      </tr>

                    ) : (

                      tests.map(
                        (test, index) => (

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
                                  test.name}
                              </strong>

                              <small>
                                {test.tests?.length ||
                                  0}{" "}
                                parameters
                              </small>

                            </td>

                            <td>
                              {test.category ||
                                "-"}
                            </td>

                            <td>
                              ₹
                              {money(
                                test.price
                              )}
                            </td>

                            <td>

                              <button
                                type="button"
                                className="removeBillTest"
                                title="Remove Test"
                                onClick={() =>
                                  removeTest(
                                    test.id
                                  )
                                }
                              >
                                ×
                              </button>

                            </td>

                          </tr>

                        )
                      )

                    )}

                  </tbody>

                </table>

              </div>

            </section>

            {/* ================================================
                PAYMENT CARD
            ================================================ */}

            <aside className="paymentCard">

              <div className="billingTitle">

                <div>

                  <h2>
                    Payment Summary
                  </h2>

                  <p>
                    Bill amount and payment.
                  </p>

                </div>

              </div>

              <div className="paymentRows">

                {/* SUBTOTAL */}

                <div>

                  <span>
                    Subtotal
                  </span>

                  <strong>
                    ₹{money(subtotal)}
                  </strong>

                </div>

                {/* DISCOUNT */}

                <div className="paymentInputRow">

                  <label>
                    Discount ₹
                  </label>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) =>
                      setDiscount(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* NET */}

                <div className="netPayable">

                  <span>
                    Net Payable
                  </span>

                  <strong>
                    ₹{money(netAmount)}
                  </strong>

                </div>

                {/* PAID */}

                <div className="paymentInputRow">

                  <label>
                    Paid Amount ₹
                  </label>

                  <input
                    type="number"
                    inputMode="decimal"
                    min="0"
                    max={netAmount}
                    value={paid}
                    onChange={(e) =>
                      setPaid(
                        e.target.value
                      )
                    }
                  />

                </div>

                {/* PAYMENT MODE */}

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

                    <option value="Cash">
                      Cash
                    </option>

                    <option value="UPI">
                      UPI
                    </option>

                    <option value="Card">
                      Card
                    </option>

                    <option value="Bank Transfer">
                      Bank Transfer
                    </option>

                    <option value="Credit">
                      Credit
                    </option>

                  </select>

                </div>

                {/* STATUS */}

                <div>

                  <span>
                    Payment Status
                  </span>

                  <strong
                    style={{
                      color:
                        paymentStatus ===
                        "Paid"
                          ? "#059669"
                          : paymentStatus ===
                            "Partial"
                          ? "#d97706"
                          : "#dc2626",
                    }}
                  >
                    {paymentStatus}
                  </strong>

                </div>

                {/* BALANCE */}

                <div className="balanceRow">

                  <span>
                    Balance Due
                  </span>

                  <strong>
                    ₹{money(balance)}
                  </strong>

                </div>

              </div>

              {/* ==============================================
                  FULL PAYMENT
              ============================================== */}

              <button
                type="button"
                className="fullPaymentBtn"
                onClick={
                  markFullPayment
                }
                disabled={
                  tests.length === 0
                }
              >
                Mark Full Payment
              </button>

              {/* ==============================================
                  CONTINUE
              ============================================== */}

              <button
                type="button"
                className="continueBtn billingContinue"
                onClick={
                  continueResults
                }
                disabled={
                  tests.length === 0
                }
              >
                Save Bill & Continue to Results →
              </button>

              {/* INFORMATION */}

              <div
                style={{
                  marginTop: "14px",
                  padding: "12px",
                  borderRadius: "8px",
                  background: "#f8fafc",
                  fontSize: "12px",
                  lineHeight: "1.6",
                  color: "#64748b",
                }}
              >
                Bill results page par continue
                karne se pehle automatically
                save hoga.
              </div>

            </aside>

          </div>

        </div>

      </main>

    </div>
  );
}
