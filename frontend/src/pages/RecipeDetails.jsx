import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { RECIPES } from "../api/mockData.js";

import StarDisplay from "../components/StarDisplay.jsx";
import StarRatingInput from "../components/StarRatingInput.jsx";

import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  X,
  MessageSquareText,
  Clock,
  Leaf,
  ListChecks,
} from "lucide-react";
import useEmblaCarousel from "embla-carousel-react";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";

function formatDate(iso) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

function normalizeImages(images) {
  if (!Array.isArray(images)) return [];
  return images.map((x) => (typeof x === "string" ? x : x?.dataUrl)).filter(Boolean);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

export default function RecipeDetails() {
  const { id } = useParams();
  const recipe = RECIPES.find((r) => String(r.id) === String(id));

  // mock user (dok nema auth)
  const userId = "demo";
  const authorName = "Demo User";

  // =========================
  // Local reviews store (frontend-only)
  // =========================
  const REV_KEY = "rf_reviews_v1"; // object: { [recipeId]: Review[] }

  const [reviews, setReviews] = useState([]);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [tempRating, setTempRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [submitError, setSubmitError] = useState("");

  const reviewsRef = useRef(null);

  function loadReviews(recipeId) {
    try {
      const raw = localStorage.getItem(REV_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      const list = obj?.[String(recipeId)];
      return Array.isArray(list) ? list : [];
    } catch {
      return [];
    }
  }

  function saveReviews(recipeId, nextList) {
    try {
      const raw = localStorage.getItem(REV_KEY);
      const obj = raw ? JSON.parse(raw) : {};
      const nextObj = { ...(obj || {}), [String(recipeId)]: nextList };
      localStorage.setItem(REV_KEY, JSON.stringify(nextObj));
    } catch {
      // ignore
    }
  }

  useEffect(() => {
    if (!id) return;
    setReviews(loadReviews(id));
  }, [id]);

  const { avg, count } = useMemo(() => {
    const c = reviews.length;
    if (c === 0) return { avg: 0, count: 0 };
    const sum = reviews.reduce((acc, r) => acc + (Number(r.rating) || 0), 0);
    return { avg: sum / c, count: c };
  }, [reviews]);

  const avgText = useMemo(() => avg.toFixed(1), [avg]);

  const myExistingReview = useMemo(() => {
    return reviews.find((r) => r.userId === userId) || null;
  }, [reviews, userId]);

  useEffect(() => {
    if (!reviewModalOpen) return;
    setTempRating(myExistingReview?.rating || 0);
    setCommentText(myExistingReview?.text || "");
    setSubmitError("");
  }, [reviewModalOpen, myExistingReview]);

  useEffect(() => {
    if (!reviewModalOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setReviewModalOpen(false);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [reviewModalOpen]);

  function openReviewModal() {
    setReviewModalOpen(true);
  }

  function submitReview(e) {
    e.preventDefault();
    setSubmitError("");

    const rating = clamp(Number(tempRating) || 0, 0, 5);
    const text = String(commentText || "").trim();

    if (rating < 1 || rating > 5) {
      setSubmitError("Odaberi ocjenu (1–5 zvjezdica).");
      return;
    }

    const now = new Date().toISOString();
    const next = [...reviews];
    const idx = next.findIndex((r) => r.userId === userId);

    if (idx >= 0) {
      next[idx] = { ...next[idx], rating, text, updatedAt: now };
    } else {
      next.unshift({
        id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
        recipeId: String(id),
        userId,
        author: authorName,
        rating,
        text,
        createdAt: now,
        updatedAt: now,
      });
    }

    setReviews(next);
    saveReviews(id, next);

    setReviewModalOpen(false);
    setTimeout(() => reviewsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  // =========================
  // Gallery
  // =========================
  const images = useMemo(() => normalizeImages(recipe?.images), [recipe]);
  const slides = useMemo(() => images.map((src) => ({ src })), [images]);

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;

    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);

    return () => {
      emblaApi.off("select", onSelect);
    };
  }, [emblaApi]);

  const canScroll = images.length > 1;

  function scrollPrev() {
    emblaApi?.scrollPrev();
  }
  function scrollNext() {
    emblaApi?.scrollNext();
  }
  function scrollTo(i) {
    emblaApi?.scrollTo(i);
  }

  // Lightbox
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  function openLightbox(i) {
    setLightboxIndex(i);
    setLightboxOpen(true);
  }

  // =========================
  // Favorites (mock localStorage)
  // =========================
  const FAV_KEY = "rf_favorites";
  const [isFav, setIsFav] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      setIsFav(Array.isArray(arr) && arr.map(String).includes(String(id)));
    } catch {
      setIsFav(false);
    }
  }, [id]);

  function toggleFav() {
    try {
      const raw = localStorage.getItem(FAV_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      const list = Array.isArray(arr) ? arr.map(String) : [];
      const sid = String(id);

      const next = list.includes(sid) ? list.filter((x) => x !== sid) : [sid, ...list];
      localStorage.setItem(FAV_KEY, JSON.stringify(next));
      setIsFav(next.includes(sid));
    } catch {
      // ignore
    }
  }

  // =========================
  // UI tokens (design system-ish)
  // =========================
  const card =
    "rounded-2xl border border-white/60 bg-white/90 shadow-[0_18px_45px_rgba(2,6,23,0.14)] backdrop-blur-md";
  const softCard = "rounded-xl border border-white/60 bg-white/75 backdrop-blur";
  const btn =
    "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2";
  const btnSecondary =
    `${btn} bg-white/80 text-slate-900 ring-1 ring-black/5 hover:bg-white focus-visible:ring-slate-400/30 focus-visible:ring-offset-white/60`;

  if (!recipe) {
    return (
      <div className={`${card} p-6`}>
        <h2 className="text-xl font-extrabold text-slate-900">Recipe not found</h2>
        <Link to="/" className="text-white mt-4 inline-block text-sm font-semibold text-slate-700 hover:underline">
          ← Back to Home
        </Link>
      </div>
    );
  }

  const categories = Array.isArray(recipe.categories) ? recipe.categories : [];

  return (
    <motion.div
      className="relative"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <div className="space-y-6 p-4 sm:p-6">
        {/* HERO: Summary (left) + Gallery (right) */}
        <div className="grid items-stretch gap-6 lg:grid-cols-12">
          {/* Summary */}
          <motion.aside
            className="lg:col-span-5 lg:order-1"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.06 }}
          >
            <div className={`${card} relative h-full overflow-hidden p-6`}>
              {/* accent strip */}
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-600 via-rose-600 to-emerald-600" />

              <div className="flex h-full flex-col pt-1">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-3">
                      <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
                        {recipe.title}
                      </h1>

                      <div className="flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 ring-1 ring-black/5">
                        <StarDisplay value={avg} />
                        <span className="text-sm font-extrabold text-slate-900">{avgText}</span>
                        <span className="text-xs font-semibold text-slate-600">({count})</span>
                      </div>
                    </div>

                    <p className="mt-2 text-sm leading-relaxed text-slate-700">
                      {recipe.description}
                    </p>

                    {categories.length > 0 && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        {categories.map((c) => (
                          <span
                            key={c}
                            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200/60 bg-emerald-50/70 px-3 py-1 text-xs font-bold text-emerald-900"
                          >
                            <Leaf className="h-3.5 w-3.5 text-emerald-700" />
                            {c}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="mt-3 text-xs font-semibold text-slate-600">By {recipe.author}</p>
                  </div>

                  <span className="shrink-0 inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/85 px-3 py-1 text-xs font-extrabold text-slate-800 ring-1 ring-black/5">
                    <Clock className="h-3.5 w-3.5" />
                    {recipe.prepTime} min
                  </span>
                </div>

                <div className="mt-auto pt-6">
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className={`${btn} bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-sm hover:shadow-md focus-visible:ring-rose-500/40 focus-visible:ring-offset-white/60`}
                      onClick={openReviewModal}
                    >
                      Leave a review
                    </button>

                    <button
                      type="button"
                      onClick={toggleFav}
                      className={
                        isFav
                          ? `${btn} border border-emerald-300/60 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-sm hover:shadow-md focus-visible:ring-emerald-500/40 focus-visible:ring-offset-white/60`
                          : `${btnSecondary} focus-visible:ring-emerald-500/25`
                      }
                    >
                      <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                      {isFav ? "Favorited" : "Favorite"}
                    </button>

                    <button
                      type="button"
                      onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
                      className={`${btnSecondary} focus-visible:ring-slate-400/30`}
                    >
                      <MessageSquareText className="h-4 w-4" />
                      Reviews
                    </button>
                  </div>

                  {myExistingReview && (
                    <div className={`${softCard} mt-4 p-4 ring-1 ring-black/5`}>
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-extrabold text-slate-900">Your review</span>
                        <span className="text-xs font-semibold text-slate-600">
                          {formatDate(myExistingReview.updatedAt || myExistingReview.createdAt)}
                        </span>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <StarDisplay value={myExistingReview.rating} />
                        <span className="text-sm font-extrabold text-slate-900">
                          {Number(myExistingReview.rating).toFixed(1)}
                        </span>
                      </div>
                      {myExistingReview.text?.trim() && (
                        <p className="mt-2 whitespace-pre-wrap text-sm text-slate-800">
                          {myExistingReview.text}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.aside>

          {/* Gallery */}
          <motion.section
            className="lg:col-span-7 lg:order-2"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.08 }}
          >
            <div className={`${card} h-full overflow-hidden`}>
              <div className="relative">
                {images.length > 0 ? (
                  <div className="relative overflow-hidden bg-slate-950">
                    <div ref={emblaRef} className="overflow-hidden">
                      <div className="flex">
                        {images.map((src, idx) => (
                          <button
                            key={`${src}-${idx}`}
                            type="button"
                            onClick={() => openLightbox(idx)}
                            className="relative min-w-0 flex-[0_0_100%] cursor-zoom-in"
                            title="Open full screen"
                          >
                            <img
                              src={src}
                              alt={`Recipe photo ${idx + 1}`}
                              className="h-64 w-full object-cover sm:h-80"
                            />
                            <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                          </button>
                        ))}
                      </div>
                    </div>

                    {canScroll && (
                      <>
                        <button
                          type="button"
                          onClick={scrollPrev}
                          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-sm ring-1 ring-black/10 transition hover:bg-white hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          title="Previous"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          type="button"
                          onClick={scrollNext}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-sm ring-1 ring-black/10 transition hover:bg-white hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                          title="Next"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </>
                    )}

                    {canScroll && (
                      <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/35 px-3 py-2 backdrop-blur-sm">
                        {images.map((_, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => scrollTo(idx)}
                            className={`h-2 w-2 rounded-full transition ${
                              idx === selectedIndex ? "bg-white" : "bg-white/55 hover:bg-white/85"
                            }`}
                            title={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex h-64 items-center justify-center bg-white/70 text-sm font-semibold text-slate-700 sm:h-80">
                    No photos yet.
                  </div>
                )}
              </div>

              <div className="border-t border-white/70 bg-white/85 p-4">
                {images.length > 0 ? (
                  <div className="flex gap-3 overflow-x-auto pb-1">
                    {images.map((src, idx) => (
                      <button
                        key={`${src}-${idx}`}
                        type="button"
                        onClick={() => scrollTo(idx)}
                        className={`shrink-0 overflow-hidden rounded-xl border border-white/70 ring-1 ring-black/5 transition ${
                          idx === selectedIndex
                            ? "ring-2 ring-amber-500/35 shadow-sm"
                            : "hover:shadow-sm"
                        }`}
                        title={`Go to image ${idx + 1}`}
                      >
                        <img src={src} alt="" className="h-16 w-24 object-cover" />
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm font-semibold text-slate-700">
                    Add images to the recipe to see them here.
                  </p>
                )}
              </div>
            </div>
          </motion.section>
        </div>

        {/* Ingredients + Steps */}
        <div className="grid gap-6 lg:grid-cols-2">
          <motion.section
            className={`${card} p-6`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.1 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Ingredients</h3>
              <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-900 ring-1 ring-emerald-500/15">
                {recipe.ingredients.length} items
              </span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-slate-800">
              {recipe.ingredients.map((ing) => (
                <li key={ing} className="flex items-start gap-2">
                  <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
                  <span className="leading-relaxed">{ing}</span>
                </li>
              ))}
            </ul>
          </motion.section>

          <motion.section
            className={`${card} p-6`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.12 }}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Steps</h3>
              <span className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-950 ring-1 ring-amber-500/15">
                <ListChecks className="h-4 w-4" />
                {recipe.steps.length} steps
              </span>
            </div>
            <ol className="mt-4 space-y-3 text-sm text-slate-800">
              {recipe.steps.map((s, idx) => (
                <li key={idx} className="flex gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-rose-600 text-xs font-extrabold text-white shadow-sm">
                    {idx + 1}
                  </span>
                  <span className="leading-relaxed">{s}</span>
                </li>
              ))}
            </ol>
          </motion.section>
        </div>

        {/* Reviews list */}
        <motion.section
          ref={reviewsRef}
          className={`${card} p-6`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.14 }}
        >
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Reviews</h3>
              <p className="mt-1 text-sm font-semibold text-slate-700">
                <span className="font-extrabold text-slate-900">{avgText}</span> / 5 · {count} reviews
              </p>
            </div>

            <button type="button" className={btnSecondary} onClick={openReviewModal}>
              Leave a review
            </button>
          </div>

          <div className="mt-6 space-y-3">
            {reviews.length === 0 && (
              <div className={`${softCard} p-4 text-sm font-semibold text-slate-700 ring-1 ring-black/5`}>
                No reviews yet.
              </div>
            )}

            {reviews.map((r) => (
              <div
                key={r.id}
                className={`${softCard} p-4 ring-1 ring-black/5 transition hover:-translate-y-0.5 hover:shadow-sm`}
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <p className="text-sm font-extrabold text-slate-900">{r.author}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <StarDisplay value={r.rating} />
                      <span className="text-sm font-extrabold text-slate-900">
                        {Number(r.rating).toFixed(1)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs font-semibold text-slate-600">
                    {formatDate(r.updatedAt || r.createdAt)}
                  </p>
                </div>

                {String(r.text || "").trim().length > 0 ? (
                  <p className="mt-3 whitespace-pre-wrap text-sm text-slate-800">{r.text}</p>
                ) : (
                  <p className="mt-3 text-sm font-semibold text-slate-600">No comment.</p>
                )}
              </div>
            ))}
          </div>
        </motion.section>

        <Link to="/" className="text-white inline-flex items-center gap-2 text-sm font-extrabold text-slate-800 hover:underline">
          ← Back to Home
        </Link>

        {/* Review modal */}
        <AnimatePresence>
          {reviewModalOpen && (
            <motion.div
              className="fixed inset-0 z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Backdrop */}
              <div
                className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
                onClick={() => setReviewModalOpen(false)}
              />

              {/* Panel */}
              <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center p-4">
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  className="w-full overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-[0_26px_70px_rgba(2,6,23,0.25)] backdrop-blur-md"
                  initial={{ opacity: 0, y: 12, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 12, scale: 0.98 }}
                  transition={{ duration: 0.18 }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="relative border-b border-white/60 p-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/12 via-rose-500/12 to-emerald-500/12" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <h4 className="text-lg font-extrabold text-slate-900">Leave a review</h4>
                        <p className="mt-1 text-sm font-semibold text-slate-700">
                          Rate <span className="font-extrabold">{recipe.title}</span> (comment optional)
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setReviewModalOpen(false)}
                        className="rounded-xl bg-white/80 p-2 shadow-sm ring-1 ring-black/10 transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
                        title="Close"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <form onSubmit={submitReview} className="p-5">
                    <p className="text-sm font-extrabold text-slate-900">Your rating</p>
                    <div className="mt-2">
                      <StarRatingInput value={tempRating} onChange={setTempRating} />
                    </div>

                    <label className="mt-4 block text-sm font-extrabold text-slate-900">
                      Comment (optional)
                    </label>
                    
                    <textarea
                      className="mt-1 w-full rounded-xl border border-white/70 bg-white/85 px-4 py-2 text-sm text-slate-900 outline-none placeholder:text-slate-500 ring-1 ring-black/5 focus-visible:ring-2 focus-visible:ring-rose-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60"
                      rows={4}
                      placeholder="Write your comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                    />

                    {submitError && (
                      <p className="mt-2 text-sm font-extrabold text-rose-600">{submitError}</p>
                    )}

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-semibold text-slate-600">Stored locally (no backend yet).</p>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          className={btnSecondary}
                          onClick={() => setReviewModalOpen(false)}
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className={`${btn} bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-sm hover:shadow-md focus-visible:ring-rose-500/40 focus-visible:ring-offset-white/60`}
                        >
                          Submit
                        </button>
                      </div>
                    </div>
                  </form>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Lightbox */}
        <Lightbox
          open={lightboxOpen}
          close={() => setLightboxOpen(false)}
          slides={slides}
          index={lightboxIndex}
          on={{ view: ({ index }) => setLightboxIndex(index) }}
          render={{
            buttonPrev: canScroll ? undefined : () => null,
            buttonNext: canScroll ? undefined : () => null,
          }}
        />
      </div>
    </motion.div>
  );
}
