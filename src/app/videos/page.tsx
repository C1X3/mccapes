"use client";

import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import Image from "next/image";
import { useState, useRef } from "react";

interface Video {
  title: string;
  description: string;
  url: string; // embed or watch URL
  thumbnail?: string;
}

// your videos data
const videos: Video[] = [
  {
    title: "Abusing Glitches To Make OP Traps",
    description: "JudeLow",
    url: "https://www.youtube.com/embed/1mq_6-UOTRY",
    thumbnail: "https://img.youtube.com/vi/1mq_6-UOTRY/maxresdefault.jpg",
  },
  {
    title: "Guess The Secret Minecraft Pro Player",
    description: "Flowtives",
    url: "https://www.youtube.com/embed/p39As2Tyr6U",
    thumbnail: "https://img.youtube.com/vi/p39As2Tyr6U/maxresdefault.jpg",
  },
  {
    title: "I Surprised Hackers by Hacking Back",
    description: "qBedwars",
    url: "https://www.youtube.com/embed/TzbwKW1aDVs",
    thumbnail: "https://img.youtube.com/vi/TzbwKW1aDVs/maxresdefault.jpg",
  },
  {
    title: "The BEST Bedwars Tips & Tricks",
    description: "Dewier",
    url: "https://www.youtube.com/embed/5TLkJbj--BQ",
    thumbnail: "https://img.youtube.com/vi/5TLkJbj--BQ/maxresdefault.jpg",
  },
  {
    title: "Untold History of EVERY Minecraft Cape",
    description: "godnxss",
    url: "https://www.youtube.com/embed/wGbQJwCBbR4",
    thumbnail: "https://img.youtube.com/vi/wGbQJwCBbR4/maxresdefault.jpg",
  },
  {
    title: "when a top ranked player joins your smp...",
    description: "Flowtives",
    url: "https://www.youtube.com/embed/NFbr6KXdY64",
    thumbnail: "https://img.youtube.com/vi/NFbr6KXdY64/maxresdefault.jpg",
  },
  {
    title: "EVERY Minecraft Cape You Can STILL Get for FREE! [2026]",
    description: "godnxss",
    url: "https://www.youtube.com/embed/SE_30y8sqgo",
    thumbnail: "https://img.youtube.com/vi/SE_30y8sqgo/maxresdefault.jpg",
  },
  {
    title: "I Won The Bedwars World Cup",
    description: "Dewier",
    url: "https://www.youtube.com/embed/S9qxDXXqEXA",
    thumbnail: "https://img.youtube.com/vi/S9qxDXXqEXA/maxresdefault.jpg",
  },
  {
    title: "How to Claim Minecraft Copper Cape in 4 Minutes (Java & Bedrock)",
    description: "godnxss",
    url: "https://www.youtube.com/embed/fDC0z4rVpzQ",
    thumbnail: "https://img.youtube.com/vi/fDC0z4rVpzQ/maxresdefault.jpg",
  },
  {
    title: "this pvp method is too unfair...",
    description: "Flowtives",
    url: "https://www.youtube.com/embed/p5Io6blJlow",
    thumbnail: "https://img.youtube.com/vi/p5Io6blJlow/maxresdefault.jpg",
  },
  {
    title: "I Tried Every Ranked Bedwars Server",
    description: "Dewier",
    url: "https://www.youtube.com/embed/b63GeCDZWfE",
    thumbnail: "https://img.youtube.com/vi/b63GeCDZWfE/maxresdefault.jpg",
  },
  {
    title: "How I Got HT3 in Crystal PVP",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/xjjbzeYHgt8",
    thumbnail: "https://img.youtube.com/vi/xjjbzeYHgt8/maxresdefault.jpg",
  },
  {
    title: "Can I Win Bedwars Alone?",
    description: "Dewier",
    url: "https://www.youtube.com/embed/RgpHAq9ZmoQ",
    thumbnail: "https://img.youtube.com/vi/RgpHAq9ZmoQ/maxresdefault.jpg",
  },
  {
    title: "What's The BEST Minecraft Launcher / Client?",
    description: "godnxss",
    url: "https://www.youtube.com/embed/TNhBkEyOPL0",
    thumbnail: "https://img.youtube.com/vi/TNhBkEyOPL0/maxresdefault.jpg",
  },
  {
    title: "I Destroyed Top Bedwars Players",
    description: "Dewier",
    url: "https://www.youtube.com/embed/Ei5P9ufh5JI",
    thumbnail: "https://img.youtube.com/vi/Ei5P9ufh5JI/maxresdefault.jpg",
  },
  {
    title: "How to Get 2 NEW Minecraft Capes in 3 Minutes!",
    description: "godnxss",
    url: "https://www.youtube.com/embed/OpiUu4fyoJY",
    thumbnail: "https://img.youtube.com/vi/OpiUu4fyoJY/maxresdefault.jpg",
  },
  {
    title: "The Best Clutches In Ranked Bedwars!",
    description: "Dewier",
    url: "https://www.youtube.com/embed/QCtVZhl9Stw",
    thumbnail: "https://img.youtube.com/vi/QCtVZhl9Stw/maxresdefault.jpg",
  },
  {
    title: "Winning $400 In A Pro Bedwars Tournament",
    description: "Dewier",
    url: "https://www.youtube.com/embed/5XCNJrimtPw",
    thumbnail: "https://img.youtube.com/vi/5XCNJrimtPw/maxresdefault.jpg",
  },
  {
    title: "It Took 3 Days to DESTROY This Crystal PVP SMP",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/Em9XXfVCjy0",
    thumbnail: "https://img.youtube.com/vi/Em9XXfVCjy0/maxresdefault.jpg",
  },
  {
    title: "Challenging The #1 Bedwars Player to 1v1... Dewier Vs. Kryptoke",
    description: "Kryptoke",
    url: "https://www.youtube.com/embed/Auo65h3BXjg",
    thumbnail: "https://img.youtube.com/vi/Auo65h3BXjg/maxresdefault.jpg",
  },
  {
    title: "Top 5 BEST Bedwars Texture Packs (1.8.9) | FPS Boost",
    description: "Kornelic",
    url: "https://www.youtube.com/embed/y1tn-DbccKY",
    thumbnail: "https://img.youtube.com/vi/y1tn-DbccKY/maxresdefault.jpg",
  },
  {
    title: "Secretly Coaching DREAM and DAQUAVIS Before $100,000 FIGHT 👀",
    description: "godnxss",
    url: "https://www.youtube.com/embed/-5Mgiewa6lc",
    thumbnail: "https://img.youtube.com/vi/-5Mgiewa6lc/maxresdefault.jpg",
  },
  {
    title: "This Player is Immortal",
    description: "ItzBlake",
    url: "https://www.youtube.com/embed/HFCel2yap3I",
    thumbnail: "https://img.youtube.com/vi/HFCel2yap3I/maxresdefault.jpg",
  },
  {
    title: "Beating Top Players In Bedwars Wagers",
    description: "Dewier",
    url: "https://www.youtube.com/embed/mstd9ZwoHOc",
    thumbnail: "https://img.youtube.com/vi/mstd9ZwoHOc/maxresdefault.jpg",
  },
  {
    title: "Destroying Pros In A $50 Bedwars Wager",
    description: "Dewier",
    url: "https://www.youtube.com/embed/IVeGewwX4Hc",
    thumbnail: "https://img.youtube.com/vi/IVeGewwX4Hc/maxresdefault.jpg",
  },
  {
    title: "I Fought The #2 Bedwars Player",
    description: "Dewier",
    url: "https://www.youtube.com/embed/k5jIsyj0Kpw",
    thumbnail: "https://img.youtube.com/vi/k5jIsyj0Kpw/maxresdefault.jpg",
  },
  {
    title: "How to Unlock Minecraft's NEW Copper Cape (Java & Bedrock)",
    description: "godnxss",
    url: "https://www.youtube.com/embed/avQPjUn8S5w",
    thumbnail: "https://img.youtube.com/vi/avQPjUn8S5w/maxresdefault.jpg",
  },
  {
    title: "Undercover In Lobby 1 Private Games",
    description: "Dewier",
    url: "https://www.youtube.com/embed/my1CKogHm8I",
    thumbnail: "https://img.youtube.com/vi/my1CKogHm8I/maxresdefault.jpg",
  },
  {
    title: "Get THIS Minecraft Cape in 2 Minutes!",
    description: "godnxss",
    url: "https://www.youtube.com/embed/Xn5_loNOqHY",
    thumbnail: "https://img.youtube.com/vi/Xn5_loNOqHY/maxresdefault.jpg",
  },
  {
    title: "How Minecraft's NEW $100,000 Cape Disappeared...",
    description: "MC Capes",
    url: "https://www.youtube.com/watch?v=lxdYGesTV6U",
    thumbnail: "https://img.youtube.com/vi/lxdYGesTV6U/maxresdefault.jpg",
  },
];

