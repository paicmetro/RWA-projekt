export default function AddRecipe() {
  return (
    <div className="rounded-xl border bg-white p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Add recipe</h2>
      <p className="mt-1 text-sm text-gray-600">
        Ovo je MVP forma (UI). Backend spajamo u Fazi 2.
      </p>

      <form className="mt-6 space-y-4">
        <div>
          <label className="text-sm font-medium">Title</label>
          <input
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="e.g. Spaghetti Bolognese"
          />
        </div>

        <div>
          <label className="text-sm font-medium">Description</label>
          <textarea
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            rows={4}
            placeholder="Short description..."
          />
        </div>

        <div>
          <label className="text-sm font-medium">Prep time (minutes)</label>
          <input
            type="number"
            className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
            placeholder="e.g. 30"
            min={1}
          />
        </div>

        <button
          type="button"
          className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
        >
          Save (mock)
        </button>
      </form>
    </div>
  );
}
