export default function StarRatingInput({ value = 0, onChange }) {
  const v = Number(value) || 0;

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((s) => {
        const active = s <= v;

        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange?.(s)}
            className="rounded-md p-1 transition hover:bg-gray-100"
            aria-label={`Rate ${s} stars`}
            title={`${s}/5`}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-7 w-7 ${active ? "text-amber-500" : "text-gray-300"}`}
              fill="currentColor"
            >
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
            </svg>
          </button>
        );
      })}
    </div>
  );
}
