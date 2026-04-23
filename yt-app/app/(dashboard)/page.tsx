'use client';

import { useEffect, useMemo, useState } from "react";
import { Clock3 } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'https://youtube-intelligence-platform-api.onrender.com';

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

  useEffect(() => {
    async function fetchVideosAndClaims() {
      try {
        setLoading(true);

        const offset = (page - 1) * PAGE_SIZE;

        const videosRes = await fetch(
          `${API_URL}/videos?limit=${PAGE_SIZE}&offset=${offset}`
        );

        if (!videosRes.ok) {
          throw new Error('Failed to fetch videos');
        }

        const videosData: VideoRow[] = await videosRes.json();
        setHasMore(videosData.length === PAGE_SIZE);

        const videosWithClaims = await Promise.all(
          videosData.map(async (video) => {
            try {
              const claimsRes = await fetch(`${API_URL}/videos/${video.video_id}/claims`);

              if (!claimsRes.ok) {
                throw new Error(`Failed to fetch claims for video ${video.video_id}`);
              }

              const claimsData: ClaimRow[] = await claimsRes.json();

              return {
                ...video,
                claims: claimsData,
              };
            } catch (err) {
              console.error(err);

              return {
                ...video,
                claims: [],
              };
            }
          })
        );

        setRows(videosWithClaims);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchVideosAndClaims();
  }, [page]);

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';

    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';

    return date.toLocaleDateString();
  }

  const videos = useMemo(() => {
    const sortedVideos = [...rows];

    sortedVideos.sort((a, b) => {
      const aTime = a.published_at ? new Date(a.published_at).getTime() : 0;
      const bTime = b.published_at ? new Date(b.published_at).getTime() : 0;
      const aViews = a.views ?? 0;
      const bViews = b.views ?? 0;

      if (sortBy === 'oldest') {
        return aTime - bTime;
      }

      if (sortBy === 'most_popular') {
        return bViews - aViews;
      }

      return bTime - aTime;
    });

    return sortedVideos;
  }, [rows, sortBy]);

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
      if (hasMore) {
        pages.push("...");
      }
    }

    return [...new Set(pages)].filter((p) => typeof p !== "number" || p > 0);
  })();

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-black font-semibold">Dashboard Overview</h1>
          <p className="text-black mt-1">
            Browse videos and the claims connected to each one.
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
          <div className="space-y-8">
            {videos.map((video) => {
              const embedVideoId =
                video.video_url?.split('v=')[1]?.split('&')[0] || video.video_id;

              return (
                <div
                  key={video.video_id}
                  className="border border-gray-200 rounded-lg p-5"
                >
                  <div className="grid lg:grid-cols-[380px_1fr] gap-6">
                    <div>
                      {embedVideoId ? (
                        <div className="rounded-lg overflow-hidden">
                          <YouTubeEmbed
                            videoid={embedVideoId}
                            height={220}
                            width={370}
                          />
                        </div>
                      ) : (
                        <div className="h-[220px] flex items-center justify-center bg-gray-100 rounded">
                          <span className="text-sm text-gray-500">Video unavailable</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <h3 className="text-gray-900 font-semibold text-lg">
                        {video.title || 'Untitled Video'}
                      </h3>

                      <p className="text-sm text-gray-600 mt-1">
                        {video.channel_name || 'Unknown channel'}
                      </p>

                      <p className="text-sm text-gray-500 mt-1 mb-4">
                        {formatDate(video.published_at)}
                        {video.views !== null && video.views !== undefined
                          ? ` • ${video.views.toLocaleString()} views`
                          : ''}
                      </p>

                      <div className="space-y-3">
                        {video.claims.length > 0 ? (
                          video.claims.map((claimItem, index) => (
                            <div
                              key={claimItem.claim_id ?? `${video.video_id}-${index}`}
                              className="bg-gray-50 rounded-md p-3"
                            >
                              <p className="text-sm font-medium text-gray-700 mb-1">
                                Claim {index + 1}
                              </p>
                              <p className="text-gray-800 text-sm">
                                {claimItem.claim_text}
                              </p>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-gray-500">
                            No claims on this video
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
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