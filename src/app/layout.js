// app/layout.js
import "./globals.css";
import MiniKitProvider from "./minikit-provider";

export const metadata = {
  title: "Penpal App - MiniKit Edition",
  description: "Using World MiniKit to verify real users",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <MiniKitProvider>{children}</MiniKitProvider>
      </body>
    </html>
  );
}
