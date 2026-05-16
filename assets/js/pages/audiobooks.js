import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const container = document.getElementById("audiobooks");

function extrairIdDrive(url) {
  if (!url || !url.includes("drive.google.com")) return "";

  const match = url.match(/\/d\/([^/]+)/);

  if (match && match[1]) return match[1];

  try {
    const params = new URLSearchParams(url.split("?")[1]);
    return params.get("id") || "";
  } catch {
    return "";
  }
}

function montarImagemCapa(url) {
  const id = extrairIdDrive(url);

  if (id) {
    return `https://drive.google.com/thumbnail?id=${id}&sz=w1200`;
  }

  return url || "/assets/images/footer.png";
}

function getDataNumber(item) {
  if (item.data?.toDate) return item.data.toDate().getTime();
  if (item.data) return new Date(item.data).getTime();
  return 0;
}

function criarCardAudiobook(audio) {
  const capaUrl = montarImagemCapa(audio.capa || "");

  return `
    <a
      href="/audiobook.html?id=${audio.id}"
      class="audiobook-card"
      style="text-decoration:none; color:inherit;"
    >
      <div class="audiobook-image">
        <img
          src="${capaUrl}"
          alt="${audio.titulo || "Audiobook"}"
          onerror="this.src='/assets/images/footer.png'"
        >
      </div>

      <div class="audiobook-content">
        <small class="audiobook-tag">
          ${audio.categoria || "Audiobook"}
        </small>

        <h3 class="audiobook-title">
          ${audio.titulo || "Sem título"}
        </h3>

        <p class="audiobook-author">
          ${audio.autor ? `Autor: ${audio.autor}` : "Autor não informado"}
        </p>

        <p class="audiobook-narrator">
          ${audio.narrador ? `Gravado por: ${audio.narrador}` : "Gravado por: não informado"}
        </p>

        <p style="margin-top:16px; color:#7c3aed; font-weight:bold;">
          Clique para ouvir →
        </p>
      </div>
    </a>
  `;
}

async function carregarAudiobooks() {
  try {
    container.innerHTML = "<p>Carregando audiobooks...</p>";

    const snap = await getDocs(collection(db, "audiobooks"));

    let lista = [];

    snap.forEach((item) => {
      const audio = item.data();

      if (audio.status && audio.status !== "publicado") return;

      lista.push({
        id: item.id,
        ...audio,
        dataNum: getDataNumber(audio)
      });
    });

    lista.sort((a, b) => b.dataNum - a.dataNum);

    if (lista.length === 0) {
      container.innerHTML = `
        <div class="empty-state">
          <h2>Nenhum audiobook publicado ainda</h2>
          <p>Quando houver audiobooks disponíveis, eles aparecerão aqui.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="audiobooks-grid">
        ${lista.map(criarCardAudiobook).join("")}
      </div>

      <style>
        .audiobooks-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(320px,320px));
          gap:28px;
          align-items:start;
          justify-content:flex-start;
        }

        .audiobook-card{
          background:#ffffff;
          border-radius:28px;
          overflow:hidden;
          box-shadow:0 10px 35px rgba(0,0,0,0.08);
          transition:0.25s;
        }

        .audiobook-card:hover{
          transform:translateY(-4px);
          box-shadow:0 18px 45px rgba(0,0,0,0.12);
        }

        .audiobook-image{
          aspect-ratio:3/4;
          overflow:hidden;
          background:#111827;
        }

        .audiobook-image img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .audiobook-content{
          padding:26px;
        }

        .audiobook-tag{
          color:#7c3aed;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:0.5px;
          font-size:13px;
        }

        .audiobook-title{
          margin-top:12px;
          font-size:30px;
          line-height:1.1;
          color:#07101f;
        }

        .audiobook-author,
        .audiobook-narrator{
          margin-top:12px;
          font-size:17px;
          color:#374151;
        }

        @media(max-width:700px){
          .audiobooks-grid{
            grid-template-columns:1fr;
          }
        }
      </style>
    `;

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h2>Erro ao carregar audiobooks</h2>
        <p>${error.message || "Verifique as regras do Firestore."}</p>
      </div>
    `;
  }
}

carregarAudiobooks();
