import React from 'react';

export function highlightText(text: string, search: string) {
  if (!search) return text;

  const regex = new RegExp(`(${search})`, 'gi');
  const parts = text.split(regex);

  return parts.map((part, index) =>
    part.toLowerCase() === search.toLowerCase() ? (
      <span key={index} className="bg-yellow-200 font-semibold px-1 rounded">
        {part}
      </span>
    ) : (
      part
    )
  );
}