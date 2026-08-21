"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabase";

export default function OrderResultQueuePage() {
  const router = useRouter();
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("lab_orders")
        .select("*")
        .not("status", "in", "(Released,Cancelled)")
        .order("ordered_at", { ascending: false })
        .limit(100);
      if (error) setMessage(error.message);
      setOrders(data || []);
      setLoading(false);
    }
    load();
  }, []);

  const q = search.trim().toLowerCase();
  const visible = orders.filter((o) => `${o.order_no} ${o.patient_id} ${o.status} ${o.priority}`.toLowerCase().includes(q));

  return (
    <main style={{ minHeight: "100vh", background: "#f4f7f9", fontFamily: "Arial,sans-serif", color: "#17212b", padding: 20 }}>
      <div style={{ maxWidth: 1050, margin: "auto" }}>
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          <div><div style={{ color: "#087f68", fontSize: 11, fontWeight: 800, letterSpacing: 1 }}>NIDAN PATHOLOGY LAB</div><h1 style={{ margin: "5px 0" }}>Result Entry Queue</h1><div style={{ color: "#64748b", fontSize: 12 }}>Select a laboratory order to enter results.</div></div>
          <button onClick={() => router.push("/operations")} style={button}>← Operations</button>
        </header>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search order, patient, status or priority" style={input} />
        {message && <div style={{ ...card, color: "#9a3412", background: "#fff7ed" }}>{message}</div>}
        {loading ? <div style={card}>Loading laboratory orders...</div> : visible.length === 0 ? <div style={card}>No pending laboratory orders found.</div> : <div style={{ display: "grid", gap: 10 }}>{visible.map((order) => <div key={order.id} style={{ ...card, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}><div><b>{order.order_no || `Order #${order.id}`}</b><div style={{ marginTop: 5, color: "#475569", fontSize: 13 }}>Patient: {order.patient_id || "-"}</div><div style={{ marginTop: 4, color: "#64748b", fontSize: 11 }}>Priority: {order.priority || "Routine"} • Status: {order.status || "Registered"}</div></div><button onClick={() => router.push(`/orders/${order.id}/results`)} style={{ ...button, background: "#087f68", borderColor: "#087f68", color: "#fff" }}>✎ Enter Results</button></div>)}</div>}
      </div>
    </main>
  );
}

const card = { background: "#fff", border: "1px solid #e1e8ed", borderRadius: 12, padding: 16, boxShadow: "0 2px 10px rgba(0,0,0,.04)" };
const button = { border: "1px solid #d5dee5", background: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700, cursor: "pointer" };
const input = { width: "100%", boxSizing: "border-box", padding: 12, border: "1px solid #d5dee5", borderRadius: 9, background: "#fff", marginBottom: 14 };
