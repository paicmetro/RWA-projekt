import { Link } from "react-router-dom";

export default function RecipeCard({ recipe }) {
  return (
    <Link
      to={`/recipes/${recipe.id}`}
      className="block rounded-xl border bg-white p-5 shadow-sm hover:shadow-md transition"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold">{recipe.title}</h3>
          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {recipe.description}
          </p>
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
