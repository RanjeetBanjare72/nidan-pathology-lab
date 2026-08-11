"use client";

import { useEffect, useState } from "react";

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  labAddress: "",
  phone: "",
  email: "",
  registrationNo: "",
  doctorName: "",

  // Letterhead
  letterhead: "",

  // Report settings
  reportHeader: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
  autoSave: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  // =====================================================
  // LOAD SETTINGS
  // =====================================================

  useEffect(() => {
    try {
      const saved = localStorage.getItem("nidanLabSettings");

      if (saved) {
        const parsed = JSON.parse(saved);

        setSettings({
          ...DEFAULT_SETTINGS,
          ...parsed,
        });
      }
    } catch (error) {
      console.error("Settings load error:", error);
    } finally {
      setLoaded(true);
    }
  }, []);

  // =====================================================
  // UPDATE SETTING
  // =====================================================

  function updateSetting(key, value) {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  // =====================================================
  // SAVE SETTINGS
  // =====================================================

  function saveSettings() {
    try {
      localStorage.setItem(
        "nidanLabSettings",
        JSON.stringify(settings)
      );

      alert("✓ Settings saved successfully");
    } catch (error) {
      console.error("Settings save error:", error);

      if (
        error?.name === "QuotaExceededError" ||
        error?.message?.toLowerCase().includes("quota")
      ) {
        alert(
          "Letterhead image bahut badi hai. Please 2 MB se kam image upload karein."
        );
      } else {
        alert("Settings save nahi ho payi.");
      }
    }
  }

  // =====================================================
  // RESET SETTINGS
  // =====================================================

  function resetSettings() {
    const confirmReset = window.confirm(
      "Kya aap Settings ko default par reset karna chahte hain?"
    );

    if (!confirmReset) return;

    setSettings(DEFAULT_SETTINGS);

    localStorage.setItem(
      "nidanLabSettings",
      JSON.stringify(DEFAULT_SETTINGS)
    );

    alert("✓ Settings reset ho gayi.");
  }

  // =====================================================
  // LETTERHEAD UPLOAD
  // =====================================================

  function handleLetterheadUpload(event) {
    const file = event.target.files?.[0];

    if (!file) return;

    // Allowed formats
    const allowedTypes = [
      "image/png",
      "image/jpeg",
      "image/jpg",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type)) {
      alert("Sirf PNG, JPG, JPEG ya WEBP image upload karein.");
      event.target.value = "";
      return;
    }

    // Maximum 2 MB
    if (file.size > 2 * 1024 * 1024) {
      alert(
        "Letterhead image 2 MB se kam honi chahiye."
      );
      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      updateSetting(
        "letterhead",
        reader.result
      );
    };

    reader.onerror = () => {
      alert("Letterhead upload nahi ho paya.");
    };

    reader.readAsDataURL(file);
  }

  // =====================================================
  // REMOVE LETTERHEAD
  // =====================================================

  function removeLetterhead() {
    const confirmRemove = window.confirm(
      "Kya aap uploaded letterhead remove karna chahte hain?"
    );

    if (!confirmRemove) return;

    updateSetting("letterhead", "");
  }

  if (!loaded) {
    return (
      <div style={styles.loading}>
        Loading Settings...
      </div>
    );
  }

  return (
    <div className="settingsPage">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="settingsHeader">
        <div>
          <div className="settingsSmallTitle">
            LABORATORY SETTINGS
          </div>

          <h1>Settings</h1>

          <p>
            NIDAN Pathology Lab ki laboratory
            configuration manage karein.
          </p>
        </div>

        <div className="settingsStatus">
          <span></span>
          System Active
        </div>
      </div>


      {/* =================================================
          LABORATORY INFORMATION
      ================================================= */}

      <section className="settingsCard">

        <div className="cardTitle">
          <div className="cardIcon">
            🏥
          </div>

          <div>
            <h2>Laboratory Information</h2>
            <p>
              Lab ki basic information yahan set karein.
            </p>
          </div>
        </div>


        <div className="settingsGrid">

          {/* Laboratory Name */}

          <div className="field">
            <label>Laboratory Name</label>

            <input
              type="text"
              value={settings.labName}
              onChange={(e) =>
                updateSetting(
                  "labName",
                  e.target.value
                )
              }
              placeholder="NIDAN PATHOLOGY LAB"
            />
          </div>


          {/* Registration Number */}

          <div className="field">
            <label>Registration Number</label>

            <input
              type="text"
              value={settings.registrationNo}
              onChange={(e) =>
                updateSetting(
                  "registrationNo",
                  e.target.value
                )
              }
              placeholder="Lab registration number"
            />
          </div>


          {/* Laboratory Address */}

          <div className="field full">
            <label>Laboratory Address</label>

            <textarea
              value={settings.labAddress}
              onChange={(e) =>
                updateSetting(
                  "labAddress",
                  e.target.value
                )
              }
              placeholder="Complete laboratory address"
              rows={3}
            />
          </div>


          {/* Mobile */}

          <div className="field">
            <label>Mobile / Phone</label>

            <input
              type="tel"
              value={settings.phone}
              onChange={(e) =>
                updateSetting(
                  "phone",
                  e.target.value
                )
              }
              placeholder="Mobile number"
            />
          </div>


          {/* Email */}

          <div className="field">
            <label>Email</label>

            <input
              type="email"
              value={settings.email}
              onChange={(e) =>
                updateSetting(
                  "email",
                  e.target.value
                )
              }
              placeholder="Lab email"
            />
          </div>


          {/* Doctor */}

          <div className="field">
            <label>
              Medical / Reporting Doctor
            </label>

            <input
              type="text"
              value={settings.doctorName}
              onChange={(e) =>
                updateSetting(
                  "doctorName",
                  e.target.value
                )
              }
              placeholder="Doctor name"
            />
          </div>


          {/* =================================================
              LETTERHEAD UPLOAD
          ================================================= */}

          <div className="field full">

            <label>
              📄 Laboratory Letterhead
            </label>

            <div className="letterheadUpload">

              <input
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                onChange={handleLetterheadUpload}
              />

              <small>
                PNG, JPG, JPEG ya WEBP image upload karein.
                Maximum size: 2 MB.
              </small>

            </div>


            {/* LETTERHEAD PREVIEW */}

            {settings.letterhead ? (
              <div className="letterheadPreview">

                <div className="previewHeader">

                  <strong>
                    Letterhead Preview
                  </strong>

                  <button
                    type="button"
                    className="removeLetterhead"
                    onClick={removeLetterhead}
                  >
                    Remove
                  </button>

                </div>


                <div className="previewImageBox">

                  <img
                    src={settings.letterhead}
                    alt="Laboratory Letterhead"
                  />

                </div>

              </div>
            ) : (
              <div className="noLetterhead">
                <div className="noLetterheadIcon">
                  📄
                </div>

                <strong>
                  No Letterhead Uploaded
                </strong>

                <small>
                  Report ke liye laboratory letterhead
                  yahan upload karein.
                </small>
              </div>
            )}

          </div>

        </div>

      </section>


      {/* =================================================
          REPORT SETTINGS
      ================================================= */}

      <section className="settingsCard">

        <div className="cardTitle">

          <div className="cardIcon">
            📋
          </div>

          <div>
            <h2>Report Settings</h2>

            <p>
              Laboratory report ke display options.
            </p>
          </div>

        </div>


        <div className="settingOptions">

          <SettingToggle
            title="Report Header"
            description="Report ke top par laboratory header show karein."
            checked={settings.reportHeader}
            onChange={(value) =>
              updateSetting(
                "reportHeader",
                value
              )
            }
          />


          <SettingToggle
            title="Show Laboratory Logo"
            description="Final report me laboratory logo display karein."
            checked={settings.showLogo}
            onChange={(value) =>
              updateSetting(
                "showLogo",
                value
              )
            }
          />


          <SettingToggle
            title="Show Reference Range"
            description="Report me reference range display karein."
            checked={settings.showReferenceRange}
            onChange={(value) =>
              updateSetting(
                "showReferenceRange",
                value
              )
            }
          />


          <SettingToggle
            title="Show Result Flag"
            description="LOW / HIGH / NORMAL flag show karein."
            checked={settings.showFlag}
            onChange={(value) =>
              updateSetting(
                "showFlag",
                value
              )
            }
          />


          <SettingToggle
            title="Auto Save Results"
            description="Result entry ke dauran data automatically save karein."
            checked={settings.autoSave}
            onChange={(value) =>
              updateSetting(
                "autoSave",
                value
              )
            }
          />

        </div>

      </section>


      {/* =================================================
          SYSTEM SETTINGS
      ================================================= */}

      <section className="settingsCard">

        <div className="cardTitle">

          <div className="cardIcon">
            ⚙️
          </div>

          <div>
            <h2>System Settings</h2>

            <p>
              Laboratory software ke general controls.
            </p>
          </div>

        </div>


        <div className="systemOptions">

          {/* Test Master */}

          <div className="systemItem">

            <div>
              <strong>Test Master</strong>

              <small>
                Laboratory tests, parameters,
                units aur reference ranges manage karein.
              </small>
            </div>

            <a href="/tests">
              Open →
            </a>

          </div>


          {/* Doctors */}

          <div className="systemItem">

            <div>
              <strong>Doctors</strong>

              <small>
                Referring doctors add aur manage karein.
              </small>
            </div>

            <a href="/doctors">
              Open →
            </a>

          </div>


          {/* Patients */}

          <div className="systemItem">

            <div>
              <strong>Patients</strong>

              <small>
                Registered patients manage karein.
              </small>
            </div>

            <a href="/patients">
              Open →
            </a>

          </div>


          {/* Reports */}

          <div className="systemItem">

            <div>
              <strong>Reports</strong>

              <small>
                Final laboratory reports dekhein
                aur print karein.
              </small>
            </div>

            <a href="/reports">
              Open →
            </a>

          </div>

        </div>

      </section>


      {/* =================================================
          ACTION BUTTONS
      ================================================= */}

      <div className="settingsActions">

        <button
          className="resetBtn"
          onClick={resetSettings}
        >
          Reset Settings
        </button>


        <button
          className="saveBtn"
          onClick={saveSettings}
        >
          Save Settings
        </button>

      </div>


      {/* =================================================
          CSS
      ================================================= */}

      <style jsx>{`

        * {
          box-sizing: border-box;
        }

        .settingsPage {
          width: 100%;
          max-width: 1200px;
          margin: 0 auto;
          padding: 28px;
          color: #172033;
        }

        .settingsHeader {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          gap: 20px;
          margin-bottom: 22px;
        }

        .settingsSmallTitle {
          color: #0f9d9a;
          font-size: 11px;
          font-weight: 800;
          letter-spacing: 1.5px;
          margin-bottom: 6px;
        }

        .settingsHeader h1 {
          margin: 0;
          font-size: 30px;
          line-height: 1.2;
        }

        .settingsHeader p {
          margin: 7px 0 0;
          color: #718096;
          font-size: 14px;
        }

        .settingsStatus {
          display: flex;
          align-items: center;
          gap: 7px;
          padding: 9px 13px;
          background: #ecfdf5;
          border: 1px solid #bbf7d0;
          border-radius: 10px;
          color: #047857;
          font-size: 12px;
          font-weight: 700;
          white-space: nowrap;
        }

        .settingsStatus span {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #10b981;
        }

        .settingsCard {
          background: #ffffff;
          border: 1px solid #e3e8ed;
          border-radius: 16px;
          padding: 22px;
          margin-bottom: 18px;
          box-shadow: 0 3px 12px rgba(15, 23, 42, 0.04);
        }

        .cardTitle {
          display: flex;
          align-items: center;
          gap: 12px;
          padding-bottom: 18px;
          margin-bottom: 18px;
          border-bottom: 1px solid #edf1f4;
        }

        .cardIcon {
          width: 42px;
          height: 42px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: #e9f7f7;
          border-radius: 11px;
          font-size: 20px;
        }

        .cardTitle h2 {
          margin: 0;
          font-size: 17px;
        }

        .cardTitle p {
          margin: 4px 0 0;
          color: #718096;
          font-size: 12px;
        }

        .settingsGrid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        .field {
          min-width: 0;
        }

        .field.full {
          grid-column: span 2;
        }

        .field label {
          display: block;
          margin-bottom: 7px;
          color: #475569;
          font-size: 12px;
          font-weight: 700;
        }

        .field input,
        .field textarea {
          width: 100%;
          border: 1px solid #d5dde4;
          border-radius: 9px;
          padding: 11px 12px;
          background: #ffffff;
          color: #172033;
          font-size: 14px;
          outline: none;
          font-family: inherit;
        }

        .field textarea {
          resize: vertical;
          min-height: 80px;
        }

        .field input:focus,
        .field textarea:focus {
          border-color: #0f9d9a;
          box-shadow: 0 0 0 3px rgba(15, 157, 154, 0.10);
        }

        /* ===============================
           LETTERHEAD
        =============================== */

        .letterheadUpload {
          padding: 16px;
          border: 1px dashed #b8c5ce;
          border-radius: 10px;
          background: #f8fafc;
        }

        .letterheadUpload input[type="file"] {
          width: 100%;
          border: none;
          padding: 0;
          background: transparent;
          cursor: pointer;
        }

        .letterheadUpload small {
          display: block;
          margin-top: 8px;
          color: #718096;
          font-size: 11px;
          line-height: 1.5;
        }

        .letterheadPreview {
          margin-top: 15px;
          padding: 14px;
          border: 1px solid #d5dde4;
          border-radius: 10px;
          background: #f8fafc;
        }

        .previewHeader {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
          margin-bottom: 12px;
        }

        .previewHeader strong {
          font-size: 13px;
          color: #334155;
        }

        .removeLetterhead {
          border: 1px solid #dc3545;
          background: #ffffff;
          color: #dc3545;
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
        }

        .removeLetterhead:hover {
          background: #fff1f2;
        }

        .previewImageBox {
          width: 100%;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 7px;
          padding: 10px;
          overflow: hidden;
        }

        .previewImageBox img {
          display: block;
          width: 100%;
          max-height: 260px;
          object-fit: contain;
          margin: 0 auto;
        }

        .noLetterhead {
          margin-top: 12px;
          padding: 25px;
          border: 1px dashed #cbd5e1;
          border-radius: 10px;
          background: #f8fafc;
          text-align: center;
          color: #64748b;
        }

        .noLetterheadIcon {
          font-size: 30px;
          margin-bottom: 8px;
        }

        .noLetterhead strong {
          display: block;
          font-size: 13px;
          color: #475569;
        }

        .noLetterhead small {
          display: block;
          margin-top: 5px;
          font-size: 11px;
        }

        /* ===============================
           TOGGLES
        =============================== */

        .settingOptions {
          display: flex;
          flex-direction: column;
        }

        .toggleItem {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
          padding: 15px 0;
          border-bottom: 1px solid #edf1f4;
        }

        .toggleItem:last-child {
          border-bottom: 0;
        }

        .toggleItem strong {
          display: block;
          font-size: 14px;
          margin-bottom: 4px;
        }

        .toggleItem small {
          display: block;
          color: #718096;
          font-size: 12px;
          line-height: 1.4;
        }

        .toggle {
          flex: 0 0 auto;
          width: 48px;
          height: 27px;
          border: 0;
          border-radius: 30px;
          background: #cbd5e1;
          padding: 3px;
          cursor: pointer;
          transition: 0.2s;
        }

        .toggle.active {
          background: #0f9d9a;
        }

        .toggle span {
          display: block;
          width: 21px;
          height: 21px;
          background: #ffffff;
          border-radius: 50%;
          transition: 0.2s;
        }

        .toggle.active span {
          transform: translateX(21px);
        }

        /* ===============================
           SYSTEM OPTIONS
        =============================== */

        .systemOptions {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .systemItem {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          padding: 15px;
          background: #f8fafc;
          border: 1px solid #e8edf1;
          border-radius: 11px;
        }

        .systemItem strong {
          display: block;
          font-size: 13px;
        }

        .systemItem small {
          display: block;
          margin-top: 4px;
          color: #718096;
          font-size: 11px;
          line-height: 1.4;
        }

        .systemItem a {
          flex: 0 0 auto;
          color: #087f7d;
          font-size: 12px;
          font-weight: 800;
          text-decoration: none;
        }

        .systemItem a:hover {
          text-decoration: underline;
        }

        /* ===============================
           ACTIONS
        =============================== */

        .settingsActions {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
          padding-bottom: 30px;
        }

        .resetBtn,
        .saveBtn {
          min-height: 44px;
          padding: 0 20px;
          border-radius: 9px;
          font-weight: 700;
          cursor: pointer;
          font-size: 13px;
        }

        .resetBtn {
          background: #ffffff;
          border: 1px solid #d5dde4;
          color: #475569;
        }

        .resetBtn:hover {
          background: #f8fafc;
        }

        .saveBtn {
          background: #0f9d9a;
          border: 1px solid #0f9d9a;
          color: #ffffff;
        }

        .saveBtn:hover {
          background: #087f7d;
        }

        @media (max-width: 700px) {

          .settingsPage {
            padding: 14px 10px;
          }

          .settingsHeader {
            flex-direction: column;
          }

          .settingsHeader h1 {
            font-size: 24px;
          }

          .settingsCard {
            padding: 15px;
            border-radius: 13px;
          }

          .settingsGrid {
            grid-template-columns: 1fr;
          }

          .field.full {
            grid-column: span 1;
          }

          .systemOptions {
            grid-template-columns: 1fr;
          }

          .settingsActions {
            display: grid;
            grid-template-columns: 1fr 1fr;
          }

          .resetBtn,
          .saveBtn {
            width: 100%;
          }

        }

        @media (max-width: 420px) {

          .settingsActions {
            grid-template-columns: 1fr;
          }

          .toggleItem {
            align-items: flex-start;
          }

          .toggleItem small {
            max-width: 230px;
          }

          .previewHeader {
            align-items: flex-start;
          }

        }

      `}</style>

    </div>
  );
}


// =====================================================
// TOGGLE COMPONENT
// =====================================================

function SettingToggle({
  title,
  description,
  checked,
  onChange,
}) {
  return (
    <div className="toggleItem">

      <div>
        <strong>{title}</strong>
        <small>{description}</small>
      </div>

      <button
        type="button"
        className={
          checked
            ? "toggle active"
            : "toggle"
        }
        onClick={() =>
          onChange(!checked)
        }
        aria-label={title}
        aria-pressed={checked}
      >
        <span></span>
      </button>

    </div>
  );
}


// =====================================================
// LOADING STYLE
// =====================================================

const styles = {
  loading: {
    minHeight: "300px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: "Arial, sans-serif",
    color: "#64748b",
    fontSize: "14px",
  },
};
