import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const container = document.getElementById("trilhasSonoras");

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
  if (item.data?.toDate) {
    return item.data.toDate().getTime();
  }

  if (item.data) {
    return new Date(item.data).getTime();
  }

  return 0;
}

function criarCardTrilhaSonora(audio, index = 0) {
  const capaUrl = montarImagemCapa(audio.capa || "");

  const loading = index < 2 ? "eager" : "lazy";
  const fetchPriority = index < 2 ? "high" : "auto";

  return `
    <a
      href="/trilha-sonora.html?id=${audio.id}"
      class="trilha-card"
      style="text-decoration:none; color:inherit;"
    >
      <div class="trilha-image">
        <img
          src="${capaUrl}"
          alt="${audio.titulo || "Trilha Sonora"}"
          loading="${loading}"
          fetchpriority="${fetchPriority}"
          decoding="async"
          onerror="this.src='/assets/images/footer.png'"
        >
      </div>

      <div class="trilha-content">

        <small class="trilha-tag">
          ${audio.categoria || "Trilha Sonora"}
        </small>

        <h3 class="trilha-title">
          ${audio.titulo || "Sem título"}
        </h3>

        <p class="trilha-author">
          ${
            audio.autor
              ? `Autor: ${audio.autor}`
              : "Autor não informado"
          }
        </p>

        <p class="trilha-narrator">
          ${
            audio.produtor
              ? `Produzido por: ${audio.produtor}`
              : "Produzido por: não informado"
          }
        </p>

        <p style="margin-top:16px; color:#7c3aed; font-weight:bold;">
          Clique para ouvir →
        </p>

      </div>
    </a>
  `;
}

async function carregarTrilhasSonoras() {
  try {
    container.innerHTML = `
      <div class="trilhasSonoras-grid">
        ${Array.from({ length: 4 }).map(() => `
          <div class="skeleton-card">
            <div class="skeleton skeleton-img"></div>

            <div class="skeleton-content">
              <div class="skeleton skeleton-line small"></div>
              <div class="skeleton skeleton-line"></div>
              <div class="skeleton skeleton-line"></div>
              <div class="skeleton skeleton-line medium"></div>
            </div>
          </div>
        `).join("")}
      </div>
    `;

    const snap = await getDocs(collection(db, "trilhasSonoras"));

    let lista = [];

    snap.forEach((item) => {
      const audio = item.data();

      if (audio.status && audio.status !== "publicado") {
        return;
      }

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
          <h2>Nenhuma trilha publicada ainda</h2>

          <p>
            Quando houver trilhas sonoras disponíveis,
            elas aparecerão aqui.
          </p>
        </div>
      `;

      return;
    }

    container.innerHTML = `
      <div class="trilhasSonoras-grid">
        ${lista.map((audio, index) =>
          criarCardTrilhaSonora(audio, index)
        ).join("")}
      </div>

      <style>

        .trilhasSonoras-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(320px,320px));
          gap:28px;
          align-items:start;
          justify-content:flex-start;
        }

        .trilha-card{
          background:#ffffff;
          border-radius:8px;
          overflow:hidden;
          box-shadow:0 10px 35px rgba(0,0,0,0.08);
          transition:0.25s;
        }

        .trilha-card:hover{
          transform:translateY(-4px);
          box-shadow:0 18px 45px rgba(0,0,0,0.12);
        }

        .trilha-image{
          aspect-ratio:3/4;
          overflow:hidden;
          background:#111827;
        }

        .trilha-image img{
          width:100%;
          height:100%;
          object-fit:cover;
          display:block;
        }

        .trilha-content{
          padding:26px;
        }

        .trilha-tag{
          color:#7c3aed;
          font-weight:800;
          text-transform:uppercase;
          letter-spacing:0.5px;
          font-size:13px;
        }

        .trilha-title{
          margin-top:12px;
          font-size:30px;
          line-height:1.1;
          color:#07101f;
        }

        .trilha-author,
        .trilha-narrator{
          margin-top:12px;
          font-size:17px;
          color:#374151;
        }

        @media(max-width:700px){

          .trilhasSonoras-grid{
            grid-template-columns:1fr;
          }

          .trilha-title{
            font-size:28px;
          }

        }

      </style>
    `;

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h2>Erro ao carregar trilhas sonoras</h2>

        <p>
          ${
            error.message ||
            "Verifique as regras do Firestore."
          }
        </p>
      </div>
    `;
  }
}

carregarTrilhasSonoras();

