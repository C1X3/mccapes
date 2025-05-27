"use client";

import Footer from "@/components/Footer";
import Navbar from "@/components/Navbar/Navbar";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useRef } from "react";

interface Video {
  title: string;
  description: string;
  url: string;  // embed or watch URL
  thumbnail?: string;
}

// your videos data
const videos: Video[] = [
  {
    title: "Untold History of EVERY Minecraft Cape",
    description: "godnxss",
    url: "https://www.youtube.com/embed/wGbQJwCBbR4",
    thumbnail: "https://img.youtube.com/vi/wGbQJwCBbR4/maxresdefault.jpg",
  },
  {
    title: "How to Get 2 NEW Minecraft Capes in 3 Minutes!",
    description: "godnxss",
    url: "https://www.youtube.com/embed/OpiUu4fyoJY",
    thumbnail: "https://img.youtube.com/vi/OpiUu4fyoJY/maxresdefault.jpg",
  },
  {
    title: "I Won The Bedwars World Cup",
    description: "Dewier",
    url: "https://www.youtube.com/embed/S9qxDXXqEXA",
    thumbnail: "https://img.youtube.com/vi/S9qxDXXqEXA/maxresdefault.jpg",
  },
  {
    title: "I Tried Every Ranked Bedwars Server",
    description: "Dewier",
    url: "https://www.youtube.com/embed/b63GeCDZWfE",
    thumbnail: "https://img.youtube.com/vi/b63GeCDZWfE/maxresdefault.jpg",
  },
  {
    title: "The End of Badlion Client... (New Updates)",
    description: "Blissolic",
    url: "https://www.youtube.com/embed/VHaMzoAWxKY",
    thumbnail: "https://img.youtube.com/vi/VHaMzoAWxKY/maxresdefault.jpg",
  },
  {
    title: "This Player is Immortal",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/HFCel2yap3I",
    thumbnail: "https://img.youtube.com/vi/HFCel2yap3I/maxresdefault.jpg",
  },
  {
    title: "How I Got HT3 in Crystal PVP",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/xjjbzeYHgt8",
    thumbnail: "https://img.youtube.com/vi/xjjbzeYHgt8/maxresdefault.jpg",
  },
  {
    title: "It Took 3 Days to DESTROY This Crystal PVP SMP",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/Em9XXfVCjy0",
    thumbnail: "https://img.youtube.com/vi/Em9XXfVCjy0/maxresdefault.jpg",
  },
  {
    title: "YouTuber Who Stole $3,000 from Technoblade's Charity is Back",
    description: "Blissolic",
    url: "https://www.youtube.com/embed/Fh7Blmb-h5I",
    thumbnail: "https://img.youtube.com/vi/Fh7Blmb-h5I/maxresdefault.jpg",
  },
];

export default function VideosPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <header className="py-8 flex justify-center">
        <Navbar />
      </header>

      <section className="py-16 bg-white relative overflow-hidden">
        <motion.div
          className="absolute inset-0 bg-[url('/images/subtle-pattern.jpg')] bg-cover bg-center opacity-10"
          animate={{ backgroundPosition: ["0% 0%", "100% 100%"] }}
          transition={{ duration: 60, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
        />

        <div className="container mx-auto px-6 relative z-10">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold mb-2 text-[var(--foreground)]">
              <span className="gradient-text">Videos</span>
            </h3>
            <p className="text-gray-600 max-w-2xl mx-auto">
              Check out our latest videos showcasing our products, tutorials, and more.
            </p>
          </motion.div>

          {/* 3-column grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((video, i) => (
              <VideoCard key={i} video={video} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}

function VideoCard({ video }: { video: Video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

  // extract YouTube ID
  const getYoutubeID = (url: string) => {
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };
  const videoId = getYoutubeID(video.url);
  const thumbnailUrl =
    video.thumbnail ?? (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "");

  const handlePlay = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      const src = videoRef.current.src;
      videoRef.current.src = `${src}${src.includes("?") ? "&" : "?"}autoplay=1`;
    }
  };

  const paragraphs = video.description.split("\n\n");
  const firstPara = paragraphs[0];

  return (
    <div className="bg-[var(--surface-light)] rounded-2xl overflow-hidden shadow-lg">
      <div className="relative aspect-video w-full cursor-pointer" onClick={!isPlaying ? handlePlay : undefined}>
        {!isPlaying && thumbnailUrl ? (
          <>
            <Image src={thumbnailUrl} alt={video.title} fill style={{ objectFit: "cover" }} />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-16 h-16 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-[var(--primary)] border-b-[10px] border-b-transparent ml-1.5" />
              </div>
            </div>
          </>
        ) : (
          <iframe
            ref={videoRef}
            className="w-full h-full"
            src={video.url}
            allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <div className="p-6">
        <h4 className="text-xl font-semibold mb-2 text-[var(--foreground)]">{video.title}</h4>
        <p className="text-gray-600 mb-2">{firstPara}</p>
        {paragraphs.slice(1).map((p, idx) => (
          <p key={idx} className="text-gray-600">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
