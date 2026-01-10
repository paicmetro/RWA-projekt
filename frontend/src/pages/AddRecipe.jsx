import { Fragment, useEffect, useMemo, useState } from "react";
import { Dialog, Disclosure, Transition } from "@headlessui/react";
import { useDropzone } from "react-dropzone";
import useEmblaCarousel from "embla-carousel-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  ImagePlus,
  Leaf,
  ListChecks,
  Plus,
  RotateCcw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const TAG_SUGGESTIONS = ["Pasta", "Dinner", "Salad", "Healthy", "Breakfast", "Sweet", "Quick", "Vegetarian"];

function cleanTag(s) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 24);
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = reject;
    r.readAsDataURL(file);
  });
}

function addUnique(arr, value, eq = (a, b) => a === b) {
  if (arr.some((x) => eq(x, value))) return arr;
  return [...arr, value];
}

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function AddRecipe() {
  // Basic fields
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [prepTime, setPrepTime] = useState("");

  // Tags
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);

  // Ingredients
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredients, setIngredients] = useState([]);

  // Steps
  const [stepInput, setStepInput] = useState("");
  const [steps, setSteps] = useState([]);

  // Images (store dataUrl so we can reuse without backend)
  const [images, setImages] = useState([]); // { id, name, dataUrl }

  // UI feedback
  const [error, setError] = useState("");
  const [savedMsg, setSavedMsg] = useState("");

  // Preview modal
  const [previewOpen, setPreviewOpen] = useState(false);

  // Embla (Preview carousel)
  const previewImgs = useMemo(() => images.map((x) => x.dataUrl), [images]);
  const canScroll = previewImgs.length > 1;
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

  useEffect(() => {
    if (!previewOpen) return;
    // kad se modal otvori, embla ponekad treba reInit jer je bio hidden
    const t = setTimeout(() => emblaApi?.reInit?.(), 0);
    return () => clearTimeout(t);
  }, [previewOpen, emblaApi]);

  function scrollPrev() {
    emblaApi?.scrollPrev();
  }
  function scrollNext() {
    emblaApi?.scrollNext();
  }
  function scrollTo(i) {
    emblaApi?.scrollTo(i);
  }

  const heroImage = images[0]?.dataUrl || "";

  const canSave = useMemo(() => {
    return (
      title.trim().length >= 2 &&
      description.trim().length >= 5 &&
      Number(prepTime) > 0 &&
      ingredients.length >= 1 &&
      steps.length >= 1
    );
  }, [title, description, prepTime, ingredients.length, steps.length]);

  const progress = useMemo(() => {
    const checks = [
      title.trim().length >= 2,
      description.trim().length >= 5,
      Number(prepTime) > 0,
      tags.length >= 1,
      ingredients.length >= 1,
      steps.length >= 1,
      images.length >= 1,
    ];
    const done = checks.filter(Boolean).length;
    return Math.round((done / checks.length) * 100);
  }, [title, description, prepTime, tags.length, ingredients.length, steps.length, images.length]);

  function addTag(raw) {
    const t = cleanTag(raw);
    if (!t) return;
    setTags((prev) => addUnique(prev, t, (a, b) => a.toLowerCase() === b.toLowerCase()));
    setTagInput("");
  }
  function removeTag(t) {
    setTags((prev) => prev.filter((x) => x !== t));
  }

  function addIngredient(raw) {
    const val = String(raw || "").trim();
    if (val.length < 2) return;
    setIngredients((prev) => [...prev, val]);
    setIngredientInput("");
  }
  function removeIngredient(idx) {
    setIngredients((prev) => prev.filter((_, i) => i !== idx));
  }

  function addStep(raw) {
    const val = String(raw || "").trim();
    if (val.length < 2) return;
    setSteps((prev) => [...prev, val]);
    setStepInput("");
  }
  function removeStep(idx) {
    setSteps((prev) => prev.filter((_, i) => i !== idx));
  }

  async function addFiles(files) {
    if (!files?.length) return;

    const MAX = 10;
    const remaining = Math.max(0, MAX - images.length);
    const slice = files.slice(0, remaining);

    try {
      const mapped = await Promise.all(
        slice.map(async (f) => ({
          id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now() + Math.random()),
          name: f.name,
          dataUrl: await fileToDataUrl(f),
        }))
      );
      setImages((prev) => [...prev, ...mapped]);
    } catch {
      setError("Could not read the image. Try another file.");
      toast.error("Could not read the image.");
    }
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((x) => x.id !== id));
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    onDrop: async (accepted) => {
      await addFiles(accepted);
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setPrepTime("");
    setTags([]);
    setTagInput("");
    setIngredients([]);
    setIngredientInput("");
    setSteps([]);
    setStepInput("");
    setImages([]);
    setError("");
    setSavedMsg("");
    setPreviewOpen(false);
    toast.message("Form reset.");
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSavedMsg("");

    if (!canSave) {
      const msg = "Fill required fields: title, description, prep time, at least 1 ingredient and 1 step.";
      setError(msg);
      toast.error("Missing required fields.");
      return;
    }

    const recipe = {
      id: (crypto.randomUUID && crypto.randomUUID()) || String(Date.now()),
      title: title.trim(),
      description: description.trim(),
      prepTime: Number(prepTime),
      categories: tags,
      ingredients,
      steps,
      images, // {id,name,dataUrl}
      author: "Demo User",
      createdAt: new Date().toISOString(),
    };

    const KEY = "rf_user_recipes";
    const existingRaw = localStorage.getItem(KEY);
    const existing = existingRaw ? JSON.parse(existingRaw) : [];
    const next = Array.isArray(existing) ? [recipe, ...existing] : [recipe];
    localStorage.setItem(KEY, JSON.stringify(next));

    const okMsg = "Saved locally (mock). Later: connect to backend.";
    setSavedMsg(okMsg);
    toast.success("Saved (mock).");
  }

  // ===== Design tokens (same vibe as RecipeDetails) =====
  const card =
    "relative overflow-hidden rounded-2xl border border-white/40 bg-white/90 shadow-sm backdrop-blur-md";
  const cardPad = "p-6";
  const accentStrip = "absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-amber-500/70 via-rose-500/60 to-emerald-500/70";

  const label = "text-sm font-semibold text-slate-800";
  const input =
    "mt-1 w-full rounded-xl border border-white/60 bg-white/100 px-4 py-2 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-rose-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60";
  const softBtn =
    "inline-flex items-center justify-center gap-2 rounded-xl border border-white/60 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm transition hover:-translate-y-0.5 hover:bg-white/85 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60";
  const primaryBtn = (enabled) =>
    cx(
      "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60",
      enabled
        ? "bg-gradient-to-r from-amber-600 to-rose-600 hover:-translate-y-0.5 hover:shadow-md"
        : "cursor-not-allowed bg-slate-400"
    );

  return (
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
    >
      {/* Header */}
      <section className={cx(card, cardPad)}>
        <div className={accentStrip} />

        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-900">Add recipe</h2>
            <p className="mt-1 text-sm text-slate-600">
              Create a recipe with tags, ingredients, steps and photos. Saved locally for now.
            </p>

            <div className="mt-4 max-w-md">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-600">Progress</p>
                <p className="text-xs font-extrabold text-slate-800">{progress}%</p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-900/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-600 via-amber-500 to-rose-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div className="mt-2 flex flex-wrap gap-2 text-[11px] font-semibold text-slate-600">
                <span className={cx("rounded-full px-3 py-1", title.trim().length >= 2 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Title
                </span>
                <span className={cx("rounded-full px-3 py-1", description.trim().length >= 5 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Description
                </span>
                <span className={cx("rounded-full px-3 py-1", Number(prepTime) > 0 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Time
                </span>
                <span className={cx("rounded-full px-3 py-1", tags.length >= 1 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Tags
                </span>
                <span className={cx("rounded-full px-3 py-1", ingredients.length >= 1 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Ingredients
                </span>
                <span className={cx("rounded-full px-3 py-1", steps.length >= 1 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Steps
                </span>
                <span className={cx("rounded-full px-3 py-1", images.length >= 1 ? "bg-emerald-500/10 text-emerald-800" : "bg-slate-900/5")}>
                  Photos
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={resetForm} className={softBtn}>
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button type="submit" form="add-recipe-form" disabled={!canSave} className={primaryBtn(canSave)}>
              <Save className="h-4 w-4" />
              Save (mock)
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-xl border border-rose-200/60 bg-rose-50/80 p-3 text-sm font-semibold text-rose-700">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="mt-4 rounded-xl border border-emerald-200/60 bg-emerald-50/80 p-3 text-sm font-semibold text-emerald-800">
            {savedMsg}
          </div>
        )}
      </section>

      <form id="add-recipe-form" onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="space-y-4 lg:col-span-8">
          {/* Basic info */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <section className={card}>
                <div className={accentStrip} />
                <Disclosure.Button className="relative flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5">
                      <Clock className="h-5 w-5 text-slate-700" />
                    </span>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">Basic info</p>
                      <p className="mt-1 text-sm text-slate-600">Title, short description and prep time.</p>
                    </div>
                  </div>
                  <ChevronDown className={cx("h-5 w-5 text-slate-700 transition", open && "rotate-180")} />
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="grid gap-4">
                    <div>
                      <label className={label} htmlFor="title">
                        Title
                      </label>
                      <input
                        id="title"
                        className={input}
                        placeholder="e.g. Spaghetti Bolognese"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={label} htmlFor="desc">
                        Description
                      </label>
                      <textarea
                        id="desc"
                        className={input}
                        rows={4}
                        placeholder="Short description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className={label} htmlFor="prep">
                        Prep time (minutes)
                      </label>
                      <input
                        id="prep"
                        type="number"
                        min={1}
                        className={input}
                        placeholder="e.g. 30"
                        value={prepTime}
                        onChange={(e) => setPrepTime(e.target.value)}
                      />
                    </div>
                  </div>
                </Disclosure.Panel>
              </section>
            )}
          </Disclosure>

          {/* Tags */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <section className={card}>
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5">
                      <Tag className="h-5 w-5 text-slate-700" />
                    </span>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">Tags</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-extrabold text-slate-700">
                      {tags.length}
                    </span>
                    <ChevronDown className={cx("h-5 w-5 text-slate-700 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className={cx(input, "mt-0")}
                      placeholder="Type a tag and press Enter..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addTag(tagInput);
                        }
                      }}
                    />
                    <button type="button" className={softBtn} onClick={() => addTag(tagInput)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {TAG_SUGGESTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-white/90 px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-white/80"
                      >
                        <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.length === 0 && <span className="text-sm text-slate-600">No tags yet.</span>}
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 rounded-full border border-white/60 bg-gradient-to-r from-emerald-50/80 to-amber-50/80 px-3 py-1 text-xs font-extrabold text-slate-700 shadow-[0_1px_0_rgba(0,0,0,0.04)]"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="rounded-full bg-slate-900/10 px-2 py-0.5 text-xs font-black text-slate-700 transition hover:bg-slate-900/15"
                          aria-label={`Remove tag ${t}`}
                          title="Remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </Disclosure.Panel>
              </section>
            )}
          </Disclosure>

          {/* Ingredients */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <section className={card}>
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10">
                      <Leaf className="h-5 w-5 text-emerald-700" />
                    </span>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">Ingredients</p>
                      <p className="mt-1 text-sm text-slate-600">Add items one by one (Enter to add).</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-extrabold text-emerald-800">
                      {ingredients.length} items
                    </span>
                    <ChevronDown className={cx("h-5 w-5 text-slate-700 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className={cx(input, "mt-0")}
                      placeholder="e.g. 200g pasta"
                      value={ingredientInput}
                      onChange={(e) => setIngredientInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addIngredient(ingredientInput);
                        }
                      }}
                    />
                    <button
                      type="button"
                      className={cx(
                        "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-extrabold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60",
                        "bg-gradient-to-r from-emerald-600 to-emerald-500"
                      )}
                      onClick={() => addIngredient(ingredientInput)}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {ingredients.length === 0 && (
                      <div className="rounded-xl border border-white/60 bg-white/80 p-4 text-sm text-slate-600">
                        No ingredients yet.
                      </div>
                    )}

                    {ingredients.map((ing, idx) => (
                      <div
                        key={`${ing}-${idx}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/60 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <p className="text-sm text-slate-800">
                          <span className="mr-2 inline-flex h-6 w-6 items-center justify-center rounded-full bg-emerald-600/15 text-xs font-black text-emerald-800">
                            {idx + 1}
                          </span>
                          {ing}
                        </p>
                        <button type="button" onClick={() => removeIngredient(idx)} className={cx(softBtn, "px-3 py-2")}>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </section>
            )}
          </Disclosure>

          {/* Steps */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <section className={card}>
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10">
                      <ListChecks className="h-5 w-5 text-amber-800" />
                    </span>
                    <div>
                      <p className="text-base font-extrabold text-slate-900">Steps</p>
                      <p className="mt-1 text-sm text-slate-600">Short instructions, added one by one.</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-amber-500/10 px-3 py-1 text-xs font-extrabold text-amber-900">
                      {steps.length} steps
                    </span>
                    <ChevronDown className={cx("h-5 w-5 text-slate-700 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className={cx(input, "mt-0")}
                      placeholder="e.g. Boil water and cook pasta..."
                      value={stepInput}
                      onChange={(e) => setStepInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addStep(stepInput);
                        }
                      }}
                    />
                    <button type="button" className={primaryBtn(true)} onClick={() => addStep(stepInput)}>
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {steps.length === 0 && (
                      <div className="rounded-xl border border-white/60 bg-white/80 p-4 text-sm text-slate-600">
                        No steps yet.
                      </div>
                    )}

                    {steps.map((s, idx) => (
                      <div
                        key={`${s}-${idx}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-white/60 bg-white/60 p-4 transition hover:-translate-y-0.5 hover:shadow-sm"
                      >
                        <div className="flex gap-3">
                          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-rose-600 text-xs font-black text-white shadow-sm">
                            {idx + 1}
                          </span>
                          <p className="text-sm text-slate-800">{s}</p>
                        </div>

                        <button type="button" onClick={() => removeStep(idx)} className={cx(softBtn, "shrink-0 px-3 py-2")}>
                          <Trash2 className="h-4 w-4" />
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </Disclosure.Panel>
              </section>
            )}
          </Disclosure>
        </div>

        {/* Right */}
        <aside className="space-y-6 lg:col-span-4">
          {/* Photos */}
          <motion.section
            className={cx(card, "lg:sticky lg:top-6", cardPad)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.22, delay: 0.05 }}
          >
            <div className={accentStrip} />

            <div className="relative flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Photos</h3>
                <p className="mt-1 text-sm text-slate-600">Drag & drop or click to add.</p>
              </div>
              <span className="rounded-full bg-slate-900/5 px-3 py-1 text-xs font-extrabold text-slate-700">
                {images.length}
              </span>
            </div>

            <div
              {...getRootProps()}
              className={cx(
                "relative mt-4 rounded-2xl border border-white/60 p-4 transition",
                isDragActive ? "bg-white/75 ring-2 ring-rose-500/20" : "bg-white/60 hover:bg-white/75"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-slate-900/5">
                  <ImagePlus className="h-5 w-5 text-slate-700" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-slate-800">
                    {isDragActive ? "Drop images here..." : "Add photos"}
                  </p>
                  <p className="mt-0.5 text-xs text-slate-600">Recommended: 1–5 photos</p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl border border-white/60 bg-white/60">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-28 w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-extrabold text-slate-800 shadow-sm transition hover:bg-white"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-2 rounded-xl border border-white/60 bg-white/60 p-4 text-sm text-slate-600">
                  No photos yet.
                </div>
              )}
            </div>

            {/* Preview trigger */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="mt-5 w-full rounded-xl border border-white/60 bg-white/60 p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:bg-white/80 hover:shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-500/25 focus-visible:ring-offset-2 focus-visible:ring-offset-white/60"
              title="Open preview"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-slate-900/5">
                    <Eye className="h-4 w-4 text-slate-700" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-slate-900">Preview</p>
                  </div>
                </div>

                <span className="rounded-full bg-slate-900/5 px-2 py-1 text-[11px] font-extrabold text-slate-700">
                  {Number(prepTime) > 0 ? `${Number(prepTime)}m` : "—"}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-lg border border-white/60 bg-white/70">
                  {heroImage ? (
                    <img src={heroImage} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-slate-500">
                      No photo
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-extrabold text-slate-900">{title.trim() || "Recipe title"}</p>
                  <p className="truncate text-[11px] text-slate-600">{description.trim() || "Short description..."}</p>
                </div>
              </div>
            </button>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-xs text-slate-600">Stored locally (mock).</p>
              <span className="inline-flex items-center gap-2 rounded-full bg-slate-900/5 px-3 py-1 text-xs font-extrabold text-slate-700">
                <Check className="h-4 w-4" />
                Ready: {canSave ? "Yes" : "No"}
              </span>
            </div>
          </motion.section>
        </aside>
      </form>

      {/* Preview modal */}
      <Transition appear show={previewOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setPreviewOpen}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-200"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-150"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto p-4">
            <div className="mx-auto flex min-h-full max-w-5xl items-center justify-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-200"
                enterFrom="opacity-0 translate-y-2 scale-[0.98]"
                enterTo="opacity-100 translate-y-0 scale-100"
                leave="ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0 scale-100"
                leaveTo="opacity-0 translate-y-2 scale-[0.98]"
              >
                <Dialog.Panel className="w-full overflow-hidden rounded-2xl border border-white/30 bg-white/80 shadow-xl backdrop-blur-md">
                  <div className="relative border-b border-white/40 p-5">
                    <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-emerald-500/10" />
                    <div className="relative flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <Dialog.Title className="text-lg font-extrabold text-slate-900">
                          Preview
                        </Dialog.Title>
                        <p className="mt-1 text-sm text-slate-600">
                          {title.trim() || "Recipe title"} · {Number(prepTime) > 0 ? `${Number(prepTime)} min` : "— min"}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setPreviewOpen(false)}
                        className="rounded-xl bg-white/70 p-2 shadow-sm ring-1 ring-black/5 transition hover:bg-white/85 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/30"
                        title="Close"
                        aria-label="Close"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="grid gap-0 md:grid-cols-5">
                    {/* Carousel */}
                    <div className="relative md:col-span-3">
                      {previewImgs.length > 0 ? (
                        <div className="relative h-64 overflow-hidden bg-slate-900 md:h-full">
                          <div ref={emblaRef} className="h-full overflow-hidden">
                            <div className="flex h-full">
                              {previewImgs.map((src, idx) => (
                                <div key={`${src}-${idx}`} className="min-w-0 flex-[0_0_100%]">
                                  <img src={src} alt={`Preview ${idx + 1}`} className="h-full w-full object-cover" />
                                </div>
                              ))}
                            </div>
                          </div>

                          {canScroll && (
                            <>
                              <button
                                type="button"
                                onClick={scrollPrev}
                                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white hover:shadow"
                                title="Previous"
                              >
                                <ChevronLeft className="h-5 w-5" />
                              </button>
                              <button
                                type="button"
                                onClick={scrollNext}
                                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2 shadow-sm transition hover:bg-white hover:shadow"
                                title="Next"
                              >
                                <ChevronRight className="h-5 w-5" />
                              </button>

                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2 backdrop-blur-sm">
                                {previewImgs.map((_, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => scrollTo(idx)}
                                    className={cx(
                                      "h-2 w-2 rounded-full transition",
                                      idx === selectedIndex ? "bg-white" : "bg-white/50 hover:bg-white/80"
                                    )}
                                    title={`Slide ${idx + 1}`}
                                  />
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ) : (
                        <div className="flex h-64 items-center justify-center bg-white/60 text-sm text-slate-600 md:h-full">
                          No photo yet
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="md:col-span-2">
                      <div className="p-6">
                        <p className="text-sm font-semibold text-slate-800">Description</p>
                        <p className="mt-1 text-sm text-slate-600">
                          {description.trim() || "Short description..."}
                        </p>
                        <p className="mt-2 text-xs text-slate-500">By Demo User</p>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(tags.length ? tags : ["Tag"]).slice(0, 8).map((t) => (
                            <span
                              key={t}
                              className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-gradient-to-r from-emerald-50/80 to-amber-50/80 px-3 py-1 text-xs font-extrabold text-slate-700"
                            >
                              <Leaf className="h-3.5 w-3.5 text-emerald-600" />
                              {t}
                            </span>
                          ))}
                        </div>

                        {/* Thumbs */}
                        <div className="mt-5">
                          {previewImgs.length > 0 ? (
                            <div className="flex gap-2 overflow-x-auto pb-1">
                              {previewImgs.map((src, idx) => (
                                <button
                                  key={`${src}-${idx}`}
                                  type="button"
                                  onClick={() => scrollTo(idx)}
                                  className={cx(
                                    "shrink-0 overflow-hidden rounded-xl border border-white/60 transition",
                                    idx === selectedIndex ? "ring-2 ring-amber-500/25 ring-inset shadow-sm" : "hover:shadow-sm"
                                  )}
                                  title={`Go to image ${idx + 1}`}
                                >
                                  <img src={src} alt="" className="h-14 w-20 object-cover" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-slate-600">Add images to see thumbnails.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid gap-4 border-t border-white/40 bg-white/60 p-6 md:grid-cols-2">
                    <div className="rounded-xl border border-white/60 bg-white/60 p-4">
                      <p className="text-sm font-extrabold text-slate-900">Ingredients</p>
                      <ul className="mt-3 space-y-2 text-sm text-slate-700">
                        {(ingredients.length ? ingredients.slice(0, 8) : ["(add ingredients)"]).map((ing, idx) => (
                          <li key={`${ing}-${idx}`} className="flex items-start gap-2">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-600/70" />
                            <span className="leading-relaxed">{ing}</span>
                          </li>
                        ))}
                      </ul>
                      {ingredients.length > 8 && (
                        <p className="mt-2 text-xs text-slate-500">+{ingredients.length - 8} more...</p>
                      )}
                    </div>

                    <div className="rounded-xl border border-white/60 bg-white/60 p-4">
                      <p className="text-sm font-extrabold text-slate-900">Steps</p>
                      <ol className="mt-3 space-y-2 text-sm text-slate-700">
                        {(steps.length ? steps.slice(0, 6) : ["(add steps)"]).map((s, idx) => (
                          <li key={`${s}-${idx}`} className="flex gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-amber-600 to-rose-600 text-xs font-black text-white shadow-sm">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{s}</span>
                          </li>
                        ))}
                      </ol>
                      {steps.length > 6 && (
                        <p className="mt-2 text-xs text-slate-500">+{steps.length - 6} more...</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 border-t border-white/40 bg-white/60 p-4">
                    <button type="button" onClick={() => setPreviewOpen(false)} className={softBtn}>
                      Close
                    </button>
                    <button type="button" onClick={() => setPreviewOpen(false)} className={primaryBtn(true)}>
                      <Check className="h-4 w-4" />
                      Ok
                    </button>
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
