// ============================================================
// GenZ Hikers — Centralized Media Data
// Add new media items here; all components read from this file
// ============================================================

export type MediaCategory = "all" | "hiking" | "mountains" | "adventures" | "videos" | "community"

export interface MediaItem {
  id: string
  media_type: "image" | "video"
  url: string
  thumbnail_url?: string
  caption: string
  category: MediaCategory
  photographer?: string
}

// ─── Cloudinary URLs ────────────────────────────────────────
export const CLOUDINARY_BASE = "https://res.cloudinary.com/vfr2vcm8"

// Helper: auto-optimize Cloudinary image URLs
export function optimizeImage(url: string, width = 800, quality = 80): string {
  if (!url.includes("cloudinary.com")) return url
  return url.replace("/upload/", `/upload/w_${width},q_${quality},f_auto/`)
}

// Helper: get video thumbnail from Cloudinary video URL
export function videoThumbnail(videoUrl: string): string {
  if (!videoUrl.includes("cloudinary.com")) return ""
  return videoUrl.replace("/video/upload/", "/video/upload/so_2,w_800,f_jpg/").replace(".mp4", ".jpg")
}

// ─── Member Photos (used in leadership section) ─────────────
export const MEMBER_PHOTOS: Record<string, string> = {
  "Talat Hussain":     "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793965173/talat.jpg",
  "Rizwan Ali":        "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793965117/Screenshot_2026-11-06_163809.png",
  "Ali Haider":        "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793965761/mypic.jpg",
  "Saad":              "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793965879/saad.jpg",
  "Raheel Ahmed Khan": "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793965757/raheel.jpg",
  "M. Qaswar":         "https://res.cloudinary.com/vfr2vcm8/image/upload/v1794418618/qaswar.jpg",
}

// ─── Logo ────────────────────────────────────────────────────
export const LOGO_URL = "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964982/logo.jpg"

// ─── Hero Video ──────────────────────────────────────────────
export const HERO_VIDEO_URL = "https://res.cloudinary.com/vfr2vcm8/video/upload/v1793964519/hike_video1.mp4"

// ─── Community Images (hero, about, sections) ───────────────
export const COMMUNITY_IMAGES = [
  "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964200/genz_hikers1.jpg",
  "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964200/genz_hikers3.jpg",
  "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964199/genz_hikers2.jpg",
  "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964198/genz_hikers4.jpg",
]

