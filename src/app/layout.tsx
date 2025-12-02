import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/layout/sidebar";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SGMM - Sistema de Gestión de Mantenimiento",
  description: "Sistema de Gestión de Mantenimiento Metalúrgico",
};

import { createClient } from "@/utils/supabase/server";

// ... existing imports

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile = null;

  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (data) {
      profile = data;
    } else {
      // Fallback if profile doesn't exist in table yet
      profile = {
        full_name: user.user_metadata?.full_name || null,
        email: user.email || null,
        role: 'operator' // Default role
      };
    }
  }

  return (
    <html lang="es">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {user ? (
          <div className="flex min-h-screen">
            <Sidebar profile={profile} />
            <main className="flex-1 md:ml-64 p-8">
              {children}
            </main>
          </div>
        ) : (
          <main className="min-h-screen bg-background">
            {children}
          </main>
        )}
        <Toaster />
      </body>
    </html>
  );
}
