"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export const SETTINGS_KEY = "nidanLabSettings";
const BUCKET = "nidan-assets";
const LETTERHEAD_FOLDER = "letterheads";

const DEFAULT_SETTINGS = {
  labName: "NIDAN PATHOLOGY LAB",
  slogan: "Accurate Diagnosis • Trusted Care • Better Health",
  labAddress: "",
  phone: "",
  email: "",
  registrationNo: "",
  doctorName: "",
  letterhead: "",
  reportHeader: true,
  showLogo: true,
  showReferenceRange: true,
  showFlag: true,
  autoSave: true,
};

export default function SettingsPage() {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState("");

  useEffect(() => { loadSettings(); }, []);

  function loadSettings() {
    try {
      const saved = localStorage.getItem(SETTINGS_KEY);
      setSettings({ ...DEFAULT_SETTINGS, ...(saved ? JSON.parse(saved) : {}) });
    } catch (error) {
      console.error("Settings load error:", error);
      setSettings(DEFAULT_SETTINGS);
    } finally { setLoaded(true); }
  }

  function updateSetting(key, value) {
    setSettings((previous) => ({ ...previous, [key]: value }));
  }

  function persistSettings(nextSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(nextSettings));
    window.dispatchEvent(new CustomEvent("nidan-settings-updated", { detail: nextSettings }));
    window.dispatchEvent(new Event("storage"));
  }

  async function saveSettings() {
    try {
      setSaving(true);
      const finalSettings = { ...DEFAULT_SETTINGS, ...settings };
      persistSettings(finalSettings);
      setSettings(finalSettings);
      setStatus("✓ Settings saved successfully.");
    } catch (error) {
      console.error("Settings save error:", error);
      setStatus("Settings save nahi ho payi.");
    } finally { setSaving(false); }
  }

  async function handleLetterheadUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      setStatus("Sirf PNG, JPG, JPEG ya WEBP image upload karein.");
      event.target.value = "";
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setStatus("Letterhead / Logo image 2 MB se kam honi chahiye.");
      event.target.value = "";
      return;
    }

    try {
      setUploading(true);
      setStatus("Letterhead upload ho raha hai...");
      const extension = (file.name.split(".").pop() || "jpg").toLowerCase();
      const safeName = `letterhead-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extension}`;
      const path = `${LETTERHEAD_FOLDER}/${safeName}`;
      const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, {
        cacheControl: "31536000", upsert: false, contentType: file.type,
      });
      if (uploadError) throw uploadError;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl;
      if (!publicUrl) throw new Error("Public URL generate nahi hui.");

      const oldUrl = settings.letterhead;
      const nextSettings = { ...settings, letterhead: publicUrl };
      setSettings(nextSettings);
      persistSettings(nextSettings);

      if (oldUrl && oldUrl.includes(`/storage/v1/object/public/${BUCKET}/`)) {
        const marker = `/storage/v1/object/public/${BUCKET}/`;
        const oldPath = decodeURIComponent(oldUrl.split(marker)[1] || "");
        if (oldPath) await supabase.storage.from(BUCKET).remove([oldPath]).catch(() => {});
      }
      setStatus("✓ Letterhead Supabase Storage me permanently save ho gaya.");
    } catch (error) {
      console.error("Letterhead upload error:", error);
      const message = error?.message || "Unknown error";
      if (message.toLowerCase().includes("row-level") || message.toLowerCase().includes("policy") || message.toLowerCase().includes("permission")) {
        setStatus("Upload permission blocked hai. Login/authentication aur Supabase Storage policy check karein.");
      } else if (message.toLowerCase().includes("bucket") || message.toLowerCase().includes("not found")) {
        setStatus("Supabase Storage bucket 'nidan-assets' nahi mila.");
      } else setStatus(`Letterhead upload nahi ho paya: ${message}`);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  }

  async function removeLetterhead() {
    if (!settings.letterhead) return;
    if (!window.confirm("Kya aap uploaded logo / letterhead remove karna chahte hain?")) return;
    try {
      const marker = `/storage/v1/object/public/${BUCKET}/`;
      const oldPath = settings.letterhead.includes(marker) ? decodeURIComponent(settings.letterhead.split(marker)[1] || "") : "";
      if (oldPath) {
        const { error } = await supabase.storage.from(BUCKET).remove([oldPath]);
        if (error) throw error;
      }
      const nextSettings = { ...settings, letterhead: "" };
      setSettings(nextSettings);
      persistSettings(nextSettings);
      setStatus("✓ Letterhead remove ho gaya.");
    } catch (error) {
      console.error("Letterhead remove error:", error);
      setStatus(`Letterhead remove nahi ho paya: ${error?.message || "Unknown error"}`);
    }
  }

  function resetSettings() {
    if (!window.confirm("Kya aap Settings ko default par reset karna chahte hain?")) return;
    const resetData = { ...DEFAULT_SETTINGS };
    setSettings(resetData);
    persistSettings(resetData);
    setStatus("✓ Settings reset ho gayi.");
  }

  if (!loaded) return <div style={styles.loading}>Loading Settings...</div>;

  return (
    <div className="settingsPage">
      <div className="settingsHeader"><div><div className="smallTitle">LABORATORY SETTINGS</div><h1>Settings</h1><p>NIDAN Pathology Lab ki laboratory configuration manage karein.</p></div><div className="systemStatus"><span /> System Active</div></div>
      {status && <div className="statusBar">{status}</div>}

      <section className="card">
        <CardTitle icon="🏥" title="Laboratory Information" text="Ye information Final Report, Saved Reports aur PDF me use hogi." />
        <div className="grid">
          <Field label="Laboratory Name" value={settings.labName} onChange={(v) => updateSetting("labName", v)} placeholder="NIDAN PATHOLOGY LAB" />
          <Field label="Registration Number" value={settings.registrationNo} onChange={(v) => updateSetting("registrationNo", v)} placeholder="Lab registration number" />
          <Field full label="Laboratory Slogan" value={settings.slogan} onChange={(v) => updateSetting("slogan", v)} placeholder="Accurate Diagnosis • Trusted Care • Better Health" />
          <Field full textarea label="Laboratory Address" value={settings.labAddress} onChange={(v) => updateSetting("labAddress", v)} placeholder="Complete laboratory address" />
          <Field label="Mobile / Phone" value={settings.phone} onChange={(v) => updateSetting("phone", v)} placeholder="Mobile number" />
          <Field label="Email" type="email" value={settings.email} onChange={(v) => updateSetting("email", v)} placeholder="Lab email" />
          <Field full label="Medical / Reporting Doctor" value={settings.doctorName} onChange={(v) => updateSetting("doctorName", v)} placeholder="Doctor name" />
        </div>
      </section>

      <section className="card">
        <CardTitle icon="🖼️" title="Logo / Letterhead" text="Letterhead ab browser localStorage ke bajay Supabase Storage me permanently save hoga." />
        <div className="uploadBox"><input type="file" accept="image/png,image/jpeg,image/jpg,image/webp" onChange={handleLetterheadUpload} disabled={uploading} /><small>PNG, JPG, JPEG ya WEBP • Maximum 2 MB</small></div>
        {settings.letterhead ? <div className="preview"><div className="previewHead"><strong>Uploaded Logo / Letterhead</strong><button type="button" onClick={removeLetterhead} disabled={uploading}>Remove</button></div><div className="previewImage"><img src={settings.letterhead} alt="NIDAN laboratory logo or letterhead" /></div><div className="stored">Supabase Storage URL saved successfully.</div></div> : <div className="empty"><div>🖼️</div><strong>No Logo / Letterhead Uploaded</strong><small>Report header me use karne ke liye logo upload karein.</small></div>}
      </section>

      <section className="card">
        <CardTitle icon="📋" title="Report Settings" text="Final aur Saved Report ke display options." />
        <div className="options">
          <SettingToggle title="Report Header" description="Report ke top par laboratory header show karein." checked={settings.reportHeader} onChange={(v) => updateSetting("reportHeader", v)} />
          <SettingToggle title="Show Laboratory Logo" description="Final aur Saved Report me laboratory logo display karein." checked={settings.showLogo} onChange={(v) => updateSetting("showLogo", v)} />
          <SettingToggle title="Show Reference Range" description="Report me reference range display karein." checked={settings.showReferenceRange} onChange={(v) => updateSetting("showReferenceRange", v)} />
          <SettingToggle title="Show Result Flag" description="LOW / HIGH / NORMAL flag show karein." checked={settings.showFlag} onChange={(v) => updateSetting("showFlag", v)} />
          <SettingToggle title="Auto Save Results" description="Result entry ke dauran data automatically save karein." checked={settings.autoSave} onChange={(v) => updateSetting("autoSave", v)} />
        </div>
      </section>

      <section className="card">
        <CardTitle icon="⚙️" title="System Settings" text="Laboratory software ke general controls." />
        <div className="systemGrid"><SystemItem title="Test Master" description="Tests, parameters, units aur reference ranges manage karein." href="/tests" /><SystemItem title="Doctors" description="Referring doctors add aur manage karein." href="/doctors" /><SystemItem title="Patients" description="Registered patients manage karein." href="/patients" /><SystemItem title="Reports" description="Final laboratory reports dekhein aur print karein." href="/reports" /></div>
      </section>

      <div className="actions"><button className="reset" onClick={resetSettings} disabled={saving || uploading}>Reset Settings</button><button className="save" onClick={saveSettings} disabled={saving || uploading}>{saving ? "Saving..." : "Save Settings"}</button></div>

      <style jsx>{`*{box-sizing:border-box}.settingsPage{width:100%;max-width:1200px;margin:0 auto;padding:28px;color:#172033}.settingsHeader{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:18px}.smallTitle{color:#0f9d9a;font-size:11px;font-weight:800;letter-spacing:1.5px;margin-bottom:6px}.settingsHeader h1{margin:0;font-size:30px}.settingsHeader p{margin:7px 0 0;color:#718096;font-size:14px}.systemStatus{display:flex;align-items:center;gap:7px;padding:9px 13px;background:#ecfdf5;border:1px solid #bbf7d0;border-radius:10px;color:#047857;font-size:12px;font-weight:700}.systemStatus span{width:8px;height:8px;border-radius:50%;background:#10b981}.statusBar{margin-bottom:16px;padding:11px 14px;border:1px solid #bae6fd;background:#f0f9ff;border-radius:10px;color:#075985;font-size:13px;font-weight:600}.card{background:#fff;border:1px solid #e3e8ed;border-radius:16px;padding:22px;margin-bottom:18px;box-shadow:0 3px 12px rgba(15,23,42,.04)}.cardTitle{display:flex;align-items:center;gap:12px;padding-bottom:18px;margin-bottom:18px;border-bottom:1px solid #edf1f4}.icon{width:42px;height:42px;display:flex;align-items:center;justify-content:center;background:#e9f7f7;border-radius:11px;font-size:20px}.cardTitle h2{margin:0;font-size:17px}.cardTitle p{margin:4px 0 0;color:#718096;font-size:12px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.field{min-width:0}.field.full{grid-column:span 2}.field label{display:block;margin-bottom:7px;color:#475569;font-size:12px;font-weight:700}.field input,.field textarea{width:100%;border:1px solid #d5dde4;border-radius:9px;padding:11px 12px;background:#fff;color:#172033;font-size:14px;outline:none;font-family:inherit}.field textarea{resize:vertical;min-height:80px}.field input:focus,.field textarea:focus{border-color:#0f9d9a;box-shadow:0 0 0 3px rgba(15,157,154,.1)}.uploadBox{padding:16px;border:1px dashed #b8c5ce;border-radius:10px;background:#f8fafc}.uploadBox input{width:100%}.uploadBox small{display:block;margin-top:8px;color:#718096;font-size:11px}.preview{margin-top:15px;padding:14px;border:1px solid #d5dde4;border-radius:10px;background:#f8fafc}.previewHead{display:flex;justify-content:space-between;align-items:center;gap:10px;margin-bottom:12px}.previewHead strong{font-size:13px}.previewHead button{border:1px solid #dc3545;background:#fff;color:#dc3545;border-radius:7px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}.previewHead button:disabled{opacity:.5;cursor:not-allowed}.previewImage{width:100%;background:#fff;border:1px solid #e2e8f0;border-radius:7px;padding:10px;overflow:hidden}.previewImage img{display:block;width:100%;max-height:280px;object-fit:contain}.stored{margin-top:8px;color:#047857;font-size:11px}.empty{margin-top:12px;padding:25px;border:1px dashed #cbd5e1;border-radius:10px;background:#f8fafc;text-align:center;color:#64748b}.empty div{font-size:30px;margin-bottom:8px}.empty strong{display:block;font-size:13px;color:#475569}.empty small{display:block;margin-top:5px;font-size:11px}.options{display:flex;flex-direction:column}.toggleItem{display:flex;align-items:center;justify-content:space-between;gap:15px;padding:15px 0;border-bottom:1px solid #edf1f4}.toggleItem:last-child{border-bottom:0}.toggleItem strong{display:block;font-size:14px;margin-bottom:4px}.toggleItem small{display:block;color:#718096;font-size:12px;line-height:1.4}.toggle{flex:0 0 auto;width:48px;height:27px;border:0;border-radius:30px;background:#cbd5e1;padding:3px;cursor:pointer}.toggle.active{background:#0f9d9a}.toggle span{display:block;width:21px;height:21px;background:#fff;border-radius:50%;transition:.2s}.toggle.active span{transform:translateX(21px)}.systemGrid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.systemItem{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:15px;background:#f8fafc;border:1px solid #e8edf1;border-radius:11px}.systemItem strong{display:block;font-size:13px}.systemItem small{display:block;margin-top:4px;color:#718096;font-size:11px;line-height:1.4}.systemItem a{color:#087f7d;font-size:12px;font-weight:800;text-decoration:none}.actions{display:flex;justify-content:flex-end;gap:10px;padding-bottom:30px}.actions button{min-height:44px;padding:0 20px;border-radius:9px;font-weight:700;cursor:pointer;font-size:13px}.actions button:disabled{opacity:.6;cursor:not-allowed}.reset{background:#fff;border:1px solid #d5dde4;color:#475569}.save{background:#0f9d9a;border:1px solid #0f9d9a;color:#fff}@media(max-width:700px){.settingsPage{padding:14px 10px}.settingsHeader{flex-direction:column}.settingsHeader h1{font-size:24px}.card{padding:15px;border-radius:13px}.grid{grid-template-columns:1fr}.field.full{grid-column:span 1}.systemGrid{grid-template-columns:1fr}.actions{display:grid;grid-template-columns:1fr 1fr}.actions button{width:100%}}@media(max-width:420px){.actions{grid-template-columns:1fr}.toggleItem{align-items:flex-start}.toggleItem small{max-width:230px}}`}</style>
    </div>
  );
}

function CardTitle({ icon, title, text }) { return <div className="cardTitle"><div className="icon">{icon}</div><div><h2>{title}</h2><p>{text}</p></div></div>; }
function Field({ label, value, onChange, placeholder, full, textarea, type="text" }) { return <div className={`field${full ? " full" : ""}`}><label>{label}</label>{textarea ? <textarea value={value || ""} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} rows={3}/> : <input type={type} value={value || ""} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder}/>}</div>; }
function SettingToggle({ title, description, checked, onChange }) { return <div className="toggleItem"><div><strong>{title}</strong><small>{description}</small></div><button type="button" className={checked ? "toggle active" : "toggle"} onClick={()=>onChange(!checked)} aria-label={title} aria-pressed={checked}><span/></button></div>; }
function SystemItem({ title, description, href }) { return <div className="systemItem"><div><strong>{title}</strong><small>{description}</small></div><a href={href}>Open →</a></div>; }
const styles={loading:{minHeight:"300px",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Arial, sans-serif",color:"#64748b",fontSize:"14px"}};
