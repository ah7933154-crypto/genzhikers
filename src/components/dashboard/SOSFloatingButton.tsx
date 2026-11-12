"use client"
import React, { useState } from "react"
import { useRouter, usePathname } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export default function SOSFloatingButton() {
  const router = useRouter()
  const pathname = usePathname()
  const [pulse, setPulse] = useState(false)

  // Don't show on safety page itself
  if (pathname === "/dashboard/safety") return null

  const handlePress = () => {
    setPulse(true)
    setTimeout(() => { setPulse(false); router.push("/dashboard/safety") }, 300)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-center gap-1.5">
      {/* Tooltip */}
      <AnimatePresence>
        {pulse && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-gray-900 text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap"
          >
            Emergency SOS
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pulse rings */}
      <div className="relative">
        <span className="absolute inset-0 rounded-full bg-red-500/30 animate-ping" />
        <span className="absolute inset-1 rounded-full bg-red-500/20 animate-ping" style={{ animationDelay: "0.3s" }} />
        <button
          onClick={handlePress}
          className="relative w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-400 hover:to-red-600 active:scale-95 transition-all duration-150 shadow-2xl shadow-red-500/40 flex flex-col items-center justify-center border-2 border-red-400/50"
          title="Emergency SOS"
        >
          <span className="text-white font-black text-sm leading-tight">SOS</span>
          <span className="text-red-200 text-[9px]">HELP</span>
        </button>
      </div>
    </div>
  )
}
