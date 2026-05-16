import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const container = document.getElementById("posts");
const buscaInput = document.getElementById("buscaMaterias");
const filtroCategoria = document.getElementById("filtroCategoria");
const resultadoBusca = document.getElementById("resultadoBusca");
const carregarMaisBtn = document.getElementById("carregarMaisBtn");

let todasMaterias = [];
let materiasFiltradas = [];
let quantidadeVisivel = 0;

const QUANTIDADE_POR_PAGINA = 8;

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

function normalizarTexto(texto) {
  return (texto || "")
    .toString()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function cortarTexto(texto, limite) {
  if (!texto) return "";

  if (texto.length > limite) {
    return texto.substring(0, limite).trim() + "...";
  }

  return texto;
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
    const agora = Date.now();

    return dataPost && dataPost <= agora;
  }

  return false;
}

function mostrarSkeleton() {
  container.innerHTML = "";

  for (let i = 0; i < 8; i++) {
    const div = document.createElement("div");
    div.className = "skeleton-card";

    div.innerHTML = `
      <div class="skeleton skeleton-img"></div>
      <div class="skeleton-content">
        <div class="skeleton skeleton-line small"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line medium"></div>
      </div>
    `;

    container.appendChild(div);
  }
}

function criarCard(post, index = 0) {
  const texto = limparTexto(post.conteudo || "");
  const imagem = post.imagem || "/assets/images/footer.png";

  const loading = index < 2 ? "eager" : "lazy";
  const fetchPriority = index < 2 ? "high" : "auto";

  return `
    <a
      href="/post.html?id=${post.id}"
      class="card post-card"
      style="text-decoration:none; color:inherit;"
    >
      <img
        src="${imagem}"
        alt="${post.titulo || "Matéria"}"
        loading="${loading}"
        fetchpriority="${fetchPriority}"
        decoding="async"
        onerror="this.src='/assets/images/footer.png'"
      >

      <div class="post-card-content">
        <small>${post.categoria || "Matéria"}</small>

        <h3>${post.titulo || ""}</h3>

        <p>${cortarTexto(texto, 120)}</p>

        <span class="card-info">
          👁️ ${post.views || 0} · 💜 ${post.curtidas || 0}
        </span>
      </div>
    </a>
  `;
}

function aplicarFiltros() {
  const termo = normalizarTexto(buscaInput.value);
  const categoria = filtroCategoria.value;

  materiasFiltradas = todasMaterias.filter((post) => {
    const textoCompleto = normalizarTexto(`
      ${post.titulo || ""}
      ${post.categoria || ""}
      ${post.autor || ""}
      ${limparTexto(post.conteudo || "")}
    `);

    const bateBusca = !termo || textoCompleto.includes(termo);
    const bateCategoria = categoria === "Todas" || post.categoria === categoria;

    return bateBusca && bateCategoria;
  });

  quantidadeVisivel = QUANTIDADE_POR_PAGINA;
  renderizarMaterias();
}

function renderizarMaterias() {
  const materiasParaMostrar = materiasFiltradas.slice(0, quantidadeVisivel);

  container.innerHTML = "";

  if (materiasFiltradas.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Nenhuma matéria encontrada</h2>
        <p>Tente buscar por outro termo ou escolher outra categoria.</p>
      </div>
    `;

    resultadoBusca.innerText = "Nenhum resultado encontrado.";
    carregarMaisBtn.style.display = "none";
    return;
  }

  container.innerHTML =
    materiasParaMostrar
      .map((post, index) => criarCard(post, index))
      .join("");

  resultadoBusca.innerText =
    `${materiasFiltradas.length} matéria(s) encontrada(s).`;

  carregarMaisBtn.style.display =
    quantidadeVisivel < materiasFiltradas.length
      ? "inline-block"
      : "none";
}

async function carregarMaterias() {
  mostrarSkeleton();

  const snap = await getDocs(collection(db, "posts"));

  todasMaterias = [];

  snap.forEach((d) => {
    const post = d.data();

    if (!postEstaPublico(post)) {
      return;
    }

    todasMaterias.push({
      id: d.id,
      ...post,
      dataNum: getDataNumber(post)
    });
  });

  todasMaterias.sort((a, b) => b.dataNum - a.dataNum);

  materiasFiltradas = [...todasMaterias];
  quantidadeVisivel = QUANTIDADE_POR_PAGINA;

  renderizarMaterias();
}

buscaInput.addEventListener("input", aplicarFiltros);
filtroCategoria.addEventListener("change", aplicarFiltros);

carregarMaisBtn.onclick = () => {
  quantidadeVisivel += QUANTIDADE_POR_PAGINA;
  renderizarMaterias();
};

carregarMaterias();
