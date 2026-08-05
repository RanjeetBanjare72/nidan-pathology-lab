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

  useEffect(() => {
    try {
      const savedTests = JSON.parse(
        localStorage.getItem("nidanSelectedTests") || "[]"
      );

      const savedPatient = JSON.parse(
        localStorage.getItem("nidanPatient") || "{}"
      );

      setTests(savedTests);
      setPatient(savedPatient);
    } catch {
      setTests([]);
      setPatient({});
    }
  }, []);

  const subtotal = useMemo(() => {
    return tests.reduce(
      (total, test) => total + Number(test.price || 0),
      0
    );
  }, [tests]);

  const discountAmount = Math.min(
    Math.max(Number(discount) || 0, 0),
    subtotal
  );

  const netAmount = Math.max(subtotal - discountAmount, 0);
  const paidAmount = Math.max(Number(paid) || 0, 0);
  const balance = Math.max(netAmount - paidAmount, 0);

  function removeTest(id) {
    const updated = tests.filter((test) => test.id !== id);

    setTests(updated);

    localStorage.setItem(
      "nidanSelectedTests",
      JSON.stringify(updated)
    );
  }

  function continueResults() {
    if (tests.length === 0) {
      alert("Billing ke liye kam se kam ek test select hona chahiye.");
      return;
    }

    const bill = {
      billNo: `NPL-BILL-${Date.now().toString().slice(-6)}`,
      date: new Date().toISOString(),
      subtotal,
      discount: discountAmount,
      netAmount,
      paid: paidAmount,
      balance,
      paymentMode,
      tests,
    };

    localStorage.setItem(
      "nidanBilling",
      JSON.stringify(bill)
    );

    router.push("/results");
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

        <button className="menu" onClick={() => router.push("/")}>
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

        <button className="menu active">
          <span>₹</span> Billing
        </button>

        <button className="menu">
          <span>▤</span> Reports
        </button>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div>
            <h3>Billing</h3>
            <p>Create patient bill and payment details</p>
          </div>

          <div className="topRight">
            <span className="statusDot"></span>
            NIDAN Lab System
          </div>
        </header>

        <div className="content">
          <div className="pageHeading">
            <div>
              <div className="smallTitle">STEP 3 OF 5</div>
              <h1>Create Patient Bill</h1>
              <p>
                Selected laboratory tests ka bill prepare karein.
              </p>
            </div>

            <button
              className="backBtn"
              onClick={() => router.push("/tests")}
            >
              ← Back to Tests
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

          <div className="billingGrid">
            <section className="billingCard">
              <div className="billingTitle">
                <div>
                  <h2>Patient & Test Details</h2>
                  <p>Verify patient and selected investigations.</p>
                </div>

                <div className="billBadge">
                  {tests.length} Tests
                </div>
              </div>

              <div className="patientBillInfo">
                <div>
                  <small>Patient ID</small>
                  <strong>
                    {patient.patientId || patient.id || "Not available"}
                  </strong>
                </div>

                <div>
                  <small>Patient Name</small>
                  <strong>
                    {patient.name || "Not available"}
                  </strong>
                </div>

                <div>
                  <small>Age / Sex</small>
                  <strong>
                    {patient.age || "-"} / {patient.sex || "-"}
                  </strong>
                </div>

                <div>
                  <small>Ref. Doctor</small>
                  <strong>
                    {patient.doctor || patient.refDoctor || "-"}
                  </strong>
                </div>
              </div>

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
                        <td colSpan="5" className="emptyBill">
                          No tests selected.
                        </td>
                      </tr>
                    ) : (
                      tests.map((test, index) => (
                        <tr key={test.id}>
                          <td>{index + 1}</td>

                          <td>
                            <strong>
                              {test.short || test.name}
                            </strong>
                            <small>
                              {test.tests?.length || 0} parameters
                            </small>
                          </td>

                          <td>{test.category || "-"}</td>

                          <td>
                            ₹{Number(test.price || 0).toFixed(0)}
                          </td>

                          <td>
                            <button
                              className="removeBillTest"
                              onClick={() => removeTest(test.id)}
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

            <aside className="paymentCard">
              <div className="billingTitle">
                <div>
                  <h2>Payment Summary</h2>
                  <p>Bill amount and payment.</p>
                </div>
              </div>

              <div className="paymentRows">
                <div>
                  <span>Subtotal</span>
                  <strong>₹{subtotal}</strong>
                </div>

                <div className="paymentInputRow">
                  <label>Discount ₹</label>
                  <input
                    type="number"
                    min="0"
                    max={subtotal}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                  />
                </div>

                <div className="netPayable">
                  <span>Net Payable</span>
                  <strong>₹{netAmount}</strong>
                </div>

                <div className="paymentInputRow">
                  <label>Paid Amount ₹</label>
                  <input
                    type="number"
                    min="0"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                  />
                </div>

                <div className="paymentInputRow">
                  <label>Payment Mode</label>

                  <select
                    value={paymentMode}
                    onChange={(e) =>
                      setPaymentMode(e.target.value)
                    }
                  >
                    <option>Cash</option>
                    <option>UPI</option>
                    <option>Card</option>
                    <option>Bank Transfer</option>
                    <option>Credit</option>
                  </select>
                </div>

                <div className="balanceRow">
                  <span>Balance Due</span>
                  <strong>₹{balance}</strong>
                </div>
              </div>

              <button
                className="fullPaymentBtn"
                onClick={() => setPaid(netAmount)}
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
