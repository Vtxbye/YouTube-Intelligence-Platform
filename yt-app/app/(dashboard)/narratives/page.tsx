'use client';

import { useEffect, useState } from "react";
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';

interface Narrative {
  narrative_id: number;
  narrative_text: string;
  domain: string | null;
  claim_count: number;
  first_detected_at: string;
}

export default function Page() {

  const [narratives, setNarratives] = useState<Narrative[]>([]);
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(null);

  useEffect(() => {
    async function fetchNarratives() {
      try {
        const res = await fetch('http://localhost:8000/narratives');
        const data = await res.json();
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data.narratives)
          ? data.narratives
          : Object.values(data);

        setNarratives(list);
        setSelectedNarrative(list[0] ?? null);
      } catch (err) {
        console.error("Error fetching narratives:", err);
      }
    }

    fetchNarratives();
  }, []);

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl text-black font-semibold"></h1>
        <p className="text-black mt-1"></p>
      </div>

      <div className="max-w-2xl">

        <div className="bg-white rounded-lg border border-gray-200 p-6">

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-purple-600"/>
            <div>
              <h2 className="font-semibold text-lg text-black">
                Trending Narratives
              </h2>
              <p className="text-black text-sm">
                Patterns of claims across videos
              </p>
            </div>
          </div>

          <ul className="space-y-3">

            {narratives.map((narrative) => (

              <li key={narrative.narrative_id}>
                <Link
                    href={`/narratives/${narrative.narrative_id}`}
                    className="block p-3 rounded-lg hover:bg-gray-50"
                >
                    <span className="text-gray-800 font-medium">
                      {narrative.narrative_text}
                    </span>

                    <p className="text-sm text-gray-500">
                      {narrative.claim_count} claims
                    </p>
                </Link>
              </li>

            ))}

          </ul>

        </div>
      </div>

    </div>
  );
}