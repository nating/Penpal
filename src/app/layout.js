// app/layout.js
import './globals.css'; // make sure this imports Tailwind's styles

export const metadata = {
  title: 'Penpal App',
  description: 'Penpal matching MVP with a polished Tailwind UI',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="h-full bg-gray-100">
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
