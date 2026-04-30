"use client";

import { useEffect, useMemo, useState } from "react";
import { TrendingUp } from "lucide-react";
import Link from "next/link";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { useSearch } from "@/app/utils/SearchContext";
import { highlightText } from "@/app/utils/highlightText";
import SplitPane from "@/app/components/SplitPane";

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

type NarrativeTrendRow = {
  narrative_id: number;
  claim_date: string;
  claims_on_date: number;
};

type NarrativeWithMeta = Narrative & {
  color: string;
  chart_label: string;
};

function generateColor(i: number) {
  const hue = (i * 137.508) % 360;
  return `hsl(${hue}, 65%, 50%)`;
}

export default function Page() {
  const search = useSearch();

  const [narratives, setNarratives] = useState<NarrativeWithMeta[]>([]);
  const [trends, setTrends] = useState<NarrativeTrendRow[]>([]);
  const [selectedNarratives, setSelectedNarratives] = useState<string[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [narrativesRes, trendsRes] = await Promise.all([
          fetch(`${API_URL}/narratives`),
          fetch(`${API_URL}/narratives-trends`),
        ]);

        const narrativesData: Narrative[] = await narrativesRes.json();
        const trendsData: NarrativeTrendRow[] = await trendsRes.json();

        const filtered = narrativesData
          .filter((n) => n.claim_count > 0)
          .map((n, index) => ({
            ...n,
            color: generateColor(index),
            chart_label: `N${index + 1}`,
          }));

        setNarratives(filtered);
        setTrends(trendsData);

        setSelectedNarratives(filtered.slice(0, 5).map((n) => n.chart_label));
      } catch (err) {
        console.error("Error fetching narrative data:", err);
      }
    }

    fetchData();
  }, []);

  const toggleNarrative = (label: string) => {
    setSelectedNarratives((prev) =>
      prev.includes(label)
        ? prev.filter((x) => x !== label)
        : [...prev, label]
    );
  };

  const graphData = useMemo(() => {
    const idToLabel = new Map(
      narratives.map((n) => [n.narrative_id, n.chart_label])
    );

    const monthMap = new Map<string, Record<string, number | string>>();

    trends.forEach((row) => {
      const label = idToLabel.get(row.narrative_id);
      if (!label) return;

      const date = new Date(row.claim_date);
      if (isNaN(date.getTime())) return;

      const key = `${date.getFullYear()}-${String(
        date.getMonth() + 1
      ).padStart(2, "0")}`;

      if (!monthMap.has(key)) {
        monthMap.set(key, { monthKey: key });
      }

      const bucket = monthMap.get(key)!;
      bucket[label] = (Number(bucket[label]) || 0) + row.claims_on_date;
    });

    const sortedKeys = Array.from(monthMap.keys()).sort();

    return sortedKeys.map((key) => {
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1);

      const row = { ...monthMap.get(key)! };

      narratives.forEach((n) => {
        if (row[n.chart_label] === undefined) {
          row[n.chart_label] = 0;
        }
      });

      row.month = date.toLocaleString("en-US", {
        month: "short",
        year: "numeric",
      });

      return row;
    });
  }, [narratives, trends]);

  const filteredNarratives = narratives.filter((n) =>
    n.narrative_text.toLowerCase().includes((search || "").toLowerCase())
  );

  return (
    <SplitPane
  initialLeft={520}
  left={
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="flex items-center gap-3 mb-6">
        <TrendingUp className="text-purple-600" />
        <div>
          <h2 className="font-semibold text-lg text-black">
            Narratives
          </h2>
          <p className="text-black text-sm">View narratives extracted from clustered groups of claims</p>
        </div>
      </div>

      {filteredNarratives.length === 0 && (
        <p className="text-gray-500">No narratives found</p>
      )}

      <ul className="space-y-3">
        {filteredNarratives.map((n) => (
          <li
            key={n.narrative_id}
            className={`transition-colors duration-300 ${
              highlighted === n.chart_label ? "bg-yellow-100" : ""
            }`}
          >
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
                    {highlightText(n.narrative_text, search)}
                  </span>
                  <p className="text-sm text-gray-500 mt-1">
                    {n.claim_count}{" "}
                    {n.claim_count === 1 ? "claim" : "claims"}
                  </p>
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  }
  right={
    <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
      <div className="flex justify-between mb-4">
        <h3 className="font-semibold text-black">Trends over time</h3>

        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="bg-gray-700 text-white px-3 py-1 rounded text-sm"
          >
            Select Narratives
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-2 bg-white border rounded shadow p-3 space-y-2 z-50 max-h-72 overflow-y-auto min-w-72">
              {narratives.map((n) => (
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
                </label>
              ))}
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={340}>
        <LineChart
          data={graphData}
          margin={{ top: 20, right: 30, left: 10, bottom: 40 }}
        >
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="month"
            tick={{ fontSize: 12 }}
            angle={-35}
            textAnchor="end"
            height={60}
          />

          <YAxis
            tick={{ fontSize: 12 }}
            label={{
              value: "Claims per Month",
              angle: -90,
              position: "insideLeft",
              style: {
                textAnchor: "middle",
                fill: "#555",
                fontSize: 12,
              },
            }}
          />

          <Tooltip formatter={(value, key) => [value, key]} />

          <Legend verticalAlign="top" height={40} />

          {narratives
            .filter((n) => selectedNarratives.includes(n.chart_label))
            .map((n) => (
              <Line
                key={n.narrative_id}
                type="monotone"
                dataKey={n.chart_label}
                stroke={n.color}
                strokeWidth={highlighted === n.chart_label ? 4 : 2}
                dot={false}
                activeDot={{ r: 6 }}
                onMouseEnter={() => setHighlighted(n.chart_label)}
                onMouseLeave={() => setHighlighted(null)}
                onClick={() =>
                  setHighlighted((prev) =>
                    prev === n.chart_label ? null : n.chart_label
                  )
                }
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  }
/>

  );
}
