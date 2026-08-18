import "./globals.css";

export const metadata = {
  title: "NIDAN Pathology Lab | Reporting System",
  description:
    "NIDAN Pathology Lab - Professional Pathology Laboratory Reporting System",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
