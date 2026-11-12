import React from "react"
import { createClient } from "@/lib/supabase/server"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { formatDate } from "@/lib/utils"

export default async function AdminIncidentsPage() {
  const supabase = await createClient()
  const { data: incidents } = await supabase
    .from("safety_incidents")
    .select("id,incident_type,description,severity,status,created_at,profile:profiles(full_name)")
    .order("created_at", { ascending: false })

  const severityColors: Record<string, string> = {
    low: "success", medium: "warning", high: "destructive", critical: "destructive",
  }
  const statusColors: Record<string, string> = {
    open: "destructive", investigating: "warning", resolved: "success", closed: "secondary",
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Safety Reports</h1>
        <p className="text-sm text-gray-500">Emergency reports and safety incidents</p>
      </div>

      {(!incidents || incidents.length === 0) ? (
        <div className="text-center py-12">
          <CheckCircle className="w-10 h-10 text-green-400 mx-auto mb-3" />
          <p className="text-gray-500">No safety incidents reported.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className={`bg-white rounded-xl border p-4 ${inc.status === "open" ? "border-red-200" : "border-gray-200"}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${inc.status === "open" ? "bg-red-100" : "bg-gray-100"}`}>
                    <AlertTriangle className={`w-4 h-4 ${inc.status === "open" ? "text-red-600" : "text-gray-500"}`} />
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <Badge variant={(severityColors[inc.severity] || "secondary") as "default"|"secondary"|"success"|"warning"|"destructive"|"info"} className="text-xs capitalize">
                        {inc.severity}
                      </Badge>
                      <Badge variant={(statusColors[inc.status] || "secondary") as "default"|"secondary"|"success"|"warning"|"destructive"|"info"} className="text-xs capitalize">
                        {inc.status}
                      </Badge>
                      <span className="text-xs text-gray-500 capitalize">{inc.incident_type.replace(/_/g, " ")}</span>
                    </div>
                    <p className="text-sm text-[#171B19]">{inc.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Reported by {(inc.profile as unknown as { full_name: string } | null)?.full_name || "Unknown"} · {formatDate(inc.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
