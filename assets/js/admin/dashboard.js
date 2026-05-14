import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

function getDataNumber(post) {
  if (post.data?.toDate) {
    return post.data.toDate().getTime();
  }

  if (post.data) {
    return new Date(post.data).getTime();
  }

  return 0;
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

function statusInfo(status) {
  const mapa = {
    publicado: "Publicado",
    rascunho: "Rascunho",
    em_revisao: "Em revisão",
    reprovado: "Reprovado",
    agendado: "Agendado"
  };

  return mapa[status] || "Rascunho";
}

export async function renderDashboard(usuario) {
  const postsSnap = await getDocs(collection(db, "posts"));
  const comentariosSnap = await getDocs(collection(db, "comentarios"));

  let publicadas = [];
  let rascunhos = [];
  let revisao = [];
  let reprovadas = [];
  let agendadas = [];
  let totalCurtidas = 0;
  let totalViews = 0;

  postsSnap.forEach((item) => {
    const post = {
      id: item.id,
      ...item.data(),
      dataNum: getDataNumber(item.data())
    };

    if (post.status === "rascunho" || !post.status) {
      rascunhos.push(post);
    }

    if (post.status === "em_revisao") {
      revisao.push(post);
    }

    if (post.status === "reprovado") {
      reprovadas.push(post);
    }

    if (post.status === "agendado") {
      agendadas.push(post);
    }

    if (post.status === "publicado") {
      publicadas.push(post);
    }

    totalCurtidas += post.curtidas || 0;
    totalViews += post.views || 0;
  });

  publicadas.sort((a, b) => b.dataNum - a.dataNum);
  revisao.sort((a, b) => b.dataNum - a.dataNum);
  agendadas.sort((a, b) => b.dataNum - a.dataNum);

  const ultimas = publicadas.slice(0, 3).map((post) => {
    return `
      <div class="dashboard-post">
        <img src="${post.imagem || "/assets/images/footer.png"}">

        <div>
          <strong>${post.titulo || "Sem título"}</strong>
          <p>Publicado em ${formatarData(post.data)}</p>
          <p>👁️ ${post.views || 0} views · 💜 ${post.curtidas || 0} curtidas</p>
        </div>

        <span class="status-publicado">
          Publicado
        </span>
      </div>
    `;
  }).join("");

  const pendentes = [...revisao, ...agendadas, ...reprovadas].slice(0, 5).map((post) => {
    return `
      <div class="dashboard-post">
        <img src="${post.imagem || "/assets/images/footer.png"}">

        <div>
          <strong>${post.titulo || "Sem título"}</strong>
          <p>${post.categoria || "Matéria"} · ${formatarData(post.data)}</p>
        </div>

        <span class="status-rascunho">
          ${statusInfo(post.status)}
        </span>
      </div>
    `;
  }).join("");

  return `
    <div class="admin-topo">
      <div>
        <h1>Painel de Controle</h1>
        <p>Bem-vindo, ${usuario.nome || "ADM"}.</p>
      </div>

      <div class="admin-data">
        📅 ${new Date().toLocaleDateString("pt-BR")}
      </div>
    </div>

    <div class="dashboard-grid">
      <div class="metric-card">
        <span>📰</span>
        <h2>${publicadas.length}</h2>
        <p>Publicadas</p>
      </div>

      <div class="metric-card">
        <span>📝</span>
        <h2>${rascunhos.length}</h2>
        <p>Rascunhos</p>
      </div>

      <div class="metric-card">
        <span>🔎</span>
        <h2>${revisao.length}</h2>
        <p>Em revisão</p>
      </div>

      <div class="metric-card">
        <span>⏰</span>
        <h2>${agendadas.length}</h2>
        <p>Agendadas</p>
      </div>

      <div class="metric-card">
        <span>❌</span>
        <h2>${reprovadas.length}</h2>
        <p>Reprovadas</p>
      </div>

      <div class="metric-card">
        <span>👁️</span>
        <h2>${totalViews}</h2>
        <p>Visualizações</p>
      </div>

      <div class="metric-card">
        <span>💜</span>
        <h2>${totalCurtidas}</h2>
        <p>Curtidas</p>
      </div>

      <div class="metric-card">
        <span>💬</span>
        <h2>${comentariosSnap.size}</h2>
        <p>Comentários</p>
      </div>
    </div>

    <div class="admin-card" style="margin-bottom:28px;">
      <h2>Últimas matérias publicadas</h2>

      ${
        ultimas
          ? ultimas
          : "<p>Nenhuma matéria publicada ainda.</p>"
      }
    </div>

    <div class="admin-card">
      <h2>Pendências editoriais</h2>

      ${
        pendentes
          ? pendentes
          : "<p>Nenhuma pendência editorial no momento.</p>"
      }
    </div>
  `;
}
