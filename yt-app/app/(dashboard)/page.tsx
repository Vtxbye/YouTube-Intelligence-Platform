'use client';

import { useState } from "react";
import { TrendingUp } from 'lucide-react';
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
import Link from 'next/link';
import { videos } from "@/app/data/videos";

const trendingTopics = [
  {
    name: 'Exercise Routine',
    color: '#3b82f6',
    description: 'Structured physical activity to improve fitness and overall health.',
    slug: 'exercise-routine'
  },
  {
    name: 'Mental Health',
    color: '#10b981',
    description: 'Emotional wellbeing, mood regulation, and cognitive function.',
    slug: 'mental-health'
  },
  {
    name: 'Stress Management',
    color: '#f97316',
    description: 'Techniques for reducing physical and psychological stress.',
    slug: 'stress-management'
  },
  {
    name: 'Sleep Hygiene',
    color: '#ef4444',
    description: 'Habits that improve sleep quality and recovery.',
    slug: 'sleep-hygiene'
  },
  {
    name: 'Healthy Diet',
    color: '#6366f1',
    description: 'Balanced eating patterns that support overall health.',
    slug: 'healthy-diet'
  },
  {
    name: 'Nutrition Tips',
    color: '#ec4899',
    description: 'Nutrients and dietary strategies that support body function.',
    slug: 'nutrition-tips'
  },
  {
    name: 'Weight Loss Tips',
    color: '#eab308',
    description: 'Strategies for reducing body fat and improving metabolism.',
    slug: 'weight-loss-tips'
  },
  {
    name: 'Gut Health',
    color: '#14b8a6',
    description: 'Digestive health and microbiome balance.',
    slug: 'gut-health'
  },
  {
    name: 'Immune System',
    color: '#8b5cf6',
    description: 'Supporting the body’s ability to fight illness.',
    slug: 'immune-system'
  },
  {
    name: 'Wellness Habits',
    color: '#06b6d4',
    description: 'Daily behaviors that support long-term health.',
    slug: 'wellness-habits'
  },
];

const revenueData = [
  {
    month: 'Jan',
    'Exercise Routine': 4200,
    'Mental Health': 3000,
    'Stress Management': 2600,
    'Sleep Hygiene': 2000,
    'Healthy Diet': 3400,
    'Nutrition Tips': 2800,
    'Weight Loss Tips': 3600,
    'Gut Health': 2500,
    'Immune System': 3000,
    'Wellness Habits': 2700,
  },
  {
    month: 'Feb',
    'Exercise Routine': 5000,
    'Mental Health': 3200,
    'Stress Management': 2700,
    'Sleep Hygiene': 2100,
    'Healthy Diet': 3600,
    'Nutrition Tips': 3000,
    'Weight Loss Tips': 3900,
    'Gut Health': 2600,
    'Immune System': 3200,
    'Wellness Habits': 2800,
  },
  {
    month: 'Mar',
    'Exercise Routine': 4800,
    'Mental Health': 3100,
    'Stress Management': 2650,
    'Sleep Hygiene': 2050,
    'Healthy Diet': 3550,
    'Nutrition Tips': 2950,
    'Weight Loss Tips': 3800,
    'Gut Health': 2550,
    'Immune System': 3150,
    'Wellness Habits': 2750,
  },
  {
    month: 'Apr',
    'Exercise Routine': 6200,
    'Mental Health': 3500,
    'Stress Management': 2900,
    'Sleep Hygiene': 2300,
    'Healthy Diet': 4000,
    'Nutrition Tips': 3300,
    'Weight Loss Tips': 4300,
    'Gut Health': 2900,
    'Immune System': 3500,
    'Wellness Habits': 3100,
  },
  {
    month: 'May',
    'Exercise Routine': 7000,
    'Mental Health': 3700,
    'Stress Management': 3000,
    'Sleep Hygiene': 2500,
    'Healthy Diet': 4300,
    'Nutrition Tips': 3600,
    'Weight Loss Tips': 4700,
    'Gut Health': 3100,
    'Immune System': 3800,
    'Wellness Habits': 3400,
  },
];

export default function Page() {

  const [selectedTopics, setSelectedTopics] = useState([
    "Exercise Routine",
    "Mental Health"
  ]);

  const [dropdownOpen, setDropdownOpen] = useState(false);

  const toggleTopic = (topic: string) => {
    setSelectedTopics(prev =>
      prev.includes(topic)
        ? prev.filter(t => t !== topic)
        : [...prev, topic]
    );
  };

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-2xl text-black font-semibold">Dashboard Overview</h1>
        <p className="text-black mt-1">Welcome back! Here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-2 gap-6">

        {/* Trending Topics */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">

          <div className="flex items-center gap-3 mb-6">
            <TrendingUp className="text-purple-600"/>
            <div>
              <h2 className="font-semibold text-lg text-black">Trending Topics</h2>
              <p className="text-black text-sm">Controversial & experimental health topics</p>
            </div>
          </div>

          <ul className="space-y-3">
            {trendingTopics.map(topic => (
              <li key={topic.name}>
                <Link
                  href={`/topic/${topic.slug}`}
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50"
                >

                  <div
                    className="w-2 h-2 rounded-full mt-2"
                    style={{ backgroundColor: topic.color }}
                  />

                  <div>
                    <span className="text-gray-700 font-medium">{topic.name}</span>
                    <p className="text-gray-500 text-sm">{topic.description}</p>
                  </div>

                </Link>
              </li>
            ))}
          </ul>

        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">

          <div className="flex justify-between mb-4">

            <h3 className="font-semibold text-black">Topics over time</h3>

            <div className="relative">

              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="bg-gray-700 px-3 py-1 rounded text-sm"
              >
                Select Topics
              </button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-2 bg-white border rounded shadow p-3 space-y-2 z-50">

                  {trendingTopics.map(topic => (

                    <label key={topic.name} className="flex items-center gap-2 text-sm text-gray-900 font-medium hover:bg-gray-100 px-2 py-1 rounded cursor-pointer">

                      <input
                        type="checkbox"
                        checked={selectedTopics.includes(topic.name)}
                        onChange={() => toggleTopic(topic.name)}
                      />

                      {topic.name}

                    </label>

                  ))}

                </div>
              )}

            </div>

          </div>

          <ResponsiveContainer width="100%" height={300}>

            <LineChart data={revenueData}>

              <CartesianGrid strokeDasharray="3 3"/>

              <XAxis dataKey="month"/>

              <YAxis/>

              <Tooltip/>

              <Legend/>

              {trendingTopics
                .filter(topic => selectedTopics.includes(topic.name))
                .map(topic => (

                  <Line
                    key={topic.name}
                    type="monotone"
                    dataKey={topic.name}
                    stroke={topic.color}
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
