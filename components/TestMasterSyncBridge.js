"use client";

import { useEffect } from "react";
import { loadDatabaseTests } from "../lib/test-master-source";

const STORAGE_KEY = "nidanSelectedTests";

function syncSelected(databaseTests) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const selected = JSON.parse(raw);
    if (!Array.isArray(selected) || !selected.length) return;

    const byId = new Map(databaseTests.map((test) => [String(test.id), test]));
    const synced = selected.map((oldTest) => byId.get(String(oldTest.id)) || oldTest);
    const before = JSON.stringify(selected);
    const after = JSON.stringify(synced);
    if (before === after) return;

    localStorage.setItem(STORAGE_KEY, after);
    window.dispatchEvent(new CustomEvent("nidan:test-master-synced", { detail: synced }));
  } catch (error) {
    console.warn("NIDAN Test Master sync warning:", error);
  }
}

export default function TestMasterSyncBridge() {
  useEffect(() => {
    let cancelled = false;
    let timer = null;

    async function sync() {
      try {
        const tests = await loadDatabaseTests();
        if (!cancelled) syncSelected(tests);
      } catch (error) {
        console.warn("NIDAN Test Master database sync unavailable:", error);
      }
    }

    sync();
    timer = window.setInterval(sync, 1500);

    const handler = () => sync();
    window.addEventListener("storage", handler);
    window.addEventListener("nidan:test-selection-changed", handler);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      window.removeEventListener("storage", handler);
      window.removeEventListener("nidan:test-selection-changed", handler);
    };
  }, []);

  return null;
}
