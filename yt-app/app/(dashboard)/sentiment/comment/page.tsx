"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";
import { useSearch } from "@/app/utils/SearchContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type Comment = {
  comment_id: number;
  author: string;
  comment_text: string;
  sentiment_label: string | null;
  sentiment_score: number | null;
  sentiment_highlight_tokens: any;
};

type VideoWithComments = {
  video_id: string;
  title: string;
  channel_name: string;
  published_at: string;
  video_url: string | null;
  comments: Comment[];
};

export default function CommentSentimentDashboard() {
  const [videos, setVideos] = useState<VideoWithComments[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const search = useSearch();

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/videos/comment-sentiment`);
        const data = await res.json();

        const normalized = data.map((v: VideoWithComments) => ({
          ...v,
          comments: v.comments.map((c) => ({
            ...c,
            sentiment_label: c.sentiment_label?.toLowerCase() ?? null,
          })),
        }));

        setVideos(normalized);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const toggle = (videoId: string) => {
    setExpanded((prev) => ({
      ...prev,
      [videoId]: !prev[videoId],
    }));
  };

  const filteredVideos = videos.filter((video) => {
    const q = search.toLowerCase();

    return (
      video.title.toLowerCase().includes(q) ||
      video.channel_name.toLowerCase().includes(q) ||
      video.comments.some((c) =>
        c.comment_text.toLowerCase().includes(q)
      ) ||
      video.comments.some((c) =>
        (c.sentiment_label ?? "").toLowerCase().includes(q)
      )
    );
  });

  return (
    <div className="space-y-6">

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">
            Comment Sentiment
          </h1>
          <p className="text-black text-sm">
            Showing extracted sentiment from video comments.
          </p>
          <a
          href="/sentiment"
          className="text-blue-600 hover:text-blue-800 text-sm"
        >
          ← Back to video sentiment
        </a>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-600">Loading comment sentiment...</p>
      ) : filteredVideos.length === 0 ? (
        <p className="text-gray-500">No videos match your search</p>
      ) : (
        <div className="space-y-8">
          {filteredVideos.map((video) => {
            const embedVideoId =
              video.video_url?.split("v=")[1]?.split("&")[0] ||
              video.video_id;

            const isOpen = expanded[video.video_id];

            return (
              <div
                key={video.video_id}
                className="bg-white border border-gray-200 rounded-lg p-6 space-y-4"
              >
                {embedVideoId ? (
                  <YouTubeEmbed videoid={embedVideoId} />
                ) : (
                  <div className="h-55 flex items-center justify-center bg-gray-100 rounded">
                    <span className="text-sm text-gray-500">Video unavailable</span>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold text-gray-900">{video.title}</h3>
                  <p className="text-sm text-gray-600">{video.channel_name}</p>
                  <p className="text-sm text-gray-500">{video.published_at}</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {video.comments.length} comment(s) with sentiment
                  </p>
                </div>

                <button
                  onClick={() => toggle(video.video_id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isOpen ? "Hide comments ▲" : "Show comments ▼"}
                </button>

                {isOpen && (
                  <div className="grid md:grid-cols-3 gap-6 pt-2">
                    <CommentColumn
                      title="Positive"
                      color="green"
                      comments={video.comments.filter(
                        (c) => c.sentiment_label === "positive"
                      )}
                    />
                    <CommentColumn
                      title="Negative"
                      color="red"
                      comments={video.comments.filter(
                        (c) => c.sentiment_label === "negative"
                      )}
                    />
                    <CommentColumn
                      title="Neutral"
                      color="gray"
                      comments={video.comments.filter(
                        (c) => c.sentiment_label === "neutral"
                      )}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function CommentColumn({
  title,
  color,
  comments,
}: {
  title: string;
  color: string;
  comments: Comment[];
}) {
  const Icon =
    title === "Positive"
      ? ThumbsUp
      : title === "Negative"
      ? ThumbsDown
      : MessageSquare;

  const [expandedComments, setExpandedComments] = useState<
    Record<number, boolean>
  >({});

  const toggleComment = (id: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  return (
    <div>
      <h3 className={`font-semibold text-${color}-700 flex items-center gap-2 mb-2`}>
        <Icon className="w-4 h-4" /> {title}
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-gray-500">No comments</p>
      )}

      <div className="space-y-2">
        {comments.map((c) => {
          const isLong = c.comment_text.length > 180;
          const isExpanded = expandedComments[c.comment_id];

          const displayText =
            isLong && !isExpanded
              ? c.comment_text.slice(0, 180) + "..."
              : c.comment_text;

          return (
            <div
              key={c.comment_id}
              className={`p-3 bg-${color}-50 border rounded`}
            >
              <p className="text-black">{displayText}</p>

              {isLong && (
                <button
                  onClick={() => toggleComment(c.comment_id)}
                  className="text-blue-600 hover:text-blue-800 text-xs font-medium mt-1"
                >
                  {isExpanded ? "Show less ▲" : "Show more ▼"}
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}