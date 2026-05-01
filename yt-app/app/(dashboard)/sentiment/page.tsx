"use client";

import { useEffect, useState } from "react";
import { YouTubeEmbed } from "@next/third-parties/google";
import { useSearch } from "@/app/utils/SearchContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

type HighlightToken = {
  token: string;
  polarity: "positive" | "negative" | "neutral";
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
};

function highlightTranscript(
  text: string | null,
  tokens: HighlightToken[] | null
): string {
  if (!text || !tokens) return text ?? "";

  let html = text;

  for (const t of tokens) {
    if (!t.token.trim()) continue;

    const color =
      t.polarity === "positive"
        ? "bg-green-200"
        : t.polarity === "negative"
        ? "bg-red-200"
        : "bg-gray-200";

    const escaped = t.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    html = html.replace(
      regex,
      `<span class="${color} px-1 rounded">${t.token}</span>`
    );
  }

  return html;
}

function extractSnippets(
  transcript: string | null,
  tokens: HighlightToken[] | null,
  radius = 60,
  maxSnippets = 5
): string[] {
  if (!transcript || !tokens) return [];

  const snippets: string[] = [];
  const used = new Set<number>();

  for (const t of tokens) {
    if (!t.token.trim()) continue;

    const escaped = t.token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`\\b${escaped}\\b`, "gi");

    let match: RegExpExecArray | null;

    while ((match = regex.exec(transcript)) !== null) {
      const index = match.index;

      if ([...used].some((u) => Math.abs(u - index) < radius)) continue;

      used.add(index);

      const start = Math.max(0, index - radius);
      const end = Math.min(
        transcript.length,
        index + t.token.length + radius
      );

      snippets.push(transcript.slice(start, end).trim());

      if (snippets.length >= maxSnippets) return snippets;
    }
  }

  return snippets;
}

function formatScore(label: string | null, score: number | null): string {
  if (score == null) return "N/A";
  const abs = Math.abs(score).toFixed(3);
  return label === "negative" ? `-${abs}` : abs;
}

const PAGE_SIZE = 20;

export default function SentimentPage() {
  const [videos, setVideos] = useState<VideoMeta[]>([]);
  const [details, setDetails] = useState<Record<string, VideoDetail>>({});
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<
    "all" | "positive" | "negative" | "neutral"
  >("all");

  const search = useSearch() ?? "";

  useEffect(() => {
    setPage(1);
  }, [filter]);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        setLoading(true);

        const res = await fetch(`${API_URL}/videos/sentiment?limit=500`);
        if (!res.ok) throw new Error("Failed to fetch videos");

        const data: VideoMeta[] = await res.json();
        if (!active) return;

        const normalized = data.map((v) => ({
          ...v,
          sentiment_label: v.sentiment_label?.toLowerCase() ?? null,
        })).filter((v) => v.sentiment_score !== 0);

        setVideos(normalized);
      } catch (err) {
        console.error("Error loading videos:", err);
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => {
      active = false;
    };
  }, []);

  const loadDetails = async (videoId: string) => {
    if (details[videoId]) return;

    try {
      const res = await fetch(`${API_URL}/videos/${videoId}/sentiment`);
      if (!res.ok) throw new Error("Failed to fetch video details");

      const data: VideoDetail = await res.json();
      data.sentiment_label = data.sentiment_label?.toLowerCase() ?? null;

      setDetails((prev) => ({ ...prev, [videoId]: data }));
    } catch (err) {
      console.error(`Error loading details for ${videoId}:`, err);
    }
  };

  const toggleExpand = async (videoId: string) => {
    setExpanded((prev) => {
      const newState = !prev[videoId];
      return { ...prev, [videoId]: newState };
    });

    if (!expanded[videoId]) {
      await loadDetails(videoId);
    }
  };

  const filteredVideos = videos.filter((v) => {
    const q = search.toLowerCase();

    const matchesSearch =
      v.title.toLowerCase().includes(q) ||
      v.channel_name.toLowerCase().includes(q) ||
      (v.sentiment_label ?? "").includes(q);

    const matchesFilter =
      filter === "all" ? true : v.sentiment_label === filter;

    return matchesSearch && matchesFilter;
  });

  const totalFiltered = filteredVideos.length;
  const totalPages = Math.max(1, Math.ceil(totalFiltered / PAGE_SIZE));

  const paginatedVideos = filteredVideos.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE
  );

  const hasMoreFiltered = page < totalPages;

  const visiblePages = (() => {
    const pages: (number | string)[] = [];

    if (page <= 3) {
      pages.push(1, 2, 3, 4, 5);
      if (hasMoreFiltered) pages.push("...");
    } else {
      pages.push(1, "...");
      pages.push(page - 1, page, page + 1);
      if (hasMoreFiltered) pages.push("...");
    }

    return [...new Set(pages)].filter(
      (p) => typeof p !== "number" || (p > 0 && p <= totalPages)
    );
  })();

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-black">Sentiment Analysis</h1>
          <p className="text-black text-sm">
            Showing extracted sentiment from video transcripts.
          </p>

          <a
            href="/sentiment/comment"
            className="text-blue-600 hover:text-blue-800 text-sm"
          >
            View comment sentiment dashboard →
          </a>
        </div>

        <div className="mt-4 flex gap-3">
          {(["all", "positive", "negative", "neutral"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
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
      </div>

      {loading ? (
        <p className="text-gray-600">Loading videos...</p>
      ) : paginatedVideos.length === 0 ? (
        <p className="text-gray-500">No videos match your search</p>
      ) : (
        <div className="space-y-8">
          {paginatedVideos.map((video) => {
            const embedVideoId =
              video.video_url?.split("v=")[1]?.split("&")[0] ??
              video.video_id ??
              "";

            const detail = details[video.video_id];
            const isOpen = expanded[video.video_id] ?? false;

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
                </div>

                <div>
                  <p className="text-black">
                    Sentiment:{" "}
                    <span className="font-semibold capitalize">
                      {video.sentiment_label ?? "unknown"}
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Score: {formatScore(video.sentiment_label, video.sentiment_score)}
                  </p>
                </div>

                {detail?.sentiment_summary && (
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">
                      Transcript Summary
                    </h4>
                    <p className="text-gray-700">{detail.sentiment_summary}</p>
                  </div>
                )}

                <button
                  onClick={() => toggleExpand(video.video_id)}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  {isOpen ? "Hide transcript ▲" : "Show transcript ▼"}
                </button>

                {isOpen && detail && (
                  <div className="space-y-6 pt-2">
                    {extractSnippets(
                      detail.transcript,
                      detail.sentiment_highlight_tokens
                    ).map((snippet, i) => (
                      <p
                        key={`${video.video_id}-snippet-${i}`}
                        className="whitespace-pre-wrap text-gray-800 mb-4"
                        dangerouslySetInnerHTML={{
                          __html: highlightTranscript(
                            snippet,
                            detail.sentiment_highlight_tokens
                          ),
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
          <button
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1}
            className="px-4 py-2 rounded bg-gray-200 text-gray-800 disabled:opacity-50"
          >
            Previous
          </button>

          {visiblePages.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                ...
              </span>
            ) : (
              <button
                key={`page-${item}`}
                onClick={() => setPage(item as number)}
                className={`px-3 py-2 rounded text-sm ${
                  page === item
                    ? "bg-gray-700 text-white"
                    : "bg-gray-100 text-gray-800 hover:bg-gray-200"
                }`}
              >
                {item}
              </button>
            )
          )}

          <button
            onClick={() => setPage((prev) => prev + 1)}
            disabled={!hasMoreFiltered}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}