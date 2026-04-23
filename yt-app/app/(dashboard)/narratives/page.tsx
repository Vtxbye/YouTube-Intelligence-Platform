'use client';

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from 'lucide-react';
import Link from 'next/link';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

const API_URL = process.env.NEXT_PUBLIC_API_URL;


type Narrative = {
  narrative_id: number;
  narrative_text: string;
  claim_count: number;
};

type NarrativeClaimVideo = {
  narrative_id: number;
  video_id: string;
  video_published_at: string;
};

type NarrativeWithVideoCount = Narrative & {
  video_count: number;
  color: string;
  chart_label: string;
};

const narrativeColors = [
  '#3b82f6',
  '#10b981',
  '#f97316',
  '#ef4444',
  '#6366f1',
  '#ec4899',
  '#eab308',
  '#14b8a6',
  '#8b5cf6',
  '#06b6d4',
  '#84cc16',
  '#f43f5e',
];

export default function Page() {
  const [narratives, setNarratives] = useState<NarrativeWithVideoCount[]>([]);
  const [narrativeClaimVideoData, setNarrativeClaimVideoData] = useState<NarrativeClaimVideo[]>([]);
  const [selectedNarratives, setSelectedNarratives] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchNarratives() {
      try {

        const narrativesRes = await fetch(`${API_URL}/narratives`);

        if (!narrativesRes.ok) {
          throw new Error("Failed to fetch narratives");
        }

        const narrativesData: Narrative[] = await narrativesRes.json();

        const filteredBase = narrativesData
          .filter((narrative) => narrative.claim_count > 0)
          .map((narrative, index) => ({
            ...narrative,
            video_count: 0,
            color: narrativeColors[index % narrativeColors.length],
            chart_label: `N${index + 1}`,
          }));

        // show the narratives right away
        setNarratives(filteredBase);
        setSelectedNarratives(
          filteredBase.slice(0, 5).map((narrative) => narrative.chart_label)
        );

        const allClaimVideoRows: NarrativeClaimVideo[] = [];

        const updatedNarratives = await Promise.all(
          filteredBase.map(async (narrative) => {
            try {
              const res = await fetch(
                `${API_URL}/narrative/${narrative.narrative_id}/claims-videos`
              );

              if (!res.ok) {
                throw new Error("Failed to fetch claims-videos");
              }

              const rows: NarrativeClaimVideo[] = await res.json();
              allClaimVideoRows.push(...rows);

              const uniqueVideos = new Set(rows.map((row) => row.video_id));

              return {
                ...narrative,
                video_count: uniqueVideos.size,
              };
            } catch (err) {
              console.error(
                `Error fetching claims-videos for narrative ${narrative.narrative_id}:`,
                err
              );

              return narrative;
            }
          })
        );

        setNarratives(updatedNarratives);
        setNarrativeClaimVideoData(allClaimVideoRows);
      } catch (err) {
        console.error("Error fetching narratives:", err);
      }
    }

    fetchNarratives();
  }, []);

  const toggleNarrative = (chartLabel: string) => {
    setSelectedNarratives((prev) =>
      prev.includes(chartLabel)
        ? prev.filter((item) => item !== chartLabel)
        : [...prev, chartLabel]
    );
  };

  const graphData = useMemo(() => {
    const narrativeMap = new Map(
      narratives.map((narrative) => [narrative.narrative_id, narrative.chart_label])
    );

    const monthNarrativeVideoMap = new Map<string, Map<string, Set<string>>>();

    narrativeClaimVideoData.forEach((row) => {
      const chartLabel = narrativeMap.get(row.narrative_id);
      if (!chartLabel) return;

      const date = new Date(row.video_published_at);
      if (isNaN(date.getTime())) return;

      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const monthKey = `${year}-${month}`;

      if (!monthNarrativeVideoMap.has(monthKey)) {
        monthNarrativeVideoMap.set(monthKey, new Map());
      }

      const narrativeCounts = monthNarrativeVideoMap.get(monthKey)!;

      if (!narrativeCounts.has(chartLabel)) {
        narrativeCounts.set(chartLabel, new Set());
      }

      narrativeCounts.get(chartLabel)!.add(row.video_id);
    });

    const sortedMonths = Array.from(monthNarrativeVideoMap.keys()).sort();

    return sortedMonths.map((monthKey) => {
      const [year, month] = monthKey.split('-');
      const date = new Date(Number(year), Number(month) - 1);
      const formattedMonth = date.toLocaleString('en-US', {
        month: 'short',
        year: 'numeric',
      });

      const row: Record<string, string | number> = { month: formattedMonth };
      const narrativeCounts = monthNarrativeVideoMap.get(monthKey)!;

      narratives.forEach((narrative) => {
        row[narrative.chart_label] =
          narrativeCounts.get(narrative.chart_label)?.size || 0;
      });

      return row;
    });
  }, [narratives, narrativeClaimVideoData]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-black font-semibold">Narratives</h1>
        <p className="text-black mt-1">
          Narrative clusters and the videos connected to them.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-purple-600" />
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
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: narrative.color }}
                    />

                    <div>
                      <span className="text-gray-800 font-medium">
                        {narrative.narrative_text}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex justify-between mb-4">
            <h3 className="font-semibold text-black">Narratives over time</h3>

            <div className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
              >
                Select Narratives
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow p-3 space-y-2 z-50 max-h-72 overflow-y-auto min-w-72">
                  {narratives.map((narrative) => (
                    <label
                      key={narrative.narrative_id}
                      className="flex items-center gap-2 text-sm text-gray-900 font-medium hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNarratives.includes(narrative.chart_label)}
                        onChange={() => toggleNarrative(narrative.chart_label)}
                      />

                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: narrative.color }}
                      />

                      <span className="font-semibold">{narrative.chart_label}</span>
                      <span className="text-gray-500 ml-1 line-clamp-1">
                        — {narrative.narrative_text}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={graphData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />

              {narratives
                .filter((narrative) =>
                  selectedNarratives.includes(narrative.chart_label)
                )
                .map((narrative) => (
                  <Line
                    key={narrative.narrative_id}
                    type="monotone"
                    dataKey={narrative.chart_label}
                    stroke={narrative.color}
                    strokeWidth={2}
                  />
                ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}