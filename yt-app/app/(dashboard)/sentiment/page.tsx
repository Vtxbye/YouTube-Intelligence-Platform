"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type Comment = {
  text: string;
  sentiment: string;
};

type TranscriptPoint = {
  time: string;
  sentiment: number;
};

type Video = {
  id: number;
  title: string;
  channel: string;
  timestamp: string;
  youtubeId: string;
  transcriptSentiment: "Positive" | "Negative" | "Neutral";
  transcriptTimeline: TranscriptPoint[];
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
        youtubeId: "jNQXAC9IVRw",
        transcriptSentiment: "Positive",
        transcriptTimeline: [
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
        youtubeId: "3fumBcKC6RE",
        transcriptSentiment: "Negative",
        transcriptTimeline: [
          { time: "0:00", sentiment: -0.2 },
          { time: "2:00", sentiment: -0.5 },
          { time: "4:00", sentiment: -0.8 },
          { time: "6:00", sentiment: -0.7 },
          { time: "8:00", sentiment: -0.4 },
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
      {
        id: 3,
        title: "Climate Change Solutions 2026",
        channel: "Science Today",
        timestamp: "1 day ago",
        youtubeId: "aqz-KE-bpKQ",
        transcriptSentiment: "Neutral",
        transcriptTimeline: [
          { time: "0:00", sentiment: 0.1 },
          { time: "2:00", sentiment: 0.2 },
          { time: "4:00", sentiment: 0.0 },
          { time: "6:00", sentiment: -0.1 },
          { time: "8:00", sentiment: 0.1 },
        ],
        positiveComments: [
          { text: "Balanced discussion overall", sentiment: "Positive" },
          { text: "Interesting solutions mentioned", sentiment: "Positive" },
        ],
        negativeComments: [
          { text: "Some points felt vague", sentiment: "Negative" },
          { text: "Needed more evidence", sentiment: "Negative" },
        ],
      },
    ];

    setVideos(mockData);

    const counts: Record<number, number> = {};
    mockData.forEach((video) => {
      counts[video.id] = 2;
    });
    setVisibleCounts(counts);
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

  const badgeClass = (sentiment: Video["transcriptSentiment"]) => {
    if (sentiment === "Positive") {
      return "bg-[#020826] text-white hover:bg-[#020826]";
    }
    if (sentiment === "Negative") {
      return "bg-[#f31260] text-white hover:bg-[#f31260]";
    }
    return "bg-[#e5e7eb] text-slate-800 hover:bg-[#e5e7eb]";
  };

  return (
    <div className="min-h-screen bg-[#f8f8f8] px-8 py-10 text-black">
      <div className="mx-auto max-w-[1800px]">
        <div className="mb-10">
          <h1 className="text-[56px] font-bold leading-none tracking-tight text-black">
            Sentiment Analysis Dashboard
          </h1>
          <p className="mt-4 text-[20px] text-slate-500">
            Transcript-level sentiment with categorized viewer comments.
          </p>
        </div>

        <div className="space-y-8">
          {videos.map((video) => (
            <Card
              key={video.id}
              className="rounded-[28px] border border-slate-200 bg-white shadow-none"
            >
              <CardHeader className="px-8 py-8">
                <div className="flex items-start justify-between gap-6">
                  <div className="min-w-0">
                    <CardTitle className="text-[44px] font-semibold leading-tight text-black">
                      {video.title}
                    </CardTitle>

                    <p className="mt-3 text-[20px] text-[#2563eb]">
                      {video.channel} • {video.timestamp}
                    </p>

                    <div className="mt-6">
                      <Button
                        variant="outline"
                        onClick={() => toggleExpanded(video.id)}
                        className="h-auto rounded-2xl border border-slate-200 bg-white px-7 py-5 text-[18px] font-semibold text-black shadow-none hover:bg-slate-50"
                      >
                        {expandedVideoId === video.id ? "Hide Details" : "View Details"}
                      </Button>
                    </div>
                  </div>

                  <Badge
                    className={`rounded-full px-4 py-2 text-[18px] font-semibold shadow-none ${badgeClass(
                      video.transcriptSentiment
                    )}`}
                  >
                    {video.transcriptSentiment}
                  </Badge>
                </div>
              </CardHeader>

              {expandedVideoId === video.id && (
                <CardContent className="px-8 pb-8 pt-0">
                  <div className="space-y-6">
                    <div className="flex justify-center">
                      <div className="w-full max-w-6xl overflow-hidden rounded-[22px] border border-slate-200 bg-white">
                        <div className="aspect-video w-full">
                          <iframe
                            className="h-full w-full"
                            src={`https://www.youtube.com/embed/${video.youtubeId}`}
                            title={video.title}
                            allowFullScreen
                          />
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-4">
                      <p className="text-[15px] font-semibold text-slate-800">
                        Overall Transcript Sentiment
                      </p>
                      <div className="mt-3">
                        <Badge
                          className={`rounded-full px-3 py-1 text-[13px] font-semibold shadow-none ${badgeClass(
                            video.transcriptSentiment
                          )}`}
                        >
                          {video.transcriptSentiment}
                        </Badge>
                      </div>
                    </div>

                    <div className="rounded-[20px] border border-slate-200 bg-white px-5 py-4">
                      <p className="mb-4 text-[15px] font-semibold text-slate-800">
                        Sentiment Timeline
                      </p>
                      <div className="h-[240px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={video.transcriptTimeline}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#d1d5db" />
                            <XAxis dataKey="time" stroke="#6b7280" />
                            <YAxis domain={[-1, 1]} stroke="#6b7280" />
                            <Tooltip />
                            <Line
                              type="monotone"
                              dataKey="sentiment"
                              stroke="#3b82f6"
                              strokeWidth={2}
                              dot={{ r: 4, fill: "#3b82f6" }}
                            />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <Tabs defaultValue="positive" className="w-full">
                      <TabsList className="grid h-auto w-full grid-cols-2 rounded-[18px] bg-[#f1f2f4] p-1">
                        <TabsTrigger
                          value="positive"
                          className="rounded-[14px] py-3 text-[16px] font-semibold text-green-600 data-[state=active]:bg-white data-[state=active]:text-green-600"
                        >
                          Positive Comments
                        </TabsTrigger>
                        <TabsTrigger
                          value="negative"
                          className="rounded-[14px] py-3 text-[16px] font-semibold text-red-600 data-[state=active]:bg-white data-[state=active]:text-red-600"
                        >
                          Negative Comments
                        </TabsTrigger>
                      </TabsList>

                      <TabsContent value="positive" className="mt-6 space-y-4">
                        {video.positiveComments
                          .slice(0, visibleCounts[video.id])
                          .map((comment, index) => (
                            <div
                              key={`positive-${video.id}-${index}`}
                              className="rounded-[18px] border border-slate-200 bg-white px-5 py-4"
                            >
                              <p className="text-[18px] text-black">{comment.text}</p>
                              <div className="mt-3">
                                <Badge className="rounded-full bg-[#020826] px-3 py-1 text-[13px] font-semibold text-white shadow-none hover:bg-[#020826]">
                                  {comment.sentiment}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </TabsContent>

                      <TabsContent value="negative" className="mt-6 space-y-4">
                        {video.negativeComments
                          .slice(0, visibleCounts[video.id])
                          .map((comment, index) => (
                            <div
                              key={`negative-${video.id}-${index}`}
                              className="rounded-[18px] border border-slate-200 bg-white px-5 py-4"
                            >
                              <p className="text-[18px] text-black">{comment.text}</p>
                              <div className="mt-3">
                                <Badge className="rounded-full bg-[#020826] px-3 py-1 text-[13px] font-semibold text-white shadow-none hover:bg-[#020826]">
                                  {comment.sentiment}
                                </Badge>
                              </div>
                            </div>
                          ))}
                      </TabsContent>
                    </Tabs>

                    {(visibleCounts[video.id] < video.positiveComments.length ||
                      visibleCounts[video.id] < video.negativeComments.length) && (
                      <div>
                        <Button
                          variant="outline"
                          onClick={() => showMoreComments(video.id)}
                          className="h-auto rounded-2xl border border-slate-200 bg-[#eef0f4] px-5 py-3 text-[14px] font-semibold text-black shadow-none hover:bg-[#e5e7eb]"
                        >
                          Show More Comments
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}