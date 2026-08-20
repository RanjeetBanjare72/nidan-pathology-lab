import LogoutButton from "../components/LogoutButton";
import PrintLetterheadBridge from "../components/PrintLetterheadBridge";
import LetterheadModeGuard from "../components/LetterheadModeGuard";
import "./tailwind.css";
import "./globals.css";
import "./print-fixes.css";
import "./letterhead-mode.css";
import "./professional-report-overrides.css";

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
        {children}
        <PrintLetterheadBridge />
        <LogoutButton />
      </body>
    </html>
  );
}
