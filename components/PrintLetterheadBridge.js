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

function installLetterhead() {
  const pages = document.querySelectorAll(
    ".a4Page, .reportPage"
  );

  if (!pages.length) return [];

  const letterhead = readLetterhead();
  const images = [];

  pages.forEach((page) => {
    let holder = page.querySelector(`#${PRINT_ID}`);

    if (!letterhead) {
      holder?.remove();
      page.classList.remove("has-nidan-letterhead");
      return;
    }

    page.classList.add("has-nidan-letterhead");

    if (!holder) {
      holder = document.createElement("div");
      holder.id = PRINT_ID;
      holder.setAttribute("aria-hidden", "true");
      holder.className = "nidan-letterhead-layer";

      const image = document.createElement("img");
      image.alt = "";
      image.decoding = "sync";
      image.loading = "eager";
      image.draggable = false;
      image.src = letterhead;

      holder.appendChild(image);
      page.insertBefore(holder, page.firstChild);
    }

    const image = holder.querySelector("img");

    if (image) {
      image.style.display = "block";
      image.style.visibility = "visible";
      image.style.opacity = "1";

      if (image.src !== letterhead) {
        image.src = letterhead;
      }

      images.push(image);
    }
  });

  return images;
}

function waitForImages(images) {
  const pending = images.filter(
    (image) => image && !image.complete
  );

  if (!pending.length) {
    return Promise.resolve();
  }

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

            image.addEventListener("load", done, {
              once: true,
            });
            image.addEventListener("error", done, {
              once: true,
            });
          })
      )
    ),
    new Promise((resolve) => {
      window.setTimeout(resolve, 2500);
    }),
  ]);
}

export default function PrintLetterheadBridge() {
  useEffect(() => {
    let disposed = false;

    const refresh = () => {
      if (!disposed) {
        installLetterhead();
      }
    };

    refresh();

    const timer = window.setInterval(refresh, 300);

    const handleSettingsUpdate = () => {
      refresh();
    };

    const handleStorage = () => {
      refresh();
    };

    const handleBeforePrint = () => {
      refresh();
    };

    window.addEventListener(
      "nidan-settings-updated",
      handleSettingsUpdate
    );

    window.addEventListener(
      "storage",
      handleStorage
    );

    window.addEventListener(
      "beforeprint",
      handleBeforePrint
    );

    // Important: Print/Save PDF may be pressed immediately after
    // opening the report. Wait for the uploaded letterhead image
    // to finish loading before opening the browser print dialog.
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

      window.removeEventListener(
        "nidan-settings-updated",
        handleSettingsUpdate
      );

      window.removeEventListener(
        "storage",
        handleStorage
      );

      window.removeEventListener(
        "beforeprint",
        handleBeforePrint
      );
    };
  }, []);

  return null;
}
