import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function normalizarUsuario(usuario) {
  return usuario
    .trim()
    .toLowerCase()
    .replaceAll(" ", "");
}

function pegarUsuario() {
  const inputUsuario = document.getElementById("usuarioWattpad");

  const usuario = inputUsuario.value.trim();

  if (!usuario) {
    alert("Digite seu usuário do Wattpad antes.");
    return null;
  }

  const usuarioNormalizado = normalizarUsuario(usuario);

  localStorage.setItem("usuarioWattpad", usuarioNormalizado);
  inputUsuario.value = usuarioNormalizado;

  return usuarioNormalizado;
}

function escaparHtml(valor) {
  const div = document.createElement("div");
  div.innerText = valor || "";

  return div.innerHTML;
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

  const snapshot = await getDocs(
    query(collection(db, "comentarios"), where("postId", "==", postId))
  );
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
          type="button"
          data-apagar-comentario="${item.id}"
          class="btn"
          style="margin-top:8px;"
        >
          Apagar comentário
        </button>
      `;
    }

    const usuario = escaparHtml(c.usuario || "usuario");
    const texto = escaparHtml(c.texto || "");

    div.innerHTML = `
      <strong style="color: var(--roxo);">
        @${usuario}
      </strong>

      <p style="margin:8px 0 0;">
        ${texto}
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

    const usuarioNormalizado = normalizarUsuario(usuario);

    localStorage.setItem("usuarioWattpad", usuarioNormalizado);
    inputUsuario.value = usuarioNormalizado;

    alert("Usuário salvo!");

    window.dispatchEvent(new CustomEvent("usuarioWattpadAtualizado"));

    carregarComentarios(postId);
  };

  document.getElementById("comentarBtn").onclick = () => {
    comentar(postId);
  };

  document.getElementById("listaComentarios").onclick = async (event) => {
    const botao = event.target.closest("[data-apagar-comentario]");

    if (!botao) return;

    const comentarioId = botao.dataset.apagarComentario;
    const confirmar = await window.confirmarModal({
          titulo: "Apagar comentário",
          mensagem: "Deseja apagar este comentário?",
          textoConfirmar: "Apagar"
        });

    if (!confirmar) return;

    botao.disabled = true;

    try {
      await deleteDoc(doc(db, "comentarios", comentarioId));
    } catch (error) {
      console.warn("Nao foi possivel excluir o comentario. Ocultando.", error);

      await updateDoc(doc(db, "comentarios", comentarioId), {
        status: "oculto",
        apagadoPeloUsuario: true,
        atualizadoEm: new Date()
      });
    }

    await carregarComentarios(postId);
  };

  carregarComentarios(postId);
}


