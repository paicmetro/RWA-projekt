import { Link, useParams } from "react-router-dom";
import { useEffect, useMemo, useRef, useState } from "react";
import { RECIPES } from "../api/mockData.js";

import StarDisplay from "../components/StarDisplay.jsx";
import StarRatingInput from "../components/StarRatingInput.jsx";

import { motion, AnimatePresence } from "framer-motion";
import { Heart, ChevronLeft, ChevronRight, X, MessageSquareText } from "lucide-react";
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
  // Review: { id, recipeId, userId, author, rating, text, createdAt, updatedAt }

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

  // avg + count derived from reviews list (consistent with list)
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

  // When modal opens: prefill with my existing review
  useEffect(() => {
    if (!reviewModalOpen) return;
    setTempRating(myExistingReview?.rating || 0);
    setCommentText(myExistingReview?.text || "");
    setSubmitError("");
  }, [reviewModalOpen, myExistingReview]);

  // ESC + lock scroll while modal open
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
      // update existing (one review per user in mock)
      next[idx] = {
        ...next[idx],
        rating,
        text,
        updatedAt: now,
      };
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

    // optional: scroll to reviews section after submit
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
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* HERO: Summary (left) + Gallery (right) */}
      <div className="grid items-stretch gap-6 lg:grid-cols-12">
        {/* Summary */}
        <motion.aside
          className="lg:col-span-5 lg:order-1"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.06 }}
        >
          <div className="h-full rounded-2xl border bg-white p-6 shadow-sm">
            <div className="flex h-full flex-col">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-3">
                    <h1 className="text-2xl font-bold leading-tight">{recipe.title}</h1>

                    <div className="flex items-center gap-2">
                      <StarDisplay value={avg} />
                      <span className="text-sm font-medium text-gray-800">{avgText}</span>
                      <span className="text-xs text-gray-500">({count})</span>
                    </div>
                  </div>

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

                  <p className="mt-3 text-xs text-gray-500">By {recipe.author}</p>
                </div>

                <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                  {recipe.prepTime} min
                </span>
              </div>

              <div className="mt-auto pt-6">
                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:-translate-y-0.5 hover:opacity-90"
                    onClick={openReviewModal}
                  >
                    Leave a review
                  </button>

                  <button
                    type="button"
                    onClick={toggleFav}
                    className={`inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 ${
                      isFav ? "bg-black text-white hover:opacity-90" : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
                    {isFav ? "Favorited" : "Favorite"}
                  </button>

                  <button
                    type="button"
                    onClick={() => reviewsRef.current?.scrollIntoView({ behavior: "smooth" })}
                    className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:-translate-y-0.5 hover:bg-gray-50"
                  >
                    <MessageSquareText className="h-4 w-4" />
                    Reviews
                  </button>
                </div>

                {myExistingReview && (
                  <div className="mt-4 rounded-lg border bg-gray-50 p-3 text-sm text-gray-700">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-medium">Your review</span>
                      <span className="text-xs text-gray-500">
                        {formatDate(myExistingReview.updatedAt || myExistingReview.createdAt)}
                      </span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StarDisplay value={myExistingReview.rating} />
                      <span className="text-sm font-medium">{Number(myExistingReview.rating).toFixed(1)}</span>
                    </div>
                    {myExistingReview.text?.trim() && (
                      <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">{myExistingReview.text}</p>
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
          <div className="h-full overflow-hidden rounded-2xl border bg-white shadow-sm">
            <div className="relative">
              {images.length > 0 ? (
                <div className="relative overflow-hidden bg-black">
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
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/40 to-transparent" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {canScroll && (
                    <>
                      <button
                        type="button"
                        onClick={scrollPrev}
                        className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                        title="Previous"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={scrollNext}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow transition hover:bg-white"
                        title="Next"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}

                  {canScroll && (
                    <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => scrollTo(idx)}
                          className={`h-2 w-2 rounded-full ${
                            idx === selectedIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                          }`}
                          title={`Slide ${idx + 1}`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex h-64 items-center justify-center bg-gray-50 text-sm text-gray-500 sm:h-80">
                  No photos yet.
                </div>
              )}
            </div>

            <div className="border-t bg-white p-4">
              {images.length > 0 ? (
                <div className="flex gap-3 overflow-x-auto pb-1">
                  {images.map((src, idx) => (
                    <button
                      key={`${src}-${idx}`}
                      type="button"
                      onClick={() => scrollTo(idx)}
                      className={`shrink-0 overflow-hidden rounded-lg border transition ${
                        idx === selectedIndex ? "ring-2 ring-black/15" : "hover:shadow-sm"
                      }`}
                      title={`Go to image ${idx + 1}`}
                    >
                      <img src={src} alt="" className="h-16 w-24 object-cover" />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-600">Add images to the recipe to see them here.</p>
              )}
            </div>
          </div>
        </motion.section>
      </div>

      {/* Ingredients + Steps */}
      <div className="grid gap-6 lg:grid-cols-2">
        <motion.section
          className="rounded-2xl border bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
        >
          <h3 className="text-base font-semibold">Ingredients</h3>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">
            {recipe.ingredients.map((ing) => (
              <li key={ing}>{ing}</li>
            ))}
          </ul>
        </motion.section>

        <motion.section
          className="rounded-2xl border bg-white p-6 shadow-sm"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.12 }}
        >
          <h3 className="text-base font-semibold">Steps</h3>
          <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm text-gray-700">
            {recipe.steps.map((s, idx) => (
              <li key={idx}>{s}</li>
            ))}
          </ol>
        </motion.section>
      </div>

      {/* Reviews list */}
      <motion.section
        ref={reviewsRef}
        className="rounded-2xl border bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: 0.14 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-base font-semibold">Reviews</h3>
            <p className="mt-1 text-sm text-gray-600">
              <span className="font-medium">{avgText}</span> / 5 · {count} reviews
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            onClick={openReviewModal}
          >
            Leave a review
          </button>
        </div>

        <div className="mt-6 space-y-3">
          {reviews.length === 0 && (
            <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
              No reviews yet.
            </div>
          )}

          {reviews.map((r) => (
            <div key={r.id} className="rounded-lg border p-4 transition hover:shadow-sm">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold">{r.author}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <StarDisplay value={r.rating} />
                    <span className="text-sm font-medium text-gray-800">
                      {Number(r.rating).toFixed(1)}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-gray-500">
                  {formatDate(r.updatedAt || r.createdAt)}
                </p>
              </div>

              {String(r.text || "").trim().length > 0 && (
                <p className="mt-3 whitespace-pre-wrap text-sm text-gray-700">{r.text}</p>
              )}

              {String(r.text || "").trim().length === 0 && (
                <p className="mt-3 text-sm text-gray-500">No comment.</p>
              )}
            </div>
          ))}
        </div>
      </motion.section>

      <Link to="/" className="text-sm font-medium hover:underline">
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
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setReviewModalOpen(false)}
            />

            {/* Panel */}
            <div className="relative mx-auto flex min-h-full max-w-2xl items-center justify-center p-4">
              <motion.div
                role="dialog"
                aria-modal="true"
                className="w-full rounded-2xl border bg-white shadow-xl"
                initial={{ opacity: 0, y: 12, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 12, scale: 0.98 }}
                transition={{ duration: 0.18 }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-start justify-between gap-4 border-b p-5">
                  <div className="min-w-0">
                    <h4 className="text-lg font-bold">Leave a review</h4>
                    <p className="mt-1 text-sm text-gray-600">
                      Rate <span className="font-medium">{recipe.title}</span> (comment optional)
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setReviewModalOpen(false)}
                    className="rounded-lg border bg-white p-2 hover:bg-gray-50"
                    title="Close"
                    aria-label="Close"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <form onSubmit={submitReview} className="p-5">
                  <p className="text-sm font-medium">Your rating</p>
                  <div className="mt-2">
                    <StarRatingInput value={tempRating} onChange={setTempRating} />
                  </div>

                  <label className="mt-4 block text-sm font-medium">Comment (optional)</label>
                  <textarea
                    className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                    rows={4}
                    placeholder="Write your comment..."
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                  />

                  {submitError && (
                    <p className="mt-2 text-sm font-medium text-red-600">{submitError}</p>
                  )}

                  <div className="mt-5 flex items-center justify-between">
                    <p className="text-xs text-gray-500">Stored locally (no backend yet).</p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="rounded-lg border bg-white px-4 py-2 text-sm font-medium hover:bg-gray-50"
                        onClick={() => setReviewModalOpen(false)}
                      >
                        Close
                      </button>
                      <button
                        type="submit"
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:opacity-90"
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
    </motion.div>
  );
}
