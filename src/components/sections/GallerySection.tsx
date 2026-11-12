"use client"
import React, { useState, useCallback, useEffect, useRef } from "react"
import Image from "next/image"
import { motion, AnimatePresence } from "framer-motion"
import { X, ChevronLeft, ChevronRight, Play, Camera, Film } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import type { MediaCategory } from "@/lib/media"

// DB media maps to MediaItem shape
interface MediaItem {
  id: string
  media_type: "image" | "video"
  url: string
  thumbnail_url?: string | null
  caption: string | null
  category: MediaCategory
  photographer?: string | null
}

// ─── Lightbox ────────────────────────────────────────────────
function Lightbox({
  items, index, onClose, onNext, onPrev,
}: { items: MediaItem[]; index: number; onClose: () => void; onNext: () => void; onPrev: () => void }) {
  const item = items[index]
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") onNext()
      if (e.key === "ArrowLeft") onPrev()
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [onClose, onNext, onPrev])

  // Pause video when navigating
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.pause()
      videoRef.current.currentTime = 0
    }
  }, [index])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 z-[200] bg-black/97 flex items-center justify-center"
      onClick={onClose}
    >
      {/* Close */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Close"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Prev */}
      <button
        onClick={(e) => { e.stopPropagation(); onPrev() }}
        className="absolute left-3 sm:left-6 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Previous"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      {/* Next */}
      <button
        onClick={(e) => { e.stopPropagation(); onNext() }}
        className="absolute right-3 sm:right-6 z-20 w-11 h-11 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
        aria-label="Next"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Media */}
      <motion.div
        key={index}
        initial={{ scale: 0.93, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-5xl max-h-[88vh] px-16 sm:px-20 flex flex-col items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        {item.media_type === "video" ? (
          <video
            ref={videoRef}
            src={item.url}
            controls
            autoPlay
            preload="metadata"
            className="w-full max-h-[75vh] rounded-xl object-contain bg-black"
            style={{ maxWidth: "900px" }}
          />
        ) : (
          <div className="relative w-full max-h-[75vh]" style={{ aspectRatio: "16/10" }}>
            <Image
              src={item.url}
              alt={item.caption || "Gallery photo"}
              fill
              className="object-contain rounded-xl"
              sizes="(max-width: 1200px) 95vw, 900px"
            />
          </div>
        )}

        {/* Caption */}
        {item.caption && (
          <div className="mt-3 text-center">
            <p className="text-white/80 text-sm">{item.caption}</p>
            {item.photographer && (
              <p className="text-white/40 text-xs mt-1">📷 {item.photographer}</p>
            )}
          </div>
        )}
      </motion.div>

      {/* Counter */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
        {items.map((_, i) => (
          <div key={i} className={`rounded-full transition-all ${i === index ? "w-4 h-1.5 bg-[#A4AA83]" : "w-1.5 h-1.5 bg-white/25"}`} />
        ))}
      </div>
    </motion.div>
  )
}

// ─── Gallery Item Card ───────────────────────────────────────
function GalleryCard({ item, index, onClick }: { item: MediaItem; index: number; onClick: () => void }) {
  const [loaded, setLoaded] = useState(false)
  const thumbUrl = item.thumbnail_url || item.url
  // Vary aspect ratio for masonry feel
  const aspectMap = ["4/3", "1/1", "3/4", "16/9", "4/3", "1/1", "3/2", "2/3", "16/9", "1/1", "4/3", "3/4"]
  const aspect = aspectMap[index % aspectMap.length]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -50px 0px" }}
      transition={{ duration: 0.5, delay: (index % 3) * 0.07 }}
      className="break-inside-avoid mb-3"
    >
      <div
        className="relative overflow-hidden rounded-xl cursor-pointer group"
        style={{ aspectRatio: aspect }}
        onClick={onClick}
      >
        {/* Thumbnail / Image */}
        <Image
          src={thumbUrl}
          alt={item.caption || `Photo ${index + 1}`}
          fill
          className={`object-cover transition-all duration-500 group-hover:scale-105 ${loaded ? "opacity-100" : "opacity-0"}`}
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setLoaded(true)}
          loading="lazy"
        />

        {/* Skeleton */}
        {!loaded && (
          <div className="absolute inset-0 bg-white/5 animate-pulse" />
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Video play button */}
        {item.media_type === "video" && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-black/50 border border-white/30 flex items-center justify-center backdrop-blur-sm group-hover:scale-110 transition-transform">
              <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
            </div>
          </div>
        )}

        {/* Caption on hover */}
        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
          {item.caption && (
            <p className="text-white text-xs font-medium line-clamp-2 leading-relaxed">{item.caption}</p>
          )}
        </div>

        {/* Video badge */}
        {item.media_type === "video" && (
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-black/60 backdrop-blur-sm text-white text-[10px] px-2 py-0.5 rounded-full">
            <Film className="w-3 h-3" />
            <span>Video</span>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ─── Filter Pills ─────────────────────────────────────────────
const FILTERS: { value: MediaCategory; label: string }[] = [
  { value: "all", label: "All" },
  { value: "hiking", label: "Hiking" },
  { value: "mountains", label: "Mountains" },
  { value: "adventures", label: "Adventures" },
  { value: "community", label: "Community" },
  { value: "videos", label: "Videos" },
]

// ─── Main Section ─────────────────────────────────────────────
export default function GallerySection() {
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(true)
  const [activeFilter, setActiveFilter] = useState<MediaCategory>("all")
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  // Load from DB — always live, reflects admin adds/deletes immediately on refresh
  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const { data } = await supabase
        .from("gallery_media")
        .select("id, url, caption, media_type, thumbnail_url, photographer_name")
        .order("created_at", { ascending: false })

      if (data) {
        // Map DB rows to MediaItem shape; infer category from media_type
        const mapped: MediaItem[] = data.map((row) => ({
          id:            row.id,
          media_type:    row.media_type as "image" | "video",
          url:           row.url,
          thumbnail_url: row.thumbnail_url || null,
          caption:       row.caption,
          photographer:  row.photographer_name,
          // Assign category based on media_type for filter tabs
          category:      row.media_type === "video" ? "videos" : "hiking" as MediaCategory,
        }))
        setItems(mapped)
      }
      setLoading(false)
    }
    load()
  }, [])

  const filtered = activeFilter === "all"
    ? items
    : activeFilter === "videos"
    ? items.filter((i) => i.media_type === "video")
    : items.filter((i) => i.media_type !== "video")

  const openLightbox = (i: number) => {
    setLightboxIndex(i)
    document.body.style.overflow = "hidden"
  }
  const closeLightbox = useCallback(() => {
    setLightboxIndex(null)
    document.body.style.overflow = ""
  }, [])
  const nextImage = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex + 1) % filtered.length)
  }, [lightboxIndex, filtered.length])
  const prevImage = useCallback(() => {
    if (lightboxIndex === null) return
    setLightboxIndex((lightboxIndex - 1 + filtered.length) % filtered.length)
  }, [lightboxIndex, filtered.length])

  const totalImages = items.filter((i) => i.media_type !== "video").length
  const totalVideos = items.filter((i) => i.media_type === "video").length

  return (
    <>
      <section id="gallery" className="section-padding bg-[#171B19]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-10">
            <div>
              <motion.span
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-xs font-semibold uppercase tracking-widest text-[#A4AA83] mb-3 block"
              >
                Captured Along the Way
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7 }}
                className="font-display font-bold text-4xl sm:text-5xl text-white leading-tight"
              >
                Stories from
                <span className="text-[#A4AA83]"> the Mountains</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-white/50 text-sm mt-3 max-w-md"
              >
                {totalImages} photos · {totalVideos} videos
              </motion.p>
            </div>
            <motion.a
              href="https://www.instagram.com/genz_hikers/"
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 text-sm text-[#A4AA83] hover:text-white transition-colors"
            >
              <Camera className="w-4 h-4" />
              More on Instagram
            </motion.a>
          </div>

          {/* ── Filters ── */}
          <div className="flex gap-2 flex-wrap mb-8">
            {FILTERS.map((f) => (
              <motion.button
                key={f.value}
                onClick={() => setActiveFilter(f.value)}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all border ${
                  activeFilter === f.value
                    ? "bg-[#A4AA83] text-[#171B19] border-[#A4AA83]"
                    : "bg-white/5 text-white/60 border-white/10 hover:border-white/25 hover:text-white"
                }`}
              >
                {f.label}
                <span className="ml-1.5 opacity-60 text-[10px]">
                  {f.value === "all" ? items.length : f.value === "videos" ? totalVideos : totalImages}
                </span>
              </motion.button>
            ))}
          </div>

          {/* ── Masonry grid ── */}
          {loading ? (
            <div className="columns-2 md:columns-3 gap-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="mb-3 rounded-2xl bg-white/5 animate-pulse" style={{ height: i % 3 === 0 ? 280 : 200 }} />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeFilter}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="columns-2 md:columns-3 lg:columns-3 gap-3"
              >
                {filtered.map((item, i) => (
                  <GalleryCard
                    key={item.id}
                    item={item}
                    index={i}
                    onClick={() => openLightbox(i)}
                  />
                ))}
              </motion.div>
            </AnimatePresence>
          )}

          {filtered.length === 0 && (
            <div className="text-center py-16 text-white/30">
              <Camera className="w-8 h-8 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No media in this category yet.</p>
            </div>
          )}
        </div>
      </section>

      {/* Lightbox */}
      <AnimatePresence>
        {lightboxIndex !== null && (
          <Lightbox
            items={filtered}
            index={lightboxIndex}
            onClose={closeLightbox}
            onNext={nextImage}
            onPrev={prevImage}
          />
        )}
      </AnimatePresence>
    </>
  )
}
