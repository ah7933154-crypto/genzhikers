import dynamic from "next/dynamic"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/sections/HeroSection"

// Lazy-load below-the-fold sections — reduces initial JS parse time
// Each section loads as the user scrolls toward it
const AboutSection        = dynamic(() => import("@/components/sections/AboutSection"))
const UpcomingHikesSection = dynamic(() => import("@/components/sections/UpcomingHikesSection"))
const AnnouncementsSection = dynamic(() => import("@/components/sections/AnnouncementsSection"))
const LeadershipSection   = dynamic(() => import("@/components/sections/LeadershipSection"))
const GallerySection      = dynamic(() => import("@/components/sections/GallerySection"))
const FeedbackSection     = dynamic(() => import("@/components/sections/FeedbackSection"))
const GoalsSection        = dynamic(() => import("@/components/sections/GoalsSection"))
const ContactSection      = dynamic(() => import("@/components/sections/ContactSection"))

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
        {/* HeroSection is NOT lazy — it must render immediately */}
        <HeroSection />
        <AboutSection />
        <UpcomingHikesSection />
        <AnnouncementsSection />
        <LeadershipSection />
        <GallerySection />
        <FeedbackSection />
        <GoalsSection />
        <ContactSection />
      </main>
      <Footer />
    </>
  )
}
