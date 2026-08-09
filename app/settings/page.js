"use client";

import { useEffect, useState } from "react";

const KEY = "nidanLabSettings";

const defaultSettings = {
  labName: "NIDAN PATHOLOGY LAB",
  tagline: "Complete Diagnostic Laboratory",
  address: "",
  city: "",
  mobile: "",
  phone: "",
  email: "",
  website: "",

  pathologistName: "",
  pathologistQualification: "",
  pathologistRegNo: "",

  patientPrefix: "NPL",
  reportPrefix: "NPL-RPT",
  billPrefix: "NPL-BILL",

  currency: "₹",
  gstEnabled: false,
  gstNumber: "",
  gstPercent: 0,

  reportHeader: true,
  reportFooter: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
  showMethod: true,

  reportFooterText:
    "This report is electronically generated.",

  autoSaveResults: true,
  autoGeneratePatientId: true,
  autoGenerateReportNo: true,

  dateFormat: "DD-MM-YYYY",
  timeFormat: "12 Hour",

  theme: "Light",
};

export default function SettingsPage() {

  const [settings, setSettings] =
    useState(defaultSettings);

  const [saved, setSaved] =
    useState(false);

  useEffect(() => {

    try {
      const data = JSON.parse(
        localStorage.getItem(KEY) || "{}"
      );

      setSettings({
        ...defaultSettings,
        ...data,
      });

    } catch {}

  }, []);

  function update(field, value) {
    setSettings((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  function saveSettings() {

    localStorage.setItem(
      KEY,
      JSON.stringify(settings)
    );

    setSaved(true);

    setTimeout(
      () => setSaved(false),
      2500
    );
  }

  function resetSettings() {

    if (
      !confirm(
        "Settings default par reset karein?"
      )
    ) {
      return;
    }

    setSettings(defaultSettings);

    localStorage.setItem(
      KEY,
      JSON.stringify(defaultSettings)
    );
  }

  function backupData() {

    const backup = {
      version: 1,
      createdAt:
        new Date().toISOString(),

      settings,

      tests: JSON.parse(
        localStorage.getItem(
          "nidanTestMaster"
        ) || "[]"
      ),

      doctors: JSON.parse(
        localStorage.getItem(
          "nidanDoctors"
        ) || "[]"
      ),

      patients: JSON.parse(
        localStorage.getItem(
          "nidanPatients"
        ) || "[]"
      ),
    };

    const blob = new Blob(
      [JSON.stringify(backup, null, 2)],
      {
        type: "application/json",
      }
    );

    const url =
      URL.createObjectURL(blob);

    const a =
      document.createElement("a");

    a.href = url;

    a.download =
      `nidan-backup-${Date.now()}.json`;

    a.click();

    URL.revokeObjectURL(url);
  }

  function clearAllData() {

    const confirmText =
      prompt(
        "All data delete karne ke liye DELETE type karein."
      );

    if (confirmText !== "DELETE") {
      return;
    }

    localStorage.clear();

    alert(
      "Local data clear ho gaya."
    );

    location.reload();
  }

  return (
    <div className="settingsPage">

      <header className="settingsHeader">

        <div>
          <h1>Settings</h1>

          <p>
            NIDAN Pathology Lab system
            configuration
          </p>
        </div>

        <div className="headerActions">

          <button
            onClick={resetSettings}
          >
            Reset
          </button>

          <button
            className="saveBtn"
            onClick={saveSettings}
          >
            Save Settings
          </button>

        </div>

      </header>

      {saved && (
        <div className="success">
          ✓ Settings saved successfully
        </div>
      )}

      {/* LAB */}

      <section className="settingsCard">

        <h2>🏥 Laboratory Information</h2>

        <div className="grid">

          <Field
            label="Laboratory Name"
            value={settings.labName}
            onChange={(v) =>
              update("labName", v)
            }
          />

          <Field
            label="Tagline"
            value={settings.tagline}
            onChange={(v) =>
              update("tagline", v)
            }
          />

          <Field
            label="Mobile"
            value={settings.mobile}
            onChange={(v) =>
              update("mobile", v)
            }
          />

          <Field
            label="Phone"
            value={settings.phone}
            onChange={(v) =>
              update("phone", v)
            }
          />

          <Field
            label="Email"
            value={settings.email}
            onChange={(v) =>
              update("email", v)
            }
          />

          <Field
            label="Website"
            value={settings.website}
            onChange={(v) =>
              update("website", v)
            }
          />

          <Field
            label="City"
            value={settings.city}
            onChange={(v) =>
              update("city", v)
            }
          />

          <Field
            label="Address"
            value={settings.address}
            onChange={(v) =>
              update("address", v)
            }
            full
          />

        </div>

      </section>

      {/* PATHOLOGIST */}

      <section className="settingsCard">

        <h2>👨‍⚕️ Pathologist Information</h2>

        <div className="grid">

          <Field
            label="Pathologist Name"
            value={
              settings.pathologistName
            }
            onChange={(v) =>
              update(
                "pathologistName",
                v
              )
            }
          />

          <Field
            label="Qualification"
            value={
              settings.pathologistQualification
            }
            onChange={(v) =>
              update(
                "pathologistQualification",
                v
              )
            }
          />

          <Field
            label="Registration Number"
            value={
              settings.pathologistRegNo
            }
            onChange={(v) =>
              update(
                "pathologistRegNo",
                v
              )
            }
          />

        </div>

      </section>

      {/* NUMBERING */}

      <section className="settingsCard">

        <h2>🔢 Numbering</h2>

        <div className="grid">

          <Field
            label="Patient ID Prefix"
            value={
              settings.patientPrefix
            }
            onChange={(v) =>
              update(
                "patientPrefix",
                v
              )
            }
          />

          <Field
            label="Report Prefix"
            value={
              settings.reportPrefix
            }
            onChange={(v) =>
              update(
                "reportPrefix",
                v
              )
            }
          />

          <Field
            label="Bill Prefix"
            value={
              settings.billPrefix
            }
            onChange={(v) =>
              update(
                "billPrefix",
                v
              )
            }
          />

        </div>

      </section>

      {/* BILLING */}

      <section className="settingsCard">

        <h2>💰 Billing & GST</h2>

        <div className="grid">

          <Field
            label="Currency"
            value={settings.currency}
            onChange={(v) =>
              update("currency", v)
            }
          />

          <Field
            label="GST Number"
            value={settings.gstNumber}
            onChange={(v) =>
              update("gstNumber", v)
            }
          />

          <Field
            label="GST %"
            type="number"
            value={settings.gstPercent}
            onChange={(v) =>
              update(
                "gstPercent",
                Number(v)
              )
            }
          />

        </div>

        <Toggle
          label="Enable GST"
          checked={settings.gstEnabled}
          onChange={(v) =>
            update("gstEnabled", v)
          }
        />

      </section>

      {/* REPORT */}

      <section className="settingsCard">

        <h2>📄 Report Settings</h2>

        <Toggle
          label="Show Lab Header"
          checked={
            settings.reportHeader
          }
          onChange={(v) =>
            update("reportHeader", v)
          }
        />

        <Toggle
          label="Show Lab Logo"
          checked={
            settings.showLogo
          }
          onChange={(v) =>
            update("showLogo", v)
          }
        />

        <Toggle
          label="Show Reference Range"
          checked={
            settings.showReferenceRange
          }
          onChange={(v) =>
            update(
              "showReferenceRange",
              v
            )
          }
        />

        <Toggle
          label="Show HIGH / LOW Flag"
          checked={
            settings.showFlag
          }
          onChange={(v) =>
            update("showFlag", v)
          }
        />

        <Toggle
          label="Show Test Method"
          checked={
            settings.showMethod
          }
          onChange={(v) =>
            update("showMethod", v)
          }
        />

        <Toggle
          label="Show Report Footer"
          checked={
            settings.reportFooter
          }
          onChange={(v) =>
            update("reportFooter", v)
          }
        />

        <Field
          label="Report Footer Text"
          value={
            settings.reportFooterText
          }
          onChange={(v) =>
            update(
              "reportFooterText",
              v
            )
          }
          full
        />

      </section>

      {/* SYSTEM */}

      <section className="settingsCard">

        <h2>⚙ System Settings</h2>

        <Toggle
          label="Auto Save Results"
          checked={
            settings.autoSaveResults
          }
          onChange={(v) =>
            update(
              "autoSaveResults",
              v
            )
          }
        />

        <Toggle
          label="Auto Generate Patient ID"
          checked={
            settings.autoGeneratePatientId
          }
          onChange={(v) =>
            update(
              "autoGeneratePatientId",
              v
            )
          }
        />

        <Toggle
          label="Auto Generate Report Number"
          checked={
            settings.autoGenerateReportNo
          }
          onChange={(v) =>
            update(
              "autoGenerateReportNo",
              v
            )
          }
        />

        <div className="grid">

          <label>
            Date Format

            <select
              value={settings.dateFormat}
              onChange={(e) =>
                update(
                  "dateFormat",
                  e.target.value
                )
              }
            >
              <option>
                DD-MM-YYYY
              </option>

              <option>
                DD/MM/YYYY
              </option>

              <option>
                YYYY-MM-DD
              </option>
            </select>
          </label>

          <label>
            Time Format

            <select
              value={settings.timeFormat}
              onChange={(e) =>
                update(
                  "timeFormat",
                  e.target.value
                )
              }
            >
              <option>12 Hour</option>
              <option>24 Hour</option>
            </select>
          </label>

        </div>

      </section>

      {/* BACKUP */}

      <section className="settingsCard dangerCard">

        <h2>💾 Backup & Data</h2>

        <p>
          Important laboratory data ka
          regular backup rakhein.
        </p>

        <div className="backupActions">

          <button
            onClick={backupData}
          >
            ⬇ Download Backup
          </button>

          <button
            className="danger"
            onClick={clearAllData}
          >
            Delete All Local Data
          </button>

        </div>

      </section>

      <style jsx global>{`

        * {
          box-sizing:border-box;
        }

        body {
          margin:0;
          background:#f5f8fb;
          font-family:Arial,sans-serif;
        }

        .settingsPage {
          max-width:1100px;
          margin:auto;
          padding:20px;
        }

        .settingsHeader {
          background:white;
          border-radius:14px;
          padding:20px;
          display:flex;
          justify-content:space-between;
          align-items:center;
          gap:15px;
          margin-bottom:15px;
        }

        .settingsHeader h1 {
          margin:0;
        }

        .settingsHeader p {
          color:#718096;
        }

        .headerActions {
          display:flex;
          gap:8px;
        }

        .headerActions button {
          padding:10px 14px;
          border-radius:8px;
          border:1px solid #d8e0e7;
          background:white;
          cursor:pointer;
        }

        .headerActions .saveBtn {
          background:#0f9d9a;
          color:white;
          border:0;
        }

        .success {
          padding:12px;
          background:#dcfce7;
          color:#15803d;
          border-radius:10px;
          margin-bottom:15px;
          font-weight:bold;
        }

        .settingsCard {
          background:white;
          border:1px solid #e1e7eb;
          border-radius:14px;
          padding:20px;
          margin-bottom:15px;
        }

        .settingsCard h2 {
          margin-top:0;
          font-size:17px;
          border-bottom:1px solid #edf0f2;
          padding-bottom:12px;
        }

        .grid {
          display:grid;
          grid-template-columns:
            repeat(2,1fr);
          gap:14px;
        }

        .grid label {
          font-size:12px;
          font-weight:bold;
          color:#475569;
        }

        .grid input,
        .grid select {
          display:block;
          width:100%;
          margin-top:5px;
          padding:10px;
          border:1px solid #d8e0e7;
          border-radius:8px;
        }

        .full {
          grid-column:span 2;
        }

        .toggle {
          display:flex;
          justify-content:space-between;
          align-items:center;
          padding:12px 0;
          border-bottom:1px solid #f0f2f4;
          font-size:13px;
        }

        .toggle input {
          width:18px;
          height:18px;
        }

        .backupActions {
          display:flex;
          gap:10px;
        }

        .backupActions button {
          border:0;
          padding:11px 15px;
          border-radius:8px;
          background:#e0f2fe;
          color:#0369a1;
          cursor:pointer;
        }

        .backupActions .danger {
          background:#fee2e2;
          color:#b91c1c;
        }

        @media(max-width:600px) {

          .settingsPage {
            padding:10px;
          }

          .settingsHeader {
            align-items:flex-start;
            flex-direction:column;
          }

          .headerActions {
            width:100%;
          }

          .headerActions button {
            flex:1;
          }

          .grid {
            grid-template-columns:1fr;
          }

          .full {
            grid-column:auto;
          }

          .backupActions {
            flex-direction:column;
          }
        }

      `}</style>

    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  full = false,
}) {
  return (
    <label className={full ? "full" : ""}>
      {label}

      <input
        type={type}
        value={value ?? ""}
        onChange={(e) =>
          onChange(e.target.value)
        }
      />
    </label>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}) {
  return (
    <div className="toggle">
      <span>{label}</span>

      <input
        type="checkbox"
        checked={checked}
        onChange={(e) =>
          onChange(e.target.checked)
        }
      />
    </div>
  );
}
