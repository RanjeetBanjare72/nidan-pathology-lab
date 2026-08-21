"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";

export default function OrderResultBridgePage() {
  const { id } = useParams();
  const router = useRouter();
  const [message, setMessage] = useState("Loading laboratory order...");
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function openOrderInResultEntry() {
      try {
        const orderId = String(id || "");
        if (!orderId) throw new Error("Laboratory order ID missing.");

        const { data: order, error: orderError } = await supabase
          .from("lab_orders")
          .select("*")
          .eq("id", orderId)
          .maybeSingle();
        if (orderError) throw orderError;
        if (!order) throw new Error("Laboratory order not found.");
        if (["Released", "Cancelled"].includes(order.status)) {
          throw new Error(`Order ${order.order_no || order.id} is ${order.status} and cannot be opened for new result entry.`);
        }

        const { data: items, error: itemError } = await supabase
          .from("lab_order_items")
          .select("*")
          .eq("order_id", order.id)
          .order("id");
        if (itemError) throw itemError;
        if (!items?.length) throw new Error("This order has no laboratory tests.");

        const { data: patient, error: patientError } = await supabase
          .from("patients")
          .select("*")
          .eq("id", order.patient_id)
          .maybeSingle();
        if (patientError) throw patientError;
        if (!patient) throw new Error("Patient linked to this order was not found.");

        const testIds = [...new Set(items.map((item) => String(item.test_id)).filter(Boolean))];
        const { data: masterTests, error: testError } = await supabase
          .from("tests")
          .select("*")
          .in("id", testIds);
        if (testError) throw testError;

        const masterById = new Map((masterTests || []).map((test) => [String(test.id), test]));
        const selectedTests = items.map((item) => {
          const master = masterById.get(String(item.test_id));
          return {
            ...(master || {}),
            id: master?.id ?? item.test_id,
            name: master?.name || item.test_name || "Laboratory Test",
            short: master?.short || master?.short_name || item.test_name || "Laboratory Test",
            category: master?.category || item.category || "Laboratory",
            price: master?.price ?? item.price ?? 0,
            sample_type: master?.sample_type || item.sample_type || "Blood",
            tests: master?.tests || master?.parameters || [],
            parameters: master?.parameters || master?.tests || [],
          };
        });

        const patientForResultEntry = {
          ...patient,
          id: patient.id,
          databaseId: patient.id,
          patient_id: patient.patient_id,
          patientId: patient.patient_id,
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          doctor: patient.referring_doctor || patient.doctor || order.referring_doctor || "",
        };

        localStorage.setItem("nidanPatient", JSON.stringify(patientForResultEntry));
        localStorage.setItem("nidanDatabasePatientId", String(patient.id));
        localStorage.setItem("nidanSelectedTests", JSON.stringify(selectedTests));
        localStorage.setItem("nidanResults", JSON.stringify({}));
        localStorage.setItem("nidanCurrentOrder", JSON.stringify(order));
        localStorage.setItem("nidanCurrentOrderId", String(order.id));
        localStorage.removeItem("nidanReportId");
        localStorage.removeItem("nidanPendingReport");

        if (!cancelled) {
          setMessage(`Order ${order.order_no || order.id} loaded. Opening Result Entry...`);
          setTimeout(() => router.push("/results"), 250);
        }
      } catch (error) {
        if (!cancelled) setMessage(error?.message || "Unable to open laboratory order.");
      } finally {
        if (!cancelled) setBusy(false);
      }
    }

    openOrderInResultEntry();
    return () => { cancelled = true; };
  }, [id, router]);

  return (
    <main style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#f4f7f9", fontFamily: "Arial,sans-serif", padding: 20 }}>
      <section style={{ maxWidth: 520, width: "100%", background: "#fff", border: "1px solid #e1e8ed", borderRadius: 14, padding: 24, boxShadow: "0 8px 30px rgba(0,0,0,.06)" }}>
        <div style={{ fontSize: 12, fontWeight: 800, color: "#087f68", letterSpacing: 1 }}>NIDAN PATHOLOGY LAB</div>
        <h1 style={{ margin: "8px 0" }}>Laboratory Result Entry</h1>
        <p style={{ color: "#64748b", lineHeight: 1.6 }}>{message}</p>
        {busy && <div style={{ height: 7, background: "#e8eef2", borderRadius: 10, overflow: "hidden" }}><div style={{ width: "55%", height: "100%", background: "#0b9b8e" }} /></div>}
        {!busy && <button onClick={() => router.push("/operations")} style={{ marginTop: 12, border: "1px solid #d5dee5", background: "#fff", borderRadius: 8, padding: "10px 14px", fontWeight: 700 }}>← Back to Operations</button>}
      </section>
    </main>
  );
}
