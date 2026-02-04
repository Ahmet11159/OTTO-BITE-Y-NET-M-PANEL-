import { Inter } from "next/font/google";
import "./globals.css";
import ToastProvider from "./providers/toast-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "OTTOBITE ShiftLog",
  description: "Operasyonel Raporlama Sistemi",
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover'
}

export default function RootLayout({ children }) {
  return (
    <html lang="tr">
      <body className={inter.className}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
