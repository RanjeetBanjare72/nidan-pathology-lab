"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";
const PRINT_ID = "nidan-print-letterhead";

const DEFAULT_CALIBRATION = {
  topMm: 40,
  bottomMm: 18,
  leftMm: 10,
  rightMm: 10,
};

function readLetterhead() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return String(settings?.letterhead || "").trim();
  } catch {
    return "";
  }
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function isInk(r, g, b, a) {
  if (a < 20) return false;
  const maxChannel = Math.max(r, g, b);
  const minChannel = Math.min(r, g, b);
  return maxChannel - minChannel > 18 || maxChannel < 238;
}

function rowInkDensity(data, width, y, step = 4) {
  let marked = 0;
  let sampled = 0;
  for (let x = 0; x < width; x += step) {
    const i = (y * width + x) * 4;
    const a = data[i + 3];
    if (a < 20) continue;
    sampled += 1;
    if (isInk(data[i], data[i + 1], data[i + 2], a)) marked += 1;
  }
  return sampled ? marked / sampled : 0;
}

function findStableWhiteRun(densities, start, end, direction) {
  const requiredRows = 10;
  const threshold = 0.015;
  if (direction === "down") {
    let run = 0;
    for (let y = start; y <= end; y += 1) {
      if (densities[y] < threshold) {
        run += 1;
        if (run >= requiredRows) return y - requiredRows + 1;
      } else run = 0;
    }
  } else {
    let run = 0;
    for (let y = start; y >= end; y -= 1) {
      if (densities[y] < threshold) {
        run += 1;
        if (run >= requiredRows) return y + requiredRows - 1;
      } else run = 0;
    }
  }
  return null;
}

/* Detect long vertical stationery boundaries in the blank report body. */
function detectHorizontalSafeZone(data, width, height) {
  const bodyStart = Math.floor(height * 0.32);
  const bodyEnd = Math.floor(height * 0.84);
  const yStep = Math.max(2, Math.floor((bodyEnd - bodyStart) / 220));
  const samples = Math.max(1, Math.ceil((bodyEnd - bodyStart) / yStep));
  const scores = new Array(width).fill(0);

  for (let x = 0; x < width; x += 1) {
    let marked = 0;
    for (let y = bodyStart; y <= bodyEnd; y += yStep) {
      const i = (y * width + x) * 4;
      if (isInk(data[i], data[i + 1], data[i + 2], data[i + 3])) marked += 1;
    }
    scores[x] = marked / samples;
  }

  const threshold = 0.32;
  const leftEnd = Math.floor(width * 0.30);
  const rightStart = Math.floor(width * 0.70);
  let left = null;
  let right = null;

  for (let x = 0; x <= leftEnd; x += 1) {
    if (scores[x] >= threshold) {
      left = x;
      break;
    }
  }
  for (let x = width - 1; x >= rightStart; x -= 1) {
    if (scores[x] >= threshold) {
      right = x;
      break;
    }
  }

  let leftMm = DEFAULT_CALIBRATION.leftMm;
  let rightMm = DEFAULT_CALIBRATION.rightMm;
  if (left != null) leftMm = clamp((left / width) * 210, 5, 24);
  if (right != null) rightMm = clamp(((width - 1 - right) / width) * 210, 5, 24);

  if (210 - leftMm - rightMm < 165) {
    const availableMargins = 45;
    const total = leftMm + rightMm || 1;
    leftMm = availableMargins * (leftMm / total);
    rightMm = availableMargins * (rightMm / total);
  }

  return { leftMm, rightMm };
}

async function calculateLetterheadCalibration(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.decoding = "async";
    image.crossOrigin = "anonymous";

    image.onload = () => {
      try {
        const width = image.naturalWidth || image.width;
        const height = image.naturalHeight || image.height;
        if (!width || !height) {
          resolve(DEFAULT_CALIBRATION);
          return;
        }

        const canvas = document.createElement("canvas");
        const scale = Math.min(1, 1600 / height);
        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) {
          resolve(DEFAULT_CALIBRATION);
          return;
        }

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        let pixels;
        try {
          pixels = ctx.getImageData(0, 0, canvas.width, canvas.height);
        } catch {
          resolve(DEFAULT_CALIBRATION);
          return;
        }

        const densities = new Array(canvas.height);
        for (let y = 0; y < canvas.height; y += 1) {
          densities[y] = rowInkDensity(pixels.data, canvas.width, y);
        }

        const topWhiteStart = findStableWhiteRun(
          densities,
          Math.floor(canvas.height * 0.02),
          Math.floor(canvas.height * 0.42),
          "down"
        );
        const bottomWhiteEnd = findStableWhiteRun(
          densities,
          Math.floor(canvas.height * 0.98),
          Math.floor(canvas.height * 0.58),
          "up"
        );

        let topRatio = topWhiteStart != null
          ? topWhiteStart / canvas.height
          : DEFAULT_CALIBRATION.topMm / 297;
        let bottomRatio = bottomWhiteEnd != null
          ? 1 - bottomWhiteEnd / canvas.height
          : DEFAULT_CALIBRATION.bottomMm / 297;

        topRatio = clamp(topRatio, 0.08, 0.30);
        bottomRatio = clamp(bottomRatio, 0.04, 0.20);

        const minContentRatio = 0.50;
        if (1 - topRatio - bottomRatio < minContentRatio) {
          const available = 1 - minContentRatio;
          const total = topRatio + bottomRatio || 1;
          topRatio = available * (topRatio / total);
          bottomRatio = available * (bottomRatio / total);
        }

        const horizontal = detectHorizontalSafeZone(
          pixels.data,
          canvas.width,
          canvas.height
        );

        resolve({
          topMm: clamp(topRatio * 297, 26, 84),
          bottomMm: clamp(bottomRatio * 297, 12, 54),
          leftMm: horizontal.leftMm,
          rightMm: horizontal.rightMm,
        });
      } catch (error) {
        console.warn("NIDAN letterhead calibration failed:", error);
        resolve(DEFAULT_CALIBRATION);
      }
    };

    image.onerror = () => resolve(DEFAULT_CALIBRATION);
    image.src = src;
  });
}

