"use client";

import { useRef, useState, useEffect } from "react";

export default function SplitPane({
  left,
  right,
  initialLeft = 500,
  minLeft = 300,
  minRight = 300,
}: {
  left: React.ReactNode;
  right: React.ReactNode;
  initialLeft?: number;
  minLeft?: number;
  minRight?: number;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState(initialLeft);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragging || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = e.clientX - rect.left;

      if (newWidth < minLeft) newWidth = minLeft;
      if (newWidth > rect.width - minRight) newWidth = rect.width - minRight;

      setLeftWidth(newWidth);
    }

    function onUp() {
      setDragging(false);
    }

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [dragging, minLeft, minRight]);

  return (
    <div ref={containerRef} className="flex w-full h-[80vh] overflow-hidden">
      <div style={{ width: leftWidth }} className="overflow-y-auto">
        {left}
      </div>

      <div
        className="w-2 bg-gray-300 hover:bg-gray-400 cursor-col-resize"
        onMouseDown={() => setDragging(true)}
      />

      <div className="flex-1 overflow-y-auto">
        {right}
      </div>
    </div>
  );
}