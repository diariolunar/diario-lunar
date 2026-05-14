import { db } from "../config/firebase.js";

import {
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function cadastrarNewsletter(email) {
  const snap = await getDocs(collection(db, "newsletter"));

  let existe = false;

  snap.forEach((item) => {
    const cadastro = item.data();

    if (
      cadastro.email &&
      cadastro.email.toLowerCase() === email.toLowerCase()
    ) {
      existe = true;
    }
  });

  if (existe) {
    return {
      sucesso: false,
      mensagem: "Este e-mail já está inscrito na newsletter."
    };
  }

  await addDoc(collection(db, "newsletter"), {
    email,
    data: new Date(),
    ativo: true
  });

  return {
    sucesso: true,
    mensagem: "Inscrição realizada com sucesso!"
  };
}
