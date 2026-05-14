import { db } from "../config/firebase.js";

import {
  doc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function registrarView(postId) {
  if (!postId) return;

  const chaveView = `view_registrada_${postId}`;

  if (sessionStorage.getItem(chaveView)) {
    return;
  }

  const postRef = doc(db, "posts", postId);

  await updateDoc(postRef, {
    views: increment(1)
  });

  sessionStorage.setItem(chaveView, "true");
}
