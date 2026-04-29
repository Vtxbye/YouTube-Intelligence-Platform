'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';

type Video = {
  video_id: string;
  title: string | null;
  published_at: string | null;
  channel_name: string | null;
  views: number | null;
  video_url: string | null;
  duration_seconds: number | null;
  matched_keywords: string | null;
  transcript: string | null;
};

export default function TopicPage() {
  const { slug } = useParams();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);

  const topicName =
    (slug as string)
      ?.split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || '';

  useEffect(() => {

    console.log("FETCHING VIDEOS...");

    async function fetchVideos() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos`);
        if (!res.ok) {
          throw new Error('Failed to fetch videos');
        }
        const data = await res.json();
        setVideos(data);
      } catch (error) {
        console.error('Error fetching videos:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, []);

  function formatDuration(seconds: number | null) {
    if (!seconds) return 'Unknown duration';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="text-gray-600">Loading videos...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">{topicName}</h1>
        <p className="text-gray-600 mt-1">
          YouTube videos and resources about {topicName}
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-6">
        {videos.map((video) => {
          const videoId = video.video_url?.split('v=')[1]?.split('&')[0];

          return (
            <div
              key={video.video_id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              {videoId ? (
                <YouTubeEmbed
                  videoid={videoId}
                  height={200}
                  width={350}
                />
              ) : (
                <div className="h-[200px] flex items-center justify-center bg-gray-100 rounded">
                  <span className="text-sm text-gray-500">Video unavailable</span>
                </div>
              )}

              <h3 className="font-semibold text-gray-900 mt-3">
                {video.title || 'Untitled Video'}
              </h3>

              <p className="text-sm text-gray-600">
                {video.channel_name || 'Unknown channel'}
              </p>

              <p className="text-sm text-gray-500">
                {(video.views ?? 0).toLocaleString()} views • {formatDuration(video.duration_seconds)}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
