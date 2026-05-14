import { db, firebaseConfig }
from "../config/firebase.js";

import {
  initializeApp,
  deleteApp
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-app.js";

import {
  getAuth,
  createUserWithEmailAndPassword
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function criarAdminAuth({
  nome,
  email,
  user,
  cargo,
  nomenclatura,
  senha,
  fotoUrl,
  reporter,
  permissoes,
  role = "admin",
  ativo = true
}) {
  const secondaryApp = initializeApp(
    firebaseConfig,
    "Secondary-" + Date.now()
  );

  const secondaryAuth = getAuth(secondaryApp);

  try {
    const credencial =
      await createUserWithEmailAndPassword(
        secondaryAuth,
        email,
        senha
      );

    const uid = credencial.user.uid;

    const dadosAdmin = {
      nome,
      email,
      user,
      cargo,
      nomenclatura,
      fotoUrl,
      reporter,
      permissoes,
      role,
      ativo,
      criadoEm: new Date(),
      atualizadoEm: new Date()
    };

    await setDoc(
      doc(db, "admins", uid),
      dadosAdmin
    );

    await deleteApp(secondaryApp);

    return {
      id: uid,
      ...dadosAdmin
    };

  } catch (error) {
    await deleteApp(secondaryApp);
    throw error;
  }
}

export async function listarAdmins() {
  const snapshot =
    await getDocs(collection(db, "admins"));

  let admins = [];

  snapshot.forEach((item) => {
    admins.push({
      id: item.id,
      ...item.data()
    });
  });

  return admins;
}

export async function buscarAdmin(id) {
  const snap =
    await getDoc(doc(db, "admins", id));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data()
  };
}

export async function atualizarAdmin(id, dados) {
  return await updateDoc(
    doc(db, "admins", id),
    {
      ...dados,
      atualizadoEm: new Date()
    }
  );
}

export async function excluirAdmin(id) {
  return await deleteDoc(
    doc(db, "admins", id)
  );
}
