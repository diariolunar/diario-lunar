import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  updateDoc,
  increment,
  collection,
  addDoc,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const container = document.getElementById("audiobookDetalhe");

const params = new URLSearchParams(window.location.search);
const audiobookId = params.get("id");

function getClientId() {
  let clientId = localStorage.getItem("diarioLunarClientId");

  if (!clientId) {
    clientId =
      "user_" +
      Date.now() +
      "_" +
      Math.random().toString(36).substring(2, 12);

    localStorage.setItem("diarioLunarClientId", clientId);
  }

  return clientId;
}

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

function montarPlayer(audioUrl) {
  const id = extrairIdDrive(audioUrl);

  if (id) {
    return `
      <iframe
        src="https://drive.google.com/file/d/${id}/preview"
        width="100%"
        height="120"
        allow="autoplay"
        class="audio-player-frame"
      ></iframe>
    `;
  }

  if (audioUrl) {
    return `
      <audio controls class="audio-player-native">
        <source src="${audioUrl}">
        Seu navegador não suporta reprodução de áudio.
      </audio>
    `;
  }

  return `
    <p class="audio-error">
      Áudio não informado.
    </p>
  `;
}

function formatarData(data) {
  if (!data) return "Sem data";

  try {
    if (data.toDate) {
      return data.toDate().toLocaleDateString("pt-BR");
    }

    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return "Sem data";
  }
}

function comentarioVisivel(comentario) {
  return comentario.status !== "oculto";
}

async function carregarComentarios() {
  const box = document.getElementById("comentariosAudiobookLista");

  if (!box) return;

  const snap = await getDocs(collection(db, "comentarios"));

  let comentarios = [];

  snap.forEach((item) => {
    const comentario = item.data();

    if (
      comentario.postId === `audiobook_${audiobookId}` &&
      comentarioVisivel(comentario)
    ) {
      comentarios.push({
        id: item.id,
        ...comentario
      });
    }
  });

  comentarios.sort((a, b) => {
    const dataA = a.data?.toDate
      ? a.data.toDate().getTime()
      : new Date(a.data || 0).getTime();

    const dataB = b.data?.toDate
      ? b.data.toDate().getTime()
      : new Date(b.data || 0).getTime();

    return dataB - dataA;
  });

  box.innerHTML = comentarios.length
    ? comentarios.map((comentario) => `
        <div class="comentario-audiobook">
          <div class="comentario-avatar">
            ${(comentario.usuario || "U").charAt(0).toUpperCase()}
          </div>

          <div>
            <strong>@${comentario.usuario || "usuario"}</strong>

            <p>${comentario.texto || ""}</p>

            <small>${formatarData(comentario.data)}</small>
          </div>
        </div>
      `).join("")
    : `
      <div class="comentarios-vazio">
        <h3>Nenhum comentário ainda</h3>
        <p>Seja o primeiro a comentar este audiobook.</p>
      </div>
    `;
}

async function enviarComentario() {
  const usuario = document.getElementById("comentarioUsuario").value.trim();
  const texto = document.getElementById("comentarioTexto").value.trim();

  if (!usuario || !texto) {
    alert("Preencha seu nome/user e o comentário.");
    return;
  }

  await addDoc(collection(db, "comentarios"), {
    postId: `audiobook_${audiobookId}`,
    tipo: "audiobook",
    usuario,
    texto,
    status: "aprovado",
    data: new Date()
  });

  document.getElementById("comentarioTexto").value = "";

  await carregarComentarios();

  alert("Comentário enviado.");
}

async function iniciarCurtida(audio) {
  const botao = document.getElementById("curtirAudiobookBtn");
  const contador = document.getElementById("curtidasAudiobook");

  if (!botao || !contador) return;

  const likeKey = `audiobook_like_${audiobookId}_${getClientId()}`;
  let curtido = localStorage.getItem(likeKey) === "true";

  function atualizarVisual() {
    botao.innerHTML = curtido ? "💜 Curtido" : "🤍 Curtir";
    contador.innerText = audio.curtidas || 0;
  }

  atualizarVisual();

  botao.onclick = async () => {
    botao.disabled = true;

    try {
      const audioRef = doc(db, "audiobooks", audiobookId);

      if (curtido) {
        await updateDoc(audioRef, {
          curtidas: increment(-1)
        });

        audio.curtidas = Math.max((audio.curtidas || 0) - 1, 0);
        curtido = false;
        localStorage.removeItem(likeKey);

      } else {
        await updateDoc(audioRef, {
          curtidas: increment(1)
        });

        audio.curtidas = (audio.curtidas || 0) + 1;
        curtido = true;
        localStorage.setItem(likeKey, "true");
      }

      atualizarVisual();

    } catch (error) {
      console.error(error);
      alert("Não foi possível registrar a curtida.");
    }

    botao.disabled = false;
  };
}

