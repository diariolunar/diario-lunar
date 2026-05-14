import { db } from "../config/firebase.js";

import {
  collection,
  addDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function enviarSugestaoPauta(dados) {
  return await addDoc(collection(db, "sugestoesPauta"), {
    ...dados,
    status: "nova",
    data: new Date()
  });
}
