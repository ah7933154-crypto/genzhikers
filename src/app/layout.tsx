import type { Metadata } from "next"
import { Space_Grotesk, Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "react-hot-toast"

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
})

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
})

export const metadata: Metadata = {
  title: {
    default: "GenZ Hikers – Clean & Green",
    template: "%s | GenZ Hikers",
  },
  description:
    "GenZ Hikers is a growing outdoor adventure and hiking community based in Pakistan. We explore trails, protect the environment, and build friendships through nature.",
  keywords: ["hiking Pakistan", "GenZ Hikers", "outdoor adventure", "trekking", "mountains Pakistan", "clean green"],
  openGraph: {
    title: "GenZ Hikers – Clean & Green",
    description: "Pakistan's youth outdoor adventure community. Hike. Explore. Protect.",
    type: "website",
    locale: "en_PK",
  },
  // icon.jpg in src/app/ is auto-picked by Next.js as the favicon
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable}`}>
      <body className="font-body bg-warm-white text-charcoal antialiased">
        {children}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: "#171B19",
              color: "#F5F4EF",
              borderRadius: "8px",
              border: "1px solid rgba(164,170,131,0.2)",
              fontFamily: "var(--font-inter)",
              fontSize: "14px",
            },
            success: {
              iconTheme: { primary: "#A4AA83", secondary: "#171B19" },
            },
            error: {
              iconTheme: { primary: "#ef4444", secondary: "#F5F4EF" },
            },
          }}
        />
      </body>
    </html>
  )
}
