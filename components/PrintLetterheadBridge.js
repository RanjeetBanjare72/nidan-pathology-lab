"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";
const PRINT_ID = "nidan-print-letterhead";

export default function PrintLetterheadBridge() {
  useEffect(() => {
    function installLetterhead() {
      const pages = document.querySelectorAll(".page");

      if (!pages.length) {
        return;
      }

      let settings = {};

      try {
        settings = JSON.parse(
          localStorage.getItem(SETTINGS_KEY) || "{}"
        );
      } catch {
        settings = {};
      }

      const letterhead = String(
        settings?.letterhead || ""
      ).trim();

      pages.forEach((page) => {
        let holder = page.querySelector(`#${PRINT_ID}`);

        if (!letterhead) {
          holder?.remove();
          return;
        }

        if (!holder) {
          holder = document.createElement("div");
          holder.id = PRINT_ID;
          holder.setAttribute("aria-hidden", "true");

          const image = document.createElement("img");
          image.alt = "";
          image.decoding = "sync";
          image.src = letterhead;

          holder.appendChild(image);
          page.insertBefore(holder, page.firstChild);
        } else {
          const image = holder.querySelector("img");

          if (image && image.src !== letterhead) {
            image.src = letterhead;
          }
        }
      });
    }

    installLetterhead();

    const timer = window.setInterval(
      installLetterhead,
      500
    );

    window.addEventListener(
      "beforeprint",
      installLetterhead
    );

    window.addEventListener(
      "nidan-settings-updated",
      installLetterhead
    );

    window.addEventListener(
      "storage",
      installLetterhead
    );

    return () => {
      window.clearInterval(timer);
      window.removeEventListener(
        "beforeprint",
        installLetterhead
      );
      window.removeEventListener(
        "nidan-settings-updated",
        installLetterhead
      );
      window.removeEventListener(
        "storage",
        installLetterhead
      );
    };
  }, []);

  return null;
}
