import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

import {
  aplicarSeo
} from "../utils/seo.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const userParam = new URLSearchParams(window.location.search).get("user");

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
  return texto.length > limite ? texto.substring(0, limite).trim() + "..." : texto;
}

function getDataNumber(post) {
  if (post.data?.toDate) return post.data.toDate().getTime();
  if (post.data) return new Date(post.data).getTime();
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

function normalizarLink(link) {
  if (!link) return "";

  if (link.startsWith("http://") || link.startsWith("https://")) {
    return link;
  }

  return "https://" + link;
}

function renderRedes(autor) {
  const redes = autor.redes || "";

  let links = [];

  if (redes.instagram) {
    links.push(`
      <a href="${normalizarLink(redes.instagram)}" target="_blank">
        Instagram
      </a>
    `);
  }

  if (redes.wattpad) {
    links.push(`
      <a href="${normalizarLink(redes.wattpad)}" target="_blank">
        Wattpad
      </a>
    `);
  }

  if (redes.site) {
    links.push(`
      <a href="${normalizarLink(redes.site)}" target="_blank">
        Site
      </a>
    `);
  }

  if (links.length === 0) {
    return "";
  }

  return `
    <div class="autor-redes">
      ${links.join("")}
    </div>
  `;
}

function renderCardPost(post) {
  const texto = limparTexto(post.conteudo || "");

  return `
    <a href="/post.html?id=${post.id}" class="card post-card" style="text-decoration:none; color:inherit;">
      <img src="${post.imagem || "/assets/images/footer.png"}">

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

async function carregarAutor() {
  const perfilBox = document.getElementById("autorPerfil");
  const materiasBox = document.getElementById("autorMaterias");

  if (!userParam) {
    perfilBox.innerHTML = `
      <div class="card" style="padding:30px;">
        <h1>Autor não encontrado</h1>
        <p>Nenhum usuário foi informado.</p>
      </div>
    `;

    aplicarSeo({
      titulo: "Autor não encontrado",
      descricao: "Nenhum usuário foi informado."
    });

    return;
  }

  const adminsSnap = await getDocs(collection(db, "admins"));
  let autor = null;

  adminsSnap.forEach((item) => {
    const adm = item.data();

    if (
      adm.user &&
      adm.user.toLowerCase() === userParam.toLowerCase() &&
      adm.ativo !== false &&
      adm.reporter !== false
    ) {
      autor = {
        id: item.id,
        ...adm
      };
    }
  });

  if (!autor) {
    perfilBox.innerHTML = `
      <div class="card" style="padding:30px;">
        <h1>Autor não encontrado</h1>
        <p>Esse perfil não está disponível publicamente.</p>
      </div>
    `;

    aplicarSeo({
      titulo: "Autor não encontrado",
      descricao: "Esse perfil não está disponível publicamente."
    });

    return;
  }

  aplicarSeo({
    titulo: `${autor.nome || autor.user} - Autor`,
    descricao: autor.bio || `${autor.nome || autor.user} faz parte da equipe do Diário Lunar.`,
    imagem: autor.fotoUrl || "/assets/images/logo-diario-lunar.png",
    url: window.location.href,
    tipo: "profile"
  });

  perfilBox.innerHTML = `
    <div class="autor-publico-card autor-publico-card-completo">
      <img src="${autor.fotoUrl || "/assets/images/logo-vertical.png"}">

      <div>
        <p style="color:var(--azul); font-weight:bold;">✦ Perfil Lunar</p>

        <h1>${autor.nome || "Membro da equipe"}</h1>

        <p class="autor-publico-user">@${autor.user || "diario_lunar"}</p>

        <span>${autor.nomenclatura || autor.cargo || "Equipe Lunar"}</span>

        <p class="autor-cargo">${autor.cargo || "Colaborador do Diário Lunar"}</p>

        ${
          autor.bio
            ? `<p class="autor-bio">${autor.bio}</p>`
            : `<p class="autor-bio">Este autor ainda não adicionou uma bio pública.</p>`
        }

        ${renderRedes(autor)}
      </div>
    </div>
  `;

  const postsSnap = await getDocs(collection(db, "posts"));
  let posts = [];

  postsSnap.forEach((item) => {
    const post = item.data();

    if (!postEstaPublico(post)) return;

    if (
      post.autor &&
      post.autor.toLowerCase() === autor.user.toLowerCase()
    ) {
      posts.push({
        id: item.id,
        ...post,
        dataNum: getDataNumber(post)
      });
    }
  });

  posts.sort((a, b) => b.dataNum - a.dataNum);

  materiasBox.innerHTML =
    posts.length
      ? posts.map(renderCardPost).join("")
      : `
        <div class="card" style="padding:30px;">
          <h2>Nenhuma matéria publicada</h2>
          <p>Este autor ainda não possui matérias públicas disponíveis.</p>
        </div>
      `;
}

carregarAutor();
