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
            Health claims, narratives, and video trends in one place
          </p>

          <h1 className="text-5xl font-bold tracking-tight text-gray-950">
            Understand Health Narratives on YouTube
          </h1>

          <p className="mt-6 text-lg text-gray-600">
            Analyze videos, uncover claims, and track how health topics spread
            across YouTube content.
          </p>

          <div className="mt-8 flex justify-center gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-3 text-white hover:bg-black"
            >
              Explore Dashboard
              <ArrowRight className="h-4 w-4" />
            </Link>

            <Link
              href="/narratives"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-gray-900 hover:bg-gray-100"
            >
              View Narratives
            </Link>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="mb-10">
          <h2 className="text-3xl font-bold">What the platform does</h2>
          <p className="mt-2 text-gray-600">
            A dashboard for exploring health videos, claims, and trends.
          </p>

          <p className="mt-3 text-gray-600 leading-relaxed">
            The YouTube Intelligence Platform helps you break down health content at scale.
            Instead of manually watching hours of videos, the platform groups 100s of videos into overall narratives, 
            extracts claims from those videos, analyzes the how the videos are recieved based on comments
            , and tracks how ideas spread across YouTube.
        </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <FeatureCard
            icon={<PlayCircle />}
            title="Video Analysis"
            text="Browse YouTube videos with channel, views, date, and duration."
          />
          <FeatureCard
            icon={<FileText />}
            title="Claim Extraction"
            text="See summarized claims connected to each video."
          />
          <FeatureCard
            icon={<Brain />}
            title="Narrative Clustering"
            text="Group similar claims into broader health narratives."
          />
          <FeatureCard
            icon={<TrendingUp />}
            title="Trend Tracking"
            text="Visualize how narratives change over time."
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
                Quickly move between videos, claims, narratives, and trends.
              </p>
            </div>

            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border bg-gray-50 p-5">
              <div className="mb-4 flex items-center gap-2">
                <Search className="h-5 w-5 text-gray-500" />
                <span className="text-sm text-gray-500">Search videos and claims</span>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold">
                  Browse videos by newest, oldest, or most popular
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  Each video card includes metadata and expandable claims.
                </p>
              </div>
            </div>

            <div className="rounded-xl border bg-gray-50 p-5">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="font-semibold">Narratives over time</h3>
                <div className="mt-4 h-48 rounded-lg border border-dashed border-gray-300 flex items-center justify-center text-gray-400">
                  Chart Preview
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
            Health information online spreads quickly. This platform helps users
            identify recurring claims, compare videos, and better understand how
            health narratives develop across content.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h2 className="text-3xl font-bold">Start exploring the data</h2>
        <p className="mt-3 text-gray-600">
          Go directly to the dashboard or review narrative clusters.
        </p>

        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/"
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