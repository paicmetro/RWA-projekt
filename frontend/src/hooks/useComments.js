import { useEffect, useState } from "react";

function keyFor(recipeId) {
  return `rf_comments_${recipeId}`;
}

// comment: { id, author, text, createdAt }
function readComments(recipeId) {
  try {
    const raw = localStorage.getItem(keyFor(recipeId));
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr : [];
  } catch {
    return [];
  }
}

function writeComments(recipeId, arr) {
  localStorage.setItem(keyFor(recipeId), JSON.stringify(arr));
}

export default function useComments(recipeId) {
  const [comments, setComments] = useState(() => readComments(recipeId));

  useEffect(() => {
    writeComments(recipeId, comments);
  }, [recipeId, comments]);

  function addComment({ author, text }) {
    const clean = String(text || "").trim();
    if (clean.length < 2) return false;

    const newComment = {
      id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
      author: author || "Demo User",
      text: clean,
      createdAt: new Date().toISOString(),
    };

    setComments((prev) => [newComment, ...prev]);
    return true;
  }

  return { comments, addComment };
}
