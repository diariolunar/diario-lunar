import { db } from "../config/firebase.js";

import { postEstaPublico } from "../utils/posts.js";

import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  updateDoc,
  arrayUnion,
  arrayRemove
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function normalizarUsuario(usuario) {
  return usuario
    .trim()
    .toLowerCase()
    .replace(/^@+/, "")
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

  if (!postSnap.exists() || !postEstaPublico(postSnap.data())) {
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
    curtidasPor: [],
    status: "aprovado",
    data: new Date()
  });

  document.getElementById("comentarioInput").value = "";

  carregarComentarios(postId);
}

function obterDataEmMs(valor) {
  if (valor?.toDate) return valor.toDate().getTime();

  const data = new Date(valor || 0).getTime();
  return Number.isNaN(data) ? 0 : data;
}

function formatarData(valor) {
  const data = valor?.toDate ? valor.toDate() : new Date(valor || 0);

  if (Number.isNaN(data.getTime())) return "";

  return data.toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  });
}

function criarComentarioHtml(comentario, usuarioAtual, resposta = false) {
  const curtidas = Array.isArray(comentario.curtidasPor)
    ? comentario.curtidasPor
    : [];
  const curtido = usuarioAtual && curtidas.includes(usuarioAtual);
  const podeExcluir = usuarioAtual && comentario.usuario === usuarioAtual;
  const usuario = escaparHtml(
    String(comentario.usuario || "usuario").replace(/^@+/, "")
  );
  const texto = escaparHtml(comentario.texto || "");
  const data = formatarData(comentario.data);

  return `
    <article class="comentario ${resposta ? "comentario-resposta" : ""}">
      <strong class="comentario-autor">@${usuario}</strong>
      <p class="comentario-texto">${texto}</p>
      ${data ? `<small class="comentario-data">${data}</small>` : ""}

      <div class="comentario-acoes">
        <button
          type="button"
          class="comentario-acao ${curtido ? "comentario-acao-ativa" : ""}"
          data-curtir-comentario="${comentario.id}"
          aria-label="${curtido ? "Remover curtida" : "Curtir comentário"}"
        >
          <i class="${curtido ? "fa-solid" : "fa-regular"} fa-heart" aria-hidden="true"></i>
          <span>${curtidas.length}</span>
        </button>

        ${!resposta ? `
          <button
            type="button"
            class="comentario-acao"
            data-responder-comentario="${comentario.id}"
          >
            <i class="fa-regular fa-comment" aria-hidden="true"></i>
            Responder
          </button>
        ` : ""}

        ${podeExcluir ? `
          <button
            type="button"
            class="comentario-acao comentario-acao-perigo"
            data-apagar-comentario="${comentario.id}"
          >
            <i class="fa-regular fa-trash-can" aria-hidden="true"></i>
            Apagar
          </button>
        ` : ""}
      </div>

      ${!resposta ? `
        <form class="comentario-resposta-form" data-form-resposta="${comentario.id}" hidden>
          <label for="resposta-${comentario.id}">Responder a @${usuario}</label>
          <textarea
            id="resposta-${comentario.id}"
            data-resposta-texto
            maxlength="1000"
            placeholder="Escreva sua resposta..."
          ></textarea>
          <div class="comentario-resposta-botoes">
            <button type="button" class="btn btn-outline" data-cancelar-resposta>Cancelar</button>
            <button type="submit" class="btn">Responder</button>
          </div>
        </form>
        <div class="comentario-respostas" data-respostas-de="${comentario.id}"></div>
      ` : ""}
    </article>
  `;
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

  const comentarios = [];
  snapshot.forEach((item) => {
    const c = item.data();

    if (c.postId !== postId) return;
    if (c.status === "oculto") return;
    comentarios.push({ id: item.id, ...c });
  });

  comentarios.sort((a, b) => obterDataEmMs(a.data) - obterDataEmMs(b.data));

  const principais = comentarios.filter((comentario) => !comentario.parentId);
  const respostasPorComentario = new Map();

  comentarios
    .filter((comentario) => comentario.parentId)
    .forEach((comentario) => {
      const respostas = respostasPorComentario.get(comentario.parentId) || [];
      respostas.push(comentario);
      respostasPorComentario.set(comentario.parentId, respostas);
    });

  container.innerHTML = principais.length
    ? principais.map((comentario) => criarComentarioHtml(
        comentario,
        usuarioAtual
      )).join("")
    : '<p class="comentarios-vazio">Nenhum comentário ainda. Seja o primeiro a comentar.</p>';

  principais.forEach((comentario) => {
    const respostas = respostasPorComentario.get(comentario.id) || [];
    const box = container.querySelector(`[data-respostas-de="${comentario.id}"]`);

    if (box) {
      box.innerHTML = respostas.map((resposta) => criarComentarioHtml(
        resposta,
        usuarioAtual,
        true
      )).join("");
    }
  });
}

