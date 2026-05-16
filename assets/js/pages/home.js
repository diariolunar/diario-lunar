import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

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
  texto = area.value;

  return texto
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
    const agora = Date.now();

    return dataPost && dataPost <= agora;
  }

  return false;
}

function preloadImagem(url) {
  if (!url) return;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "image";
  link.href = url;

  document.head.appendChild(link);
}

function criarCardPost(post) {
  const textoLimpo = limparTexto(post.conteudo);
  const imagem = post.imagem || "/assets/images/footer.png";

  return `
    <a
      href="/post.html?id=${post.id}"
      class="card post-card"
      style="text-decoration:none; color:inherit;"
    >
      <img
        src="${imagem}"
        alt="${post.titulo || "Matéria"}"
        loading="lazy"
        decoding="async"
        onerror="this.src='/assets/images/footer.png'"
      >

      <div class="post-card-content">
        <small>${post.categoria || "Matéria"}</small>

        <h3>${post.titulo || ""}</h3>

        <p>${cortarTexto(textoLimpo, 100)}</p>

        <span class="card-info">
          👁️ ${post.views || 0} · 💜 ${post.curtidas || 0}
        </span>
      </div>
    </a>
  `;
}

async function carregarHome() {
  const snapshot = await getDocs(collection(db, "posts"));
  const container = document.getElementById("posts");
  const maisLidasContainer = document.getElementById("maisLidas");
  const heroImagem = document.getElementById("heroImagem");

  container.innerHTML = "";
  maisLidasContainer.innerHTML = "";

  let listaPosts = [];

  snapshot.forEach((docItem) => {
    const post = docItem.data();

    if (!postEstaPublico(post)) {
      return;
    }

    listaPosts.push({
      id: docItem.id,
      ...post,
      dataNum: getDataNumber(post)
    });
  });

  listaPosts.sort((a, b) => b.dataNum - a.dataNum);

  if (listaPosts.length === 0) {
    document.getElementById("heroTitulo").innerText =
      "Nenhuma matéria publicada ainda";

    document.getElementById("heroResumo").innerText =
      "Publique a primeira matéria pelo painel ADM.";

    container.innerHTML = "<p>Nenhuma matéria publicada ainda.</p>";
    maisLidasContainer.innerHTML = "<p>Nenhuma matéria publicada ainda.</p>";
    return;
  }

  const destaques = listaPosts.filter((post) => post.destaque === true);

  const destaque =
    destaques.length > 0
      ? destaques.sort((a, b) => b.dataNum - a.dataNum)[0]
      : listaPosts[0];

  const imagemDestaque =
    destaque.imagem || "/assets/images/footer.png";

  preloadImagem(imagemDestaque);

  const textoDestaque = limparTexto(destaque.conteudo);

  heroImagem.loading = "eager";
  heroImagem.fetchPriority = "high";
  heroImagem.decoding = "async";
  heroImagem.alt = destaque.titulo || "Matéria destaque";
  heroImagem.onerror = () => {
    heroImagem.src = "/assets/images/footer.png";
  };
  heroImagem.src = imagemDestaque;

  document.getElementById("heroCategoria").innerText =
    destaque.categoria || "Matéria";

  document.getElementById("heroTitulo").innerText =
    destaque.titulo || "";

  document.getElementById("heroResumo").innerText =
    cortarTexto(textoDestaque, 160);

  document.getElementById("heroCard").onclick = () => {
    window.location.href = `/post.html?id=${destaque.id}`;
  };

  container.innerHTML =
    listaPosts
      .filter((post) => post.id !== destaque.id)
      .slice(0, 8)
      .map(criarCardPost)
      .join("");

  const maisLidas = [...listaPosts]
    .sort((a, b) => (b.views || 0) - (a.views || 0))
    .slice(0, 4);

  maisLidasContainer.innerHTML =
    maisLidas.length
      ? maisLidas.map(criarCardPost).join("")
      : "<p>Ainda não há visualizações registradas.</p>";
}

carregarHome();
