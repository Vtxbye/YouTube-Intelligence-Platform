'use client';

import Link from "next/link";
import { useEffect, useState, useRef } from "react";

export default function Header() {

  const [showHeader, setShowHeader] = useState(true);
  const lastScrollY = useRef(0);

  useEffect(() => {

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      console.log("current:", currentScrollY, "last:", lastScrollY.current);



      if (currentScrollY > lastScrollY.current && currentScrollY > 0) {
        setShowHeader(false);
      } else {
        setShowHeader(true);
      }

      lastScrollY.current = currentScrollY;
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);

  }, []);

  return (
    <header
      className={`fixed top-0 left-0 w-full bg-black text-white px-6 py-4 transition-transform duration-300 z-50 ${
        showHeader ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <div className="max-w-7xl mx-auto">
        <Link href="/home" className="text-lg font-semibold hover:opacity-80">
          YouTube Intelligence Platform
        </Link>
      </div>
    </header>
  );
}
