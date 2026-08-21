"use client";

import { useEffect } from "react";
import { loadDatabaseTests } from "../lib/test-master-source";

const STORAGE_KEY = "nidanSelectedTests";

function normalize(value) {
  return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

let databaseCache = [];

function resolveDatabaseTest(oldTest, databaseTests) {
  const idMatch = databaseTests.find((test) => String(test.id) === String(oldTest.id));
  if (idMatch) return idMatch;

  const oldName = normalize(oldTest.name);
  const oldShort = normalize(oldTest.short);
  return databaseTests.find((test) => {
    return (oldName && normalize(test.name) === oldName) ||
      (oldShort && normalize(test.short) === oldShort);
  }) || oldTest;
}

function syncSelected(databaseTests = databaseCache) {
  if (!databaseTests.length) return;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const selected = JSON.parse(raw);
    if (!Array.isArray(selected) || !selected.length) return;

    const synced = selected.map((oldTest) => resolveDatabaseTest(oldTest, databaseTests));
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
    const originalSetItem = Storage.prototype.setItem;

    async function sync() {
      try {
        const tests = await loadDatabaseTests();
        if (!cancelled) {
          databaseCache = tests || [];
          syncSelected(databaseCache);
        }
      } catch (error) {
        console.warn("NIDAN Test Master database sync unavailable:", error);
      }
    }

    Storage.prototype.setItem = function (key, value) {
      originalSetItem.call(this, key, value);
      if (this === localStorage && key === STORAGE_KEY && databaseCache.length) {
        try {
          const selected = JSON.parse(value);
          if (Array.isArray(selected) && selected.length) {
            const synced = selected.map((oldTest) => resolveDatabaseTest(oldTest, databaseCache));
            const syncedJson = JSON.stringify(synced);
            if (syncedJson !== value) originalSetItem.call(this, STORAGE_KEY, syncedJson);
          }
        } catch {}
      }
    };

    sync();
    timer = window.setInterval(sync, 5000);

    const handler = () => sync();
    window.addEventListener("storage", handler);
    window.addEventListener("nidan:test-selection-changed", handler);

    return () => {
      cancelled = true;
      if (timer) window.clearInterval(timer);
      window.removeEventListener("storage", handler);
      window.removeEventListener("nidan:test-selection-changed", handler);
      Storage.prototype.setItem = originalSetItem;
    };
  }, []);

  return null;
}
