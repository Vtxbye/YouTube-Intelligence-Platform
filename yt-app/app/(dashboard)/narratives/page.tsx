'use client';

import { useEffect, useState } from "react";
import { TrendingUp } from 'lucide-react';
import { YouTubeEmbed } from '@next/third-parties/google';
import Link from 'next/link';

export const mockNarratives = [
  {
    id: 1,
    narrative: "Exercise and mental state significantly influence physical performance and long-term metabolic health.",
    videos: [
      {
        video_id: "9GzlbLIU5dU",
        claims: [
          "Emotional state influences workout effectiveness.",
          "Neurogenesis occurs in the adult brain.",
          "Motivation affects physical endurance."
        ]
      },
      {
        video_id: "3JZ_D3ELwOQ",
        claims: [
          "Combining cardio and strength improves metabolic health.",
          "Consistency matters more than intensity.",
          "Exercise improves cognitive function."
        ]
      }
    ]
  },
  {
    id: 2,
    narrative: "Sleep and recovery are essential for hormonal balance, muscle repair, and cognitive performance.",
    videos: [
      {
        video_id: "eh0DoBsiLgU",
        claims: [
          "Sleep deprivation reduces muscle recovery.",
          "Poor sleep affects insulin sensitivity.",
          "REM sleep is critical for memory."
        ]
      },
      {
        video_id: "e-ORhEE9VVg",
        claims: [
          "Deep sleep supports brain detoxification.",
          "Irregular sleep disrupts circadian rhythm.",
          "Sleep improves reaction time."
        ]
      }
    ]
  },
  {
    id: 3,
    narrative: "Nutrition and gut health are foundational to immunity, digestion, and long-term disease prevention.",
    videos: [
      {
        video_id: "kXYiU_JCYtU",
        claims: [
          "Gut microbiome diversity impacts immune function.",
          "Fiber supports beneficial bacteria.",
          "Processed foods harm gut health."
        ]
      },
      {
        video_id: "RgKAFK5djSk",
        claims: [
          "Micronutrients are essential for energy production.",
          "Hydration affects digestion.",
          "Balanced diets reduce inflammation."
        ]
      }
    ]
  },
  {
    id: 4,
    narrative: "Stress management plays a critical role in preventing chronic disease and improving mental health.",
    videos: [
      {
        video_id: "hT_nvWreIhg",
        claims: [
          "Chronic stress elevates cortisol levels.",
          "Stress weakens immune response.",
          "Mindfulness reduces anxiety."
        ]
      },
      {
        video_id: "OPf0YbXqDm0",
        claims: [
          "Breathing exercises lower heart rate.",
          "Stress impacts digestion.",
          "Relaxation improves sleep quality."
        ]
      }
    ]
  },
  {
    id: 5,
    narrative: "Weight loss strategies vary widely, but sustainable approaches focus on consistency, nutrition, and lifestyle changes.",
    videos: [
      {
        video_id: "2Vv-BfVoq4g",
        claims: [
          "Calorie deficits drive weight loss.",
          "Crash diets are not sustainable.",
          "Protein intake supports fat loss."
        ]
      },
      {
        video_id: "JGwWNGJdvx8",
        claims: [
          "Metabolism adapts over time.",
          "Exercise alone is not enough for weight loss.",
          "Lifestyle changes improve long-term success."
        ]
      }
    ]
  },
  {
    id: 6,
    narrative: "The immune system is influenced by lifestyle factors such as diet, sleep, exercise, and stress levels.",
    videos: [
      {
        video_id: "fRh_vgS2dFE",
        claims: [
          "Sleep strengthens immune response.",
          "Nutrition impacts immune defense.",
          "Stress suppresses immunity."
        ]
      },
      {
        video_id: "ktvTqknDobU",
        claims: [
          "Exercise boosts immune surveillance.",
          "Vitamin deficiencies weaken immunity.",
          "Hydration supports cellular function."
        ]
      }
    ]
  }
];

interface ClaimVideo {
  video_id: string;
  claims: string[];
}

interface Narrative {
  id: number;
  narrative: string;
  videos: ClaimVideo[];
}

export default function Page() {

  const [narratives] = useState<Narrative[]>(mockNarratives);
  const [selectedNarrative, setSelectedNarrative] = useState<Narrative | null>(mockNarratives[0]);

//   useEffect(() => {
//     fetch('http://localhost:8000/api/narratives')
//       .then(res => res.json())
//       .then(res => {
//         console.log("API:", res);

//         // Fix your previous error here 
//         const data = Array.isArray(res)
//           ? res
//           : Array.isArray(res.narratives)
//           ? res.narratives
//           : Object.values(res);

//         setNarratives(data);
//         setSelectedNarrative(data[0]);
//       });
//   }, []);

<<<<<<< HEAD
// useEffect(() => {
//   setNarratives(mockNarratives);
//   setSelectedNarrative(mockNarratives[0]);
// }, []);
=======
useEffect(() => {
  async function fetchNarratives() {
    try {
      const res = await fetch(
        'http://localhost:8000/narratives'
      );

      const data = await res.json();

      console.log("API narratives:", data);

      setNarratives(data);
    } catch (err) {
      console.error("Error fetching narratives:", err);
    }
  }

  fetchNarratives();
}, []);
>>>>>>> cda86bf90ae0167c34f80f71620a071fca66b61d

  return (
    <div className="space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl text-black font-semibold"></h1>
        <p className="text-black mt-1">
          
        </p>
      </div>

      <div className="max-w-2xl">

        {/* LEFT: Narratives List (like Trending Topics) */}
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

            {narratives.map((narrative, index) => (

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

<<<<<<< HEAD
        {/* RIGHT: Narrative Details (like Chart Area) */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">

          {!selectedNarrative ? (
            <p className="text-gray-500">Select a narrative</p>
          ) : (
            <div className="space-y-6">

              {/* Narrative Title */}
              <div>
                <h3 className="text-xl font-semibold text-black">
                  {selectedNarrative.id}
                </h3>

                <p className="text-gray-600 mt-2">
                  {selectedNarrative.narrative}
                </p>
              </div>

              {/* Videos */}
              <div className="space-y-6">

                {selectedNarrative.videos?.map((video: ClaimVideo, i: number) => (

                  <div
                    key={i}
                    className="border rounded-lg p-4 space-y-3"
                  >

                    {/* Video */}
                    <YouTubeEmbed videoid={video.video_id} />

                    {/* Claims */}
                    <div>
                      <h4 className="font-semibold text-black mb-2">
                        Claims
                      </h4>

                      <ul className="list-disc pl-5 text-gray-700 space-y-1">

                        {video.claims?.map((claim: string, idx: number) => (
                          <li key={idx}>{claim}</li>
                        ))}

                      </ul>
                    </div>

                  </div>

                ))}

              </div>

            </div>
          )}

        </div>
=======
        
>>>>>>> cda86bf90ae0167c34f80f71620a071fca66b61d

      </div>

    </div>
  );
}