export default function VideosPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[var(--background)]">
      <div className="pointer-events-none absolute inset-0 tech-grid-bg opacity-20" />
      <div className="pointer-events-none absolute inset-0 dot-grid-bg opacity-[0.05]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(160deg,rgba(84,184,255,0.06),transparent_38%,rgba(57,203,115,0.1))]" />
      <section className="relative overflow-hidden">
        <div className="relative z-10 px-6 py-16">
          <div className="container mx-auto relative z-10">
          <motion.div
            className="mb-12 text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mb-2 text-5xl text-[var(--foreground)] md:text-6xl lg:text-7xl">
              Videos
            </h1>
            <p className="mx-auto max-w-2xl text-[var(--color-text-secondary)]">
              Check out our latest videos showcasing our products, tutorials,
              and more.
            </p>
          </motion.div>

            {/* 3-column grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {videos.map((video, i) => (
                <VideoCard key={i} video={video} />
              ))}
            </div>
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
    const regExp =
      /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return match && match[1].length === 11 ? match[1] : null;
  };
  const videoId = getYoutubeID(video.url);
  const thumbnailUrl =
    video.thumbnail ??
    (videoId ? `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg` : "");

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
    <div className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_8%)] shadow-lg card-hover">
      <div
        className="relative aspect-video w-full cursor-pointer"
        onClick={!isPlaying ? handlePlay : undefined}
      >
        {!isPlaying && thumbnailUrl ? (
          <>
            <Image
              src={thumbnailUrl}
              alt={video.title}
              fill
              style={{ objectFit: "cover" }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.05),rgba(0,0,0,0.4))]" />
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-full border border-[var(--border)] bg-[color-mix(in_srgb,var(--surface),#000_8%)] shadow-lg hover:scale-110 transition-transform">
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
        <h4 className="text-xl font-semibold mb-2 text-[var(--foreground)]">
          {video.title}
        </h4>
        <p className="text-[var(--color-text-secondary)] mb-2">{firstPara}</p>
        {paragraphs.slice(1).map((p, idx) => (
          <p key={idx} className="text-[var(--color-text-secondary)]">
            {p}
          </p>
        ))}
      </div>
    </div>
  );
}
