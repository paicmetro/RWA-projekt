export default function StarRating({ value, onChange }) {
  const stars = [1, 2, 3, 4, 5];

  return (
    <div className="flex items-center gap-1">
      {stars.map((s) => {
        const active = s <= value;
        return (
          <button
            key={s}
            type="button"
            onClick={() => onChange(s)}
            className={`h-9 w-9 rounded-lg border text-lg transition ${
              active ? "bg-black text-white" : "bg-white hover:bg-gray-50"
            }`}
            aria-label={`Rate ${s} stars`}
            title={`${s}/5`}
          >
            ★
          </button>
        );
      })}
    </div>
  );
}
