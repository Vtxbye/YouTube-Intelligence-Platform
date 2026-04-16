"use client";

import { useEffect, useState } from "react";

type Comment = {
  text: string;
  sentiment: string;
};

type Video = {
  id: number;
  title: string;
  channel: string;
  timestamp: string;
  youtubeId: string;
  transcriptSentiment: string;
  positiveComments: Comment[];
  negativeComments: Comment[];
};

export default function SentimentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [expandedVideoId, setExpandedVideoId] = useState<number | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    function loadMockData() {
      const mockData: Video[] = [
        {
          id: 1,
          title: "AI in Healthcare Trends",
          channel: "Health Insights",
          timestamp: "2 hours ago",
          youtubeId: "dQw4w9WgXcQ",
          transcriptSentiment: "Positive",
          positiveComments: [
            { text: "Very informative breakdown", sentiment: "Positive" },
            { text: "This was helpful", sentiment: "Positive" },
            { text: "Loved the explanation", sentiment: "Positive" },
            { text: "Great summary of the topic", sentiment: "Positive" },
          ],
          negativeComments: [
            { text: "Too optimistic in my opinion", sentiment: "Negative" },
            { text: "Missed some concerns", sentiment: "Negative" },
          ],
        },
        {
          id: 2,
          title: "Vaccine Debate on Social Media",
          channel: "Medical Watch",
          timestamp: "5 hours ago",
          youtubeId: "M7lc1UVf-VE",
          transcriptSentiment: "Negative",
          positiveComments: [
            { text: "Interesting perspective", sentiment: "Positive" },
            { text: "Useful discussion overall", sentiment: "Positive" },
          ],
          negativeComments: [
            { text: "This seems misleading", sentiment: "Negative" },
            { text: "Needs fact checking", sentiment: "Negative" },
            { text: "I don’t trust this source", sentiment: "Negative" },
            { text: "Very biased presentation", sentiment: "Negative" },
          ],
        },
      ];

      setVideos(mockData);

      const initialCounts: Record<number, number> = {};
      mockData.forEach((video) => {
        initialCounts[video.id] = 2;
      });

      setVisibleCounts(initialCounts);
    }

    loadMockData();
  }, []);

  const toggleExpanded = (id: number) => {
    setExpandedVideoId((prev) => (prev === id ? null : id));
  };

  const showMoreComments = (videoId: number) => {
    setVisibleCounts((prev) => ({
      ...prev,
      [videoId]: prev[videoId] + 2,
    }));
  };

  const sentimentColor = (sentiment: string) => {
    if (sentiment === "Positive") return "text-green-600";
    if (sentiment === "Negative") return "text-red-600";
    return "text-yellow-600";
  };

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-6">Sentiment Analysis Dashboard</h1>

      <div className="grid gap-6">
        {videos.map((video) => (
          <div
            key={video.id}
            className="border rounded-md bg-white shadow p-4"
          >
            <button
              onClick={() => toggleExpanded(video.id)}
              className="w-full text-left"
            >
              <h2 className="font-semibold text-lg">{video.title}</h2>
              <p className="text-sm text-gray-500 mt-1">
                {video.channel} • {video.timestamp}
              </p>
              <p className="mt-2">
                Overall transcript sentiment:{" "}
                <span className={`font-semibold ${sentimentColor(video.transcriptSentiment)}`}>
                  {video.transcriptSentiment}
                </span>
              </p>
              <p className="text-sm text-gray-600 mt-1">
                Click to expand details
              </p>
            </button>

            {expandedVideoId === video.id && (
              <div className="mt-4">
                <div className="aspect-video w-full mb-4">
                  <iframe
                    className="w-full h-full rounded-md"
                    src={`https://www.youtube.com/embed/${video.youtubeId}`}
                    title={video.title}
                    allowFullScreen
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold text-green-700 mb-2">
                      Positive Comments
                    </h3>
                    <ul className="space-y-2">
                      {video.positiveComments
                        .slice(0, visibleCounts[video.id])
                        .map((comment, index) => (
                          <li
                            key={index}
                            className="border rounded p-2 bg-green-50"
                          >
                            <p>{comment.text}</p>
                            <p className="text-sm text-green-700 mt-1">
                              Sentiment: {comment.sentiment}
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>

                  <div>
                    <h3 className="font-semibold text-red-700 mb-2">
                      Negative Comments
                    </h3>
                    <ul className="space-y-2">
                      {video.negativeComments
                        .slice(0, visibleCounts[video.id])
                        .map((comment, index) => (
                          <li
                            key={index}
                            className="border rounded p-2 bg-red-50"
                          >
                            <p>{comment.text}</p>
                            <p className="text-sm text-red-700 mt-1">
                              Sentiment: {comment.sentiment}
                            </p>
                          </li>
                        ))}
                    </ul>
                  </div>
                </div>

                {(visibleCounts[video.id] < video.positiveComments.length ||
                  visibleCounts[video.id] < video.negativeComments.length) && (
                  <button
                    onClick={() => showMoreComments(video.id)}
                    className="mt-4 px-4 py-2 border rounded bg-gray-100 hover:bg-gray-200"
                  >
                    Show More
                  </button>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}