async function carregarAudiobook() {
  if (!audiobookId) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Audiobook não encontrado</h2>
        <p>Nenhum audiobook foi informado.</p>
      </div>
    `;

    return;
  }

  const snap = await getDoc(doc(db, "audiobooks", audiobookId));

  if (!snap.exists()) {
    container.innerHTML = `
      <div class="empty-state">
        <h2>Audiobook não encontrado</h2>
        <p>Esse audiobook não existe ou foi removido.</p>
      </div>
    `;

    return;
  }

  const audio = {
    id: snap.id,
    ...snap.data()
  };

  const capa = montarImagemCapa(audio.capa || "");

  document.title = `${audio.titulo || "Audiobook"} - Diário Lunar`;

  container.innerHTML = `
    <a href="/audiobooks.html" class="voltar-audiobooks">
      ← Voltar para Audiobooks
    </a>

    <section class="audiobook-hero">

      <div class="audiobook-capa-box">
        <img
          src="${capa}"
          alt="${audio.titulo || "Audiobook"}"
          onerror="this.src='/assets/images/footer.png'"
        >
      </div>

      <div class="audiobook-info-box">

        <span class="audiobook-label">
          ✦ ${audio.categoria || "Audiobook"}
        </span>

        <h1>${audio.titulo || "Sem título"}</h1>

        <div class="audiobook-meta-grid">
          <div>
            <small>Autor</small>
            <strong>${audio.autor || "Não informado"}</strong>
          </div>

          <div>
            <small>Gravado por</small>
            <strong>${audio.narrador || "Não informado"}</strong>
          </div>

          <div>
            <small>Publicado em</small>
            <strong>${formatarData(audio.data)}</strong>
          </div>
        </div>

        ${
          audio.descricao
            ? `
              <p class="audiobook-descricao">
                ${audio.descricao}
              </p>
            `
            : ""
        }

        <div class="audiobook-player-box">
          <h2>Ouça agora</h2>
          ${montarPlayer(audio.audioUrl || audio.linkAudio || "")}
        </div>

        <div class="audiobook-acoes">
          <button id="curtirAudiobookBtn" class="btn-like-audio">
            🤍 Curtir
          </button>

          <span>
            💜 <b id="curtidasAudiobook">${audio.curtidas || 0}</b> curtida(s)
          </span>
        </div>

      </div>

    </section>

    <section class="comentarios-section">

      <div class="comentarios-header">
        <div>
          <span class="audiobook-label">✦ Comunidade</span>
          <h2>Comentários</h2>
          <p>Compartilhe sua reação sobre este audiobook.</p>
        </div>
      </div>

      <div class="comentario-form-card">

        <div class="form-grid">
          <div class="form-group">
            <label>Seu nome/user</label>

            <input
              id="comentarioUsuario"
              type="text"
              placeholder="Ex: Mayke"
            >
          </div>

          <div class="form-group">
            <label>Comentário</label>

            <input
              id="comentarioTexto"
              type="text"
              placeholder="Escreva seu comentário"
            >
          </div>
        </div>

        <button id="enviarComentarioAudiobookBtn" class="btn btn-gradient">
          Enviar comentário
        </button>

      </div>

      <div id="comentariosAudiobookLista" class="comentarios-lista"></div>

    </section>

    <style>
      .voltar-audiobooks{
        display:inline-flex;
        align-items:center;
        margin-bottom:26px;
        color:#7c3aed;
        text-decoration:none;
        font-weight:800;
      }

      .audiobook-hero{
        display:grid;
        grid-template-columns:360px 1fr;
        gap:38px;
        align-items:start;
        background:#ffffff;
        border-radius:34px;
        padding:34px;
        box-shadow:0 16px 45px rgba(0,0,0,0.08);
      }

      .audiobook-capa-box{
        aspect-ratio:3/4;
        border-radius:26px;
        overflow:hidden;
        background:#111827;
        box-shadow:0 14px 35px rgba(0,0,0,0.18);
      }

      .audiobook-capa-box img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }

      .audiobook-info-box{
        padding:8px 0;
      }

      .audiobook-label{
        color:#0ea5e9;
        font-weight:900;
        text-transform:uppercase;
        letter-spacing:0.5px;
        font-size:14px;
      }

      .audiobook-info-box h1{
        font-size:58px;
        line-height:1.05;
        margin:18px 0 24px;
        color:#07101f;
      }

      .audiobook-meta-grid{
        display:grid;
        grid-template-columns:repeat(3,1fr);
        gap:14px;
        margin-bottom:26px;
      }

      .audiobook-meta-grid div{
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:18px;
        padding:15px;
      }

      .audiobook-meta-grid small{
        display:block;
        color:#64748b;
        font-weight:700;
        margin-bottom:6px;
      }

      .audiobook-meta-grid strong{
        color:#111827;
      }

      .audiobook-descricao{
        font-size:18px;
        line-height:1.85;
        color:#374151;
        margin-bottom:28px;
      }

      .audiobook-player-box{
        background:#07101f;
        border-radius:26px;
        padding:24px;
        margin-top:22px;
      }

      .audiobook-player-box h2{
        color:white;
        margin:0 0 10px;
      }

      .audio-player-frame{
        border:0;
        border-radius:18px;
        background:#111827;
      }

      .audio-player-native{
        width:100%;
        margin-top:18px;
      }

      .audio-error{
        color:#fecaca;
        font-weight:bold;
      }

      .audiobook-acoes{
        margin-top:24px;
        display:flex;
        align-items:center;
        gap:18px;
        flex-wrap:wrap;
      }

      .btn-like-audio{
        border:none;
        background:linear-gradient(90deg,#0ea5e9,#7c3aed);
        color:white;
        padding:13px 24px;
        border-radius:999px;
        font-weight:900;
        cursor:pointer;
      }

      .comentarios-section{
        margin-top:42px;
        background:#ffffff;
        border-radius:34px;
        padding:34px;
        box-shadow:0 16px 45px rgba(0,0,0,0.08);
      }

      .comentarios-header h2{
        font-size:38px;
        margin:10px 0 6px;
      }

      .comentarios-header p{
        color:#64748b;
        margin-bottom:24px;
      }

      .comentario-form-card{
        background:#f8fafc;
        border:1px solid #e5e7eb;
        border-radius:24px;
        padding:24px;
        margin-bottom:28px;
      }

      .comentario-form-card input{
        width:100%;
        padding:15px;
        border-radius:14px;
        border:1px solid #cbd5e1;
      }

      .comentarios-lista{
        display:flex;
        flex-direction:column;
        gap:16px;
      }

      .comentario-audiobook{
        display:flex;
        gap:14px;
        background:#ffffff;
        border:1px solid #e5e7eb;
        border-radius:20px;
        padding:18px;
      }

      .comentario-avatar{
        width:44px;
        height:44px;
        border-radius:50%;
        background:linear-gradient(90deg,#0ea5e9,#7c3aed);
        color:white;
        display:flex;
        align-items:center;
        justify-content:center;
        font-weight:900;
        flex-shrink:0;
      }

      .comentario-audiobook p{
        margin:8px 0;
        color:#374151;
      }

      .comentario-audiobook small{
        color:#64748b;
      }

      .comentarios-vazio{
        background:#f8fafc;
        border:1px dashed #cbd5e1;
        border-radius:22px;
        padding:26px;
        text-align:center;
      }

      .comentarios-vazio h3{
        margin-bottom:8px;
      }

      .comentarios-vazio p{
        color:#64748b;
      }

      @media(max-width:950px){
        .audiobook-hero{
          grid-template-columns:1fr;
        }

        .audiobook-capa-box{
          max-width:360px;
        }

        .audiobook-info-box h1{
          font-size:42px;
        }

        .audiobook-meta-grid{
          grid-template-columns:1fr;
        }
      }

      @media(max-width:650px){
        .audiobook-hero,
        .comentarios-section{
          padding:22px;
          border-radius:24px;
        }

        .audiobook-info-box h1{
          font-size:34px;
        }
      }
    </style>
  `;

  document.getElementById("enviarComentarioAudiobookBtn").onclick =
    enviarComentario;

  await iniciarCurtida(audio);
  await carregarComentarios();
}

carregarAudiobook();
