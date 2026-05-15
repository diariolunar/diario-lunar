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
  if (!url || !url.includes("drive.google.com")) {
    return "";
  }

  const match = url.match(/\/d\/([^/]+)/);

  if (match && match[1]) {
    return match[1];
  }

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

function montarPlayer(audioUrl) {
  const id = extrairIdDrive(audioUrl);

  if (id) {
    return `
      <iframe
        src="https://drive.google.com/file/d/${id}/preview"
        width="100%"
        height="90"
        allow="autoplay"
        style="border:0; border-radius:16px; margin-top:15px;"
      ></iframe>
    `;
  }

  if (audioUrl) {
    return `
      <audio controls style="width:100%; margin-top:15px;">
        <source src="${audioUrl}">
        Seu navegador não suporta reprodução de áudio.
      </audio>
    `;
  }

  return `
    <p style="color:#991b1b; font-weight:bold;">
      Áudio não informado.
    </p>
  `;
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

function criarCardAudiobook(audio) {
  const capaUrl = montarImagemCapa(audio.capa || "");
  const audioUrl = audio.audioUrl || audio.linkAudio || "";

  return `
    <div class="card post-card">
      <img
        src="${capaUrl}"
        alt="${audio.titulo || "Audiobook"}"
        onerror="this.src='/assets/images/footer.png'"
      >

      <div class="post-card-content">
        <small>${audio.categoria || "Audiobook"}</small>

        <h3>${audio.titulo || "Sem título"}</h3>

        <p>${audio.autor ? `Por ${audio.autor}` : "Autor não informado"}</p>

        ${audio.descricao ? `<p>${audio.descricao}</p>` : ""}

        ${montarPlayer(audioUrl)}
      </div>
    </div>
  `;
}

async function carregarAudiobooks() {
  try {
    container.innerHTML = "<p>Carregando audiobooks...</p>";

    const snap = await getDocs(collection(db, "audiobooks"));

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
          <h2>Nenhum audiobook publicado ainda</h2>
          <p>Quando houver audiobooks disponíveis, eles aparecerão aqui.</p>
        </div>
      `;

      return;
    }

    container.innerHTML = lista.map(criarCardAudiobook).join("");

  } catch (error) {
    console.error(error);

    container.innerHTML = `
      <div class="empty-state">
        <h2>Erro ao carregar audiobooks</h2>
        <p>${error.message || "Verifique as regras do Firestore e o nome da coleção."}</p>
      </div>
    `;
  }
}

carregarAudiobooks();
