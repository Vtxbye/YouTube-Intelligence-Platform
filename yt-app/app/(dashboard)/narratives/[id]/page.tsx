'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';

// TEMP: reuse your mock data (later replace with API)
import { mockNarratives } from '../page'; // or move it to a separate file

export default function NarrativePage() {
  const { id } = useParams();

  const narrative = mockNarratives.find(
    (n) => n.id.toString() === id
  );

  if (!narrative) {
    return <div className="text-gray-500">Narrative not found</div>;
  }

  return (
    <div className="space-y-6">

      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Link
          href="/narratives"
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Narratives</span>
        </Link>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          {narrative.narrative}
        </h1>
      </div>

      {/* Videos */}
      <div className="grid md:grid-cols-2 gap-6">
        {narrative.videos.map((video, i) => (
          <div key={i} className="bg-white border rounded-lg p-4">

            <YouTubeEmbed videoid={video.video_id} />

            <div className="mt-3">
              <h4 className="font-semibold">Claims</h4>

              <ul className="list-disc pl-5 text-sm text-gray-700">
                {video.claims.map((claim, idx) => (
                  <li key={idx}>{claim}</li>
                ))}
              </ul>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}