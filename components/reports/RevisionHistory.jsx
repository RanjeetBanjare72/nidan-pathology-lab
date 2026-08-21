"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function RevisionHistory({ reportId }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!reportId) return;
    let active = true;
    (async () => {
      const { data } = await supabase
        .from("report_audit_log")
        .select("*")
        .eq("report_id", reportId)
        .order("created_at", { ascending: false });
      if (active) {
        setRows(data || []);
        setLoading(false);
      }
    })();
    return () => { active = false; };
  }, [reportId]);

  return (
    <section className="revisionHistory">
      <h3>Report History</h3>
      {loading ? <p>Loading history…</p> : rows.length === 0 ? <p>No audit entries.</p> : (
        <ol>
          {rows.map((row) => (
            <li key={row.id}>
              <strong>{row.action || row.event_type || "Report update"}</strong>
              <span>{row.created_at ? new Date(row.created_at).toLocaleString("en-IN") : ""}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
