import LogoutButton from "../components/LogoutButton";
import PrintLetterheadBridge from "../components/PrintLetterheadBridge";
import LetterheadModeGuard from "../components/LetterheadModeGuard";
import TestMasterSyncBridge from "../components/TestMasterSyncBridge";
import NidanReportBarcodeEnhancer from "../components/NidanReportBarcodeEnhancer";
import NidanReferenceRangeEnhancer from "../components/NidanReferenceRangeEnhancer";
import "./tailwind.css";
import "./globals.css";
import "./print-fixes.css";
import "./letterhead-mode.css";
import "./professional-report-overrides.css";
import "./patient-report-fix.css";
import "./nidan-report-final-fixes.css";
import "./nidan-production-report.css";
import "./final-report-print-fix.css";

export const metadata = {
  title: "NIDAN Pathology Lab | Reporting System",
  description:
    "NIDAN Pathology Lab - Professional Pathology Laboratory Reporting System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <LetterheadModeGuard />
        <TestMasterSyncBridge />
        <NidanReferenceRangeEnhancer />
        {children}
        <NidanReportBarcodeEnhancer />
        <PrintLetterheadBridge />
        <LogoutButton />
      </body>
    </html>
  );
}
