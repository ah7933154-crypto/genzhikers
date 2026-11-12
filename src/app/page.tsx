import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import HeroSection from "@/components/sections/HeroSection"
import AboutSection from "@/components/sections/AboutSection"
import UpcomingHikesSection from "@/components/sections/UpcomingHikesSection"
import AnnouncementsSection from "@/components/sections/AnnouncementsSection"
import LeadershipSection from "@/components/sections/LeadershipSection"
import GallerySection from "@/components/sections/GallerySection"
import FeedbackSection from "@/components/sections/FeedbackSection"
import GoalsSection from "@/components/sections/GoalsSection"
import ContactSection from "@/components/sections/ContactSection"

export default function HomePage() {
  return (
    <>
      <Navbar />
      <main>
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