// ─── Gallery Items — mirrors exactly what is in gallery_media DB ─────────────
// All images and videos from Cloudinary only. No external URLs.
export const STATIC_GALLERY_ITEMS: MediaItem[] = [
  {
    id: "g1",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964200/genz_hikers1.jpg",
    caption: "GenZ Hikers on the trail",
    category: "hiking",
    photographer: "GenZ Hikers",
  },
  {
    id: "g2",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964200/genz_hikers3.jpg",
    caption: "Together in the mountains",
    category: "community",
    photographer: "GenZ Hikers",
  },
  {
    id: "g3",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964199/genz_hikers2.jpg",
    caption: "Breathtaking views of Pakistan",
    category: "mountains",
    photographer: "GenZ Hikers",
  },
  {
    id: "g4",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1793964198/genz_hikers4.jpg",
    caption: "Every Sunday is an adventure",
    category: "adventures",
    photographer: "GenZ Hikers",
  },
  {
    id: "g5",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1794418626/vertical_photo1.jpg",
    caption: "On the trail with GenZ Hikers",
    category: "hiking",
    photographer: "GenZ Hikers",
  },
  {
    id: "g6",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1794418634/view1.jpg",
    caption: "Scenic mountain view",
    category: "mountains",
    photographer: "GenZ Hikers",
  },
  {
    id: "g7",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1794418641/view3.jpg",
    caption: "Mountain landscape",
    category: "mountains",
    photographer: "GenZ Hikers",
  },
  {
    id: "g8",
    media_type: "image",
    url: "https://res.cloudinary.com/vfr2vcm8/image/upload/v1794419559/WhatsApp_Image_2026-11-11_at_22.43.19.jpg",
    caption: "Community hike moment",
    category: "community",
    photographer: "GenZ Hikers",
  },
  {
    id: "g9",
    media_type: "video",
    url: "https://res.cloudinary.com/vfr2vcm8/video/upload/v1793964519/hike_video1.mp4",
    thumbnail_url: "https://res.cloudinary.com/vfr2vcm8/video/upload/so_0,w_600,f_jpg/v1793964519/hike_video1.jpg",
    caption: "The mountains are calling",
    category: "videos",
    photographer: "GenZ Hikers",
  },
  {
    id: "g10",
    media_type: "video",
    url: "https://res.cloudinary.com/vfr2vcm8/video/upload/v1793964167/video1.mp4",
    thumbnail_url: "https://res.cloudinary.com/vfr2vcm8/video/upload/so_0,w_600,f_jpg/v1793964167/video1.jpg",
    caption: "Hike reel — Sunday adventure",
    category: "videos",
    photographer: "GenZ Hikers",
  },
  {
    id: "g11",
    media_type: "video",
    url: "https://res.cloudinary.com/vfr2vcm8/video/upload/v1794419582/WhatsApp_Video_2026-11-11_at_22.45.25.mp4",
    thumbnail_url: "https://res.cloudinary.com/vfr2vcm8/video/upload/so_0,w_600,f_jpg/v1794419582/WhatsApp_Video_2026-11-11_at_22.45.25.jpg",
    caption: "Trail adventure",
    category: "videos",
    photographer: "GenZ Hikers",
  },
  {
    id: "g12",
    media_type: "video",
    url: "https://res.cloudinary.com/vfr2vcm8/video/upload/v1794419588/WhatsApp_Video_2026-11-11_at_22.45.56.mp4",
    thumbnail_url: "https://res.cloudinary.com/vfr2vcm8/video/upload/so_0,w_600,f_jpg/v1794419588/WhatsApp_Video_2026-11-11_at_22.45.56.jpg",
    caption: "Hike moments",
    category: "videos",
    photographer: "GenZ Hikers",
  },
  {
    id: "g13",
    media_type: "video",
    url: "https://res.cloudinary.com/vfr2vcm8/video/upload/v1794419593/WhatsApp_Video_2026-11-11_at_22.46.09.mp4",
    thumbnail_url: "https://res.cloudinary.com/vfr2vcm8/video/upload/so_0,w_600,f_jpg/v1794419593/WhatsApp_Video_2026-11-11_at_22.46.09.jpg",
    caption: "Sunday hike highlights",
    category: "videos",
    photographer: "GenZ Hikers",
  },
]

// ─── Activity photos (About section hover) ──────────────────
// Each image matches the activity description — Pexels (free use)
export const ACTIVITY_IMAGES: Record<string, string> = {
  "Trail Hiking":          "https://images.pexels.com/photos/1365425/pexels-photo-1365425.jpeg?w=600&q=80",
  "Clean-up Drives":       "https://images.pexels.com/photos/2559941/pexels-photo-2559941.jpeg?w=600&q=80",
  "Photography":           "https://images.pexels.com/photos/1252500/pexels-photo-1252500.jpeg?w=600&q=80",
  "Outdoor Cooking":       "https://images.pexels.com/photos/2534523/pexels-photo-2534523.jpeg?w=600&q=80",
  "Music & Entertainment": "https://images.pexels.com/photos/2422588/pexels-photo-2422588.jpeg?w=600&q=80",
  "Community Building":    "https://images.pexels.com/photos/1659438/pexels-photo-1659438.jpeg?w=600&q=80",
  "Healthy Lifestyle":     "https://images.pexels.com/photos/235922/pexels-photo-235922.jpeg?w=600&q=80",
  "Safety First":          "https://images.pexels.com/photos/1170765/pexels-photo-1170765.jpeg?w=600&q=80",
}
