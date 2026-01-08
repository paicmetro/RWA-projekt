import { Link, useParams } from "react-router-dom";
import { RECIPES } from "../api/mockData.js";

export default function RecipeDetails() {
  const { id } = useParams();
  const recipe = RECIPES.find((r) => String(r.id) === String(id));

  if (!recipe) {
    return (
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Recipe not found</h2>
        <Link to="/" className="mt-4 inline-block text-sm font-medium hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{recipe.title}</h2>
            <p className="mt-2 text-sm text-gray-600">{recipe.description}</p>

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
          </div>

          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
            {recipe.prepTime} min
          </span>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            Favorite (mock)
          </button>
          <button
            type="button"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            Rate (mock)
          </button>
        </div>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold">Ingredients</h3>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
          {recipe.ingredients.map((ing) => (
            <li key={ing}>{ing}</li>
          ))}
        </ul>
      </div>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h3 className="text-base font-semibold">Steps</h3>
        <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
          {recipe.steps.map((s, idx) => (
            <li key={idx}>{s}</li>
          ))}
        </ol>
      </div>

      <Link to="/" className="text-sm font-medium hover:underline">
        ← Back to Home
      </Link>
    </div>
  );
}
