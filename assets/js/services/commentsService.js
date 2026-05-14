import { db } from "../config/firebase.js";

import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function listarComentarios() {
  const snap = await getDocs(collection(db, "comentarios"));

  let comentarios = [];

  snap.forEach((item) => {
    comentarios.push({
      id: item.id,
      ...item.data()
    });
  });

  return comentarios;
}

export async function atualizarComentario(id, dados) {
  return await updateDoc(doc(db, "comentarios", id), {
    ...dados,
    atualizadoEm: new Date()
  });
}

export async function excluirComentario(id) {
  return await deleteDoc(doc(db, "comentarios", id));
}
