'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type NarrativeClaimVideoRow = {
  narrative_id: number;
  narrative_text: string;
  claim_count: number;

  claim_id: number;
  claim_text: string;

  video_id: string;
  video_title: string | null;
  video_published_at: string | null;
  channel_name: string | null;
  views: number | null;
  video_url: string | null;
  duration_seconds: number | null;
};

type GroupedVideo = {
  video_id: string;
  video_title: string | null;
  channel_name: string | null;
  views: number | null;
  video_url: string | null;
  duration_seconds: number | null;
  claims: string[];
};

export default function NarrativeDetailPage() {
  const params = useParams();
  const id = params?.id as string;

  const [rows, setRows] = useState<NarrativeClaimVideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchNarrativeData() {
      try {
        setLoading(true);
        setError('');

        const res = await fetch(`${API_URL}/narrative/${id}/claims-videos`);

        if (!res.ok) {
          throw new Error('Failed to fetch narrative/claim/video data');
        }

        const data: NarrativeClaimVideoRow[] = await res.json();
        setRows(data);
      } catch (err) {
        console.error(err);
        setError('Could not load this narrative.');
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchNarrativeData();
    }
  }, [id]);

  const narrativeTitle = rows[0]?.narrative_text ?? 'Narrative';

  const groupedVideos = useMemo(() => {
    const map = new Map<string, GroupedVideo>();

    for (const row of rows) {
      if (!map.has(row.video_id)) {
        map.set(row.video_id, {
          video_id: row.video_id,
          video_title: row.video_title,
          channel_name: row.channel_name,
          views: row.views,
          video_url: row.video_url,
          duration_seconds: row.duration_seconds,
          claims: [],
        });
      }

      const existing = map.get(row.video_id)!;

      if (row.claim_text && !existing.claims.includes(row.claim_text)) {
        existing.claims.push(row.claim_text);
      }
    }

    return Array.from(map.values());
  }, [rows]);

  function formatDuration(seconds: number | null) {
    if (!seconds) return 'Unknown duration';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  if (loading) {
    return <div className="text-gray-600">Loading narrative...</div>;
  }

  if (error) {
    return <div className="text-red-600">{error}</div>;
  }

  if (!rows.length) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Link
          href="/narratives"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Narratives</span>
        </Link>
      </div>

      <div className="text-gray-600">No data found for this narrative.</div>
    </div>
  );
}

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/narratives"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Narratives</span>
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {narrativeTitle}
        </h1>
        <p className="text-gray-600 mt-1">
          Videos and claims associated with this narrative
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {groupedVideos.map((video) => (
          <div
            key={video.video_id}
            className="bg-white border border-gray-200 rounded-lg p-4 space-y-4"
          >
            <YouTubeEmbed videoid={video.video_id} />

            <div>
              <h3 className="font-semibold text-gray-900">
                {video.video_title || 'Untitled Video'}
              </h3>

              <p className="text-sm text-gray-600">
                {video.channel_name || 'Unknown channel'}
              </p>

              <p className="text-sm text-gray-500">
                {(video.views ?? 0).toLocaleString()} views •{' '}
                {formatDuration(video.duration_seconds)}
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Claims</h4>

              <ul className="list-disc pl-5 text-sm text-gray-700 space-y-1">
                {video.claims.slice(0, 2).map((claim, idx) => (
                  <li key={idx}>{claim}</li>
                ))}
              </ul>

              {video.claims.length > 2 && (
                <details className="mt-2 group">
                  <summary className="cursor-pointer list-none inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-800">
                    <span className="group-open:hidden">
                      Show {video.claims.length - 2} more claim(s)
                    </span>

                    <span className="hidden group-open:inline">
                      Hide extra claims
                    </span>

                    <span className="transition-transform group-open:rotate-180">
                      ⌄
                    </span>
                  </summary>

                  <ul className="list-disc pl-5 pt-2 text-sm text-gray-700 space-y-1">
                    {video.claims.slice(2).map((claim, idx) => (
                      <li key={idx}>{claim}</li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}