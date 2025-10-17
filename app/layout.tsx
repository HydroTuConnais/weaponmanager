import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/navbar";
import { DiscordRoleGuard } from "@/components/discord-role-guard";

export const metadata: Metadata = {
  title: "Weapon Management System",
  description: "System de gestion d'armes",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>
        <Navbar />
        <DiscordRoleGuard>{children}</DiscordRoleGuard>
      </body>
    </html>
  );
}
