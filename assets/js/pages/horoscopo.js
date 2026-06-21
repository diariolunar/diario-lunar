import { db } from "../config/firebase.js";

import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const container = document.getElementById("horoscopoPosts");

function normalizar(texto) {
  return (texto || "")
    .toString()
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

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

  return texto.length > limite
    ? texto.substring(0, limite).trim() + "..."
    : texto;
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

function ehHoroscopo(post) {
  const categoria = normalizar(post.categoria);

  return categoria === "horoscopo" || categoria === "horoscopo lunar";
}

function criarCardHoroscopo(post, index = 0) {
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
        alt="${post.titulo || "Horóscopo"}"
        loading="${loading}"
        fetchpriority="${fetchPriority}"
        decoding="async"
        onerror="this.src='/assets/images/footer.png'"
      >

      <div class="post-card-content">
        <small>${post.categoria || "Horóscopo"}</small>

        <h3>${post.titulo || "Horóscopo da semana"}</h3>

        <p>${cortarTexto(texto, 130)}</p>

        <span class="card-info">
          ${post.views || 0} visualizações · ${post.curtidas || 0} curtidas
        </span>
      </div>
    </a>
  `;
}

function mostrarSkeleton() {
  container.innerHTML = Array.from({ length: 4 }).map(() => `
    <div class="skeleton-card">
      <div class="skeleton skeleton-img"></div>

      <div class="skeleton-content">
        <div class="skeleton skeleton-line small"></div>
        <div class="skeleton skeleton-line"></div>
        <div class="skeleton skeleton-line medium"></div>
      </div>
    </div>
  `).join("");
}

async function carregarHoroscopo() {
  try {
    mostrarSkeleton();

    const snap = await getDocs(
      query(collection(db, "posts"), where("status", "in", ["publicado", "agendado"]))
    );
    let posts = [];

    snap.forEach((item) => {
      const post = item.data();

      if (!postEstaPublico(post) || !ehHoroscopo(post)) {
        return;
      }

      posts.push({
        id: item.id,
        ...post,
        dataNum: getDataNumber(post)
      });
    });

    posts.sort((a, b) => b.dataNum - a.dataNum);

    if (posts.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>Nenhum horóscopo publicado ainda</h2>

          <p>
            Publique matérias na categoria Horóscopo para que elas apareçam aqui.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      posts.map((post, index) => criarCardHoroscopo(post, index)).join("");

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h2>Erro ao carregar Horóscopo</h2>
        <p>${error.message || "Verifique as regras do Firestore."}</p>
      </div>
    `;
  }
}

carregarHoroscopo();
