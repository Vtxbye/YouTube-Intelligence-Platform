'use client';

import { useEffect, useState } from "react";
import { Clock3 } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';
import { useSearch } from '@/app/utils/SearchContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type VideoRow = {
  video_id: string;
  title: string | null;
  published_at: string | null;
  channel_name: string | null;
  video_url?: string | null;
  views?: number | null;
  duration_seconds?: number | null;
  matched_keywords?: string | null;
  transcript?: string | null;

  like_count?: number | null;
  comment_count?: number | null;
  engagement_rate?: number | null;
  view_velocity?: number | null;
  transcript_length?: number | null;
  keyword_density?: number | null;
};

type ClaimRow = {
  claim_id: number;
  video_id: string;
  claim_text: string;
  created_at: string;
};

type VideoWithClaims = VideoRow & {
  claims: ClaimRow[];
};

type SortOption = 'newest' | 'oldest' | 'most_popular';

const PAGE_SIZE = 20;

export default function Page() {
  const [rows, setRows] = useState<VideoWithClaims[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [expandedVideos, setExpandedVideos] = useState<Record<string, boolean>>({});
  const [totalVideos, setTotalVideos] = useState(0);
  const [totalClaims, setTotalClaims] = useState(0);

  const search = useSearch();

  useEffect(() => {
    async function fetchVideos() {
      try {
        setLoading(true);

        const offset = (page - 1) * PAGE_SIZE;

        const res = await fetch(
          `${API_URL}/videos/with-claims?sort=${sortBy}&limit=${PAGE_SIZE}&offset=${offset}`
        );

        if (!res.ok) throw new Error("Failed to fetch videos");

        const data = await res.json();

        setRows(data);
        setHasMore(data.length === PAGE_SIZE);
      } catch (err) {
        console.error("Error fetching videos:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideos();
  }, [page, sortBy]);

  useEffect(() => {
    setPage(1);
  }, [sortBy]);

  useEffect(() => {
    async function fetchCounts() {
      try {
        const res = await fetch(`${API_URL}/stats/claim-overview`);
        if (!res.ok) return;

        const data = await res.json();
        setTotalVideos(data.total_videos);
        setTotalClaims(data.total_claims);
      } catch (err) {
        console.error("Error fetching counts:", err);
      }
    }

    fetchCounts();
  }, []);

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString();
  }

  const sortLabel =
    sortBy === 'oldest'
      ? 'Oldest'
      : sortBy === 'most_popular'
      ? 'Most Popular'
      : 'Newest';

  const visiblePages = (() => {
    const pages: (number | string)[] = [];

    if (page <= 3) {
      pages.push(1, 2, 3, 4, 5);
      if (hasMore) pages.push("...");
    } else {
      pages.push(1, "...");
      pages.push(page - 1, page, page + 1);
      if (hasMore) pages.push("...");
    }

    return [...new Set(pages)].filter((p) => typeof p !== "number" || p > 0);
  })();

  const filteredRows = rows.filter((video) => {
    const query = (search || '').toLowerCase();

    return (
      video.title?.toLowerCase().includes(query) ||
      video.channel_name?.toLowerCase().includes(query) ||
      video.claims?.some((claim) =>
        claim.claim_text.toLowerCase().includes(query)
      )
    );
  });

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-black font-semibold">Claims Overview</h1>
          <p className="text-black mt-1">
            Browse the claims extracted from video transcripts.
            <br />
            <span className="text-gray-700 text-sm">
              {totalVideos} videos • {totalClaims} total claims
            </span>
          </p>
        </div>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-gray-700 text-white px-4 py-2 rounded text-sm"
          >
            Sort: {sortLabel}
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow p-2 z-50 min-w-44">
              <button
                onClick={() => {
                  setSortBy('newest');
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded"
              >
                Newest
              </button>

              <button
                onClick={() => {
                  setSortBy('oldest');
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded"
              >
                Oldest
              </button>

              <button
                onClick={() => {
                  setSortBy('most_popular');
                  setDropdownOpen(false);
                }}
                className="block w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-100 rounded"
              >
                Most Popular
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Clock3 className="text-purple-600" />
          <div>
            <h2 className="font-semibold text-lg text-black">Videos</h2>
            <p className="text-black text-sm">
              Videos and their related claims
            </p>
          </div>
        </div>

        {loading ? (
          <p className="text-gray-600">Loading videos...</p>
        ) : (
          <>
            {filteredRows.length === 0 && (
              <p className="text-gray-500">No videos match your search</p>
            )}

            <div className="grid md:grid-cols-2 gap-6">
              {filteredRows.map((video) => {
                const embedVideoId =
                  video.video_url?.split('v=')[1]?.split('&')[0] || video.video_id;

                return (
                  <div
                    key={video.video_id}
                    className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
                  >
                    {embedVideoId ? (
                      <YouTubeEmbed videoid={embedVideoId} />
                    ) : (
                      <div className="h-55 flex items-center justify-center bg-gray-100 rounded">
                        <span className="text-sm text-gray-500">Video unavailable</span>
                      </div>
                    )}

                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {video.title || 'Untitled Video'}
                      </h3>

                      <p className="text-sm text-gray-600">
                        {video.channel_name || 'Unknown channel'}
                      </p>

                      <p className="text-sm text-gray-500">
                        {formatDate(video.published_at)}
                        {video.views !== null && video.views !== undefined
                          ? ` • ${video.views.toLocaleString()} views`
                          : ''}
                      </p>

                      <p className="text-sm text-gray-500 font-medium">
                        {video.claims.length} claim{video.claims.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Claims</h4>

                      {video.claims && video.claims.length > 0 ? (
                        <div>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                            {(expandedVideos[video.video_id]
                              ? video.claims
                              : video.claims.slice(0, 2)
                            ).map((claim) => (
                              <li key={claim.claim_id}>
                                <div>{claim.claim_text}</div>
                              </li>
                            ))}
                          </ul>

                          {video.claims.length > 2 && (
                            <div className="flex justify-center mt-3">
                              <button
                                onClick={() =>
                                  setExpandedVideos((prev) => ({
                                    ...prev,
                                    [video.video_id]: !prev[video.video_id],
                                  }))
                                }
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                {expandedVideos[video.video_id]
                                  ? "Hide extra claims ▲"
                                  : `Show ${video.claims.length - 2} more claim(s) ▼`}
                              </button>
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500">
                          No claims on this video
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

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
                key={item}
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
            disabled={!hasMore}
            className="px-4 py-2 rounded bg-gray-700 text-white disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}