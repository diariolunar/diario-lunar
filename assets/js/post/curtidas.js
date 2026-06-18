import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function normalizarUsuario(usuario) {
  return usuario
    .trim()
    .toLowerCase()
    .replaceAll(" ", "");
}

function pegarUsuario() {
  const inputUsuario = document.getElementById("usuarioWattpad");
  const valorInput = inputUsuario?.value || "";
  const usuarioSalvo = localStorage.getItem("usuarioWattpad") || "";
  const usuario = normalizarUsuario(valorInput || usuarioSalvo);

  if (!usuario) {
    alert("Salve seu usuario do Wattpad antes de curtir.");
    inputUsuario?.focus();
    return null;
  }

  localStorage.setItem("usuarioWattpad", usuario);

  if (inputUsuario) {
    inputUsuario.value = usuario;
  }

  return usuario;
}

function getLikeId(postId, usuario) {
  return `${postId}_${encodeURIComponent(usuario)}`;
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

async function usuarioJaCurtiu(postId, usuario) {
  if (!usuario) return false;

  const likeRef = doc(db, "likes", getLikeId(postId, usuario));
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

async function atualizarEstadoUsuarioAtual(postId) {
  const botao = buscarBotaoCurtir();
  const usuario = normalizarUsuario(
    document.getElementById("usuarioWattpad")?.value ||
    localStorage.getItem("usuarioWattpad") ||
    ""
  );

  const curtido = await usuarioJaCurtiu(postId, usuario);

  atualizarVisualBotao(botao, curtido);

  return curtido;
}

export async function iniciarCurtidas(postId) {
  if (!postId) return;

  const botao = buscarBotaoCurtir();

  if (!botao) {
    console.warn("Botão de curtir não encontrado.");
    return;
  }

  botao.disabled = true;

  let curtido = await atualizarEstadoUsuarioAtual(postId);

  await atualizarContador(postId);

  const inputUsuario = document.getElementById("usuarioWattpad");

  if (inputUsuario) {
    inputUsuario.addEventListener("change", async () => {
      curtido = await atualizarEstadoUsuarioAtual(postId);
    });
  }

  window.addEventListener("usuarioWattpadAtualizado", async () => {
    curtido = await atualizarEstadoUsuarioAtual(postId);
  });

  botao.onclick = async () => {
    const usuario = pegarUsuario();

    if (!usuario) return;

    botao.disabled = true;

    const likeRef = doc(db, "likes", getLikeId(postId, usuario));
    const postRef = doc(db, "posts", postId);

    try {
      curtido = await usuarioJaCurtiu(postId, usuario);

      if (curtido) {
        await deleteDoc(likeRef);

        await updateDoc(postRef, {
          curtidas: increment(-1)
        });

        curtido = false;

      } else {
        await setDoc(likeRef, {
          postId,
          usuario,
          tipo: "post",
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
