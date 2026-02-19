"use client";

import Image from "next/image";
import { useState, useRef } from "react";
import { type Video } from "@/data/videos";

function VideoCarouselCard({ video }: { video: Video }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const videoRef = useRef<HTMLIFrameElement>(null);

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
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-200 hover:border-[var(--accent)] transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5">
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
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 bg-white/90 rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[9px] border-t-transparent border-l-[16px] border-l-[var(--primary)] border-b-[9px] border-b-transparent ml-1" />
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

      <div className="p-5">
        <h4 className="text-lg font-semibold mb-1.5 text-gray-800 group-hover:text-[var(--primary)] transition-colors truncate">
          {video.title}
        </h4>
        <p className="text-gray-500 text-sm leading-relaxed line-clamp-1">
          {firstPara}
        </p>
      </div>
    </div>
  );
}

export default VideoCarouselCard;
