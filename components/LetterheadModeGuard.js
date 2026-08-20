"use client";

import { useEffect } from "react";

const SETTINGS_KEY = "nidanLabSettings";

/**
 * Full-A4 letterhead is the only branding surface.
 * The browser also analyses the uploaded stationery so the report
 * content zone follows the actual header/footer geometry instead of
 * relying on one hard-coded margin.
 */
export default function LetterheadModeGuard() {
  useEffect(() => {
    let observer;

    const analyseLetterhead = (letterhead) => {
      if (!letterhead || typeof window === "undefined") return;

      const img = new Image();
      img.onload = () => {
        try {
          const width = 320;
          const height = Math.max(
            320,
            Math.round((img.naturalHeight / img.naturalWidth) * width)
          );

          const canvas = document.createElement("canvas");
          canvas.width = width;
          canvas.height = height;

          const ctx = canvas.getContext("2d", { willReadFrequently: true });
          if (!ctx) return;

          ctx.drawImage(img, 0, 0, width, height);
          const data = ctx.getImageData(0, 0, width, height).data;
          const scores = new Array(height).fill(0);

          for (let y = 0; y < height; y += 1) {
            let marked = 0;
            for (let x = 0; x < width; x += 4) {
              const i = (y * width + x) * 4;
              const r = data[i];
              const g = data[i + 1];
              const b = data[i + 2];
              const brightness = (r + g + b) / 3;
              const saturation = Math.max(r, g, b) - Math.min(r, g, b);

              if (brightness < 235 || saturation > 28) marked += 1;
            }
            scores[y] = marked / Math.ceil(width / 4);
          }

          const runFromTop = () => {
            let start = -1;
            let end = -1;
            for (let y = 0; y < height; y += 1) {
              if (scores[y] > 0.32) {
                if (start === -1) start = y;
                end = y;
              } else if (start !== -1) {
                if (end - start > height * 0.045) break;
                start = -1;
                end = -1;
              }
            }
            return end > start ? end : Math.round(height * 0.15);
          };

          const runFromBottom = () => {
            let start = -1;
            let end = -1;
            for (let y = height - 1; y >= 0; y -= 1) {
              if (scores[y] > 0.32) {
                if (end === -1) end = y;
                start = y;
              } else if (end !== -1) {
                if (end - start > height * 0.045) break;
                start = -1;
                end = -1;
              }
            }
            return start < end ? start : Math.round(height * 0.88);
          };

          const headerEnd = runFromTop();
          const footerStart = runFromBottom();
          const pageMm = 297;

          // Leave a small breathing space after the stationery header and
          // before the stationery footer. Clamp values for unusual designs.
          const contentTop = Math.min(
            68,
            Math.max(52, (headerEnd / height) * pageMm + 12)
          );
          const contentBottom = Math.min(
            280,
            Math.max(250, (footerStart / height) * pageMm - 6)
          );

          document.documentElement.style.setProperty(
            "--nidan-letterhead-content-top",
            `${contentTop.toFixed(2)}mm`
          );
          document.documentElement.style.setProperty(
            "--nidan-letterhead-content-bottom",
            `${contentBottom.toFixed(2)}mm`
          );
        } catch (error) {
          console.warn("Letterhead geometry analysis failed:", error);
        }
      };

      img.onerror = () => {
        document.documentElement.style.setProperty(
          "--nidan-letterhead-content-top",
          "57mm"
        );
        document.documentElement.style.setProperty(
          "--nidan-letterhead-content-bottom",
          "270mm"
        );
      };

      img.src = letterhead;
    };

    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      const current = raw ? JSON.parse(raw) : {};
      const hasLetterhead = Boolean(
        String(current?.letterhead || "").trim()
      );

      const next = {
        ...current,
        reportHeader: hasLetterhead ? false : current?.reportHeader ?? true,
        showLogo: hasLetterhead ? false : current?.showLogo ?? true,
      };

      localStorage.setItem(SETTINGS_KEY, JSON.stringify(next));

      if (hasLetterhead) {
        document.documentElement.style.setProperty(
          "--nidan-letterhead-content-top",
          "57mm"
        );
        document.documentElement.style.setProperty(
          "--nidan-letterhead-content-bottom",
          "270mm"
        );
        analyseLetterhead(current.letterhead);
      }

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
        observer = new MutationObserver(hideObsoleteToggles);
        observer.observe(document.body, { childList: true, subtree: true });
      }
    } catch (error) {
      console.error("Letterhead mode guard error:", error);
    }

    return () => observer?.disconnect();
  }, []);

  return null;
}
