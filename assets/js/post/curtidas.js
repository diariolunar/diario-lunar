import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function getClientId() {
  let clientId = localStorage.getItem("diarioLunarClientId");

  if (!clientId) {
    clientId =
      "user_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 12);

    localStorage.setItem("diarioLunarClientId", clientId);
  }

  return clientId;
}

function getLikeId(postId) {
  return `${postId}_${getClientId()}`;
}

function buscarBotaoCurtir() {
  return (
    document.getElementById("curtirBtn") ||
    document.getElementById("botaoCurtir") ||
    document.getElementById("likeBtn") ||
    document.getElementById("btnCurtir") ||
    document.querySelector("[data-like-btn]")
  );
}

function atualizarVisualBotao(botao, curtido) {
  if (!botao) return;

  botao.disabled = false;

  botao.innerHTML = curtido
    ? "💜 Curtido"
    : "🤍 Curtir";

  botao.classList.toggle("curtido", curtido);
}

async function usuarioJaCurtiu(postId) {
  const likeRef = doc(db, "likes", getLikeId(postId));
  const likeSnap = await getDoc(likeRef);

  return likeSnap.exists();
}

async function atualizarContador(postId) {
  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) return;

  const post = postSnap.data();
  const contador = document.getElementById("curtidas");

  if (contador) {
    contador.innerText = post.curtidas || 0;
  }
}

export async function iniciarCurtidas(postId) {
  if (!postId) return;

  const botao = buscarBotaoCurtir();

  if (!botao) {
    console.warn("Botão de curtir não encontrado.");
    return;
  }

  botao.disabled = true;

  let curtido = await usuarioJaCurtiu(postId);

  atualizarVisualBotao(botao, curtido);
  await atualizarContador(postId);

  botao.onclick = async () => {
    botao.disabled = true;

    const likeRef = doc(db, "likes", getLikeId(postId));
    const postRef = doc(db, "posts", postId);

    try {
      if (curtido) {
        await deleteDoc(likeRef);

        await updateDoc(postRef, {
          curtidas: increment(-1)
        });

        curtido = false;

      } else {
        await setDoc(likeRef, {
          postId,
          clientId: getClientId(),
          data: new Date()
        });

        await updateDoc(postRef, {
          curtidas: increment(1)
        });

        curtido = true;
      }

      atualizarVisualBotao(botao, curtido);
      await atualizarContador(postId);

    } catch (error) {
      console.error(error);
      alert("Não foi possível registrar a curtida agora.");
      botao.disabled = false;
    }
  };
}
