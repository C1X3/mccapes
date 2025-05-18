"use client";

import React, { useEffect, useState } from "react";
import Marquee from "react-fast-marquee";
import { YouTubeChannel } from "@/types/youtube";
import { fetchYouTubeChannels, YOUTUBE_CHANNEL_IDS } from "@/utils/youtube";
import { motion } from "framer-motion";
import Image from "next/image";

const PartnerScroller = () => {
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChannels = async () => {
      const data = await fetchYouTubeChannels(YOUTUBE_CHANNEL_IDS);
      setChannels(data);
      setIsLoading(false);
    };
    loadChannels();
  }, []);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[var(--primary)]"></div>
      </div>
    );
  }

  if (channels.length === 0) return null;

  return (
    <Marquee
      gradient={false}
      speed={30}
    >
      {channels.map((channel) => (
        <div
          key={channel.id}
          className="flex flex-col items-center mx-8"
          onClick={() => window.open(channel.url, "_blank")}
        >
          <div className="w-32 h-32 relative mb-4">
            <motion.div
              className="w-full h-full overflow-hidden bg-[var(--surface-light)] rounded-full"
              transition={{ duration: 0.6 }}
            >
              <Image
                src={channel.thumbnailUrl}
                alt={channel.name}
                fill
                className="rounded-full"
                style={{ objectFit: "cover" }}
              />
            </motion.div>
          </div>
          <h4 className="text-lg font-semibold text-[var(--foreground)] mb-1">
            {channel.name}
          </h4>
          <p className="text-gray-500 text-sm">
            <span className="font-bold">{channel.subscribers}</span>{" "}
            <span className="font-normal">subscribers</span>
          </p>
        </div>
      ))}
    </Marquee>
  );
};

export default PartnerScroller;
