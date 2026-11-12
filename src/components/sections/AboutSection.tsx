"use client"
import React, { useState } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { useInView } from "react-intersection-observer"
import { Mountain, Users, Leaf, Camera, Music, ChefHat, Heart, Shield } from "lucide-react"
import { ACTIVITY_IMAGES, COMMUNITY_IMAGES } from "@/lib/media"

const activities = [
  { icon: Mountain, label: "Trail Hiking",        desc: "Exploring Pakistan's most beautiful trails every Sunday" },
  { icon: Leaf,     label: "Clean-up Drives",     desc: "Protecting nature by leaving trails cleaner than we find them" },
  { icon: Camera,   label: "Photography",          desc: "Capturing the raw beauty of Pakistan's landscapes" },
  { icon: ChefHat,  label: "Outdoor Cooking",      desc: "Cooking together in the heart of nature" },
  { icon: Music,    label: "Music & Entertainment",desc: "Singing, dancing, and making memories" },
  { icon: Users,    label: "Community Building",   desc: "Building friendships that last beyond the trails" },
  { icon: Heart,    label: "Healthy Lifestyle",    desc: "Encouraging physical activity and mental wellness" },
  { icon: Shield,   label: "Safety First",         desc: "Every hike led with preparation, care, and emergency readiness" },
]

function ActivityCard({
  icon: Icon, label, desc, delay, imageUrl,
}: {
  icon: React.ElementType; label: string; desc: string; delay: number; imageUrl?: string
}) {
  const [hovered, setHovered] = useState(false)
  const [ref, inView] = useInView({ triggerOnce: true, threshold: 0.05 })

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="relative rounded-2xl overflow-hidden cursor-pointer border border-[#173D35]/10 group"
      style={{ minHeight: hovered ? 200 : 80, transition: "min-height 0.4s cubic-bezier(0.22,1,0.36,1)" }}
    >
      {/* Image reveal on hover */}
      <AnimatePresence>
        {hovered && imageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
            className="absolute inset-0 z-0"
          >
            <Image src={imageUrl} alt={label} fill className="object-cover scale-105" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#0f2a24]/90 via-[#0f2a24]/40 to-transparent" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content */}
      <div className={`relative z-10 flex items-start gap-3 p-4 transition-colors ${hovered && imageUrl ? "" : "hover:bg-[#173D35]/5"}`}>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-300 ${hovered && imageUrl ? "bg-[#A4AA83] text-[#171B19]" : "bg-[#173D35]/10 group-hover:bg-[#173D35]"}`}>
          <Icon className={`w-4 h-4 transition-colors ${hovered && imageUrl ? "text-[#171B19]" : "text-[#173D35] group-hover:text-white"}`} />
        </div>
        <div>
          <div className={`font-display font-semibold text-sm transition-colors ${hovered && imageUrl ? "text-white" : "text-[#171B19]"}`}>
            {label}
          </div>
          <AnimatePresence>
            {hovered ? (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className={`text-xs mt-1 leading-relaxed ${hovered && imageUrl ? "text-white/80" : "text-[#6b6b5e]"}`}>
                  {desc}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="collapsed"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-xs text-[#9c9c8f] mt-0.5 line-clamp-1"
              >
                {desc}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}

export default function AboutSection() {
  const [titleRef, titleInView] = useInView({ triggerOnce: true, threshold: 0.1 })

  return (
    <section id="about" className="section-padding bg-[#F5F4EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Two-column header ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20 mb-16 items-center">
          <div>
            <motion.div
              ref={titleRef}
              initial={{ opacity: 0, y: 20 }}
              animate={titleInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.7 }}
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block">
                Our Story
              </span>
              <h2 className="font-display font-bold text-4xl sm:text-5xl text-[#171B19] leading-tight mb-6">
                More than a hiking
                <br />
                <span className="text-[#173D35]">community.</span>
              </h2>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="space-y-4 text-[#6b6b5e] text-base leading-relaxed"
            >
              <p>
                GenZ Hikers began as a simple idea, get young Pakistanis away from screens and onto trails.
                What followed was something far greater: a living community united by adventure,
                friendship, and a shared responsibility to protect Pakistan&apos;s natural heritage.
              </p>
              <p>
                Every Sunday, we lace up our boots and head somewhere new. The destination changes.
                The spirit doesn&apos;t. We hike, we cook, we sing, we clean, we photograph, and
                most importantly, we connect. Real conversations, real friendships, real experiences.
              </p>
            </motion.div>
          </div>

          {/* Photo collage */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative h-80 lg:h-96 hidden sm:block"
          >
            {/* Large image */}
            <div className="absolute top-0 left-0 w-[60%] h-[75%] rounded-2xl overflow-hidden shadow-xl">
              <Image src={COMMUNITY_IMAGES[0]} alt="GenZ Hikers hiking" fill className="object-cover" />
            </div>
            {/* Small top-right */}
            <div className="absolute top-0 right-0 w-[37%] h-[47%] rounded-2xl overflow-hidden shadow-lg">
              <Image src={COMMUNITY_IMAGES[1]} alt="GenZ Hikers trail" fill className="object-cover" />
            </div>
            {/* Small bottom-right */}
            <div className="absolute bottom-0 right-0 w-[55%] h-[48%] rounded-2xl overflow-hidden shadow-lg">
              <Image src={COMMUNITY_IMAGES[2]} alt="GenZ Hikers community" fill className="object-cover" />
            </div>
            {/* Accent badge */}
            <div className="absolute bottom-4 left-4 bg-[#173D35] text-white px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg">
              Every Sunday 🏔
            </div>
          </motion.div>
        </div>

        {/* ── Activities Grid ── */}
        <div>
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center gap-3 mb-6"
          >
            <h3 className="font-display font-semibold text-lg text-[#171B19]">
              What we do together
            </h3>
            <span className="text-xs text-[#9c9c8f] bg-[#173D35]/8 px-2.5 py-1 rounded-full">
              Hover to explore
            </span>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {activities.map((act, i) => (
              <ActivityCard
                key={act.label}
                {...act}
                delay={i * 0.06}
                imageUrl={ACTIVITY_IMAGES[act.label]}
              />
            ))}
          </div>
        </div>

        {/* ── Mission / Vision ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-14">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative bg-[#173D35] rounded-2xl p-8 overflow-hidden"
          >
            {/* Background image */}
            <div className="absolute inset-0 opacity-15">
              <Image src={COMMUNITY_IMAGES[3]} alt="" fill className="object-cover" />
            </div>
            <div className="relative">
              <span className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block">
                Our Mission
              </span>
              <p className="font-display text-xl font-medium leading-relaxed text-white">
                &ldquo;To inspire the next generation of Pakistanis to explore the natural beauty of their country,
                build meaningful friendships, protect the environment, and live adventurously.&rdquo;
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.12 }}
            className="bg-white rounded-2xl p-8 border border-[#173D35]/10"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block">
              Our Vision
            </span>
            <p className="font-display text-xl font-medium leading-relaxed text-[#171B19]">
              &ldquo;A Pakistan where every young person has experienced the transformative power of hiking in nature,
              and where outdoor adventure is a cornerstone of youth culture.&rdquo;
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
