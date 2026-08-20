"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";

/**
 * Full-A4 letterhead is the only branding surface.
 * Do not force the legacy generated header/logo back on.
 */
export default function LetterheadModeGuard() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const hasLetterhead = Boolean(
        String(current?.letterhead || "").trim()
      );

      const next = {
        ...current,
        // When a full A4 letterhead exists, the uploaded stationery is the
        // only branding layer. These legacy flags must not re-enable it.
        reportHeader: hasLetterhead ? false : current?.reportHeader ?? true,
        showLogo: hasLetterhead ? false : current?.showLogo ?? true,
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

      if (window.location.pathname === "/settings") {
        const hideObsoleteToggles = () => {
          const options = document.querySelector(".settingOptions");
          if (!options) return;

          const items = options.querySelectorAll(".toggleItem");
          items.forEach((item, index) => {
            if (index === 0 || index === 1) {
              item.style.display = "none";
            }
          });
        };

        hideObsoleteToggles();
        const observer = new MutationObserver(hideObsoleteToggles);
        observer.observe(document.body, { childList: true, subtree: true });

        return () => observer.disconnect();
      }
    } catch (error) {
      console.error("Letterhead mode guard error:", error);
    }
  }, []);

  return null;
}
