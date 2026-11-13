"use client"
import React, { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Save } from "lucide-react"
import toast from "react-hot-toast"

interface Setting { key: string; value: string | null; description: string | null }

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Setting[]>([])
  const [values, setValues] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.from("community_settings").select("*").order("key").then(({ data }: { data: Setting[] | null }) => {
      setSettings(data || [])
      const vals: Record<string, string> = {}
      data?.forEach((s) => { vals[s.key] = s.value || "" })
      setValues(vals)
    })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    const updates = Object.entries(values).map(([key, value]) => ({
      key, value, updated_by: user?.id, updated_at: new Date().toISOString(),
    }))
    for (const update of updates) {
      await supabase.from("community_settings").upsert(update, { onConflict: "key" })
    }
    setSaving(false)
    toast.success("Settings saved!")
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="font-display font-bold text-2xl text-[#171B19]">Community Settings</h1>
        <p className="text-sm text-gray-500">Manage community mission, vision, and links.</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
        {settings.map((s) => (
          <div key={s.key}>
            {s.key.includes("url") ? (
              <Input
                label={s.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                value={values[s.key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                hint={s.description || undefined}
              />
            ) : (
              <Textarea
                label={s.key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                value={values[s.key] || ""}
                onChange={(e) => setValues((v) => ({ ...v, [s.key]: e.target.value }))}
                rows={3}
                hint={s.description || undefined}
              />
            )}
          </div>
        ))}
      </div>

      <Button onClick={handleSave} disabled={saving} size="lg">
        <Save className="w-4 h-4" />
        {saving ? "Saving..." : "Save Settings"}
      </Button>
    </div>
  )
}
