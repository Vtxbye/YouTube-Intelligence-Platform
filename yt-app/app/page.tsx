import Link from "next/link";
import {
  BarChart3,
  Brain,
  FileText,
  PlayCircle,
  Search,
  TrendingUp,
  Github,
  ArrowRight,
} from "lucide-react";

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gray-50 text-gray-900">

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <p className="mb-4 inline-flex items-center rounded-full bg-purple-100 px-4 py-2 text-sm font-medium text-purple-700">
            AI‑powered insights across claims, narratives, trends, and sentiment
          </p>

          <h1 className="text-5xl font-bold tracking-tight text-gray-950">
            Understand Health Narratives on YouTube with AI
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Our platform uses advanced AI models to analyze YouTube health content at scale:
            extracting claims, mapping narratives, tracking trends, and evaluating sentiment
            across thousands of videos and comments.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/claims"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-black"
            >
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">What the platform does</h2>
          <p className="mt-2 text-gray-600">
            A dashboard for exploring AI‑generated insights from health videos, claims, narratives, and trends.
          </p>

          <p className="mt-3 text-gray-600 leading-relaxed">
            The YouTube Health Intelligence Platform uses a hybrid AI pipeline to break down
            health content at scale. Gemini extracts structured claims from video transcripts.
            Ollama cluster those videos into narratives, detect emerging themes, and analyze both video and
            comment sentiment. Instead of manually watching hours of content, you get an
            instant, AI‑generated map of what people are saying and how those ideas spread.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<PlayCircle />}
            title="Video Analysis"
            text="Browse AI‑enriched video metadata, summaries, and context."
          />
          <FeatureCard
            icon={<FileText />}
            title="AI Claim Extraction"
            text="Gemini identifies and summarizes health claims from transcripts."
          />
          <FeatureCard
            icon={<Brain />}
            title="Narrative Clustering"
            text="Ollama groups related claims and videos into evolving narratives."
          />
          <FeatureCard
            icon={<TrendingUp />}
            title="Trend Tracking"
            text="Visualize how narratives rise, fall, and shift over time."
          />
        </div>
      </section>

      {/* Preview */}
      <section className="max-w-7xl mx-auto px-6 pb-20">
        <div className="rounded-2xl border bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Dashboard Preview</h2>
              <p className="text-gray-600">
                Move seamlessly between videos, claims, narratives, and trends.
              </p>
            </div>

            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">

            {/* Example Claims Preview */}
            <div className="rounded-xl border bg-gray-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Example extracted claims</span>
              </div>

              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4 shadow-sm">

                {/* Video thumbnail placeholder */}
                <div className="h-48 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
                  Video Preview
                </div>

                {/* Video metadata */}
                <div>
                  <h3 className="font-semibold text-gray-900">
                    Cold Plunging for Better Health?
                  </h3>

                  <p className="text-sm text-gray-600">HealthHub</p>

                  <p className="text-sm text-gray-500">
                    Jan 12, 2024 • 128,492 views
                  </p>
                </div>

                {/* Claims */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Claims</h4>

                  <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                    <li>Cold plunges boost your immune system</li>
                    <li>Cold exposure increases metabolism</li>
                  </ul>

                  <div className="flex justify-center mt-3">
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Show 2 more claim(s) ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Example Narrative Chart Preview */}
            <div className="rounded-xl border bg-gray-50 p-5">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold mb-3">Narratives over time</h3>

                {/* Legend */}
                <div className="flex gap-4 text-[11px] mb-4">
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-purple-600"></span>
                    <span>Cold Plunge</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="inline-block h-2 w-2 rounded-full bg-sky-500"></span>
                    <span>Magnesium</span>
                  </div>
                </div>

                <div className="flex">
                  {/* Y-axis labels (outside the chart) */}
                  <div className="mr-3 flex flex-col justify-between text-[10px] text-gray-500 py-2">
                    <span>20</span>
                    <span>15</span>
                    <span>10</span>
                    <span>5</span>
                    <span>0</span>
                  </div>

                  {/* Chart box */}
                  <div className="flex-1 flex flex-col">
                    <div className="relative h-64 w-full border border-dashed border-gray-300 rounded overflow-hidden bg-white">

                      {/* Grid lines */}
                      <div className="absolute inset-0">
                        {[0, 25, 50, 75, 100].map((v) => (
                          <div
                            key={v}
                            className="border-t border-gray-200 absolute left-0 right-0"
                            style={{ top: `${v}%` }}
                          />
                        ))}
                      </div>

                      {/* Lines (up and down) */}
                      <svg className="absolute inset-0 w-full h-full">
                        {/* Cold Plunge */}
                        <polyline
                          points="0,150 60,90 120,130 180,70 240,110 300,80"
                          fill="none"
                          stroke="#7c3aed"
                          strokeWidth="2"
                        />
                        {/* Magnesium */}
                        <polyline
                          points="0,170 60,130 120,160 180,120 240,150 300,115"
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="2"
                        />
                      </svg>
                    </div>

                    {/* X-axis labels (outside the chart) */}
                    <div className="mt-3 flex justify-between text-[10px] text-gray-500 px-1">
                      <span>Jan</span>
                      <span>Feb</span>
                      <span>Mar</span>
                      <span>Apr</span>
                      <span>May</span>
                      <span>Jun</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>


          </div>
        </div>
      </section>

      {/* Why it matters */}
      <section className="bg-white border-y border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <h2 className="text-3xl font-bold">Why this matters</h2>
          <p className="mt-4 max-w-3xl text-gray-600">
            Health information online spreads quickly and not always accurately. Our plaform makes it
            possible to analyze thousands of videos at once, revealing:
          </p>

          <ul className="mt-6 max-w-3xl space-y-3 text-gray-600">
            <li>• Which health claims are most common across creators and topics</li>
            <li>• How AI‑clustered claims form larger narratives within the health ecosystem</li>
            <li>• How narratives change over time as new videos and claims appear each month</li>
            <li>• How viewers respond to videos through comment sentiment</li>
          </ul>

          <p className="mt-6 max-w-3xl text-gray-600">
            By combining claim extraction, narrative clustering, trend tracking, and sentiment analysis, the
            platform gives researchers, journalists, public health teams, and health-conscious viewers a clear view of the
            conversations shaping health beliefs online.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Start exploring the data</h2>
        <p className="mt-3 text-gray-600">
          Explore the AI‑powered dashboard or check out the open‑source repository.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/claims"
            className="rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-black"
          >
            Open Dashboard
          </Link>

          <Link
            href="https://github.com/KBui4/YouTube-Intelligence-Platform"
            target="_blank"
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 hover:bg-gray-100"
          >
            <Github className="h-4 w-4" />
            GitHub
          </Link>
        </div>
      </section>
    </main>
  );
}

function FeatureCard({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-purple-100 text-purple-700">
        {icon}
      </div>
      <h3 className="font-semibold text-gray-950">{title}</h3>
      <p className="mt-2 text-sm text-gray-600">{text}</p>
    </div>
  );
}