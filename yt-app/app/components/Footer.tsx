import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white mt-auto">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              YouTube Intelligence Platform
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Explore health related videos with summarized claims and catagorized narratives.
            </p>
          </div>

          <div className="flex items-center gap-6 text-sm text-gray-600 flex-wrap">
            <Link href="/" className="hover:text-gray-900 transition-colors">
              Home
            </Link>

            <Link href="/claims" className="hover:text-gray-900 transition-colors">
              Dashboard
            </Link>

            <Link href="/signup" className="hover:text-gray-900 transition-colors">
              Sign Up
            </Link>

            <a
              href="mailto:karrette04@gmail.com"
              className="hover:text-gray-900 transition-colors"
            >
              Contact Us
            </a>

            <a
              href="https://github.com/KBui4/YouTube-Intelligence-Platform"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-gray-900 transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}