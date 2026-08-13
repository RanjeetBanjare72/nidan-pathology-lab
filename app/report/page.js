"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/*
===========================================================
 NIDAN PATHOLOGY LAB
 PROFESSIONAL LABORATORY REPORT
 VERSION 3.0
===========================================================

 IMPORTANT:
 - No uploaded letterhead
 - No external image required
 - No canvas
 - A4 print ready
 - Mobile responsive
 - Existing localStorage data supported
===========================================================
*/

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "Diagnostic & Pathology Laboratory",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
  address:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
  phone: "7987580004, 8889325233",
  email: "",
};

/* =========================================================
   MAIN PAGE
========================================================= */

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportNo, setReportNo] = useState("");
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  function safeJSON(keys) {
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);

        if (!value) continue;

        return JSON.parse(value);
      } catch (error) {
        console.log("Unable to read:", key);
      }
    }

    return null;
  }

  function loadData() {
    const p = safeJSON([
      "nidanPatient",
      "patient",
      "currentPatient",
    ]);

    const tests = safeJSON([
      "nidanSelectedTests",
      "selectedTests",
      "selected_tests",
    ]);

    const r = safeJSON([
      "nidanResults",
      "results",
      "testResults",
    ]);

    setPatient(p || {});
    setSelectedTests(
      Array.isArray(tests) ? tests : []
    );
    setResults(r || {});

    const existingReport =
      localStorage.getItem(
        "nidanCurrentReportNo"
      );

    const generatedReport =
      existingReport ||
      `NPL-${Date.now()
        .toString()
        .slice(-8)}`;

    if (!existingReport) {
      localStorage.setItem(
        "nidanCurrentReportNo",
        generatedReport
      );
    }

    setReportNo(generatedReport);

    setReportDate(
      new Date().toLocaleDateString(
        "en-IN",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        }
      )
    );
  }

  /* =======================================================
     BASIC PATIENT DATA
  ======================================================= */

  const patientName =
    patient?.name ||
    patient?.patientName ||
    "Patient Name";

  const patientId =
    patient?.patientId ||
    patient?.id ||
    patient?.registrationNo ||
    "-";

  const age =
    patient?.age !== undefined &&
    patient?.age !== null &&
    patient?.age !== ""
      ? patient.age
      : "-";

  const gender =
    patient?.gender ||
    patient?.sex ||
    "-";

  const mobile =
    patient?.mobile ||
    patient?.mobileNumber ||
    patient?.phone ||
    "-";

  const doctor =
    patient?.doctor ||
    patient?.referredBy ||
    patient?.refDoctor ||
    "Self";

  const sampleDate =
    patient?.sampleDate ||
    patient?.collectionDate ||
    reportDate;

  /* =======================================================
     REFERENCE RANGE
  ======================================================= */

  function normalise(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[-_/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function reference(name) {
    const n = normalise(name);

    const male =
      String(gender).toLowerCase() ===
        "male" ||
      String(gender).toLowerCase() ===
        "m";

    if (
      n.includes("haemoglobin") ||
      n.includes("hemoglobin") ||
      n === "hb"
    ) {
      return male
        ? {
            range: "13 - 17",
            min: 13,
            max: 17,
            unit: "g/dL",
          }
        : {
            range: "12 - 15",
            min: 12,
            max: 15,
            unit: "g/dL",
          };
    }

    if (
      n.includes("total leucocyte") ||
      n.includes("total leukocyte") ||
      n === "tlc" ||
      n.includes("wbc")
    ) {
      return {
        range: "4,000 - 11,000",
        min: 4000,
        max: 11000,
        unit: "/cumm",
      };
    }

    if (
      n === "neutrophils" ||
      n === "neutrophil"
    ) {
      return {
        range: "40 - 75",
        min: 40,
        max: 75,
        unit: "%",
      };
    }

    if (
      n === "lymphocytes" ||
      n === "lymphocyte"
    ) {
      return {
        range: "20 - 40",
        min: 20,
        max: 40,
        unit: "%",
      };
    }

    if (
      n === "eosinophils" ||
      n === "eosinophil"
    ) {
      return {
        range: "1 - 6",
        min: 1,
        max: 6,
        unit: "%",
      };
    }

    if (
      n === "monocytes" ||
      n === "monocyte"
    ) {
      return {
        range: "1 - 10",
        min: 1,
        max: 10,
        unit: "%",
      };
    }

    if (
      n === "basophils" ||
      n === "basophil"
    ) {
      return {
        range: "0 - 1",
        min: 0,
        max: 1,
        unit: "%",
      };
    }

    if (n === "rbc count") {
      return male
        ? {
            range: "4.5 - 6.0",
            min: 4.5,
            max: 6,
            unit: "million/cumm",
          }
        : {
            range: "4.0 - 5.5",
            min: 4,
            max: 5.5,
            unit: "million/cumm",
          };
    }

    if (
      n.includes("pcv") ||
      n.includes("haematocrit") ||
      n.includes("hematocrit")
    ) {
      return male
        ? {
            range: "40 - 50",
            min: 40,
            max: 50,
            unit: "%",
          }
        : {
            range: "36 - 46",
            min: 36,
            max: 46,
            unit: "%",
          };
    }

    if (n === "mcv") {
      return {
        range: "80 - 100",
        min: 80,
        max: 100,
        unit: "fL",
      };
    }

    if (n === "mch") {
      return {
        range: "27 - 32",
        min: 27,
        max: 32,
        unit: "pg",
      };
    }

    if (n === "mchc") {
      return {
        range: "32 - 36",
        min: 32,
        max: 36,
        unit: "g/dL",
      };
    }

    if (
      n === "rdw cv" ||
      n === "rdw-cv"
    ) {
      return {
        range: "11.5 - 14.5",
        min: 11.5,
        max: 14.5,
        unit: "%",
      };
    }

    if (
      n === "platelet count" ||
      n === "platelets"
    ) {
      return {
        range: "1.5 - 4.5",
        min: 1.5,
        max: 4.5,
        unit: "Lac/cumm",
      };
    }

    if (n === "mpv") {
      return {
        range: "7.5 - 11.5",
        min: 7.5,
        max: 11.5,
        unit: "fL",
      };
    }

    if (n === "pdw") {
      return {
        range: "9 - 17",
        min: 9,
        max: 17,
        unit: "%",
      };
    }

    if (n === "pct") {
      return {
        range: "0.15 - 0.40",
        min: 0.15,
        max: 0.4,
        unit: "%",
      };
    }

    if (
      n === "esr" ||
      n.includes(
        "erythrocyte sedimentation"
      )
    ) {
      return {
        range: "0 - 15",
        min: 0,
        max: 15,
        unit: "mm/hr",
      };
    }

    if (
      n.includes(
        "fasting blood sugar"
      ) ||
      n === "fbs"
    ) {
      return {
        range: "70 - 99",
        min: 70,
        max: 99,
        unit: "mg/dL",
      };
    }

    if (
      n.includes("post prandial") ||
      n === "ppbs"
    ) {
      return {
        range: "70 - 140",
        min: 70,
        max: 140,
        unit: "mg/dL",
      };
    }

    if (
      n.includes(
        "random blood sugar"
      ) ||
      n === "rbs"
    ) {
      return {
        range: "70 - 140",
        min: 70,
        max: 140,
        unit: "mg/dL",
      };
    }

    if (
      n === "urea" ||
      n === "blood urea"
    ) {
      return {
        range: "15 - 40",
        min: 15,
        max: 40,
        unit: "mg/dL",
      };
    }

    if (
      n === "creatinine" ||
      n === "serum creatinine"
    ) {
      return {
        range: "0.6 - 1.3",
        min: 0.6,
        max: 1.3,
        unit: "mg/dL",
      };
    }

    if (n === "uric acid") {
      return male
        ? {
            range: "3.4 - 7.0",
            min: 3.4,
            max: 7,
            unit: "mg/dL",
          }
        : {
            range: "2.4 - 6.0",
            min: 2.4,
            max: 6,
            unit: "mg/dL",
          };
    }

    if (n === "sodium") {
      return {
        range: "135 - 145",
        min: 135,
        max: 145,
        unit: "mEq/L",
      };
    }

    if (n === "potassium") {
      return {
        range: "3.5 - 5.1",
        min: 3.5,
        max: 5.1,
        unit: "mEq/L",
      };
    }

    if (n === "tsh") {
      return {
        range: "0.4 - 4.0",
        min: 0.4,
        max: 4,
        unit: "µIU/mL",
      };
    }

    if (
      n.includes("sgot") ||
      n === "ast"
    ) {
      return {
        range: "Up to 40",
        min: 0,
        max: 40,
        unit: "U/L",
      };
    }

    if (
      n.includes("sgpt") ||
      n === "alt"
    ) {
      return {
        range: "Up to 40",
        min: 0,
        max: 40,
        unit: "U/L",
      };
    }

    if (
      n.includes("total bilirubin")
    ) {
      return {
        range: "0.2 - 1.2",
        min: 0.2,
        max: 1.2,
        unit: "mg/dL",
      };
    }

    return {
      range: "-",
      min: null,
      max: null,
      unit: "",
    };
  }

  /* =======================================================
     PARAMETER NORMALIZATION
  ======================================================= */

  function parameterInfo(parameter) {
    if (
      typeof parameter ===
      "string"
    ) {
      const ref =
        reference(parameter);

      return {
        name: parameter,
        min: ref.min,
        max: ref.max,
        unit: ref.unit,
        range: ref.range,
      };
    }

    const name =
      parameter?.name ||
      parameter?.testName ||
      parameter?.investigation ||
      "Investigation";

    const ref =
      reference(name);

    return {
      name,
      min:
        parameter?.min ??
        parameter?.minimum ??
        ref.min,
      max:
        parameter?.max ??
        parameter?.maximum ??
        ref.max,
      unit:
        parameter?.unit ||
        parameter?.units ||
        ref.unit,
      range:
        parameter?.range ||
        parameter?.referenceRange ||
        parameter?.reference ||
        ref.range,
    };
  }

  /* =======================================================
     FLAG
  ======================================================= */

  function calculateFlag(
    value,
    parameter
  ) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const p =
      parameterInfo(parameter);

    const number =
      Number(
        String(value)
          .replace(/,/g, "")
          .trim()
      );

    if (Number.isNaN(number)) {
      return "";
    }

    if (
      p.min !== null &&
      p.min !== undefined &&
      number < Number(p.min)
    ) {
      return "L";
    }

    if (
      p.max !== null &&
      p.max !== undefined &&
      number > Number(p.max)
    ) {
      return "H";
    }

    return "";
  }

  /* =======================================================
     GET RESULT
  ======================================================= */

  function findResult(
    test,
    parameter,
    index,
    testIndex
  ) {
    const testId =
      test?.id ??
      test?.testId ??
      `test-${testIndex}`;

    const name =
      typeof parameter ===
      "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          `parameter-${index}`;

    const possibleKeys = [
      `${testId}-${name}-${index}`,
      `${testId}-${name}`,
      `${testIndex}-${name}-${index}`,
      name,
      parameter?.id,
    ].filter(Boolean);

    for (const key of possibleKeys) {
      if (
        results &&
        Object.prototype.hasOwnProperty.call(
          results,
          key
        )
      ) {
        return results[key];
      }
    }

    if (
      parameter &&
      typeof parameter === "object"
    ) {
      if (
        parameter.result !==
        undefined
      ) {
        return parameter.result;
      }

      if (
        parameter.value !==
        undefined
      ) {
        return parameter.value;
      }
    }

    return "";
  }

  /* =======================================================
     BUILD TESTS
  ======================================================= */

  const finalTests = useMemo(() => {
    if (
      !Array.isArray(
        selectedTests
      )
    ) {
      return [];
    }

    return selectedTests.map(
      (
        test,
        testIndex
      ) => {
        const parameters =
          test?.parameters ||
          test?.tests ||
          test?.items ||
          [];

        return {
          id:
            test?.id ||
            test?.testId ||
            `test-${testIndex}`,

          name:
            test?.name ||
            test?.testName ||
            "Laboratory Investigation",

          category:
            test?.category ||
            test?.department ||
            "PATHOLOGY",

          parameters:
            Array.isArray(
              parameters
            )
              ? parameters.map(
                  (
                    parameter,
                    index
                  ) => {
                    const info =
                      parameterInfo(
                        parameter
                      );

                    const value =
                      findResult(
                        test,
                        parameter,
                        index,
                        testIndex
                      );

                    return {
                      ...info,
                      result:
                        value === null ||
                        value === undefined
                          ? ""
                          : value,
                      flag:
                        calculateFlag(
                          value,
                          parameter
                        ),
                    };
                  }
                )
              : [],
        };
      }
    );
  }, [
    selectedTests,
    results,
    gender,
  ]);

  /* =======================================================
     PRINT
  ======================================================= */

  function printReport() {
    window.print();
  }

  /* =======================================================
     NEW PATIENT
  ======================================================= */

  function newPatient() {
    const ok =
      window.confirm(
        "Current report clear karke New Patient start karein?"
      );

    if (!ok) return;

    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanCurrentReportNo",
    ].forEach((key) =>
      localStorage.removeItem(
        key
      )
    );

    router.push("/patients");
  }

  return (
    <>
      {/* ===================================================
          TOP CONTROL BAR
      =================================================== */}

      <div className="screenToolbar">

        <div className="toolbarTitle">
          <div className="miniLogo">
            N
          </div>

          <div>
            <b>
              Final Laboratory Report
            </b>

            <span>
              Report No: {reportNo}
            </span>
          </div>
        </div>

        <div className="toolbarButtons">

          <button
            onClick={() =>
              router.push(
                "/results"
              )
            }
            className="btn edit"
          >
            ← Edit Results
          </button>

          <button
            onClick={
              printReport
            }
            className="btn print"
          >
            🖨 Print / Save PDF
          </button>

          <button
            onClick={
              newPatient
            }
            className="btn new"
          >
            + New Patient
          </button>

        </div>
      </div>

      {/* ===================================================
          REPORT
      =================================================== */}

      <div className="previewArea">

        <div className="reportPage">

          {/* ================================================
              HEADER
          ================================================= */}

          <header className="labHeader">

            <div className="brandSection">

              {/* ORIGINAL CSS LOGO */}
              <div className="labLogo">

                <div className="logoCircle">
                  <span>
                    N
                  </span>

                  <i />
                  <i />
                  <i />
                </div>

              </div>

              <div className="labIdentity">

                <h1>
                  NIDAN PATHOLOGY LAB
                </h1>

                <div className="labSubtitle">
                  {LAB.subtitle}
                </div>

                <div className="labSlogan">
                  {LAB.slogan}
                </div>

              </div>

            </div>

            <div className="contactSection">

              <div className="reportHeading">
                LABORATORY REPORT
              </div>

              <div className="contactLine">
                ☎ {LAB.phone}
              </div>

              <div className="contactLine">
                📍 {LAB.address}
              </div>

              <div className="contactLine">
                Report No: <b>{reportNo}</b>
              </div>

            </div>

          </header>

          <div className="headerAccent">
            <span />
            <span />
            <span />
          </div>

          {/* ================================================
              PATIENT CARD
          ================================================= */}

          <section className="patientCard">

            <div className="cardTitle">
              <span className="titleIcon">
                P
              </span>

              PATIENT INFORMATION
            </div>

            <div className="patientGrid">

              <Info
                label="Patient Name"
                value={patientName}
                strong
              />

              <Info
                label="Patient ID"
                value={patientId}
              />

              <Info
                label="Age / Sex"
                value={`${age} / ${gender}`}
              />

              <Info
                label="Mobile"
                value={mobile}
              />

              <Info
                label="Referred By"
                value={doctor}
              />

              <Info
                label="Collection Date"
                value={sampleDate}
              />

              <Info
                label="Report Date"
                value={reportDate}
              />

              <Info
                label="Report Status"
                value="FINAL"
                status
              />

            </div>
          </section>

          {/* ================================================
              TESTS
          ================================================= */}

          <main className="testContainer">

            {finalTests.length === 0 ? (
              <div className="emptyReport">
                No laboratory investigation
                available.
              </div>
            ) : (
              finalTests.map(
                (
                  test,
                  testIndex
                ) => (
                  <TestSection
                    key={
                      test.id ||
                      testIndex
                    }
                    test={test}
                  />
                )
              )
            )}

          </main>

          {/* ================================================
              SIGNATURES
          ================================================= */}

          <section className="signatureSection">

            <div className="signatureBox">
              <div className="signSpace" />

              <div className="signLine" />

              <b>
                Lab Technician
              </b>

              <span>
                NIDAN PATHOLOGY LAB
              </span>
            </div>

            <div className="signatureBox">
              <div className="signSpace" />

              <div className="signLine" />

              <b>
                Authorized Signatory
              </b>

              <span>
                Signature & Seal
              </span>
            </div>

          </section>

          {/* ================================================
              NOTE
          ================================================= */}

          <div className="reportNote">
            <b>Note:</b>{" "}
            Reference ranges may vary according
            to laboratory methodology, age and
            clinical conditions. Results should
            be interpreted by a qualified
            healthcare professional along with
            relevant clinical findings.
          </div>

          {/* ================================================
              FOOTER
          ================================================= */}

          <footer className="labFooter">

            <div className="footerName">
              NIDAN PATHOLOGY LAB
            </div>

            <div className="footerSlogan">
              {LAB.slogan}
            </div>

            <div className="footerContact">
              {LAB.phone} &nbsp; | &nbsp;
              {LAB.address}
            </div>

            <div className="pageNumber">
              Page 1
            </div>

          </footer>

        </div>
      </div>

      {/* ===================================================
          STYLES
      =================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #edf2f7;
          color: #172033;
          font-family:
            Arial,
            Helvetica,
            sans-serif;
        }

        /* ==================================================
           TOOLBAR
        ================================================== */

        .screenToolbar {
          width: 100%;
          max-width: 1200px;

          margin: 8px auto 6px;

          padding: 8px 12px;

          background: #ffffff;

          border: 1px solid #dce5ed;

          border-radius: 9px;

          display: flex;
          justify-content: space-between;
          align-items: center;

          gap: 12px;

          box-shadow:
            0 3px 15px
            rgba(
              15,
              23,
              42,
              .07
            );
        }

        .toolbarTitle {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .toolbarTitle b {
          display: block;
          font-size: 12px;
        }

        .toolbarTitle span {
          display: block;
          margin-top: 2px;
          font-size: 7px;
          color: #64748b;
        }

        .miniLogo {
          width: 32px;
          height: 32px;

          border-radius: 9px;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6476
            );

          color: white;

          display: flex;
          align-items: center;
          justify-content: center;

          font-size: 16px;
          font-weight: 900;
        }

        .toolbarButtons {
          display: flex;
          gap: 6px;
        }

        .btn {
          border-radius: 6px;

          padding: 7px 11px;

          font-size: 8px;

          font-weight: 800;

          cursor: pointer;

          background: white;
        }

        .btn.edit {
          border: 1px solid #cbd5e1;
          color: #334155;
        }

        .btn.print {
          color: white;

          border: 1px solid #087f72;

          background:
            linear-gradient(
              135deg,
              #087f72,
              #0b6476
            );
        }

        .btn.new {
          color: #dc2626;

          border:
            1px solid #fecaca;
        }

        /* ==================================================
           PREVIEW
        ================================================== */

        .previewArea {
          width: 100%;

          min-height: 100vh;

          padding:
            12px 10px 30px;

          display: flex;
          justify-content: center;

          background:
            linear-gradient(
              180deg,
              #edf2f7,
              #e7edf4
            );
        }

        /* ==================================================
           A4
        ================================================== */

        .reportPage {
          position: relative;

          width: 210mm;

          min-height: 297mm;

          padding:
            0 12mm 27mm;

          background: white;

          box-shadow:
            0 15px 40px
            rgba(
              15,
              23,
              42,
              .15
            );

          overflow: hidden;
        }

        /* ==================================================
           LAB HEADER
        ================================================== */

        .labHeader {
          min-height: 39mm;

          padding-top: 8mm;

          display: flex;

          justify-content:
            space-between;

          align-items:
            center;

          gap: 8mm;
        }

        .brandSection {
          display: flex;

          align-items: center;

          gap: 5mm;

          min-width: 0;
        }

        /* ==================================================
           LOGO
        ================================================== */

        .labLogo {
          flex-shrink: 0;
        }

        .logoCircle {
          position: relative;

          width: 25mm;
          height: 25mm;

          border-radius: 50%;

          border:
            2px solid #087f72;

          background:
            linear-gradient(
              145deg,
              #f0fdfa,
              #ffffff
            );

          display: flex;

          align-items: center;

          justify-content: center;

          box-shadow:
            inset 0 0 0 3px
            #d8f3ee,
            0 3px 8px
            rgba(
              8,
              127,
              114,
              .13
            );
        }

        .logoCircle span {
          font-size: 22px;

          font-weight: 950;

          color: #087f72;

          z-index: 2;

          font-family:
            Arial,
            sans-serif;
        }

        .logoCircle i {
          position: absolute;

          display: block;

          width: 18mm;

          height: 1px;

          background: #f0b429;

          transform-origin:
            center;
        }

        .logoCircle i:nth-child(2) {
          transform:
            rotate(35deg);
        }

        .logoCircle i:nth-child(3) {
          transform:
            rotate(-35deg);
        }

        .logoCircle i:nth-child(4) {
          width: 13mm;

          transform:
            rotate(90deg);
        }

        /* ==================================================
           LAB IDENTITY
        ================================================== */

        .labIdentity h1 {
          margin: 0;

          font-size: 25px;

          line-height: 1;

          letter-spacing:
            .4px;

          font-weight: 950;

          color: #101828;
        }

        .labSubtitle {
          margin-top: 3px;

          font-size: 9px;

          font-weight: 800;

          color: #087f72;

          letter-spacing:
            .7px;

          text-transform:
            uppercase;
        }

        .labSlogan {
          margin-top: 5px;

          font-size: 8px;

          font-weight: 700;

          color: #64748b;

          letter-spacing:
            .2px;
        }

        /* ==================================================
           CONTACT
        ================================================== */

        .contactSection {
          width: 67mm;

          text-align: right;

          color: #475569;

          font-size: 7px;

          line-height: 1.45;
        }

        .reportHeading {
          display: inline-block;

          margin-bottom: 3px;

          padding:
            3px 7px;

          border-radius: 4px;

          background: #e9f8f5;

          color: #087f72;

          font-size: 7px;

          font-weight: 900;

          letter-spacing:
            .8px;
        }

        .contactLine {
          overflow-wrap:
            anywhere;
        }

        /* ==================================================
           ACCENT
        ================================================== */

        .headerAccent {
          height: 2px;

          display: flex;

          gap: 3px;

          margin-bottom: 6mm;
        }

        .headerAccent span:nth-child(1) {
          flex: 4;

          background: #087f72;
        }

        .headerAccent span:nth-child(2) {
          flex: 1;

          background: #f0b429;
        }

        .headerAccent span:nth-child(3) {
          flex: 7;

          background: #dce7ed;
        }

        /* ==================================================
           PATIENT CARD
        ================================================== */

        .patientCard {
          border:
            1px solid #d6e0e7;

          border-radius: 6px;

          overflow: hidden;

          margin-bottom: 6mm;

          box-shadow:
            0 2px 7px
            rgba(
              15,
              23,
              42,
              .04
            );
        }

        .cardTitle {
          height: 9mm;

          display: flex;

          align-items: center;

          gap: 6px;

          padding:
            0 4mm;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0b6e7d
            );

          color: white;

          font-size: 8px;

          font-weight: 900;

          letter-spacing:
            .7px;
        }

        .titleIcon {
          width: 18px;
          height: 18px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(
              255,
              255,
              255,
              .18
            );

          font-size: 8px;
        }

        .patientGrid {
          display: grid;

          grid-template-columns:
            repeat(
              4,
              1fr
            );
        }

        .infoCell {
          min-height: 13mm;

          padding:
            3mm 3.5mm;

          border-right:
            1px solid #e1e7ec;

          border-bottom:
            1px solid #e1e7ec;

          background: white;
        }

        .infoCell:nth-child(4n) {
          border-right: 0;
        }

        .infoCell:nth-last-child(-n + 4) {
          border-bottom: 0;
        }

        .infoLabel {
          display: block;

          margin-bottom: 2px;

          font-size: 6px;

          font-weight: 800;

          color: #7a8796;

          text-transform:
            uppercase;

          letter-spacing:
            .3px;
        }

        .infoValue {
          display: block;

          font-size: 8px;

          font-weight: 700;

          color: #172033;

          overflow-wrap:
            anywhere;
        }

        .infoValue.strong {
          font-size: 9px;

          font-weight: 900;

          color: #0f2935;
        }

        .infoValue.status {
          color: #15803d;
        }

        /* ==================================================
           TEST
        ================================================== */

        .testContainer {
          display: flex;

          flex-direction: column;

          gap: 6mm;
        }

        .testSection {
          break-inside: avoid;

          page-break-inside:
            avoid;
        }

        .testHeader {
          display: flex;

          align-items: center;

          gap: 3mm;

          margin-bottom: 2.5mm;
        }

        .departmentTag {
          padding:
            3px 7px;

          border-radius: 3px;

          background: #e9f8f5;

          color: #087f72;

          font-size: 6px;

          font-weight: 900;

          letter-spacing:
            .7px;

          white-space:
            nowrap;
        }

        .testTitle {
          flex: 1;

          font-size: 11px;

          font-weight: 950;

          color: #111827;

          letter-spacing:
            .1px;
        }

        .testHeaderLine {
          width: 25mm;

          height: 1px;

          background:
            linear-gradient(
              90deg,
              #087f72,
              transparent
            );
        }

        /* ==================================================
           TABLE
        ================================================== */

        .labTable {
          width: 100%;

          border-collapse:
            separate;

          border-spacing: 0;

          border:
            1px solid #cfd9e1;

          border-radius: 5px;

          overflow: hidden;

          table-layout: fixed;
        }

        .labTable th {
          padding:
            3mm 2mm;

          background:
            linear-gradient(
              180deg,
              #f2f7f9,
              #e8f0f3
            );

          border-right:
            1px solid #d5dfe6;

          border-bottom:
            1px solid #cbd6de;

          color: #334155;

          font-size: 7px;

          font-weight: 900;

          text-transform:
            uppercase;

          text-align: center;
        }

        .labTable th:last-child {
          border-right: 0;
        }

        .labTable td {
          padding:
            2.5mm 2.5mm;

          border-right:
            1px solid #e1e7ec;

          border-bottom:
            1px solid #e5eaee;

          font-size: 8px;

          color: #263341;

          background: white;

          vertical-align:
            middle;
        }

        .labTable tr:last-child td {
          border-bottom: 0;
        }

        .labTable td:last-child {
          border-right: 0;
        }

        .labTable tbody tr:nth-child(even) td {
          background: #fbfcfd;
        }

        .investigation {
          width: 31%;

          font-weight: 700;
        }

        .flag {
          width: 9%;

          text-align: center;
        }

        .result {
          width: 18%;

          text-align: center;
        }

        .reference {
          width: 27%;

          text-align: center;
        }

        .unit {
          width: 15%;

          text-align: center;
        }

        /* ==================================================
           RESULT
        ================================================== */

        .resultValue {
          display: inline-flex;

          min-width: 28mm;

          min-height: 9mm;

          align-items: center;

          justify-content: center;

          padding:
            1.5mm 3mm;

          border-radius: 4px;

          background:
            #f4f8fa;

          color: #101828;

          font-size: 10px;

          font-weight: 950;

          letter-spacing:
            .2px;
        }

        .resultValue.abnormal {
          color: #b42318;

          background:
            #fff3f2;

          border:
            1px solid #fecdca;
        }

        .flagBadge {
          display: inline-flex;

          align-items: center;

          justify-content: center;

          width: 18px;
          height: 18px;

          border-radius: 4px;

          font-size: 7px;

          font-weight: 950;
        }

        .flagBadge.high {
          color: #b42318;

          background:
            #fee4e2;

          border:
            1px solid #fecdca;
        }

        .flagBadge.low {
          color: #175cd3;

          background:
            #eff8ff;

          border:
            1px solid #b2ddff;
        }

        .normalDot {
          color: #16a34a;

          font-size: 12px;

          font-weight: 900;
        }

        /* ==================================================
           SIGNATURE
        ================================================== */

        .signatureSection {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 35mm;

          margin-top: 10mm;

          break-inside: avoid;
        }

        .signatureBox {
          text-align: center;
        }

        .signSpace {
          height: 9mm;
        }

        .signLine {
          border-top:
            1px solid #667085;

          margin-bottom: 2mm;
        }

        .signatureBox b {
          display: block;

          font-size: 7px;

          color: #1d2939;
        }

        .signatureBox span {
          display: block;

          margin-top: 1px;

          font-size: 5.5px;

          color: #667085;
        }

        /* ==================================================
           NOTE
        ================================================== */

        .reportNote {
          margin-top: 5mm;

          padding:
            2.5mm 3mm;

          border:
            1px solid #d9e2e8;

          border-radius: 4px;

          background:
            #f8fafb;

          color: #667085;

          font-size: 5.8px;

          line-height: 1.5;
        }

        .reportNote b {
          color: #344054;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .labFooter {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          min-height: 17mm;

          padding:
            3mm 12mm;

          background:
            linear-gradient(
              180deg,
              #f8fafb,
              #eef3f5
            );

          border-top:
            1px solid #d8e1e6;

          text-align: center;
        }

        .footerName {
          font-size: 8px;

          font-weight: 950;

          color: #087f72;

          letter-spacing:
            .8px;
        }

        .footerSlogan {
          margin-top: 1px;

          font-size: 5.5px;

          color: #667085;

          font-weight: 700;
        }

        .footerContact {
          margin-top: 2px;

          font-size: 5px;

          color: #98a2b3;
        }

        .pageNumber {
          position: absolute;

          right: 8mm;
          bottom: 5mm;

          font-size: 5px;

          color: #98a2b3;
        }

        /* ==================================================
           EMPTY
        ================================================== */

        .emptyReport {
          padding: 25mm;

          text-align: center;

          color: #667085;

          font-size: 10px;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (
          max-width: 700px
        ) {

          .screenToolbar {
            margin:
              5px;

            flex-direction:
              column;

            align-items:
              stretch;
          }

          .toolbarButtons {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .btn.print {
            grid-column:
              span 2;
          }

          .previewArea {
            padding: 8px 4px 25px;
          }

          .reportPage {
            width:
              calc(
                100vw - 8px
              );

            min-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            padding-left:
              5.5mm;

            padding-right:
              5.5mm;

            padding-bottom:
              20mm;
          }

          .labHeader {
            min-height:
              30mm;

            padding-top:
              5mm;

            gap: 3mm;
          }

          .logoCircle {
            width: 17mm;
            height: 17mm;
          }

          .logoCircle span {
            font-size: 16px;
          }

          .labIdentity h1 {
            font-size: 14px;
          }

          .labSubtitle {
            font-size: 5px;
          }

          .labSlogan {
            font-size: 4.5px;
          }

          .contactSection {
            width: 42mm;

            font-size: 4.5px;
          }

          .reportHeading {
            font-size: 4.5px;
          }

          .patientGrid {
            grid-template-columns:
              repeat(
                2,
                1fr
              );
          }

          .infoCell:nth-child(4n) {
            border-right:
              1px solid #e1e7ec;
          }

          .infoCell:nth-child(2n) {
            border-right: 0;
          }

          .infoCell:nth-last-child(-n + 4) {
            border-bottom:
              1px solid #e1e7ec;
          }

          .infoCell:nth-last-child(-n + 2) {
            border-bottom: 0;
          }

          .infoLabel {
            font-size: 4px;
          }

          .infoValue {
            font-size: 5.5px;
          }

          .infoValue.strong {
            font-size: 6px;
          }

          .cardTitle {
            height: 6mm;

            font-size: 5px;
          }

          .testTitle {
            font-size: 7px;
          }

          .departmentTag {
            font-size: 4px;
          }

          .labTable th {
            font-size: 4px;

            padding:
              1.7mm 1mm;
          }

          .labTable td {
            font-size: 4.7px;

            padding:
              1.7mm 1mm;
          }

          .resultValue {
            min-width: 16mm;

            min-height: 6mm;

            font-size: 6px;

            padding:
              1mm 1.5mm;
          }

          .flagBadge {
            width: 12px;
            height: 12px;

            font-size: 5px;
          }

          .signatureSection {
            gap: 15mm;

            margin-top: 5mm;
          }

          .signatureBox b {
            font-size: 4.5px;
          }

          .signatureBox span {
            font-size: 3.5px;
          }

          .reportNote {
            font-size: 3.5px;
          }

          .footerName {
            font-size: 5px;
          }

          .footerSlogan {
            font-size: 3.5px;
          }

          .footerContact {
            font-size: 3px;
          }
        }

        /* ==================================================
           PRINT / PDF
        ================================================== */

        @media print {

          @page {
            size: A4 portrait;

            margin: 0;
          }

          html,
          body {
            margin: 0 !important;

            padding: 0 !important;

            width: 210mm !important;

            background:
              white !important;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .screenToolbar {
            display: none !important;
          }

          .previewArea {
            display: block !important;

            padding: 0 !important;

            margin: 0 !important;

            background:
              white !important;
          }

          .reportPage {
            width: 210mm !important;

            min-height:
              297mm !important;

            height:
              297mm !important;

            margin: 0 !important;

            box-shadow: none !important;

            overflow: hidden !important;

            page-break-after: always;

            break-after: page;

            -webkit-print-color-adjust:
              exact !important;

            print-color-adjust:
              exact !important;
          }

          .testSection,
          .patientCard,
          .signatureSection,
          .reportNote {
            break-inside:
              avoid !important;

            page-break-inside:
              avoid !important;
          }
        }

      `}</style>
    </>
  );
}

/* =========================================================
   INFO COMPONENT
========================================================= */

function Info({
  label,
  value,
  strong,
  status,
}) {
  return (
    <div className="infoCell">

      <span className="infoLabel">
        {label}
      </span>

      <span
        className={`infoValue ${
          strong
            ? "strong"
            : ""
        } ${
          status
            ? "status"
            : ""
        }`}
      >
        {value || "-"}
      </span>

    </div>
  );
}

/* =========================================================
   TEST SECTION
========================================================= */

function TestSection({
  test,
}) {
  return (
    <section className="testSection">

      <div className="testHeader">

        <div className="departmentTag">
          {String(
            test.category ||
              "PATHOLOGY"
          ).toUpperCase()}
        </div>

        <div className="testTitle">
          {test.name}
        </div>

        <div className="testHeaderLine" />

      </div>

      <table className="labTable">

        <colgroup>
          <col className="investigation" />
          <col className="flag" />
          <col className="result" />
          <col className="reference" />
          <col className="unit" />
        </colgroup>

        <thead>

          <tr>
            <th>
              Investigation
            </th>

            <th>
              Flag
            </th>

            <th>
              Result
            </th>

            <th>
              Reference Range
            </th>

            <th>
              Unit
            </th>
          </tr>

        </thead>

        <tbody>

          {(test.parameters || []).map(
            (
              parameter,
              index
            ) => {

              const abnormal =
                parameter.flag ===
                  "H" ||
                parameter.flag ===
                  "L";

              const value =
                parameter.result ===
                  "" ||
                parameter.result ===
                  null ||
                parameter.result ===
                  undefined
                  ? "-"
                  : parameter.result;

              return (
                <tr
                  key={index}
                >

                  <td>
                    {parameter.name}
                  </td>

                  <td
                    className="flag"
                  >
                    {parameter.flag ===
                    "H" ? (
                      <span className="flagBadge high">
                        H
                      </span>
                    ) : parameter.flag ===
                      "L" ? (
                      <span className="flagBadge low">
                        L
                      </span>
                    ) : (
                      <span className="normalDot">
                        •
                      </span>
                    )}
                  </td>

                  <td
                    className="result"
                  >
                    <span
                      className={`resultValue ${
                        abnormal
                          ? "abnormal"
                          : ""
                      }`}
                    >
                      {value}
                    </span>
                  </td>

                  <td className="reference">
                    {parameter.range ||
                      "-"}
                  </td>

                  <td className="unit">
                    {parameter.unit ||
                      "-"}
                  </td>

                </tr>
              );
            }
          )}

        </tbody>

      </table>

    </section>
  );
}
