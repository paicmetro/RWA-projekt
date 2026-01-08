import { useState } from "react";
import RecipeCard from "../components/RecipeCard.jsx";
import { RECIPES } from "../api/mockData.js";

export default function Home() {
  const recipes = RECIPES;
  const [search, setSearch] = useState("");

  const filtered = recipes.filter((r) =>
    (r.title + " " + r.description).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">Find recipes</h2>
        <p className="mt-1 text-sm text-gray-600">
          Search, filter and sort will be here. For now: search works locally.
        </p>

        <input
          className="mt-4 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
          placeholder="Search by title or description..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="rounded-xl border bg-white p-6 text-sm text-gray-600">
          No recipes match your search.
        </div>
      )}
    </div>
  );
}
