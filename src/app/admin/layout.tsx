import React from "react"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import AdminSidebar from "@/components/admin/AdminSidebar"
import AdminPasswordGate from "@/components/admin/AdminPasswordGate"

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect("/auth/login?redirect=/admin")

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, role, avatar_url")
    .eq("id", user.id)
    .single()

  if (!profile || !["super_admin", "admin", "organizer", "moderator", "senior_member", "executive"].includes(profile.role)) {
    redirect("/dashboard")
  }

  return (
    <AdminPasswordGate>
      <div className="min-h-screen bg-gray-50 flex">
        <AdminSidebar profile={profile} />
        <main className="flex-1 min-w-0 lg:ml-64">
          <div className="p-4 sm:p-6 lg:p-8">
            {children}
          </div>
        </main>
      </div>
    </AdminPasswordGate>
  )
}
