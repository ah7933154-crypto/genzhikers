"use client"
import React from "react"
import Image from "next/image"
import { motion } from "framer-motion"
import { Mountain, Leaf, Users, Globe, Heart, Compass, Camera, Shield } from "lucide-react"

const goals = [
  {
    icon: Mountain,
    title: "Discover New Destinations",
    description: "Continuously explore new trails, valleys, peaks, and natural wonders across Pakistan, building the most comprehensive hiking map for youth.",
    image: "https://images.pexels.com/photos/618833/pexels-photo-618833.jpeg?w=600&q=80",
    color: "from-[#173D35] to-[#0f2a24]",
  },
  {
    icon: Leaf,
    title: "Protect the Environment",
    description: "Organize regular clean-up drives on trails and in natural areas, leaving every location cleaner and more beautiful than we found it.",
    image: "https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?w=600&q=80",
    color: "from-emerald-800 to-emerald-950",
  },
  {
    icon: Users,
    title: "Grow the Community",
    description: "Expand GenZ Hikers to every major city in Pakistan, welcoming hundreds of young adventurers into a supportive, inclusive outdoor community.",
    image: "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?w=600&q=80",
    color: "from-[#173D35] to-[#1e5045]",
  },
  {
    icon: Globe,
    title: "Promote Hiking Culture",
    description: "Make hiking and outdoor adventure a mainstream activity for Pakistani youth, shifting culture towards nature, fitness, and exploration.",
    image: "https://images.pexels.com/photos/1170765/pexels-photo-1170765.jpeg?w=600&q=80",
    color: "from-slate-800 to-slate-950",
  },
  {
    icon: Heart,
    title: "Build Lasting Friendships",
    description: "Create a community where every hike builds real relationships, friendships forged on trails, in conversation, and through shared challenge.",
    image: "https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?w=600&q=80",
    color: "from-rose-900 to-rose-950",
  },
  {
    icon: Compass,
    title: "Encourage Healthy Living",
    description: "Inspire young Pakistanis to prioritize physical activity, mental wellness, and the proven benefits of spending regular time in nature.",
    image: "https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?w=600&q=80",
    color: "from-amber-900 to-amber-950",
  },
  {
    icon: Camera,
    title: "Showcase Pakistan's Beauty",
    description: "Document and share the extraordinary natural beauty of Pakistan with the world through photography, storytelling, and social media.",
    image: "https://images.pexels.com/photos/1252500/pexels-photo-1252500.jpeg?w=600&q=80",
    color: "from-indigo-900 to-indigo-950",
  },
  {
    icon: Shield,
    title: "Set Safety Standards",
    description: "Establish and promote the highest safety standards for youth hiking in Pakistan, making outdoor adventure accessible and responsible.",
    image: "https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?w=600&q=80",
    color: "from-teal-900 to-teal-950",
  },
]

function GoalCard({ goal, index }: { goal: typeof goals[0]; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -60px 0px" }}
      transition={{ duration: 0.5, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative rounded-2xl overflow-hidden cursor-default border border-white/8 hover:border-white/20 transition-colors duration-300"
      style={{ minHeight: 180 }}
    >
      {/* Background image — always present, dimmed by default */}
      <div className="absolute inset-0">
        <Image
          src={goal.image}
          alt={goal.title}
          fill
          className="object-cover transition-all duration-700 group-hover:scale-105 group-hover:opacity-60 opacity-25"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          loading="lazy"
        />
        {/* Colour gradient overlay */}
        <div className={`absolute inset-0 bg-gradient-to-br ${goal.color} opacity-85 group-hover:opacity-70 transition-opacity duration-500`} />
      </div>

      {/* Content */}
      <div className="relative z-10 p-5 h-full flex flex-col justify-between">
        <div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4 transition-all duration-300 bg-[#A4AA83]/20 group-hover:bg-[#A4AA83] group-hover:shadow-lg">
            <goal.icon className="w-5 h-5 text-[#A4AA83] group-hover:text-[#171B19] transition-colors duration-300" />
          </div>
          <h3 className="font-display font-bold text-white text-sm leading-tight mb-2">
            {goal.title}
          </h3>
        </div>

        {/* CSS transition — no state needed, pure group-hover */}
        <p className="text-white/45 text-xs leading-relaxed line-clamp-2 mt-1 group-hover:text-white/80 group-hover:line-clamp-none transition-all duration-200">
          {goal.description}
        </p>
      </div>
    </motion.div>
  )
}

export default function GoalsSection() {
  return (
    <section id="goals" className="section-padding bg-[#171B19] relative overflow-hidden">

      {/* Subtle large background image */}
      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <Image
          src="https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?w=1920&q=60"
          alt=""
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-[#171B19]/60" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Header ── */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
          >
            Where We&apos;re Headed
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight mb-4"
          >
            Our Goals for
            <span className="text-[#A4AA83]"> Pakistan</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-white/60 text-base leading-relaxed"
          >
            GenZ Hikers is building something that lasts, a movement, not just a group chat.
            <br className="hidden sm:block" />
            <span className="text-white/40 text-sm">Hover each card to explore.</span>
          </motion.p>
        </div>

        {/* ── Goals Grid ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {goals.map((goal, i) => (
            <GoalCard key={goal.title} goal={goal} index={i} />
          ))}
        </div>

        {/* ── Highlighted stat strip ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { value: "Every Sunday", label: "We hike together" },
            { value: "Nationwide", label: "Expanding across Pakistan" },
            { value: "Clean & Green", label: "Our promise to nature" },
            { value: "1 Community", label: "Thousands of stories" },
          ].map((item) => (
            <div key={item.label} className="bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center hover:bg-white/8 transition-colors">
              <p className="font-display font-bold text-[#A4AA83] text-lg">{item.value}</p>
              <p className="text-white/50 text-xs mt-1">{item.label}</p>
            </div>
          ))}
        </motion.div>

        {/* ── CTA ── */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.4 }}
          className="text-center mt-12"
        >
          <p className="text-white/40 text-sm mb-5">
            These goals are achieved one Sunday at a time, by people like you.
          </p>
          <a
            href="/auth/register"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#A4AA83] text-[#171B19] rounded-xl font-bold text-sm hover:bg-[#b8bd9b] transition-colors shadow-lg"
          >
            <Users className="w-4 h-4" />
            Join the Movement
          </a>
        </motion.div>
      </div>
    </section>
  )
}
