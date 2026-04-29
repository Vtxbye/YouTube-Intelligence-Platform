"use client";

import { useEffect, useState } from "react";
import { MessageSquare, ThumbsUp, ThumbsDown } from "lucide-react";
import { YouTubeEmbed } from "@next/third-parties/google";

type HighlightToken = {
  token: string;
  polarity: "positive" | "negative" | "neutral";
};

type Comment = {
  comment_id: number;
  author: string;
  comment_text: string;
  sentiment_label: string | null;
  sentiment_score: number | null;
  sentiment_highlight_tokens: HighlightToken[] | null;
};

type VideoMeta = {
  video_id: string;
  title: string;
  channel_name: string;
  published_at: string;
  video_url: string | null;
  sentiment_label: string | null;
  sentiment_score: number | null;
};

type VideoDetail = {
  video_id: string;
  title: string;
  channel_name: string;
  published_at: string;
  video_url: string | null;
  transcript: string | null;
  sentiment_label: string | null;
  sentiment_score: number | null;
  sentiment_summary: string | null;
  sentiment_highlight_tokens: HighlightToken[] | null;
  comments: Comment[];
};

function highlightTranscript(text: string | null, tokens: HighlightToken[] | null) {
  if (!text || !tokens) return text ?? "";
  let html = text;
  tokens.forEach((t) => {
    const color =
      t.polarity === "positive"
        ? "bg-green-200"
        : t.polarity === "negative"
        ? "bg-red-200"
        : "bg-gray-200";
    const regex = new RegExp(`\\b${t.token}\\b`, "gi");
    html = html.replace(
      regex,
      `<span class="${color} px-1 rounded">${t.token}</span>`
    );
  });
  return html;
}

// ⭐ Score formatting helper
function formatScore(label: string | null, score: number | null) {
  if (score == null) return "N/A";
  const abs = Math.abs(score).toFixed(3);
  return label === "negative" ? `-${abs}` : abs;
}

export default function SentimentPage() {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [details, setDetails] = useState<Record<string, VideoDetail>>({});
  const [expanded, setExpanded] = useState<string | null>(null);
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [filter, setFilter] = useState<"all" | "positive" | "negative" | "neutral">("all");

  useEffect(() => {
    async function load() {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/videos/sentiment?limit=20&offset=${offset}`
      );
      const data: VideoMeta[] = await res.json();

      // Normalize labels
      const normalized = data.map((v) => ({
        ...v,
        sentiment_label: v.sentiment_label?.toLowerCase() ?? null,
      }));

      // Deduplicate by video_id
      setVideos((prev) => {
        const merged = [...prev, ...normalized];
        const unique = Array.from(new Map(merged.map((v) => [v.video_id, v])).values());
        return unique;
      });
    }
    load();
  }, [offset]);

  const loadDetails = async (videoId: string) => {
    if (details[videoId]) return;
    setLoadingDetail(videoId);
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/videos/${videoId}/sentiment?comment_limit=50`
    );
    const data: VideoDetail = await res.json();

    data.sentiment_label = data.sentiment_label?.toLowerCase() ?? null;

    setDetails((prev) => ({ ...prev, [videoId]: data }));
    setLoadingDetail(null);
  };

  const toggle = async (videoId: string) => {
    if (expanded === videoId) {
      setExpanded(null);
      return;
    }
    setExpanded(videoId);
    await loadDetails(videoId);
  };

  const filteredVideos =
    filter === "all"
      ? videos
      : videos.filter((v) => v.sentiment_label === filter);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-black">Sentiment Analysis</h1>

      {/* Filter Bar */}
      <div className="flex gap-3">
        {["all", "positive", "negative", "neutral"].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as "all" | "positive" | "negative" | "neutral")}
            className={`px-3 py-1 rounded text-sm border ${
              filter === f
                ? "bg-purple-600 text-white border-purple-600"
                : "bg-white text-black border-gray-300"
            }`}
          >
            {f === "all" ? "All" : f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-8">
        {filteredVideos.map((video, index) => {
          const detail = details[video.video_id];
          const embedVideoId =
            video.video_url?.split("v=")[1]?.split("&")[0] ||
            video.video_id;

          return (
            <div
              key={`${video.video_id}-${index}`}
              className="bg-white border rounded-lg p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="text-purple-600" />
                <div>
                  <h2 className="font-semibold text-lg text-black">
                    {video.title}
                  </h2>
                  <p className="text-sm text-gray-500">
                    {video.channel_name} • {video.published_at}
                  </p>
                </div>
              </div>

              {/* Always-visible embed */}
              <div className="rounded-lg overflow-hidden mt-4">
                <YouTubeEmbed videoid={embedVideoId} height={300} width={500} />
              </div>

              {/* Always-visible sentiment label + score */}
              <div className="mt-4 text-black">
                <p>
                  Sentiment:{" "}
                  <span className="font-semibold">
                    {video.sentiment_label ?? "Unknown"}
                  </span>
                </p>
                <p className="text-sm text-gray-600">
                  Score: {formatScore(video.sentiment_label, video.sentiment_score)}
                </p>
              </div>

              {/* Always-visible summary */}
              {detail && (
                <div className="mt-6">
                  <h3 className="font-semibold text-black mb-2">
                    Transcript Summary
                  </h3>
                  <p className="text-gray-700">{detail.sentiment_summary}</p>
                </div>
              )}

              {/* Toggle */}
              <button
                onClick={() => toggle(video.video_id)}
                className="mt-4 text-sm text-purple-600 underline"
              >
                {expanded === video.video_id
                  ? "Hide transcript & comments"
                  : "Show transcript & comments"}
              </button>

              {/* Expanded section */}
              {expanded === video.video_id && detail && (
                <div className="mt-6 space-y-8">
                  <div>
                    <h3 className="font-semibold text-black mb-2">
                      Transcript
                    </h3>
                    <p
                      className="whitespace-pre-wrap text-gray-800"
                      dangerouslySetInnerHTML={{
                        __html: highlightTranscript(
                          detail.transcript,
                          detail.sentiment_highlight_tokens
                        ),
                      }}
                    />
                  </div>

                  <div className="grid md:grid-cols-3 gap-6">
                    <CommentColumn
                      title="Positive"
                      color="green"
                      comments={detail.comments.filter(
                        (c) => c.sentiment_label === "positive"
                      )}
                    />
                    <CommentColumn
                      title="Negative"
                      color="red"
                      comments={detail.comments.filter(
                        (c) => c.sentiment_label === "negative"
                      )}
                    />
                    <CommentColumn
                      title="Neutral"
                      color="gray"
                      comments={detail.comments.filter(
                        (c) => c.sentiment_label === "neutral"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-center">
        <button
          onClick={() => setOffset(offset + 20)}
          className="bg-gray-700 text-white px-4 py-2 rounded"
        >
          Load More
        </button>
      </div>
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

  return (
    <div>
      <h3 className={`font-semibold text-${color}-700 flex items-center gap-2 mb-2`}>
        <Icon className="w-4 h-4" /> {title}
      </h3>

      {comments.length === 0 && (
        <p className="text-sm text-gray-500">No comments</p>
      )}

      <div className="space-y-2">
        {comments.map((c) => (
          <div key={c.comment_id} className={`p-3 bg-${color}-50 border rounded`}>
            <p className="text-black">{c.comment_text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
