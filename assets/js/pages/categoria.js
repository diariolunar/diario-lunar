import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const params = new URLSearchParams(window.location.search);

const tipo =
  params.get("tipo") ||
  params.get("categoria") ||
  params.get("cat") ||
  "Literatura";

document.getElementById("nomeCategoria").innerText = tipo;

const descricoes = {
  Literatura:
    "Matérias sobre livros, narrativas, leitura e construção literária.",

  Comunidade:
    "Notícias, ações e movimentos da comunidade Lunar.",

  Resenhas:
    "Leituras comentadas, análises e impressões sobre obras em destaque.",

  Entrevistas:
    "Conversas com autores, leitores e criadores da comunidade.",

  Autores:
    "Destaques, perfis e trajetórias de quem escreve.",

  Eventos:
    "Chamadas, encontros, ações e novidades especiais.",

  "Destaques Lunar":
    "Obras, projetos e conteúdos selecionados pelo Diário Lunar."
};

document.getElementById("descricaoCategoria").innerText =
  descricoes[tipo] || "Conteúdos selecionados do Diário Lunar.";

function limparTexto(html) {
  let texto = html || "";

  texto = texto
    .replace(/<\/p>/gi, "\n")
    .replace(/<div>/gi, "\n")
    .replace(/<\/div>/gi, "\n")
    .replace(/<br\s*\/?>/gi, "\n");

  texto = texto.replace(/<[^>]*>/g, "");

  const area = document.createElement("textarea");
  area.innerHTML = texto;

  return area.value
    .replace(/\n\s*\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .trim();
}

function cortarTexto(texto, limite) {
  if (!texto) return "";

  if (texto.length <= limite) {
    return texto;
  }

  return texto.substring(0, limite).trim() + "...";
}

function getDataNumber(post) {
  if (post.data?.toDate) {
    return post.data.toDate().getTime();
  }

  if (post.data) {
    return new Date(post.data).getTime();
  }

  return 0;
}

function postEstaPublico(post) {
  const status = post.status || "rascunho";

  if (status === "publicado") {
    return true;
  }

  if (status === "agendado") {
    const dataPost = getDataNumber(post);
    return dataPost && dataPost <= Date.now();
  }

  return false;
}

function normalizar(texto) {
  return (texto || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function carregarCategoria() {
  const container = document.getElementById("posts");

  container.innerHTML = "<p>Carregando matérias...</p>";

  const snapshot = await getDocs(collection(db, "posts"));

  let posts = [];

  snapshot.forEach((docItem) => {
    const post = docItem.data();

    if (!postEstaPublico(post)) {
      return;
    }

    if (normalizar(post.categoria) === normalizar(tipo)) {
      posts.push({
        id: docItem.id,
        ...post,
        dataNum: getDataNumber(post)
      });
    }
  });

  posts.sort((a, b) => b.dataNum - a.dataNum);

  if (posts.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Nenhuma matéria encontrada</h2>

        <p>
          Ainda não existem publicações disponíveis nesta categoria.
        </p>
      </div>
    `;

    return;
  }

  container.innerHTML = posts.map((post) => {
    const textoLimpo = limparTexto(post.conteudo || "");

    return `
      <a
        href="/post.html?id=${post.id}"
        class="card post-card"
        style="text-decoration:none; color:inherit;"
      >
        <img src="${post.imagem || "/assets/images/footer.png"}">

        <div class="post-card-content">
          <small>${post.categoria || "Matéria"}</small>

          <h3>${post.titulo || ""}</h3>

          <p>${cortarTexto(textoLimpo, 120)}</p>

          <span class="card-info">
            👁️ ${post.views || 0} · 💜 ${post.curtidas || 0}
          </span>
        </div>
      </a>
    `;
  }).join("");
}

carregarCategoria();
