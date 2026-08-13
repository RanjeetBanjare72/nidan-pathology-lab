"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/* =========================================================
   NIDAN PATHOLOGY LAB
   PROFESSIONAL A4 REPORT - SINGLE PAGE
========================================================= */

const LAB = {
  name: "NIDAN PATHOLOGY LAB",
  subtitle: "DIAGNOSTIC & PATHOLOGY LABORATORY",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
  phone: "7987580004, 8889325233",
  address:
    "Gram/Singhanpur, Tehsil Sarangarh, District Sarangarh-Bilaigarh, Chhattisgarh",
};

/* =========================================================
   MAIN REPORT PAGE
========================================================= */

export default function ReportPage() {
  const router = useRouter();

  const [patient, setPatient] = useState({});
  const [selectedTests, setSelectedTests] = useState([]);
  const [results, setResults] = useState({});
  const [reportNo, setReportNo] = useState("");
  const [reportDate, setReportDate] = useState("");

  useEffect(() => {
    loadReport();
  }, []);

  /* =======================================================
     LOCAL STORAGE READER
  ======================================================= */

  function readJSON(keys) {
    for (const key of keys) {
      try {
        const value = localStorage.getItem(key);

        if (value) {
          return JSON.parse(value);
        }
      } catch (error) {
        console.log("Storage read error:", key);
      }
    }

    return null;
  }

  /* =======================================================
     LOAD REPORT
  ======================================================= */

  function loadReport() {
    const p = readJSON([
      "nidanPatient",
      "patient",
      "currentPatient",
    ]);

    const tests = readJSON([
      "nidanSelectedTests",
      "selectedTests",
      "selected_tests",
    ]);

    const r = readJSON([
      "nidanResults",
      "results",
      "testResults",
    ]);

    setPatient(p || {});
    setSelectedTests(Array.isArray(tests) ? tests : []);
    setResults(r || {});

    let rn = localStorage.getItem("nidanCurrentReportNo");

    if (!rn) {
      rn =
        "NPL-" +
        Date.now()
          .toString()
          .slice(-8);

      localStorage.setItem(
        "nidanCurrentReportNo",
        rn
      );
    }

    setReportNo(rn);

    setReportDate(
      new Date().toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      })
    );
  }

  /* =======================================================
     PATIENT DATA
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

  const referredBy =
    patient?.doctor ||
    patient?.referredBy ||
    patient?.refDoctor ||
    "Self";

  const collectionDate =
    patient?.sampleDate ||
    patient?.collectionDate ||
    reportDate;

  /* =======================================================
     NORMALIZE TEST NAME
  ======================================================= */

  function normalize(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[()]/g, "")
      .replace(/[-_/]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  /* =======================================================
     REFERENCE RANGES
  ======================================================= */

  function getReference(name) {
    const n = normalize(name);

    const isMale =
      String(gender).toLowerCase() === "male" ||
      String(gender).toLowerCase() === "m";

    if (
      n.includes("haemoglobin") ||
      n.includes("hemoglobin") ||
      n === "hb"
    ) {
      return isMale
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
      return isMale
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
      return isMale
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

    if (n === "rdw cv") {
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
        max: 0.40,
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
      n.includes("fasting blood sugar") ||
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
      n.includes("random blood sugar") ||
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
      return isMale
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
     PARAMETER INFORMATION
  ======================================================= */

  function parameterInfo(parameter) {
    if (
      typeof parameter === "string"
    ) {
      const ref =
        getReference(parameter);

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
      getReference(name);

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
     FLAG CALCULATOR
  ======================================================= */

  function getFlag(value, parameter) {
    if (
      value === "" ||
      value === null ||
      value === undefined
    ) {
      return "";
    }

    const p =
      parameterInfo(parameter);

    const num = Number(
      String(value)
        .replace(/,/g, "")
        .trim()
    );

    if (Number.isNaN(num)) {
      return "";
    }

    if (
      p.min !== null &&
      p.min !== undefined &&
      num < Number(p.min)
    ) {
      return "L";
    }

    if (
      p.max !== null &&
      p.max !== undefined &&
      num > Number(p.max)
    ) {
      return "H";
    }

    return "";
  }

  /* =======================================================
     RESULT FINDER
  ======================================================= */

  function getResult(
    test,
    parameter,
    index,
    testIndex
  ) {
    const testId =
      test?.id ||
      test?.testId ||
      `test-${testIndex}`;

    const name =
      typeof parameter === "string"
        ? parameter
        : parameter?.name ||
          parameter?.testName ||
          parameter?.investigation ||
          `parameter-${index}`;

    const keys = [
      `${testId}-${name}-${index}`,
      `${testId}-${name}`,
      `${testIndex}-${name}-${index}`,
      name,
      parameter?.id,
    ].filter(Boolean);

    for (const key of keys) {
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
        parameter.result !== undefined
      ) {
        return parameter.result;
      }

      if (
        parameter.value !== undefined
      ) {
        return parameter.value;
      }
    }

    return "";
  }

  /* =======================================================
     FINAL TEST DATA
  ======================================================= */

  const finalTests = useMemo(() => {
    if (
      !Array.isArray(selectedTests)
    ) {
      return [];
    }

    return selectedTests.map(
      (test, testIndex) => {
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
            Array.isArray(parameters)
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
                      getResult(
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
                        getFlag(
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
    const ok = window.confirm(
      "Current report clear karke New Patient start karein?"
    );

    if (!ok) return;

    [
      "nidanPatient",
      "nidanSelectedTests",
      "nidanResults",
      "nidanCurrentReportNo",
    ].forEach((key) => {
      localStorage.removeItem(key);
    });

    router.push("/patients");
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <>
      {/* ===================================================
          SCREEN TOOLBAR
      =================================================== */}

      <div className="screenToolbar">
        <div className="toolbarLeft">
          <div className="smallLogo">
            N
          </div>

          <div>
            <strong>
              Final Laboratory Report
            </strong>

            <small>
              Report No: {reportNo}
            </small>
          </div>
        </div>

        <div className="toolbarActions">
          <button
            className="btn btnEdit"
            onClick={() =>
              router.push("/results")
            }
          >
            ← Edit Results
          </button>

          <button
            className="btn btnPrint"
            onClick={printReport}
          >
            🖨 Print / Save PDF
          </button>

          <button
            className="btn btnNew"
            onClick={newPatient}
          >
            + New Patient
          </button>
        </div>
      </div>

      {/* ===================================================
          REPORT PREVIEW
      =================================================== */}

      <div className="preview">
        <div className="a4Page">

          {/* =================================================
              PROFESSIONAL HEADER
          ================================================= */}

          <header className="labHeader">

            <div className="brand">

              <div className="mainLogo">
                <span>N</span>

                <div className="logoRay r1" />
                <div className="logoRay r2" />
                <div className="logoRay r3" />
                <div className="logoRay r4" />
              </div>

              <div className="brandText">

                <h1>
                  {LAB.name}
                </h1>

                <h2>
                  {LAB.subtitle}
                </h2>

                <p>
                  {LAB.slogan}
                </p>

              </div>

            </div>

            <div className="headerRight">

              <div className="reportLabel">
                LABORATORY REPORT
              </div>

              <div>
                ☎ {LAB.phone}
              </div>

              <div className="address">
                📍 {LAB.address}
              </div>

              <div>
                Report No:{" "}
                <b>{reportNo}</b>
              </div>

            </div>

          </header>

          <div className="accentBar">
            <span />
            <b />
            <i />
          </div>

          {/* =================================================
              PATIENT INFORMATION
          ================================================= */}

          <section className="patientCard">

            <div className="sectionBar">
              <span className="circleP">
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
                value={referredBy}
              />

              <Info
                label="Collection Date"
                value={collectionDate}
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

          {/* =================================================
              TESTS
          ================================================= */}

          <main className="tests">

            {finalTests.length === 0 ? (
              <div className="noTest">
                No laboratory investigation available.
              </div>
            ) : (
              finalTests.map(
                (test, index) => (
                  <TestSection
                    key={
                      test.id ||
                      index
                    }
                    test={test}
                  />
                )
              )
            )}

          </main>

          {/* =================================================
              SIGNATURES
              NOTE:
              NO HORIZONTAL SIGNATURE LINE
          ================================================= */}

          <section className="signatures">

            <div className="signature">

              <div className="signatureSpace" />

              <strong>
                Lab Technician
              </strong>

              <small>
                NIDAN PATHOLOGY LAB
              </small>

            </div>

            <div className="signature">

              <div className="signatureSpace" />

              <strong>
                Authorized Signatory
              </strong>

              <small>
                Signature & Seal
              </small>

            </div>

          </section>

          {/* =================================================
              NOTE
          ================================================= */}

          <div className="note">
            <b>Note:</b>{" "}
            Reference ranges may vary according
            to laboratory methodology, age and
            clinical condition. Results should
            be interpreted by a qualified
            healthcare professional.
          </div>

          {/* =================================================
              FOOTER
          ================================================= */}

          <footer className="footer">

            <strong>
              {LAB.name}
            </strong>

            <span>
              {LAB.slogan}
            </span>

            <small>
              {LAB.phone} &nbsp; | &nbsp;
              {LAB.address}
            </small>

            <em>
              Page 1
            </em>

          </footer>

        </div>
      </div>

      {/* ===================================================
          ALL CSS
      =================================================== */}

      <style jsx global>{`

        * {
          box-sizing: border-box;
        }

        html,
        body {
          margin: 0;
          padding: 0;
          background: #edf2f6;
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
          max-width: 1200px;
          margin: 8px auto;
          padding: 8px 12px;
          background: #ffffff;
          border: 1px solid #dce4ea;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          box-shadow:
            0 2px 12px rgba(16,24,40,.06);
        }

        .toolbarLeft {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .smallLogo {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #087f72;
          color: #ffffff;
          font-size: 15px;
          font-weight: 900;
        }

        .toolbarLeft strong {
          display: block;
          font-size: 12px;
        }

        .toolbarLeft small {
          display: block;
          margin-top: 2px;
          font-size: 7px;
          color: #667085;
        }

        .toolbarActions {
          display: flex;
          gap: 6px;
        }

        .btn {
          border-radius: 6px;
          padding: 7px 11px;
          background: #ffffff;
          font-size: 8px;
          font-weight: 800;
          cursor: pointer;
        }

        .btnEdit {
          border: 1px solid #d0d5dd;
          color: #344054;
        }

        .btnPrint {
          border: 1px solid #087f72;
          background: #087f72;
          color: #ffffff;
        }

        .btnNew {
          border: 1px solid #f3c4c4;
          color: #b42318;
        }

        /* ==================================================
           PREVIEW
        ================================================== */

        .preview {
          min-height: 100vh;
          padding: 15px 10px 40px;
          display: flex;
          justify-content: center;
          background:
            linear-gradient(
              180deg,
              #edf2f6,
              #e7edf2
            );
        }

        /* ==================================================
           A4 PAGE
        ================================================== */

        .a4Page {
          position: relative;
          width: 210mm;
          height: 297mm;
          min-height: 297mm;
          max-height: 297mm;

          padding:
            0 11mm 19mm;

          background: #ffffff;

          overflow: hidden;

          box-shadow:
            0 15px 40px
            rgba(16,24,40,.14);
        }

        /* ==================================================
           HEADER
        ================================================== */

        .labHeader {
          height: 34mm;
          padding-top: 6.5mm;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 7mm;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 4mm;
          min-width: 0;
        }

        /* PROFESSIONAL ROUND LOGO */

        .mainLogo {
          position: relative;

          width: 22mm;
          height: 22mm;

          flex-shrink: 0;

          border:
            1.5px solid #087f72;

          border-radius: 50%;

          background:
            radial-gradient(
              circle,
              #ffffff 42%,
              #eefaf8 100%
            );

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            inset 0 0 0 2px #d9f1ec;
        }

        .mainLogo span {
          position: relative;
          z-index: 5;

          color: #087f72;

          font-size: 20px;
          font-weight: 950;
        }

        .logoRay {
          position: absolute;

          width: 14mm;
          height: .5px;

          background: #d8b33f;
        }

        .r1 {
          transform: rotate(0deg);
        }

        .r2 {
          transform: rotate(45deg);
        }

        .r3 {
          transform: rotate(90deg);
        }

        .r4 {
          transform: rotate(135deg);
        }

        .brandText h1 {
          margin: 0;

          color: #101828;

          font-size: 21px;
          line-height: 1.05;

          font-weight: 950;

          letter-spacing: .1px;
        }

        .brandText h2 {
          margin: 2px 0 0;

          color: #087f72;

          font-size: 6.5px;

          letter-spacing: .75px;

          font-weight: 900;
        }

        .brandText p {
          margin: 4px 0 0;

          color: #667085;

          font-size: 5.7px;

          font-weight: 700;
        }

        .headerRight {
          width: 66mm;

          text-align: right;

          color: #667085;

          font-size: 5.5px;

          line-height: 1.55;
        }

        .headerRight .address {
          margin-top: 1px;
        }

        .reportLabel {
          display: inline-block;

          margin-bottom: 2px;

          padding: 2px 5px;

          border-radius: 3px;

          background: #e7f7f3;

          color: #087f72;

          font-size: 5.5px;

          font-weight: 950;

          letter-spacing: .55px;
        }

        .accentBar {
          height: 1.3px;

          display: flex;

          margin-bottom: 4mm;

          gap: 2px;
        }

        .accentBar span {
          flex: 4;
          background: #087f72;
        }

        .accentBar b {
          flex: 1;
          background: #d8b33f;
        }

        .accentBar i {
          flex: 7;
          background: #dce5e9;
        }

        /* ==================================================
           PATIENT CARD
        ================================================== */

        .patientCard {
          margin-bottom: 4mm;

          border:
            1px solid #d6e0e5;

          border-radius: 4px;

          overflow: hidden;
        }

        .sectionBar {
          height: 6.5mm;

          padding: 0 3mm;

          display: flex;
          align-items: center;

          gap: 5px;

          color: #ffffff;

          background:
            linear-gradient(
              90deg,
              #087f72,
              #0b6f7d
            );

          font-size: 6px;

          font-weight: 950;

          letter-spacing: .55px;
        }

        .circleP {
          width: 14px;
          height: 14px;

          border-radius: 50%;

          display: flex;
          align-items: center;
          justify-content: center;

          background:
            rgba(255,255,255,.18);

          font-size: 6px;
        }

        .patientGrid {
          display: grid;
          grid-template-columns:
            repeat(4, 1fr);
        }

        .infoCell {
          min-height: 9mm;

          padding:
            2mm 2.7mm;

          border-right:
            1px solid #e3e8ed;

          border-bottom:
            1px solid #e3e8ed;
        }

        .infoCell:nth-child(4n) {
          border-right: 0;
        }

        .infoCell:nth-last-child(-n+4) {
          border-bottom: 0;
        }

        .infoLabel {
          display: block;

          margin-bottom: 1px;

          color: #7a8796;

          font-size: 4.4px;

          font-weight: 800;

          text-transform: uppercase;
        }

        .infoValue {
          display: block;

          color: #172033;

          font-size: 6px;

          font-weight: 700;

          overflow-wrap: anywhere;
        }

        .infoValue.strong {
          font-size: 6.7px;
          font-weight: 950;
        }

        .infoValue.status {
          color: #15803d;
          font-weight: 950;
        }

        /* ==================================================
           TEST AREA
        ================================================== */

        .tests {
          display: flex;
          flex-direction: column;
          gap: 3mm;
        }

        .testSection {
          break-inside: avoid;
          page-break-inside: avoid;
        }

        /* TEST TITLE CLEARLY VISIBLE */

        .testHeader {
          display: flex;

          align-items: center;

          gap: 2.5mm;

          min-height: 7mm;

          margin-bottom: 1.7mm;
        }

        .departmentTag {
          flex-shrink: 0;

          padding:
            2.5px 6px;

          border-radius: 3px;

          background: #e8f7f4;

          color: #087f72;

          font-size: 4.8px;

          font-weight: 950;

          letter-spacing: .5px;
        }

        .testTitleBox {
          flex: 1;

          padding:
            2mm 3mm;

          border-left:
            3px solid #087f72;

          border-radius: 3px;

          background:
            linear-gradient(
              90deg,
              #edf9f7,
              #ffffff
            );

          color: #101828;

          font-size: 9px;

          font-weight: 950;

          letter-spacing: .1px;
        }

        .testLine {
          width: 17mm;
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

          table-layout: fixed;

          border-collapse: separate;

          border-spacing: 0;

          border:
            1px solid #cbd7dd;

          border-radius: 4px;

          overflow: hidden;
        }

        .labTable th {
          height: 6.3mm;

          padding: 1.1mm;

          background:
            linear-gradient(
              180deg,
              #edf5f7,
              #e3edf0
            );

          color: #344054;

          border-right:
            1px solid #d0dbe0;

          border-bottom:
            1px solid #cbd6dc;

          font-size: 5px;

          font-weight: 950;

          text-align: center;

          text-transform: uppercase;

          letter-spacing: .15px;
        }

        .labTable th:last-child {
          border-right: 0;
        }

        .labTable td {
          height: 6.45mm;

          padding:
            1mm 1.7mm;

          color: #273443;

          border-right:
            1px solid #e1e7eb;

          border-bottom:
            1px solid #e5eaee;

          font-size: 5.7px;

          vertical-align: middle;

          background: #ffffff;
        }

        .labTable tbody tr:nth-child(even) td {
          background: #fbfcfd;
        }

        .labTable tr:last-child td {
          border-bottom: 0;
        }

        .labTable td:last-child {
          border-right: 0;
        }

        .investigation {
          width: 30%;
        }

        .flag {
          width: 8%;
          text-align: center;
        }

        .result {
          width: 18%;
          text-align: center;
        }

        .reference {
          width: 29%;
          text-align: center;
        }

        .unit {
          width: 15%;
          text-align: center;
        }

        /* INVESTIGATION NAME - BOLD */

        .investigationText {
          color: #172033;

          font-size: 5.8px;

          font-weight: 850;
        }

        /* ==================================================
           RESULT BOX
        ================================================== */

        .resultBox {
          display: inline-flex;

          min-width: 24mm;

          height: 5.8mm;

          padding:
            1mm 2.5mm;

          align-items: center;
          justify-content: center;

          border-radius: 3px;

          background: #f2f6f9;

          color: #101828;

          font-size: 7.5px;

          font-weight: 950;
        }

        .resultBox.abnormal {
          background: #fff0ef;

          border:
            1px solid #f3c7c4;

          color: #b42318;
        }

        /* ==================================================
           FLAGS
        ================================================== */

        .flagBadge {
          display: inline-flex;

          width: 14px;
          height: 14px;

          align-items: center;
          justify-content: center;

          border-radius: 3px;

          font-size: 5px;

          font-weight: 950;
        }

        .flagHigh {
          color: #b42318;

          background: #fee4e2;

          border:
            1px solid #fecdca;
        }

        .flagLow {
          color: #175cd3;

          background: #eff8ff;

          border:
            1px solid #b2ddff;
        }

        .normalMark {
          color: #159957;

          font-size: 9px;

          font-weight: 900;
        }

        /* ==================================================
           SIGNATURES
           IMPORTANT:
           NO LINE ABOVE TEXT
        ================================================== */

        .signatures {
          display: grid;

          grid-template-columns:
            1fr 1fr;

          gap: 35mm;

          margin-top: 5mm;

          break-inside: avoid;

          page-break-inside: avoid;
        }

        .signature {
          text-align: center;
        }

        .signatureSpace {
          height: 6mm;
        }

        .signature strong {
          display: block;

          color: #172033;

          font-size: 6px;

          font-weight: 800;
        }

        .signature small {
          display: block;

          margin-top: 1px;

          color: #667085;

          font-size: 4.4px;
        }

        /* ==================================================
           NOTE
        ================================================== */

        .note {
          margin-top: 3mm;

          padding:
            1.8mm 2.5mm;

          border:
            1px solid #dbe3e8;

          border-radius: 3px;

          background: #f8fafb;

          color: #667085;

          font-size: 4.4px;

          line-height: 1.35;
        }

        /* ==================================================
           FOOTER
        ================================================== */

        .footer {
          position: absolute;

          left: 0;
          right: 0;
          bottom: 0;

          height: 12mm;

          padding:
            2.3mm 11mm;

          text-align: center;

          border-top:
            1px solid #dce4e8;

          background:
            linear-gradient(
              180deg,
              #f8fafb,
              #eef3f5
            );
        }

        .footer strong {
          display: block;

          color: #087f72;

          font-size: 5.8px;

          font-weight: 950;

          letter-spacing: .55px;
        }

        .footer span {
          display: block;

          margin-top: 1px;

          color: #667085;

          font-size: 3.8px;

          font-weight: 700;
        }

        .footer small {
          display: block;

          margin-top: 1px;

          color: #98a2b3;

          font-size: 3.3px;
        }

        .footer em {
          position: absolute;

          right: 7mm;
          bottom: 3mm;

          color: #98a2b3;

          font-size: 3.3px;

          font-style: normal;
        }

        .noTest {
          padding: 20mm;

          text-align: center;

          color: #667085;

          font-size: 9px;
        }

        /* ==================================================
           MOBILE
        ================================================== */

        @media (max-width: 700px) {

          .screenToolbar {
            margin: 5px;

            flex-direction: column;

            align-items: stretch;
          }

          .toolbarActions {
            display: grid;

            grid-template-columns:
              1fr 1fr;
          }

          .btnPrint {
            grid-column: span 2;
          }

          .preview {
            padding:
              8px 4px 25px;
          }

          .a4Page {
            width:
              calc(100vw - 8px);

            height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            min-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            max-height:
              calc(
                (100vw - 8px)
                * 1.4142857
              );

            padding-left:
              4.5mm;

            padding-right:
              4.5mm;

            padding-bottom:
              15mm;
          }

          .labHeader {
            height: 30mm;

            padding-top: 4.5mm;

            gap: 2.5mm;
          }

          .mainLogo {
            width: 17mm;
            height: 17mm;
          }

          .mainLogo span {
            font-size: 15px;
          }

          .brand {
            gap: 2.5mm;
          }

          .brandText h1 {
            font-size: 12px;
          }

          .brandText h2 {
            font-size: 4px;
          }

          .brandText p {
            font-size: 3.5px;
          }

          .headerRight {
            width: 39mm;

            font-size: 3.4px;
          }

          .reportLabel {
            font-size: 3.7px;
          }

          .patientGrid {
            grid-template-columns:
              repeat(2, 1fr);
          }

          .infoCell {
            min-height: 7.5mm;

            padding:
              1.3mm 1.8mm;
          }

          .infoCell:nth-child(4n) {
            border-right:
              1px solid #e3e8ed;
          }

          .infoCell:nth-child(2n) {
            border-right: 0;
          }

          .infoCell:nth-last-child(-n+4) {
            border-bottom:
              1px solid #e3e8ed;
          }

          .infoCell:nth-last-child(-n+2) {
            border-bottom: 0;
          }

          .sectionBar {
            height: 5.3mm;
            font-size: 4.3px;
          }

          .circleP {
            width: 11px;
            height: 11px;
            font-size: 4.5px;
          }

          .infoLabel {
            font-size: 3.2px;
          }

          .infoValue {
            font-size: 4.5px;
          }

          .infoValue.strong {
            font-size: 5px;
          }

          .testHeader {
            min-height: 5.5mm;
            margin-bottom: 1.3mm;
          }

          .departmentTag {
            font-size: 3.2px;
          }

          .testTitleBox {
            font-size: 6px;
            padding:
              1.5mm 1.8mm;
          }

          .testLine {
            width: 8mm;
          }

          .labTable th {
            height: 5mm;
            padding: .8mm;
            font-size: 3.1px;
          }

          .labTable td {
            height: 5.15mm;
            padding: .7mm .8mm;
            font-size: 3.6px;
          }

          .investigationText {
            font-size: 3.7px;
          }

          .resultBox {
            min-width: 14mm;
            height: 4.5mm;
            font-size: 5px;
          }

          .flagBadge {
            width: 10px;
            height: 10px;
            font-size: 3.5px;
          }

          .normalMark {
            font-size: 6px;
          }

          .signatures {
            gap: 14mm;
            margin-top: 2.5mm;
          }

          .signatureSpace {
            height: 3.5mm;
          }

          .signature strong {
            font-size: 3.8px;
          }

          .signature small {
            font-size: 2.8px;
          }

          .note {
            margin-top: 1.8mm;
            font-size: 2.8px;
          }

          .footer {
            height: 9mm;
            padding: 1.8mm 5mm;
          }

          .footer strong {
            font-size: 4px;
          }

          .footer span {
            font-size: 2.8px;
          }

          .footer small {
            font-size: 2.3px;
          }

          .footer em {
            font-size: 2.3px;
          }
        }

        /* ==================================================
           PRINT - CRITICAL A4 SETTINGS
        ================================================== */

        @media print {

          @page {
            size: A4 portrait;
            margin: 0 !important;
          }

          html,
          body {
            width: 210mm !important;
            height: 297mm !important;

            margin: 0 !important;
            padding: 0 !important;

            background: #ffffff !important;

            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .screenToolbar {
            display: none !important;
          }

          .preview {
            display: block !important;

            width: 210mm !important;
            height: 297mm !important;

            min-height: 297mm !important;

            padding: 0 !important;
            margin: 0 !important;

            background: #ffffff !important;
          }

          .a4Page {
            width: 210mm !important;
            height: 297mm !important;

            min-height: 297mm !important;
            max-height: 297mm !important;

            margin: 0 !important;

            padding:
              0 11mm 19mm !important;

            overflow: hidden !important;

            box-shadow: none !important;

            page-break-before: avoid !important;
            page-break-after: avoid !important;

            break-before: avoid !important;
            break-after: avoid !important;

            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .testSection {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .patientCard {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .signatures {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .note {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
          }

          .footer {
            break-inside: avoid !important;
            page-break-inside: avoid !important;
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
        className={
          "infoValue" +
          (strong ? " strong" : "") +
          (status ? " status" : "")
        }
      >
        {value || "-"}
      </span>

    </div>
  );
}

/* =========================================================
   TEST SECTION COMPONENT
========================================================= */

function TestSection({ test }) {
  return (
    <section className="testSection">

      <div className="testHeader">

        <span className="departmentTag">
          {String(
            test.category ||
              "PATHOLOGY"
          ).toUpperCase()}
        </span>

        <div className="testTitleBox">
          {test.name}
        </div>

        <span className="testLine" />

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
              INVESTIGATION
            </th>

            <th>
              FLAG
            </th>

            <th>
              RESULT
            </th>

            <th>
              REFERENCE RANGE
            </th>

            <th>
              UNIT
            </th>
          </tr>
        </thead>

        <tbody>

          {(test.parameters || []).map(
            (parameter, index) => {

              const abnormal =
                parameter.flag === "H" ||
                parameter.flag === "L";

              const value =
                parameter.result === "" ||
                parameter.result === null ||
                parameter.result === undefined
                  ? "-"
                  : parameter.result;

              return (
                <tr key={index}>

                  {/* INVESTIGATION */}

                  <td>
                    <span className="investigationText">
                      {parameter.name}
                    </span>
                  </td>

                  {/* FLAG */}

                  <td className="flag">

                    {parameter.flag === "H" ? (
                      <span className="flagBadge flagHigh">
                        H
                      </span>
                    ) : parameter.flag === "L" ? (
                      <span className="flagBadge flagLow">
                        L
                      </span>
                    ) : (
                      <span className="normalMark">
                        •
                      </span>
                    )}

                  </td>

                  {/* RESULT */}

                  <td className="result">

                    <span
                      className={
                        "resultBox" +
                        (abnormal
                          ? " abnormal"
                          : "")
                      }
                    >
                      {value}
                    </span>

                  </td>

                  {/* REFERENCE */}

                  <td className="reference">
                    {parameter.range || "-"}
                  </td>

                  {/* UNIT */}

                  <td className="unit">
                    {parameter.unit || "-"}
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
