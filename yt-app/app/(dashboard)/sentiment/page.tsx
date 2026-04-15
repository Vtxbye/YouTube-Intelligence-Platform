"use client";

import { useEffect, useState } from "react";

type Video = {
  id: number;
  title: string;
  channel: string;
  timestamp: string;
  sentiment: string;
  comments: string[];
};

export default function SentimentPage() {
  // const [videos, setVideos] = useState<Video[]>([]); 
  const [selectedVideoId, setSelectedVideoId] = useState<number | null>(null);

  // For now while not connecting to db
  const [videos, setVideos] = useState<Video[]>(() => [
  {
    id: 1,
    title: "AI in Healthcare Trends",
    channel: "Health Insights",
    timestamp: "2 hours ago",
    sentiment: "Positive 😊",
    comments: [
      "Very informative breakdown",
      "This was helpful",
      "Loved the explanation",
    ],
  },
  {
    id: 2,
    title: "Vaccine Debate on Social Media",
    channel: "Medical Watch",
    timestamp: "5 hours ago",
    sentiment: "Negative 😡",
    comments: [
      "This seems misleading",
      "Needs fact checking",
      "I don’t trust this source",
    ],
  },
  {
    id: 3,
    title: "Mental Health Awareness Update",
    channel: "Mind Matters",
    timestamp: "1 day ago",
    sentiment: "Neutral 😐",
    comments: [
      "Interesting perspective",
      "Mixed opinions here",
      "Not sure how to feel about this",
    ],
  },
]);

  // useEffect(() => {
  //   const mockData: Video[] = [
  //     {
  //       id: 1,
  //       title: "AI in Healthcare Trends",
  //       channel: "Health Insights",
  //       timestamp: "2 hours ago",
  //       sentiment: "Positive 😊",
  //       comments: [
  //         "Very informative breakdown",
  //         "This was helpful",
  //         "Loved the explanation",
  //       ],
  //     },
  //     {
  //       id: 2,
  //       title: "Vaccine Debate on Social Media",
  //       channel: "Medical Watch",
  //       timestamp: "5 hours ago",
  //       sentiment: "Negative 😡",
  //       comments: [
  //         "This seems misleading",
  //         "Needs fact checking",
  //         "I don’t trust this source",
  //       ],
  //     },
  //     {
  //       id: 3,
  //       title: "Mental Health Awareness Update",
  //       channel: "Mind Matters",
  //       timestamp: "1 day ago",
  //       sentiment: "Neutral 😐",
  //       comments: [
  //         "Interesting perspective",
  //         "Mixed opinions here",
  //         "Not sure how to feel about this",
  //       ],
  //     },
  //   ];

  //   setVideos(mockData);
  // }, []);

  const handleCardClick = (id: number) => {
    setSelectedVideoId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="p-6 text-black">
      <h1 className="text-2xl font-bold mb-6">
        Sentiment Analysis Dashboard
      </h1>

      <div className="grid gap-4">
        {videos.map((video) => (
          <div
            key={video.id}
            onClick={() => handleCardClick(video.id)}
            className="border rounded-md bg-white shadow p-4 text-left cursor-pointer hover:bg-gray-50"
          >
            <h2 className="font-semibold text-lg">{video.title}</h2>

            <p className="text-sm text-gray-500 mt-1">
              {video.channel} • {video.timestamp}
            </p>

            <p className="mt-2">Sentiment: {video.sentiment}</p>

            <p className="text-sm text-gray-600 mt-1">
              Click to view comments
            </p>

            {selectedVideoId === video.id && (
              <div className="mt-4">
                <h3 className="font-medium">
                  Comments contributing to sentiment:
                </h3>
                <ul className="list-disc ml-6 mt-2">
                  {video.comments.map((comment, index) => (
                    <li key={index}>{comment}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}