import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, Tab, Transition } from "@headlessui/react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Heart,
  ListOrdered,
  Mail,
  Pencil,
  Plus,
  Search,
  SlidersHorizontal,
  Star,
  Trash2,
  User,
  X,
} from "lucide-react";

import RecipeCard from "../components/RecipeCard.jsx";
import { RECIPES } from "../api/mockData.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

function safeJsonParse(raw, fallback) {
  try {
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function uniqById(list) {
  const seen = new Set();
  const out = [];
  for (const x of list) {
    const id = String(x?.id ?? "");
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(x);
  }
  return out;
}

function isValidEmail(s) {
  const v = String(s || "").trim();
  return v.length >= 3 && v.includes("@") && v.includes(".");
}

export default function Profile() {
  // keys
  const USER_RECIPES_KEY = "rf_user_recipes";
  const FAV_KEY = "rf_favorites";
  const REV_KEY = "rf_reviews_v1"; // { [recipeId]: Review[] }
  const PROFILE_KEY = "rf_profile_v1"; // { name, email }

  // profile (mock until auth)
  const [profile, setProfile] = useState({ name: "Demo User", email: "demo@user.com" });

  // dialog
  const [infoOpen, setInfoOpen] = useState(false);
  const [draftName, setDraftName] = useState("");
  const [draftEmail, setDraftEmail] = useState("");

  // lists
  const [favoritesIds, setFavoritesIds] = useState([]);
  const [userRecipes, setUserRecipes] = useState([]);

  // tabs + controls
  const [tabIndex, setTabIndex] = useState(0); // 0 mine, 1 favs
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("newest"); // newest | oldest | title | time
  const [favSort, setFavSort] = useState("newest");

  // load localStorage
  useEffect(() => {
    const prof = safeJsonParse(localStorage.getItem(PROFILE_KEY), null);
    if (prof?.name || prof?.email) {
      setProfile({
        name: String(prof?.name || "Demo User"),
        email: String(prof?.email || "demo@user.com"),
      });
    }

    const favArr = safeJsonParse(localStorage.getItem(FAV_KEY), []);
    setFavoritesIds(Array.isArray(favArr) ? favArr.map(String) : []);

    const mineArr = safeJsonParse(localStorage.getItem(USER_RECIPES_KEY), []);
    setUserRecipes(Array.isArray(mineArr) ? mineArr : []);
  }, []);

  // optional: mine also from mock data (demo user)
  const baseMineFromMock = useMemo(() => {
    const demo = String(profile.name || "demo user").toLowerCase();
    return RECIPES.filter((r) => String(r.author || "").toLowerCase() === demo);
  }, [profile.name]);

  const allMine = useMemo(() => uniqById([...userRecipes, ...baseMineFromMock]), [userRecipes, baseMineFromMock]);

  const allKnownRecipes = useMemo(() => uniqById([...userRecipes, ...RECIPES]), [userRecipes]);

  const favorites = useMemo(() => {
    const set = new Set(favoritesIds.map(String));
    return allKnownRecipes.filter((r) => set.has(String(r.id)));
  }, [favoritesIds, allKnownRecipes]);

  // review stats (for my recipes)
  const reviewStats = useMemo(() => {
    const obj = safeJsonParse(localStorage.getItem(REV_KEY), {});
    const recipeIds = new Set(allMine.map((r) => String(r.id)));

    let myReviewsCount = 0;
    let myAvgSum = 0;
    let myAvgN = 0;

    for (const [rid, list] of Object.entries(obj || {})) {
      if (!recipeIds.has(String(rid))) continue;
      if (!Array.isArray(list)) continue;

      myReviewsCount += list.length;
      for (const rev of list) {
        const rating = Number(rev?.rating) || 0;
        if (rating >= 1 && rating <= 5) {
          myAvgSum += rating;
          myAvgN += 1;
        }
      }
    }

    const avg = myAvgN > 0 ? myAvgSum / myAvgN : 0;

    return {
      myReviewsCount,
      myAvgRatingText: myAvgN > 0 ? avg.toFixed(1) : "—",
    };
  }, [allMine]);

  function saveFavorites(nextIds) {
    const list = nextIds.map(String);
    localStorage.setItem(FAV_KEY, JSON.stringify(list));
    setFavoritesIds(list);
  }

  function removeFavorite(recipeId) {
    const rid = String(recipeId);
    const next = favoritesIds.filter((x) => String(x) !== rid);
    saveFavorites(next);
    toast.message("Removed from favorites.");
  }

  function clearFavorites() {
    saveFavorites([]);
    toast.message("Favorites cleared.");
  }

  // filtering + sorting
  const filteredMine = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? allMine.filter((r) => {
          const title = String(r.title || "").toLowerCase();
          const desc = String(r.description || "").toLowerCase();
          const cats = Array.isArray(r.categories) ? r.categories.join(" ").toLowerCase() : "";
          return title.includes(q) || desc.includes(q) || cats.includes(q);
        })
      : allMine;

    return [...list].sort((a, b) => {
      if (sort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
      if (sort === "time") return (Number(a.prepTime) || 0) - (Number(b.prepTime) || 0);

      const ta = Date.parse(a.createdAt || "") || 0;
      const tb = Date.parse(b.createdAt || "") || 0;

      if (sort === "oldest") return ta - tb;
      return tb - ta; // newest
    });
  }, [allMine, query, sort]);

  const filteredFavs = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? favorites.filter((r) => {
          const title = String(r.title || "").toLowerCase();
          const desc = String(r.description || "").toLowerCase();
          const cats = Array.isArray(r.categories) ? r.categories.join(" ").toLowerCase() : "";
          return title.includes(q) || desc.includes(q) || cats.includes(q);
        })
      : favorites;

    return [...list].sort((a, b) => {
      if (favSort === "title") return String(a.title || "").localeCompare(String(b.title || ""));
      if (favSort === "time") return (Number(a.prepTime) || 0) - (Number(b.prepTime) || 0);

      const ta = Date.parse(a.createdAt || "") || 0;
      const tb = Date.parse(b.createdAt || "") || 0;

      if (favSort === "oldest") return ta - tb;
      return tb - ta;
    });
  }, [favorites, query, favSort]);

  const initials = useMemo(() => {
    const parts = String(profile.name || "").split(" ").filter(Boolean);
    return parts.slice(0, 2).map((p) => p[0]?.toUpperCase()).join("");
  }, [profile.name]);

  function openInfo() {
    setDraftName(profile.name);
    setDraftEmail(profile.email);
    setInfoOpen(true);
  }

  function saveInfo() {
    const name = String(draftName || "").trim();
    const email = String(draftEmail || "").trim();

    if (name.length < 2) {
      toast.error("Name is too short.");
      return;
    }
    if (!isValidEmail(email)) {
      toast.error("Enter a valid email.");
      return;
    }

    const next = { name, email };
    localStorage.setItem(PROFILE_KEY, JSON.stringify(next));
    setProfile(next);
    setInfoOpen(false);
    toast.success("Profile updated (mock).");
  }

  const activeSortValue = tabIndex === 0 ? sort : favSort;
  const setActiveSortValue = (v) => (tabIndex === 0 ? setSort(v) : setFavSort(v));

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Header card */}
      <section className="relative overflow-hidden rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-sm backdrop-blur-md">
        {/* accent strip */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500/80 via-rose-500/70 to-emerald-500/80" />

        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900/5 text-base font-extrabold text-slate-800 ring-1 ring-black/5">
              {initials || <User className="h-5 w-5" />}
            </div>

            <div className="min-w-0">
              <h2 className="text-xl font-extrabold text-slate-900">My profile</h2>
              <p className="mt-1 text-sm text-slate-600">{profile.email}</p>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  <ListOrdered className="h-4 w-4" />
                  {allMine.length} recipes
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Heart className="h-4 w-4" />
                  {favorites.length} favorites
                </span>

                <span className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700">
                  <Star className="h-4 w-4" />
                  Avg {reviewStats.myAvgRatingText} · {reviewStats.myReviewsCount} reviews
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:items-end">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={openInfo}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white"
                title="Edit profile info"
              >
                <Pencil className="h-4 w-4" />
                Information
              </button>

      
            </div>
          </div>
        </div>
      </section>

      {/* Tabs + controls in one “middle” box */}
      <Tab.Group selectedIndex={tabIndex} onChange={setTabIndex}>
        <section className="rounded-[28px] border border-white/50 bg-white/85 p-4 shadow-sm backdrop-blur-md">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Tab.List className="flex flex-wrap gap-2">
              {["My recipes", "Favorites"].map((label) => (
                <Tab
                  key={label}
                  className={({ selected }) =>
                    cx(
                      "rounded-xl px-4 py-2 text-sm font-extrabold outline-none transition",
                      selected
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-white/90 text-slate-800 hover:bg-white"
                    )
                  }
                >
                  {label}
                </Tab>
              ))}
            </Tab.List>

            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-end md:gap-3">
              {/* Search */}
              <label className="sr-only" htmlFor="profile-search">
                Search
              </label>
              <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-2 shadow-[0_1px_0_rgba(0,0,0,0.04)] md:w-[420px]">
                <Search className="h-4 w-4 text-slate-500" />
                <input
                  id="profile-search"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search recipes (title, description, tags)..."
                  className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-400"
                />
              </div>

              {/* Sort (changes with tab) */}
              <div className="flex items-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-2">
                <SlidersHorizontal className="h-4 w-4 text-slate-500" />
                <select
                  value={activeSortValue}
                  onChange={(e) => setActiveSortValue(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-slate-800 outline-none md:w-[190px]"
                >
                  <option value="newest">Sort: newest</option>
                  <option value="oldest">Sort: oldest</option>
                  <option value="title">Sort: title</option>
                  <option value="time">Sort: prep time</option>
                </select>
              </div>

              {/* Favorites extra action only when Favorites tab is active */}
              {tabIndex === 1 && (
                <button
                  type="button"
                  onClick={clearFavorites}
                  disabled={favorites.length === 0}
                  className={cx(
                    "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2 text-sm font-semibold transition",
                    favorites.length === 0
                      ? "cursor-not-allowed border-white/60 bg-white/70 text-slate-400"
                      : "border-white/70 bg-white/90 text-slate-800 hover:-translate-y-0.5 hover:bg-white"
                  )}
                  title="Clear all favorites"
                >
                  <Trash2 className="h-4 w-4" />
                  Clear
                </button>
              )}
            </div>
          </div>
        </section>

        <Tab.Panels className="mt-4">
          {/* My recipes */}
          <Tab.Panel>
            <section className="rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">My recipes</h3>
                  <p className="mt-1 text-sm text-slate-600">
                    Recipes created by <span className="font-semibold">{profile.name}</span>.
                  </p>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Showing {filteredMine.length} / {allMine.length}
                </div>
              </div>

              {filteredMine.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-6">
                  <p className="text-sm font-semibold text-slate-800">No recipes found.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Try clearing the search, or create your first recipe.
                  </p>
                  <Link
                    to="/add"
                    className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-amber-600 to-rose-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                  >
                    <Plus className="h-4 w-4" />
                    Add recipe
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredMine.map((r) => (
                    <RecipeCard key={r.id} recipe={r} />
                  ))}
                </div>
              )}
            </section>
          </Tab.Panel>

          {/* Favorites */}
          <Tab.Panel>
            <section className="rounded-[28px] border border-white/50 bg-white/85 p-6 shadow-sm backdrop-blur-md">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Favorites</h3>
                  <p className="mt-1 text-sm text-slate-600">Saved locally. Remove items anytime.</p>
                </div>
                <div className="text-sm font-semibold text-slate-700">
                  Showing {filteredFavs.length} / {favorites.length}
                </div>
              </div>

              {filteredFavs.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-white/70 bg-white/80 p-6">
                  <p className="text-sm font-semibold text-slate-800">No favorites yet.</p>
                  <p className="mt-1 text-sm text-slate-600">
                    Open a recipe and click <span className="font-semibold">Favorite</span>.
                  </p>
                  <Link to="/" className="mt-4 inline-flex text-sm font-semibold text-slate-800 hover:underline">
                    Browse recipes
                  </Link>
                </div>
              ) : (
                <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {filteredFavs.map((r) => (
                    <div key={r.id} className="space-y-2">
                      <RecipeCard recipe={r} />
                      <button
                        type="button"
                        onClick={() => removeFavorite(r.id)}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/70 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:-translate-y-0.5 hover:bg-white"
                      >
                        <Heart className="h-4 w-4" />
                        Remove from favorites
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      {/* Information dialog */}
      <Transition appear show={infoOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setInfoOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="mx-auto flex min-h-full max-w-xl items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2 scale-[0.98]"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-2 scale-[0.98]"
              >
                <Dialog.Panel className="w-full overflow-hidden rounded-2xl border bg-white shadow-xl">
                  <div className="relative">
                    <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500/80 via-rose-500/70 to-emerald-500/80" />
                    <div className="p-6">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <Dialog.Title className="text-lg font-extrabold text-slate-900">
                            Profile information
                          </Dialog.Title>
                          <p className="mt-1 text-sm text-slate-600">
                            Mock edit (stored in localStorage).
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setInfoOpen(false)}
                          className="rounded-lg border bg-white p-2 transition hover:bg-slate-50"
                          title="Close"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>

                      <div className="mt-5 grid gap-4">
                        <div>
                          <label className="text-sm font-semibold text-slate-800">Name</label>
                          <div className="mt-1 flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                            <User className="h-4 w-4 text-slate-500" />
                            <input
                              value={draftName}
                              onChange={(e) => setDraftName(e.target.value)}
                              className="w-full bg-transparent text-sm text-slate-800 outline-none"
                              placeholder="Your name"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-sm font-semibold text-slate-800">Email</label>
                          <div className="mt-1 flex items-center gap-2 rounded-xl border bg-white px-3 py-2">
                            <Mail className="h-4 w-4 text-slate-500" />
                            <input
                              value={draftEmail}
                              onChange={(e) => setDraftEmail(e.target.value)}
                              className="w-full bg-transparent text-sm text-slate-800 outline-none"
                              placeholder="you@example.com"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 border-t bg-white p-4">
                      <button
                        type="button"
                        onClick={() => setInfoOpen(false)}
                        className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={saveInfo}
                        className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:opacity-90"
                      >
                        Save changes
                      </button>
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </motion.div>
  );
}
