import type { Metadata } from "next";
import { MobileNavProvider } from "@/components/MobileNavProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Centro RM",
  description: "Sistema de gestión del gimnasio Centro RM",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <link href="https://fonts.googleapis.com/css2?family=Hanken+Grotesk:wght@400;600;700&family=JetBrains+Mono&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block" rel="stylesheet" />
      </head>
      <body className="bg-background text-on-background font-body-lg text-body-lg antialiased">
        <MobileNavProvider>{children}</MobileNavProvider>
      </body>
    </html>
  );
}
