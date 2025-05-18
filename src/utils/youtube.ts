import { YouTubeApiResponse, YouTubeChannel } from "@/types/youtube";

export const YOUTUBE_CHANNEL_IDS = [
  "UCZf6WKzzljB8LHyPHTPxHLA",
  "UC2KjRb9JQ9yAEIw8HMFUENg",
  "UCNLO8nw8mmHN5tMF0sprwSQ",
  "UChNwsP0_jTrqYgq74DyfCIg",
  "UCXHiZWRYzDnzZE_Xm_1OEVA",
  "UCoDmUnYTz2ly28F6rdDdBNw",
  "UCSZjWwaOze7AfAUfo3dqYBQ",
  "UCgBfyINBxXscTfTfXI0AT5Q"
];

export const YOUTUBE_API_CONFIG = {
  baseUrl: "https://www.googleapis.com/youtube/v3",
  part: "snippet,statistics",
  apiKey: process.env.NEXT_PUBLIC_YOUTUBE_API_KEY,
};

export const formatSubscriberCount = (count: string): string => {
  const num = parseInt(count);
  if (num >= 1000000) {
    return `${(num / 1000000).toFixed(1)}M`;
  }
  if (num >= 1000) {
    return `${(num / 1000).toFixed(1)}K`;
  }
  return count;
};

export const fetchYouTubeChannels = async (
  channelIds: string[]
): Promise<YouTubeChannel[]> => {
  if (!YOUTUBE_API_CONFIG.apiKey) {
    console.error("YouTube API key is not configured");
    return [];
  }

  try {
    const response = await fetch(
      `${YOUTUBE_API_CONFIG.baseUrl}/channels?part=${YOUTUBE_API_CONFIG.part
      }&id=${channelIds.join(",")}&key=${YOUTUBE_API_CONFIG.apiKey}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: YouTubeApiResponse = await response.json();

    return data.items.map((item) => ({
      id: item.id,
      url: `https://www.youtube.com/channel/${item.id}`,
      name: item.snippet.title,
      subscribers: formatSubscriberCount(item.statistics.subscriberCount),
      thumbnailUrl: item.snippet.thumbnails.medium.url,
    }));
  } catch (error) {
    console.error("Error fetching YouTube data:", error);
    return [];
  }
}; 