import { auth, db }
from "../../config/firebase.js";

import {
  signInWithEmailAndPassword,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  salvarSessao,
  limparSessao
}
from "./session.js";

export async function fazerLogin(email, senha) {
  try {
    const credencial =
      await signInWithEmailAndPassword(auth, email, senha);

    const uid = credencial.user.uid;

    const admSnap =
      await getDoc(doc(db, "admins", uid));

    if (!admSnap.exists()) {
      await signOut(auth);

      return {
        sucesso: false,
        mensagem: "Usuário sem permissão administrativa."
      };
    }

    const adm = {
      id: uid,
      ...admSnap.data()
    };

    if (adm.ativo === false) {
      await signOut(auth);

      return {
        sucesso: false,
        mensagem: "Este acesso está desativado."
      };
    }

    salvarSessao(adm);

    return {
      sucesso: true,
      usuario: adm
    };

  } catch {
    return {
      sucesso: false,
      mensagem: "E-mail ou senha inválidos."
    };
  }
}

export async function fazerLogout() {
  limparSessao();
  await signOut(auth);
}
