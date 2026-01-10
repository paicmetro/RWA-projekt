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
  Eye,
  ImagePlus,
  Plus,
  RotateCcw,
  Save,
  Tag,
  Trash2,
  X,
} from "lucide-react";

const TAG_SUGGESTIONS = [
  "Pasta",
  "Dinner",
  "Salad",
  "Healthy",
  "Breakfast",
  "Sweet",
  "Quick",
  "Vegetarian",
];

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
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!emblaApi) return;
    const onSelect = () => setSelectedIndex(emblaApi.selectedScrollSnap());
    onSelect();
    emblaApi.on("select", onSelect);
    return () => emblaApi.off("select", onSelect);
  }, [emblaApi]);

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

    // primjer ograničenja (po želji)
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
      setError("Ne mogu učitati sliku. Probaj s drugom slikom.");
      toast.error("Ne mogu učitati sliku.");
    }
  }

  function removeImage(id) {
    setImages((prev) => prev.filter((x) => x.id !== id));
  }

  // Dropzone
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
    toast.message("Forma resetirana.");
  }

  function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSavedMsg("");

    if (!canSave) {
      const msg =
        "Popuni obavezna polja: naslov, opis, vrijeme, barem 1 sastojak i 1 korak.";
      setError(msg);
      toast.error("Nedostaju obavezna polja.");
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

    const okMsg = "Recept je spremljen lokalno (mock). Kasnije se spaja na backend.";
    setSavedMsg(okMsg);
    toast.success("Spremljeno (mock).");
  }

  const checklist = [
    { label: "Title (min 2)", ok: title.trim().length >= 2 },
    { label: "Description (min 5)", ok: description.trim().length >= 5 },
    { label: "Prep time", ok: Number(prepTime) > 0 },
    { label: "At least 1 tag", ok: tags.length >= 1 },
    { label: "At least 1 ingredient", ok: ingredients.length >= 1 },
    { label: "At least 1 step", ok: steps.length >= 1 },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        className="rounded-2xl border bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-2xl font-bold">Add recipe</h2>
            <p className="mt-1 text-sm text-gray-600">
              Dodaj naslov, tagove, sastojke, korake i slike. Sve se trenutno sprema lokalno.
            </p>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-gray-600">Progress</p>
                <p className="text-xs font-semibold text-gray-800">{progress}%</p>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className="h-full rounded-full bg-black transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
            >
              <RotateCcw className="h-4 w-4" />
              Reset
            </button>
            <button
              type="submit"
              form="add-recipe-form"
              disabled={!canSave}
              className={cx(
                "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition",
                canSave ? "bg-black hover:opacity-90" : "cursor-not-allowed bg-gray-400"
              )}
            >
              <Save className="h-4 w-4" />
              Save (mock)
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-700">
            {error}
          </div>
        )}
        {savedMsg && (
          <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-3 text-sm font-medium text-green-700">
            {savedMsg}
          </div>
        )}
      </motion.div>

      <form id="add-recipe-form" onSubmit={onSubmit} className="grid gap-6 lg:grid-cols-12">
        {/* Left */}
        <div className="space-y-4 lg:col-span-8">
          {/* Basic */}
          <Disclosure defaultOpen>
            {({ open }) => (
              <section className="rounded-2xl border bg-white shadow-sm">
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div>
                    <p className="text-base font-semibold">Basic info</p>
                    <p className="mt-1 text-sm text-gray-600">Naslov, opis i vrijeme pripreme.</p>
                  </div>
                  <ChevronDown className={cx("h-5 w-5 transition", open && "rotate-180")} />
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="grid gap-4">
                    <div>
                      <label className="text-sm font-medium" htmlFor="title">
                        Title
                      </label>
                      <input
                        id="title"
                        className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                        placeholder="e.g. Spaghetti Bolognese"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="desc">
                        Description
                      </label>
                      <textarea
                        id="desc"
                        className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
                        rows={4}
                        placeholder="Short description..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="text-sm font-medium" htmlFor="prep">
                        Prep time (minutes)
                      </label>
                      <input
                        id="prep"
                        type="number"
                        min={1}
                        className="mt-1 w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
              <section className="rounded-2xl border bg-white shadow-sm">
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                      <Tag className="h-4 w-4" />
                    </span>
                    <div>
                      <p className="text-base font-semibold">Tags</p>
                      <p className="mt-1 text-sm text-gray-600">
                        Tagovi kao na Home karticama (npr. Pasta, Dinner).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {tags.length}
                    </span>
                    <ChevronDown className={cx("h-5 w-5 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                      onClick={() => addTag(tagInput)}
                    >
                      <Plus className="h-4 w-4" />
                      Add tag
                    </button>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {TAG_SUGGESTIONS.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => addTag(t)}
                        className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-200"
                      >
                        {t}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    {tags.length === 0 && <span className="text-sm text-gray-500">No tags yet.</span>}
                    {tags.map((t) => (
                      <span
                        key={t}
                        className="inline-flex items-center gap-2 rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                      >
                        {t}
                        <button
                          type="button"
                          onClick={() => removeTag(t)}
                          className="rounded-full bg-blue-200 px-2 py-0.5 text-xs font-bold transition hover:opacity-90"
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
              <section className="rounded-2xl border bg-white shadow-sm">
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div>
                    <p className="text-base font-semibold">Ingredients</p>
                    <p className="mt-1 text-sm text-gray-600">Dodaj sastojke jedan po jedan.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {ingredients.length}
                    </span>
                    <ChevronDown className={cx("h-5 w-5 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                      onClick={() => addIngredient(ingredientInput)}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {ingredients.length === 0 && (
                      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                        No ingredients yet.
                      </div>
                    )}

                    {ingredients.map((ing, idx) => (
                      <div
                        key={`${ing}-${idx}`}
                        className="flex items-center justify-between gap-3 rounded-lg border p-3 transition hover:bg-gray-50"
                      >
                        <p className="text-sm text-gray-800">
                          <span className="mr-2 text-xs font-semibold text-gray-500">{idx + 1}.</span>
                          {ing}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeIngredient(idx)}
                          className="inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50"
                        >
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
              <section className="rounded-2xl border bg-white shadow-sm">
                <Disclosure.Button className="flex w-full items-center justify-between gap-3 p-6 text-left">
                  <div>
                    <p className="text-base font-semibold">Steps</p>
                    <p className="mt-1 text-sm text-gray-600">Dodaj korake pripreme.</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                      {steps.length}
                    </span>
                    <ChevronDown className={cx("h-5 w-5 transition", open && "rotate-180")} />
                  </div>
                </Disclosure.Button>

                <Disclosure.Panel className="px-6 pb-6">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    <input
                      className="w-full rounded-lg border px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
                    <button
                      type="button"
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                      onClick={() => addStep(stepInput)}
                    >
                      <Plus className="h-4 w-4" />
                      Add
                    </button>
                  </div>

                  <div className="mt-4 space-y-2">
                    {steps.length === 0 && (
                      <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                        No steps yet.
                      </div>
                    )}

                    {steps.map((s, idx) => (
                      <div
                        key={`${s}-${idx}`}
                        className="flex items-start justify-between gap-3 rounded-lg border p-3 transition hover:bg-gray-50"
                      >
                        <p className="text-sm text-gray-800">
                          <span className="mr-2 text-xs font-semibold text-gray-500">{idx + 1}.</span>
                          {s}
                        </p>
                        <button
                          type="button"
                          onClick={() => removeStep(idx)}
                          className="shrink-0 inline-flex items-center gap-2 rounded-lg border bg-white px-3 py-1.5 text-sm font-medium transition hover:bg-gray-50"
                        >
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
            className="rounded-2xl border bg-white p-6 shadow-sm lg:sticky lg:top-6"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.05 }}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="text-base font-semibold">Photos</h3>
                <p className="mt-1 text-sm text-gray-600">Drag & drop ili klikni za dodavanje.</p>
              </div>
              <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                {images.length}
              </span>
            </div>

            <div
              {...getRootProps()}
              className={cx(
                "mt-4 rounded-2xl border p-4 transition",
                isDragActive ? "bg-gray-50 ring-2 ring-black/10" : "bg-white hover:bg-gray-50"
              )}
            >
              <input {...getInputProps()} />
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50">
                  <ImagePlus className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">
                    {isDragActive ? "Pusti slike ovdje..." : "Dodaj fotografije"}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-600">
                    Podržano: image/* · preporuka: 1–5 slika
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {images.map((img) => (
                <div key={img.id} className="group relative overflow-hidden rounded-xl border">
                  <img
                    src={img.dataUrl}
                    alt={img.name}
                    className="h-28 w-full object-cover transition group-hover:scale-[1.02]"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(img.id)}
                    className="absolute right-2 top-2 rounded-lg bg-white/90 px-2 py-1 text-xs font-semibold transition hover:bg-white"
                    title="Remove image"
                  >
                    Remove
                  </button>
                </div>
              ))}

              {images.length === 0 && (
                <div className="col-span-2 rounded-lg border bg-gray-50 p-4 text-sm text-gray-600">
                  No photos yet.
                </div>
              )}
            </div>

            {/* Preview trigger */}
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="group mt-5 w-full rounded-xl border bg-white p-4 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-md hover:ring-2 hover:ring-black/10 focus:outline-none focus:ring-2 focus:ring-black/10"
              title="Open preview"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gray-50">
                    <Eye className="h-4 w-4" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">Preview</p>
                    <p className="mt-0.5 text-xs text-gray-600">Klikni da vidiš “published” izgled.</p>
                  </div>
                </div>

                <span className="rounded-full bg-gray-100 px-2 py-1 text-[11px] font-medium text-gray-700">
                  {Number(prepTime) > 0 ? `${Number(prepTime)}m` : "—"}
                </span>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <div className="h-10 w-10 overflow-hidden rounded-lg border bg-gray-50">
                  {heroImage ? (
                    <img src={heroImage} alt="Preview" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-500">
                      No photo
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{title.trim() || "Recipe title"}</p>
                  <p className="truncate text-[11px] text-gray-600">
                    {description.trim() || "Short description..."}
                  </p>
                </div>
              </div>
            </button>

            {/* Checklist */}
            <div className="mt-5 rounded-xl border bg-gray-50 p-4">
              <p className="text-sm font-semibold">Checklist</p>
              <div className="mt-3 space-y-2">
                {checklist.map((x) => (
                  <div key={x.label} className="flex items-center justify-between gap-3">
                    <p className="text-sm text-gray-700">{x.label}</p>
                    <span
                      className={cx(
                        "inline-flex h-6 w-6 items-center justify-center rounded-full border",
                        x.ok ? "bg-white" : "bg-gray-100"
                      )}
                      title={x.ok ? "OK" : "Missing"}
                    >
                      {x.ok ? <Check className="h-4 w-4" /> : null}
                    </span>
                  </div>
                ))}
              </div>

              <p className="mt-3 text-xs text-gray-600">
                Tagovi i slike nisu obavezni za save, ali jako poboljšaju UX.
              </p>
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
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" />
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
                <Dialog.Panel className="w-full overflow-hidden rounded-2xl border bg-white shadow-xl">
                  {/* Top */}
                  <div className="grid gap-0 md:grid-cols-5">
                    {/* Carousel */}
                    <div className="relative md:col-span-3">
                      {previewImgs.length > 0 ? (
                        <div className="relative h-64 overflow-hidden bg-black md:h-full">
                          <div ref={emblaRef} className="h-full overflow-hidden">
                            <div className="flex h-full">
                              {previewImgs.map((src, idx) => (
                                <div key={`${src}-${idx}`} className="min-w-0 flex-[0_0_100%]">
                                  <img
                                    src={src}
                                    alt={`Preview ${idx + 1}`}
                                    className="h-full w-full object-cover"
                                  />
                                </div>
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

                              <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-2 rounded-full bg-black/40 px-3 py-2">
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
                        <div className="flex h-64 items-center justify-center bg-gray-50 text-sm text-gray-600 md:h-full">
                          No photo yet
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="md:col-span-2">
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Dialog.Title className="truncate text-lg font-bold">
                              {title.trim() || "Recipe title"}
                            </Dialog.Title>
                            <p className="mt-1 text-sm text-gray-600">
                              {description.trim() || "Short description..."}
                            </p>
                            <p className="mt-2 text-xs text-gray-500">By Demo User</p>
                          </div>

                          <button
                            type="button"
                            onClick={() => setPreviewOpen(false)}
                            className="rounded-lg border bg-white p-2 transition hover:bg-gray-50"
                            title="Close"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(tags.length ? tags : ["Tag"]).slice(0, 8).map((t) => (
                            <span
                              key={t}
                              className="rounded-full bg-blue-100 px-3 py-1 text-xs font-medium text-blue-800"
                            >
                              {t}
                            </span>
                          ))}
                        </div>

                        <div className="mt-4 flex items-center justify-between">
                          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-700">
                            {Number(prepTime) > 0 ? `${Number(prepTime)} min` : "— min"}
                          </span>
                          <p className="text-xs text-gray-500">ESC / klik van zatvara</p>
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
                                    "shrink-0 overflow-hidden rounded-lg border transition",
                                    idx === selectedIndex ? "ring-2 ring-black/15" : "hover:shadow-sm"
                                  )}
                                  title={`Go to image ${idx + 1}`}
                                >
                                  <img src={src} alt="" className="h-14 w-20 object-cover" />
                                </button>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-gray-600">Dodaj slike da vidiš thumbnails.</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Details */}
                  <div className="grid gap-4 border-t bg-white p-6 md:grid-cols-2">
                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm font-semibold">Ingredients</p>
                      <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-gray-700">
                        {(ingredients.length ? ingredients.slice(0, 8) : ["(add ingredients)"]).map((ing, idx) => (
                          <li key={`${ing}-${idx}`}>{ing}</li>
                        ))}
                      </ul>
                      {ingredients.length > 8 && (
                        <p className="mt-2 text-xs text-gray-500">+{ingredients.length - 8} more...</p>
                      )}
                    </div>

                    <div className="rounded-xl border bg-gray-50 p-4">
                      <p className="text-sm font-semibold">Steps</p>
                      <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-gray-700">
                        {(steps.length ? steps.slice(0, 6) : ["(add steps)"]).map((s, idx) => (
                          <li key={`${s}-${idx}`}>{s}</li>
                        ))}
                      </ol>
                      {steps.length > 6 && (
                        <p className="mt-2 text-xs text-gray-500">+{steps.length - 6} more...</p>
                      )}
                    </div>
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-end gap-2 border-t bg-white p-4">
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="rounded-lg border bg-white px-4 py-2 text-sm font-medium transition hover:bg-gray-50"
                    >
                      Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setPreviewOpen(false)}
                      className="inline-flex items-center gap-2 rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
                    >
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
    </div>
  );
}
