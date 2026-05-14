import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function pegarUsuario() {
  const inputUsuario = document.getElementById("usuarioWattpad");

  const usuario = inputUsuario.value.trim();

  if (!usuario) {
    alert("Digite seu usuário do Wattpad antes.");
    return null;
  }

  localStorage.setItem("usuarioWattpad", usuario);

  return usuario
    .toLowerCase()
    .replaceAll(" ", "");
}

async function verificarCurtida(postId) {
  const inputUsuario = document.getElementById("usuarioWattpad");

  const usuario = inputUsuario.value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "");

  if (!usuario || !postId) return;

  const likeId = `${postId}_${usuario}`;
  const likeRef = doc(db, "likes", likeId);
  const likeSnap = await getDoc(likeRef);

  const total = document.getElementById("curtidas").innerText || 0;

  if (likeSnap.exists()) {
    document.getElementById("curtirBtn").innerHTML =
      `💜 Curtido (<span id="curtidas">${total}</span>)`;
  } else {
    document.getElementById("curtirBtn").innerHTML =
      `❤️ Curtir (<span id="curtidas">${total}</span>)`;
  }
}

async function curtir(postId) {
  const usuario = pegarUsuario();

  if (!usuario) return;

  const likeId = `${postId}_${usuario}`;
  const likeRef = doc(db, "likes", likeId);
  const likeSnap = await getDoc(likeRef);

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) return;

  const post = postSnap.data();

  if (post.status && post.status !== "publicado") {
    alert("Essa matéria não está disponível para interação.");
    return;
  }

  let atual = post.curtidas || 0;

  if (likeSnap.exists()) {
    await deleteDoc(likeRef);

    const novoTotal = Math.max(atual - 1, 0);

    await updateDoc(postRef, {
      curtidas: novoTotal
    });

    document.getElementById("curtidas").innerText = novoTotal;
    document.getElementById("curtirBtn").innerHTML =
      `❤️ Curtir (<span id="curtidas">${novoTotal}</span>)`;

    return;
  }

  await setDoc(likeRef, {
    postId: postId,
    usuario: usuario,
    data: new Date()
  });

  await updateDoc(postRef, {
    curtidas: atual + 1
  });

  document.getElementById("curtidas").innerText = atual + 1;
  document.getElementById("curtirBtn").innerHTML =
    `💜 Curtido (<span id="curtidas">${atual + 1}</span>)`;
}

export function iniciarCurtidas(postId) {
  const inputUsuario = document.getElementById("usuarioWattpad");
  const usuarioSalvo = localStorage.getItem("usuarioWattpad");

  if (usuarioSalvo) {
    inputUsuario.value = usuarioSalvo;
  }

  document.getElementById("curtirBtn").onclick = () => {
    curtir(postId);
  };

  verificarCurtida(postId);
}
