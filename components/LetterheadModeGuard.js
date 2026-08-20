"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";

export default function LetterheadModeGuard() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const next = {
        ...current,
        // Uploaded letterhead is now the only header/logo source.
        // Keep these internally enabled so the uploaded letterhead can render.
        reportHeader: true,
        showLogo: true,
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

      // Remove the obsolete Report Header and Logo toggles from Settings UI.
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
