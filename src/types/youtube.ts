export interface YouTubeChannel {
  id: string;
  name: string;
  subscribers: string;
  thumbnailUrl: string;
  url: string;
}

export interface YouTubeApiResponse {
  items: Array<{
    id: string;
    snippet: {
      title: string;
      thumbnails: {
        default: {
          url: string;
        };
        medium: {
          url: string;
        };
      };
    };
    statistics: {
      subscriberCount: string;
    };
  }>;
} 