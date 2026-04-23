"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Comment = {
  text: string;
  sentiment: string;
};

type TranscriptChunk = {
  time: string;
  sentiment: number;
};

type Video = {
  id: number;
  title: string;
  channel: string;
  timestamp: string;
  youtubeId: string;
  transcriptSentiment: string;
  transcriptChunks: TranscriptChunk[];
  positiveComments: Comment[];
  negativeComments: Comment[];
};

export default function SentimentPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [expandedVideoId, setExpandedVideoId] = useState<number | null>(null);
  const [visibleCounts, setVisibleCounts] = useState<Record<number, number>>({});

  useEffect(() => {
    const mockData: Video[] = [
      {
        id: 1,
        title: "AI in Healthcare Trends",
        channel: "Health Insights",
        timestamp: "2 hours ago",
        youtubeId: "dQw4w9WgXcQ",
        transcriptSentiment: "Positive",
        transcriptChunks: [
          { time: "0:00", sentiment: 0.8 },
          { time: "2:30", sentiment: 0.9 },
          { time: "5:00", sentiment: 0.1 },
          { time: "7:30", sentiment: 0.7 },
          { time: "10:00", sentiment: 0.85 },
        ],
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
        transcriptChunks: [
          { time: "0:00", sentiment: 0.2 },
          { time: "2:00", sentiment: -0.6 },
          { time: "4:00", sentiment: -0.8 },
          { time: "6:00", sentiment: -0.7 },
          { time: "8:00", sentiment: 0.0 },
        ],
        positiveComments: [
          { text: "Interesting perspective", sentiment: "Positive" },
          { text: "Useful discussion overall", sentiment: "Positive" },
        ],
        negativeComments: [
          { text: "This seems misleading", sentiment: "Negative" },
          { text: "Needs fact checking", sentiment: "Negative" },
          { text: "I don't trust this source", sentiment: "Negative" },
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

  const badgeVariant = (sentiment: string) => {
    if (sentiment === "Positive") return "default";
    if (sentiment === "Negative") return "destructive";
    return "secondary";
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-6 text-black">
      <div className="mx-auto max-w-6xl space-y-6">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-black">
            Sentiment Analysis Dashboard
          </h1>
          <p className="mt-2 text-base text-gray-600">
            Transcript-level sentiment with categorized viewer comments.
          </p>
        </div>

        <div className="grid gap-6">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-black shadow-sm"
            >
              <CardHeader className="space-y-4 p-6">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-2xl font-semibold text-black">
                      {video.title}
                    </CardTitle>
                    <p className="mt-2 text-base text-blue-600">
                      {video.channel} • {video.timestamp}
                    </p>
                  </div>

                  <Badge
                    variant={badgeVariant(video.transcriptSentiment)}
                    className="rounded-full px-3 py-1 text-sm"
                  >
                    {video.transcriptSentiment}
                  </Badge>
                </div>

                <div>
                  <Button
                    variant="outline"
                    className="rounded-lg border-gray-300 bg-white text-black hover:bg-gray-50"
                    onClick={() => toggleExpanded(video.id)}
                  >
                    {expandedVideoId === video.id ? "Hide Details" : "View Details"}
                  </Button>
                </div>
              </CardHeader>

              {expandedVideoId === video.id && (
                <CardContent className="space-y-6 p-6 pt-0">
                  <div className="aspect-video w-full overflow-hidden rounded-2xl border border-gray-200 bg-white">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${video.youtubeId}`}
                      title={video.title}
                      allowFullScreen
                    />
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
                    <p className="text-sm font-semibold text-gray-700">
                      Overall Transcript Sentiment
                    </p>
                    <div className="mt-3">
                      <Badge
                        variant={badgeVariant(video.transcriptSentiment)}
                        className="rounded-full px-3 py-1 text-sm"
                      >
                        {video.transcriptSentiment}
                      </Badge>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
                    <p className="mb-4 text-sm font-semibold text-gray-700">
                      Sentiment Timeline
                    </p>
                    <ResponsiveContainer
                      width="100%"
                      height={220}
                      key={`chart-container-${video.id}`}
                    >
                      <LineChart
                        data={video.transcriptChunks}
                        key={`line-chart-${video.id}`}
                      >
                        <CartesianGrid strokeDasharray="3 3" key={`grid-${video.id}`} />
                        <XAxis dataKey="time" key={`xaxis-${video.id}`} />
                        <YAxis domain={[-1, 1]} key={`yaxis-${video.id}`} />
                        <Tooltip key={`tooltip-${video.id}`} />
                        <Line
                          key={`line-${video.id}`}
                          type="monotone"
                          dataKey="sentiment"
                          stroke="#2563eb"
                          strokeWidth={2}
                          dot={{ fill: "#2563eb" }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>

                  <Tabs defaultValue="positive" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 rounded-xl bg-gray-200 p-1">
                      <TabsTrigger
                        value="positive"
                        className="font-semibold text-green-700"
                      >
                        Positive Comments
                      </TabsTrigger>
                      <TabsTrigger
                        value="negative"
                        className="font-semibold text-red-700"
                      >
                        Negative Comments
                      </TabsTrigger>
                    </TabsList>

                    <TabsContent value="positive" className="mt-4 space-y-4">
                      {video.positiveComments
                        .slice(0, visibleCounts[video.id])
                        .map((comment, index) => (
                          <Card
                            key={`positive-${video.id}-${index}`}
                            className="rounded-xl border border-green-200 bg-green-50"
                          >
                            <CardContent className="p-5">
                              <p className="text-base text-gray-900">{comment.text}</p>
                              <div className="mt-3">
                                <Badge className="bg-white text-green-700 hover:bg-white">
                                  {comment.sentiment}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </TabsContent>

                    <TabsContent value="negative" className="mt-4 space-y-4">
                      {video.negativeComments
                        .slice(0, visibleCounts[video.id])
                        .map((comment, index) => (
                          <Card
                            key={`negative-${video.id}-${index}`}
                            className="rounded-xl border border-red-200 bg-red-50"
                          >
                            <CardContent className="p-5">
                              <p className="text-base text-gray-900">{comment.text}</p>
                              <div className="mt-3">
                                <Badge
                                  variant="destructive"
                                  className="bg-white text-red-700 hover:bg-white"
                                >
                                  {comment.sentiment}
                                </Badge>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </TabsContent>
                  </Tabs>

                  {(visibleCounts[video.id] < video.positiveComments.length ||
                    visibleCounts[video.id] < video.negativeComments.length) && (
                    <div>
                      <Button
                        variant="outline"
                        className="rounded-xl border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                        onClick={() => showMoreComments(video.id)}
                      >
                        Show More Comments
                      </Button>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}