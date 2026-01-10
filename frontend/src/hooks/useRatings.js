import { useEffect, useMemo, useState } from "react";

function keyFor(recipeId) {
  return `rf_ratings_${recipeId}`;
}

// ratings format: { [userId]: number }
function readRatings(recipeId) {
  try {
    const raw = localStorage.getItem(keyFor(recipeId));
    const obj = raw ? JSON.parse(raw) : {};
    return obj && typeof obj === "object" ? obj : {};
  } catch {
    return {};
  }
}

function writeRatings(recipeId, obj) {
  localStorage.setItem(keyFor(recipeId), JSON.stringify(obj));
}

export function getRatingSummary(recipeId) {
  const ratingsByUser = readRatings(recipeId);
  const values = Object.values(ratingsByUser)
    .map(Number)
    .filter((v) => v >= 1 && v <= 5);

  const count = values.length;
  const avg = count === 0 ? 0 : values.reduce((a, b) => a + b, 0) / count;

  return { avg, count };
}

export default function useRatings(recipeId, userId = "demo") {
  const [ratingsByUser, setRatingsByUser] = useState(() =>
    readRatings(recipeId)
  );

  useEffect(() => {
    writeRatings(recipeId, ratingsByUser);
  }, [recipeId, ratingsByUser]);

  const values = useMemo(() => Object.values(ratingsByUser), [ratingsByUser]);

  const avg = useMemo(() => {
    if (values.length === 0) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return sum / values.length;
  }, [values]);

  const count = values.length;

  const myRating = ratingsByUser[userId] ?? 0;

  function setMyRating(value) {
    const v = Number(value);
    if (v < 1 || v > 5) return;

    setRatingsByUser((prev) => ({
      ...prev,
      [userId]: v,
    }));
  }

  return { avg, count, myRating, setMyRating };
}
