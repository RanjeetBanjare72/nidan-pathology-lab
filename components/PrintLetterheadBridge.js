"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";
const PRINT_ID = "nidan-print-letterhead";

function readLetterhead() {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    const settings = raw ? JSON.parse(raw) : {};
    return String(settings?.letterhead || "").trim();
  } catch {
    return "";
  }
}

function removeLegacyBranding(page) {
  // A full uploaded A4 letterhead is the only stationery layer.
  page.querySelectorAll(
    ".labHeader, .accentBar, .accent, .footer, .uploadedLogo"
  ).forEach((node) => node.remove());

  // Remove accidental duplicate letterhead layers left by older builds.
  page.querySelectorAll(`.nidan-letterhead-layer`).forEach((node) => {
    if (node.id !== PRINT_ID) node.remove();
  });
}

function installLetterhead() {
  const pages = document.querySelectorAll(
    ".a4Page, .reportPage"
  );

  if (!pages.length) return [];

  const letterhead = readLetterhead();
  const images = [];

  pages.forEach((page) => {
    if (!letterhead) {
      page.querySelector(`#${PRINT_ID}`)?.remove();
      page.classList.remove("has-nidan-letterhead");
      return;
    }

    page.classList.add("has-nidan-letterhead");
    removeLegacyBranding(page);

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

    if (image.src !== letterhead) {
      image.src = letterhead;
    }

    images.push(image);
  });

  return images;
}

function waitForImages(images) {
  const pending = images.filter(
    (image) => image && !image.complete
  );

  if (!pending.length) return Promise.resolve();

  return Promise.race([
    Promise.all(
      pending.map(
        (image) =>
          new Promise((resolve) => {
            const done = () => {
              image.removeEventListener("load", done);
              image.removeEventListener("error", done);
              resolve();
            };

            image.addEventListener("load", done, { once: true });
            image.addEventListener("error", done, { once: true });
          })
      )
    ),
    new Promise((resolve) => window.setTimeout(resolve, 2500)),
  ]);
}

export default function PrintLetterheadBridge() {
  useEffect(() => {
    let disposed = false;

    const refresh = () => {
      if (!disposed) installLetterhead();
    };

    refresh();
    const timer = window.setInterval(refresh, 300);

    const handleSettingsUpdate = () => refresh();
    const handleStorage = () => refresh();
    const handleBeforePrint = () => refresh();

    window.addEventListener("nidan-settings-updated", handleSettingsUpdate);
    window.addEventListener("storage", handleStorage);
    window.addEventListener("beforeprint", handleBeforePrint);

    const nativePrint = window.print.bind(window);

    if (!window.__nidanPrintWrapped) {
      window.__nidanPrintWrapped = true;

      window.print = async () => {
        const images = installLetterhead();
        await waitForImages(images);
        installLetterhead();
        nativePrint();
      };
    }

    return () => {
      disposed = true;
      window.clearInterval(timer);
      window.removeEventListener("nidan-settings-updated", handleSettingsUpdate);
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("beforeprint", handleBeforePrint);
    };
  }, []);

  return null;
}
