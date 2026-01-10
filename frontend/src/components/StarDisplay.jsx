function clamp(x, a, b) {
  return Math.max(a, Math.min(b, x));
}

function Star({ fill = 0 }) {
  const pct = Math.round(clamp(fill, 0, 1) * 100);

  return (
    <div className="relative h-5 w-5">
      {/* base star */}
      <svg viewBox="0 0 24 24" className="h-5 w-5 text-gray-300" fill="currentColor">
        <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
      </svg>

      {/* filled part */}
      <div className="absolute inset-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-amber-500" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      </div>
    </div>
  );
}

export default function StarDisplay({ value = 0 }) {
  const v = clamp(Number(value) || 0, 0, 5);

  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => (
        <Star key={i} fill={clamp(v - i, 0, 1)} />
      ))}
    </div>
  );
}
