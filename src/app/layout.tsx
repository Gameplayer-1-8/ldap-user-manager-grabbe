import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { AppLayout } from "../components/layout/AppLayout"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "LDAP Admin Dashboard",
  description: "Modern UI for managing LDAP users and groups",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="de" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <AppLayout>{children}</AppLayout>
      </body>
    </html>
  )
}
