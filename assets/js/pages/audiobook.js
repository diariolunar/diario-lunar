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
        height="110"
        allow="autoplay"
        style="
          border:0;
          border-radius:20px;
          margin-top:20px;
          background:#111827;
        "
      ></iframe>
    `;
  }

  if (audioUrl) {
    return `
      <audio controls style="width:100%; margin-top:20px;">
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
    const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data || 0).getTime();
    const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data || 0).getTime();

    return dataB - dataA;
  });

  box.innerHTML = comentarios.length
    ? comentarios.map((comentario) => `
        <div class="comentario-audiobook">
          <strong>@${comentario.usuario || "usuario"}</strong>
          <p>${comentario.texto || ""}</p>
          <small>${formatarData(comentario.data)}</small>
        </div>
      `).join("")
    : "<p>Nenhum comentário ainda. Seja o primeiro a comentar.</p>";
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
    botao.innerText = curtido ? "💜 Curtido" : "🤍 Curtir";
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
    <a href="/audiobooks.html" class="btn" style="margin-bottom:25px; display:inline-block;">
      ← Voltar para Audiobooks
    </a>

    <div class="audiobook-detalhe">

      <div class="audiobook-detalhe-capa">
        <img
          src="${capa}"
          alt="${audio.titulo || "Audiobook"}"
          onerror="this.src='/assets/images/footer.png'"
        >
      </div>

      <div class="audiobook-detalhe-info">
        <p style="color:var(--azul); font-weight:bold;">
          ✦ ${audio.categoria || "Audiobook"}
        </p>

        <h1>${audio.titulo || "Sem título"}</h1>

        <p><b>Autor:</b> ${audio.autor || "Não informado"}</p>

        <p><b>Gravado por:</b> ${audio.narrador || "Não informado"}</p>

        <p><b>Publicado em:</b> ${formatarData(audio.data)}</p>

        ${
          audio.descricao
            ? `<p class="audiobook-detalhe-descricao">${audio.descricao}</p>`
            : ""
        }

        ${montarPlayer(audio.audioUrl || audio.linkAudio || "")}

        <div class="audiobook-acoes">
          <button id="curtirAudiobookBtn" class="btn">
            🤍 Curtir
          </button>

          <span>
            💜 <b id="curtidasAudiobook">${audio.curtidas || 0}</b> curtida(s)
          </span>
        </div>
      </div>

    </div>

    <div class="admin-card" style="margin-top:35px;">
      <h2>Comentários</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Seu nome/user</label>
          <input id="comentarioUsuario" type="text" placeholder="Ex: Mayke">
        </div>

        <div class="form-group">
          <label>Comentário</label>
          <input id="comentarioTexto" type="text" placeholder="Escreva seu comentário">
        </div>
      </div>

      <button id="enviarComentarioAudiobookBtn" class="btn btn-gradient">
        Enviar comentário
      </button>

      <div id="comentariosAudiobookLista" style="margin-top:25px;"></div>
    </div>

    <style>
      .audiobook-detalhe{
        display:grid;
        grid-template-columns:360px 1fr;
        gap:35px;
        align-items:start;
        background:white;
        border-radius:30px;
        padding:32px;
        box-shadow:0 10px 35px rgba(0,0,0,0.08);
      }

      .audiobook-detalhe-capa{
        aspect-ratio:3/4;
        border-radius:24px;
        overflow:hidden;
        background:#111827;
      }

      .audiobook-detalhe-capa img{
        width:100%;
        height:100%;
        object-fit:cover;
        display:block;
      }

      .audiobook-detalhe-info h1{
        font-size:52px;
        line-height:1.1;
        margin-bottom:22px;
      }

      .audiobook-detalhe-info p{
        font-size:18px;
        color:#374151;
      }

      .audiobook-detalhe-descricao{
        margin-top:24px;
        line-height:1.8;
      }

      .audiobook-acoes{
        margin-top:25px;
        display:flex;
        align-items:center;
        gap:18px;
        flex-wrap:wrap;
      }

      .comentario-audiobook{
        border-bottom:1px solid #e5e7eb;
        padding:16px 0;
      }

      .comentario-audiobook p{
        margin:8px 0;
      }

      .comentario-audiobook small{
        color:#6b7280;
      }

      @media(max-width:850px){
        .audiobook-detalhe{
          grid-template-columns:1fr;
        }

        .audiobook-detalhe-info h1{
          font-size:38px;
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