async function curtirComentario(comentarioId, postId) {
  const usuario = pegarUsuario();
  if (!usuario) return;

  const comentarioRef = doc(db, "comentarios", comentarioId);
  const comentarioSnap = await getDoc(comentarioRef);

  if (!comentarioSnap.exists() || comentarioSnap.data().status === "oculto") {
    alert("Esse comentário não está mais disponível.");
    return;
  }

  const curtidas = comentarioSnap.data().curtidasPor || [];
  await updateDoc(comentarioRef, {
    curtidasPor: curtidas.includes(usuario)
      ? arrayRemove(usuario)
      : arrayUnion(usuario)
  });

  await carregarComentarios(postId);
}

async function responderComentario(comentarioId, texto, postId) {
  const usuario = pegarUsuario();
  if (!usuario) return;

  const resposta = texto.trim();

  if (!resposta) {
    alert("Escreva uma resposta.");
    return;
  }

  const [postSnap, comentarioSnap] = await Promise.all([
    getDoc(doc(db, "posts", postId)),
    getDoc(doc(db, "comentarios", comentarioId))
  ]);

  if (
    !postSnap.exists() ||
    !postEstaPublico(postSnap.data()) ||
    !comentarioSnap.exists() ||
    comentarioSnap.data().status === "oculto"
  ) {
    alert("Não foi possível responder a esse comentário.");
    return;
  }

  await addDoc(collection(db, "comentarios"), {
    postId,
    parentId: comentarioId,
    usuario,
    texto: resposta,
    curtidasPor: [],
    status: "aprovado",
    data: new Date()
  });

  await carregarComentarios(postId);
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

  const listaComentarios = document.getElementById("listaComentarios");

  listaComentarios.onclick = async (event) => {
    const botaoCurtir = event.target.closest("[data-curtir-comentario]");
    const botaoResponder = event.target.closest("[data-responder-comentario]");
    const botaoCancelar = event.target.closest("[data-cancelar-resposta]");
    const botao = event.target.closest("[data-apagar-comentario]");

    if (botaoCurtir) {
      botaoCurtir.disabled = true;

      try {
        await curtirComentario(botaoCurtir.dataset.curtirComentario, postId);
      } catch (error) {
        console.error(error);
        alert("Não foi possível curtir o comentário agora.");
        botaoCurtir.disabled = false;
      }
      return;
    }

    if (botaoResponder) {
      const form = listaComentarios.querySelector(
        `[data-form-resposta="${botaoResponder.dataset.responderComentario}"]`
      );

      if (form) {
        form.hidden = !form.hidden;
        if (!form.hidden) form.querySelector("textarea")?.focus();
      }
      return;
    }

    if (botaoCancelar) {
      botaoCancelar.closest("form").hidden = true;
      return;
    }

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
      const respostas = await getDocs(
        query(
          collection(db, "comentarios"),
          where("parentId", "==", comentarioId)
        )
      );

      await Promise.all(
        respostas.docs.map((resposta) => deleteDoc(resposta.ref))
      );
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

  listaComentarios.onsubmit = async (event) => {
    const form = event.target.closest("[data-form-resposta]");
    if (!form) return;

    event.preventDefault();
    const botaoEnviar = form.querySelector('[type="submit"]');
    botaoEnviar.disabled = true;

    try {
      await responderComentario(
        form.dataset.formResposta,
        form.querySelector("[data-resposta-texto]").value,
        postId
      );
    } catch (error) {
      console.error(error);
      alert("Não foi possível enviar a resposta agora.");
      botaoEnviar.disabled = false;
    }
  };

  carregarComentarios(postId);
}
