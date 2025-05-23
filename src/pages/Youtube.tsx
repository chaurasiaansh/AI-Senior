import React, { useState } from 'react';
import { getYouTubeRecommendations, extractTopics } from '../lib/api';

interface Video {
  title: string;
  url: string;
  thumbnail: string;
  topic: string;
}

export const YouTubeSearch: React.FC = () => {
  const [query, setQuery] = useState('');
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setIsLoading(true);
    setVideos([]);
    
    try {
      // Extract topics from the input text using Gemini AI
      const topics = await extractTopics(query);
      
      let allVideos: Video[] = [];
      
      for (const topic of topics) {
        const { videos } = await getYouTubeRecommendations(topic);
        
        const videosWithTopic = videos.map((video) => ({
          ...video,
          topic,
        }));
        
        allVideos = [...allVideos, ...videosWithTopic];
      }

      setVideos(allVideos);
    } catch (error) {
      console.error('Error fetching YouTube videos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 space-y-4 min-h-screen">
      <h1 className="text-2xl font-bold text-center">YouTube Video Search</h1>

      <div className="flex flex-wrap gap-2 sm:gap-4 items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyPress}
          placeholder="Enter a paragraph or text..."
          className="flex-1 p-2 border rounded-md w-full sm:w-auto"
        />
        <button
          onClick={handleSearch}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition"
        >
          Search
        </button>
      </div>

      {isLoading && <p className="text-center text-gray-500">Fetching videos...</p>}

      <div className="max-h-[500px] overflow-y-auto scrollbar-none space-y-4 border p-3 rounded-md shadow-lg">
        {videos.map((video, index) => (
          <div key={index} className="flex flex-col sm:flex-row items-center sm:items-start space-x-0 sm:space-x-4 border p-3 rounded-md shadow">
            <img src={video.thumbnail} alt={video.title} className="w-full sm:w-24 h-20 object-cover rounded-md" />
            <div className="mt-2 sm:mt-0 text-center sm:text-left">
              <p className="text-sm text-gray-500">Topic: {video.topic}</p>
              <a href={video.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline font-medium">
                {video.title}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default YouTubeSearch;
