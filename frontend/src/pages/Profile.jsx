import RecipeCard from "../components/RecipeCard.jsx";
import { RECIPES } from "../api/mockData.js";

export default function Profile() {
  // mock: prvi recept neka bude "moj", a druga dva favoriti (za početak)
  const myRecipes = [RECIPES[0]];
  const favorites = [RECIPES[1], RECIPES[2]];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold">My profile</h2>
        <p className="mt-1 text-sm text-gray-600">demo@user.com</p>
      </div>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">My recipes</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myRecipes.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-base font-semibold">Favorites</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {favorites.map((r) => (
            <RecipeCard key={r.id} recipe={r} />
          ))}
        </div>
      </section>
    </div>
  );
}