function applyCalibration(page, calibration) {
  page.style.setProperty("--nidan-letterhead-top", `${calibration.topMm}mm`);
  page.style.setProperty("--nidan-letterhead-bottom", `${calibration.bottomMm}mm`);
  page.style.setProperty("--nidan-letterhead-left", `${calibration.leftMm}mm`);
  page.style.setProperty("--nidan-letterhead-right", `${calibration.rightMm}mm`);
  page.dataset.letterheadCalibrated = "true";
}

function removeLegacyBranding(page) {
  page.querySelectorAll(".labHeader, .accentBar, .accent, .footer, .uploadedLogo").forEach((node) => node.remove());
  page.querySelectorAll(`.nidan-letterhead-layer`).forEach((node) => {
    if (node.id !== PRINT_ID) node.remove();
  });
}

async function installLetterhead() {
  const pages = document.querySelectorAll(".a4Page, .reportPage");
  if (!pages.length) return [];
  const letterhead = readLetterhead();
  const images = [];

  if (!letterhead) {
    pages.forEach((page) => {
      page.querySelector(`#${PRINT_ID}`)?.remove();
      page.classList.remove("has-nidan-letterhead");
      page.style.removeProperty("--nidan-letterhead-top");
      page.style.removeProperty("--nidan-letterhead-bottom");
      page.style.removeProperty("--nidan-letterhead-left");
      page.style.removeProperty("--nidan-letterhead-right");
      delete page.dataset.letterheadCalibrated;
    });
    return images;
  }

  const calibration = await calculateLetterheadCalibration(letterhead);
  pages.forEach((page) => {
    page.classList.add("has-nidan-letterhead");
    removeLegacyBranding(page);
    applyCalibration(page, calibration);

    let holder = page.querySelector(`#${PRINT_ID}`);
    if (!holder) {
      holder = document.createElement("div");
      holder.id = PRINT_ID;
      holder.setAttribute("aria-hidden", "true");
      holder.className = "nidan-letterhead-layer";
      page.insertBefore(holder, page.firstChild);
    }

    let image = holder.querySelector("img");
    if (!image) {
      image = document.createElement("img");
      image.alt = "";
      image.decoding = "sync";
      image.loading = "eager";
      image.draggable = false;
      holder.appendChild(image);
    }

    image.style.display = "block";
    image.style.visibility = "visible";
    image.style.opacity = "1";
    if (image.src !== letterhead) image.src = letterhead;
    images.push(image);
  });
  return images;
}

function waitForImages(images) {
  const pending = images.filter((image) => image && !image.complete);
  if (!pending.length) return Promise.resolve();
  return Promise.race([
    Promise.all(pending.map((image) => new Promise((resolve) => {
      const done = () => {
        image.removeEventListener("load", done);
        image.removeEventListener("error", done);
        resolve();
      };
      image.addEventListener("load", done, { once: true });
      image.addEventListener("error", done, { once: true });
    }))),
    new Promise((resolve) => window.setTimeout(resolve, 2500)),
  ]);
}

export default function PrintLetterheadBridge() {
  useEffect(() => {
    let disposed = false;
    let calibrationPromise = null;
    let lastLetterhead = "";

    const refresh = async () => {
      if (disposed) return;
      const letterhead = readLetterhead();
      if (letterhead !== lastLetterhead) {
        lastLetterhead = letterhead;
        calibrationPromise = null;
      }
      if (!calibrationPromise) calibrationPromise = installLetterhead();
      await calibrationPromise;
      if (disposed) return;
      const pages = document.querySelectorAll(".a4Page, .reportPage");
      if (letterhead) {
        pages.forEach((page) => {
          if (!page.dataset.letterheadCalibrated) calibrationPromise = null;
        });
      }
    };

    refresh();
    const timer = window.setInterval(refresh, 700);

    const resetCalibration = () => {
      lastLetterhead = "";
      calibrationPromise = null;
      refresh();
    };

    window.addEventListener("nidan-settings-updated", resetCalibration);
    window.addEventListener("storage", resetCalibration);
    window.addEventListener("beforeprint", resetCalibration);

    const nativePrint = window.print.bind(window);
    if (!window.__nidanPrintWrapped) {
      window.__nidanPrintWrapped = true;
      window.print = async () => {
        lastLetterhead = "";
        calibrationPromise = null;
        const images = await installLetterhead();
        await waitForImages(images);
        await installLetterhead();
        nativePrint();
      };
    }

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("nidan-settings-updated", resetCalibration);
      window.removeEventListener("storage", resetCalibration);
      window.removeEventListener("beforeprint", resetCalibration);
    };
  }, []);

  return null;
}
