import React from "react"
import Link from "next/link"
import { Mountain, Mail } from "lucide-react"

export default function VerifyEmailPage() {
  return (
    <div className="min-h-screen bg-[#F5F4EF] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center">
        <div className="w-16 h-16 rounded-2xl bg-[#173D35] flex items-center justify-center mx-auto mb-6">
          <Mail className="w-8 h-8 text-white" />
        </div>
        <h1 className="font-display font-bold text-2xl text-[#171B19] mb-3">Check your email</h1>
        <p className="text-[#6b6b5e] text-sm leading-relaxed mb-8">
          We sent a confirmation link to your email address. Click it to activate your GenZ Hikers account.
        </p>
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-[#173D35] hover:underline">
          <Mountain className="w-4 h-4" />
          Back to GenZ Hikers
        </Link>
      </div>
    </div>
  )
}
