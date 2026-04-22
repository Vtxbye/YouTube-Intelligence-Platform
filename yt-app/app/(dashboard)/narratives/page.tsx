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

type Narrative = {
  narrative_id: number;
  narrative_text: string;
  claim_count: number;
};

type NarrativeTrendRow = {
  narrative_id: number;
  narrative_text: string;
  claim_date: string;
  claims_on_date: number;
  claims_7d_avg: number;
};

type NarrativeWithMeta = Narrative & {
  color: string;
  chart_label: string;
};

const narrativeColors = [
  '#3b82f6', '#10b981', '#f97316', '#ef4444',
  '#6366f1', '#ec4899', '#eab308', '#14b8a6',
  '#8b5cf6', '#06b6d4', '#84cc16', '#f43f5e',
];

export default function Page() {
  const [narratives, setNarratives] = useState<NarrativeWithMeta[]>([]);
  const [trends, setTrends] = useState<NarrativeTrendRow[]>([]);
  const [selectedNarratives, setSelectedNarratives] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [narrativesRes, trendsRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/narratives`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/narratives-trends`)
        ]);

        const narrativesData: Narrative[] = await narrativesRes.json();
        const trendsData: NarrativeTrendRow[] = await trendsRes.json();

        const filtered = narrativesData
          .filter(n => n.claim_count > 0)
          .map((n, index) => ({
            ...n,
            color: narrativeColors[index % narrativeColors.length],
            chart_label: `N${index + 1}`
          }));

        setNarratives(filtered);
        setTrends(trendsData);

        setSelectedNarratives(filtered.slice(0, 5).map(n => n.chart_label));
      } catch (err) {
        console.error("Error fetching narrative data:", err);
      }
    }

    fetchData();
  }, []);

  const toggleNarrative = (label: string) => {
    setSelectedNarratives(prev =>
      prev.includes(label)
        ? prev.filter(x => x !== label)
        : [...prev, label]
    );
  };

  const graphData = useMemo(() => {
    const idToLabel = new Map(
      narratives.map(n => [n.narrative_id, n.chart_label])
    );

    const monthMap = new Map<string, Record<string, number>>();

    trends.forEach(row => {
      const label = idToLabel.get(row.narrative_id);
      if (!label) return;

      const date = new Date(row.claim_date);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, { month: parseInt(key) });
      }

      const bucket = monthMap.get(key)!;
      bucket[label] = (bucket[label] || 0) + row.claims_on_date;
    });

    const sortedKeys = Array.from(monthMap.keys()).sort();

    return sortedKeys.map(key => {
      const [year, month] = key.split('-');
      const date = new Date(Number(year), Number(month) - 1);

      return {
        ...monthMap.get(key)!,
        month: date.toLocaleString('en-US', { month: 'short', year: 'numeric' })
      };
    });
  }, [narratives, trends]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-black font-semibold">Narratives</h1>
        <p className="text-black mt-1">
          Narrative clusters and their activity over time.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-purple-600" />
            <div>
              <h2 className="font-semibold text-lg text-black">Trending Narratives</h2>
              <p className="text-black text-sm">Narratives with active claims</p>
            </div>
          </div>

          <ul className="space-y-3">
            {narratives.map(n => (
              <li key={n.narrative_id}>
                <Link
                  href={`/narratives/${n.narrative_id}`}
                  className="block p-3 rounded-lg hover:bg-gray-50"
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="w-2 h-2 rounded-full mt-2 shrink-0"
                      style={{ backgroundColor: n.color }}
                    />

                    <div>
                      <span className="text-gray-800 font-medium">
                        {n.narrative_text}
                      </span>
                      <p className="text-sm text-gray-500 mt-1">
                        {n.claim_count} {n.claim_count === 1 ? "claim" : "claims"}
                      </p>
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
                  {narratives.map(n => (
                    <label
                      key={n.narrative_id}
                      className="flex items-center gap-2 text-sm text-gray-900 font-medium hover:bg-gray-100 px-2 py-1 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedNarratives.includes(n.chart_label)}
                        onChange={() => toggleNarrative(n.chart_label)}
                      />

                      <span
                        className="w-2 h-2 rounded-full inline-block"
                        style={{ backgroundColor: n.color }}
                      />

                      <span className="font-semibold">{n.chart_label}</span>
                      <span className="text-gray-500 ml-1 line-clamp-1">
                        — {n.narrative_text}
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
                .filter(n => selectedNarratives.includes(n.chart_label))
                .map(n => (
                  <Line
                    key={n.narrative_id}
                    type="monotone"
                    dataKey={n.chart_label}
                    stroke={n.color}
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