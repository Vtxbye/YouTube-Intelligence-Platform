'use client';

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/app/auth/firebase";
import { Clock3 } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';

type NarrativeClaimVideoRow = {
  video_id: string;
  video_title: string | null;
  video_published_at: string | null;
  channel_name: string | null;
  video_url?: string | null;
  views?: number | null;
  claim_id: number | null;
  claim_text: string | null;
};

type VideoWithClaims = {
  video_id: string;
  video_title: string | null;
  video_published_at: string | null;
  channel_name: string | null;
  video_url?: string | null;
  views?: number | null;
  claims: {
    claim: string;
    claim_number: number;
  }[];
};

type SortOption = 'newest' | 'oldest' | 'most_popular';

export default function Page() {
  const router = useRouter();
  const [authChecked, setAuthChecked] = useState(false);
  const [rows, setRows] = useState<NarrativeClaimVideoRow[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) {
        router.replace("/signup");
      } else {
        setAuthChecked(true);
      }
    });
    return () => unsub();
  }, [router]);

  useEffect(() => {
    if (!authChecked) return;
    async function fetchVideoClaims() {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/videos-claims`);
        const data = await res.json();
        setRows(data);
      } catch (err) {}
    }
    fetchVideoClaims();
  }, [authChecked]);

  function formatDate(dateString: string | null) {
    if (!dateString) return 'Unknown date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Unknown date';
    return date.toLocaleDateString();
  }

  const videos = useMemo(() => {
    if (!authChecked) return [];
    const videoMap = new Map<string, VideoWithClaims>();
    rows.forEach((row) => {
      if (!videoMap.has(row.video_id)) {
        videoMap.set(row.video_id, {
          video_id: row.video_id,
          video_title: row.video_title,
          video_published_at: row.video_published_at,
          channel_name: row.channel_name,
          video_url: row.video_url,
          views: row.views,
          claims: [],
        });
      }
      const video = videoMap.get(row.video_id)!;
      if (row.claim_text) {
        video.claims.push({
          claim: row.claim_text,
          claim_number: video.claims.length + 1,
        });
      }
    });
    const groupedVideos = Array.from(videoMap.values());
    groupedVideos.sort((a, b) => {
      const aTime = a.video_published_at ? new Date(a.video_published_at).getTime() : 0;
      const bTime = b.video_published_at ? new Date(b.video_published_at).getTime() : 0;
      const aViews = a.views ?? 0;
      const bViews = b.views ?? 0;
      if (sortBy === 'oldest') return aTime - bTime;
      if (sortBy === 'most_popular') return bViews - aViews;
      return bTime - aTime;
    });
    return groupedVideos;
  }, [rows, sortBy, authChecked]);

  if (!authChecked) {
    return (
      <div className="flex items-center justify-center h-screen text-black">
        Checking authentication...
      </div>
    );
  }

  const sortLabel =
    sortBy === 'oldest'
      ? 'Oldest'
      : sortBy === 'most_popular'
      ? 'Most Popular'
      : 'Newest';

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl text-black font-semibold">Dashboard Overview</h1>
          <p className="text-black mt-1">Browse videos and the claims connected to each one.</p>
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
            <p className="text-black text-sm">Videos and their related claims</p>
          </div>
        </div>

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
                      {video.video_title || 'Untitled Video'}
                    </h3>

                    <p className="text-sm text-gray-600 mt-1">
                      {video.channel_name || 'Unknown channel'}
                    </p>

                    <p className="text-sm text-gray-500 mt-1 mb-4">
                      {formatDate(video.video_published_at)}
                      {video.views !== null && video.views !== undefined
                        ? ` • ${video.views.toLocaleString()} views`
                        : ''}
                    </p>

                    <div className="space-y-3">
                      {video.claims.length > 0 ? (
                        video.claims.map((claimItem) => (
                          <div
                            key={`${video.video_id}-${claimItem.claim_number}`}
                            className="bg-gray-50 rounded-md p-3"
                          >
                            <p className="text-sm font-medium text-gray-700 mb-1">
                              Claim {claimItem.claim_number}
                            </p>
                            <p className="text-gray-800 text-sm">
                              {claimItem.claim}
                            </p>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">no claims on this video</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}