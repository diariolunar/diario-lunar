import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function listarCurtidas() {
  const snap = await getDocs(collection(db, "likes"));

  let curtidas = [];

  snap.forEach((item) => {
    curtidas.push({
      id: item.id,
      ...item.data()
    });
  });

  return curtidas;
}
