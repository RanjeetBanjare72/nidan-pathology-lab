"use client";

import { useEffect } from "react";
import { calculateDerivedResults, canonicalParameterName } from "../lib/lab-calculations";

function visible(el) {
  if (!el) return false;
  const s = getComputedStyle(el);
  return s.display !== "none" && s.visibility !== "hidden" && el.getClientRects().length > 0;
}

function setReactInputValue(input, value) {
  const next = String(value);
  if (input.value === next) return;
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set;
  if (setter) setter.call(input, next);
  else input.value = next;
  input.dispatchEvent(new Event("input", { bubbles: true }));
  input.dispatchEvent(new Event("change", { bubbles: true }));
}

function parameterNameFromElement(input) {
  const row = input.closest("tr");
  if (row) return row.querySelector("td:first-child b")?.textContent?.trim() || "";
  const card = input.closest(".param");
  return card?.querySelector(".paramName")?.textContent?.replace(/^\s*\d+\s*/, "").trim() || "";
}

function collectEntries() {
  const entries = {};
  document.querySelectorAll(".desktopTable input, .desktopTable select, .mobileParams input, .mobileParams select").forEach((input) => {
    if (!visible(input)) return;
    const name = parameterNameFromElement(input);
    if (!name || input.value === "") return;
    entries[name] = input.value;
  });

  try {
    const patient = JSON.parse(localStorage.getItem("nidanPatient") || "{}");
    if (patient?.age !== undefined && patient?.age !== null && patient.age !== "") entries.Age = patient.age;
    const gender = patient?.gender || patient?.sex || "";
    if (gender) entries.Gender = gender;
  } catch {}

  return entries;
}

function findTargetInputs(target) {
  const canonical = canonicalParameterName(target);
  const inputs = [];
  document.querySelectorAll(".desktopTable input, .mobileParams input").forEach((input) => {
    const name = parameterNameFromElement(input);
    if (canonicalParameterName(name) === canonical) inputs.push(input);
  });
  return inputs.filter(visible);
}

function applyCalculatedResults() {
  if (!document.querySelector(".desktopTable, .mobileParams")) return;
  const entries = collectEntries();
  const derived = calculateDerivedResults(entries);

  Object.entries(derived).forEach(([target, data]) => {
    const inputs = findTargetInputs(target);
    inputs.forEach((input) => {
      input.dataset.nidanCalculated = "true";
      input.title = `Calculated: ${data.formula}`;
      setReactInputValue(input, data.value);
    });
  });
}

export default function CalculatedResultsBridge() {
  useEffect(() => {
    let timer = null;
    let observer = null;
    let running = false;

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        if (running) return;
        running = true;
        try { applyCalculatedResults(); } finally { running = false; }
      }, 80);
    };

    const start = () => {
      schedule();
      observer = new MutationObserver(schedule);
      observer.observe(document.body, { childList: true, subtree: true });
      document.addEventListener("input", schedule, true);
      document.addEventListener("change", schedule, true);
      window.addEventListener("storage", schedule);
    };

    start();
    return () => {
      if (timer) window.clearTimeout(timer);
      observer?.disconnect();
      document.removeEventListener("input", schedule, true);
      document.removeEventListener("change", schedule, true);
      window.removeEventListener("storage", schedule);
    };
  }, []);

  return null;
}
