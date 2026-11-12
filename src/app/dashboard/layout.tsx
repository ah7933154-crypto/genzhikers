import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import DashboardSidebar from "@/components/dashboard/DashboardSidebar"
import SOSFloatingButton from "@/components/dashboard/SOSFloatingButton"
import SOSAlertBanner from "@/components/dashboard/SOSAlertBanner"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login?redirect=/dashboard")
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, role, membership_status, completed_hikes_count")
    .eq("id", user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#F5F4EF] flex">
      <DashboardSidebar profile={profile} />
      <main className="flex-1 min-w-0 lg:ml-64">
        <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
          {children}
        </div>
      </main>
      <SOSAlertBanner />
      <SOSFloatingButton />
    </div>
  )
}
