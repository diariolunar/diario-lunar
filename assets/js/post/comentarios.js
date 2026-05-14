import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  deleteDoc
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

async function comentar(postId) {
  const usuario = pegarUsuario();

  if (!usuario) return;

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (
    !postSnap.exists() ||
    (
      postSnap.data().status &&
      postSnap.data().status !== "publicado"
    )
  ) {
    alert("Essa matéria não está disponível para comentários.");
    return;
  }

  const texto = document.getElementById("comentarioInput").value.trim();

  if (!texto) {
    alert("Escreva um comentário.");
    return;
  }

  await addDoc(collection(db, "comentarios"), {
    postId: postId,
    usuario: usuario,
    texto: texto,
    status: "aprovado",
    data: new Date()
  });

  document.getElementById("comentarioInput").value = "";

  carregarComentarios(postId);
}

async function carregarComentarios(postId) {
  const inputUsuario = document.getElementById("usuarioWattpad");

  const usuarioAtual = inputUsuario.value
    .trim()
    .toLowerCase()
    .replaceAll(" ", "");

  const snapshot = await getDocs(collection(db, "comentarios"));
  const container = document.getElementById("listaComentarios");

  container.innerHTML = "";

  snapshot.forEach((item) => {
    const c = item.data();

    if (c.postId !== postId) return;

    if (c.status === "oculto") return;

    const div = document.createElement("div");
    div.className = "comentario";

    let botaoExcluir = "";

    if (usuarioAtual && c.usuario === usuarioAtual) {
      botaoExcluir = `
        <button
          onclick="apagarComentario('${item.id}', '${postId}')"
          class="btn"
          style="margin-top:8px;"
        >
          Apagar comentário
        </button>
      `;
    }

    div.innerHTML = `
      <strong style="color: var(--roxo);">
        @${c.usuario}
      </strong>

      <p style="margin:8px 0 0;">
        ${c.texto}
      </p>

      ${botaoExcluir}
    `;

    container.appendChild(div);
  });
}

export function iniciarComentarios(postId) {
  const inputUsuario = document.getElementById("usuarioWattpad");
  const usuarioSalvo = localStorage.getItem("usuarioWattpad");

  if (usuarioSalvo) {
    inputUsuario.value = usuarioSalvo;
  }

  document.getElementById("salvarUsuarioBtn").onclick = () => {
    const usuario = inputUsuario.value.trim();

    if (!usuario) {
      alert("Digite seu usuário do Wattpad.");
      return;
    }

    localStorage.setItem("usuarioWattpad", usuario);

    alert("Usuário salvo!");

    carregarComentarios(postId);
  };

  document.getElementById("comentarBtn").onclick = () => {
    comentar(postId);
  };

  window.apagarComentario = async function (comentarioId, postIdAtual) {
    const confirmar = confirm("Deseja apagar este comentário?");

    if (!confirmar) return;

    await deleteDoc(doc(db, "comentarios", comentarioId));

    carregarComentarios(postIdAtual);
  };

  carregarComentarios(postId);
}
