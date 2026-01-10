import { Link } from "react-router-dom";
import StarDisplay from "./StarDisplay.jsx";
import { getRatingSummary } from "../hooks/useRatings.js";

export default function RecipeCard({ recipe }) {
  const { avg, count } = getRatingSummary(recipe.id);

  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block rounded-xl border bg-white p-5 shadow-sm transition hover:shadow-md"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-base font-semibold">{recipe.title}</h3>
          <p className="mt-1 text-sm text-gray-600">
            {recipe.description}
          </p>

          {/* rating row */}
          <div className="mt-3 flex items-center gap-2">
            <StarDisplay value={avg} />
            <span className="text-sm font-medium text-gray-800">
              {avg.toFixed(1)}
            </span>
            <span className="text-xs text-gray-500">({count})</span>
          </div>
        </div>

        <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
          {recipe.prepTime} min
        </span>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {recipe.categories.map((c) => (
          <span
            key={c}
            className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
          >
            {c}
          </span>
        ))}
      </div>
    </Link>
  );
}
