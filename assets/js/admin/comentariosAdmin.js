import {
  listarComentarios,
  atualizarComentario,
  excluirComentario
} from "../services/commentsService.js";

import {
  listarPosts
} from "../services/postsService.js";

import {
  listarCurtidas
} from "../services/likesService.js";

import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

let comentariosGlobais = [];
let curtidasGlobais = [];
let postsGlobais = [];
let audiobooksGlobais = [];

function escaparHtml(valor) {
  const div = document.createElement("div");
  div.innerText = valor || "";

  return div.innerHTML;
}

function formatarData(data) {
  if (!data) return "Sem data";

  try {
    if (data.toDate) {
      return data.toDate().toLocaleString("pt-BR");
    }

    return new Date(data).toLocaleString("pt-BR");
  } catch {
    return "Sem data";
  }
}

function formatarDataSimples(data) {
  if (!data) return "";

  try {
    const d = new Date(data + "T12:00:00");

    return d.toLocaleDateString("pt-BR");
  } catch {
    return data;
  }
}

function getDataComentario(comentario) {
  if (comentario.data?.toDate) {
    return comentario.data.toDate();
  }

  if (comentario.data) {
    return new Date(comentario.data);
  }

  return null;
}

function getDataCurtida(curtida) {
  if (curtida.data?.toDate) {
    return curtida.data.toDate();
  }

  if (curtida.data) {
    return new Date(curtida.data);
  }

  return null;
}

function statusComentario(comentario) {
  if (comentario.status === "oculto") {
    return `<span class="status-rascunho">Oculto</span>`;
  }

  return `<span class="status-publicado">Visível</span>`;
}

async function listarAudiobooksComentarios() {
  const snap = await getDocs(collection(db, "audiobooks"));

  let audiobooks = [];

  snap.forEach((item) => {
    audiobooks.push({
      id: item.id,
      ...item.data()
    });
  });

  return audiobooks;
}

function getConteudoComentario(comentario) {
  if (comentario.tipo === "audiobook" || comentario.postId?.startsWith("audiobook_")) {
    const audiobookId = comentario.audiobookId || comentario.postId.replace("audiobook_", "");
    const audiobook = audiobooksGlobais.find((item) => item.id === audiobookId);

    return {
      tipo: "Audiobook",
      titulo: audiobook?.titulo || "Audiobook nao encontrado"
    };
  }

  const post = postsGlobais.find((item) => item.id === comentario.postId);

  return {
    tipo: "Materia",
    titulo: post?.titulo || "Materia nao encontrada"
  };
}

function criarCardComentario(comentario, conteudo) {
  const usuario = escaparHtml(comentario.usuario || "usuario");
  const texto = escaparHtml(comentario.texto || "");
  const tipo = escaparHtml(conteudo.tipo);
  const titulo = escaparHtml(conteudo.titulo);

  return `
    <div class="comentario-admin-card">

      <div>
        <strong>@${usuario}</strong>

        <p class="comentario-admin-texto">
          ${texto}
        </p>

        <p class="comentario-admin-meta">
          ${tipo}: <b>${titulo}</b>
        </p>

        <p class="comentario-admin-meta">
          ${formatarData(comentario.data)}
        </p>

        <div class="materia-admin-meta">
          ${statusComentario(comentario)}
        </div>
      </div>

      <div class="comentario-admin-actions">
        <button
          class="btn-editar"
          data-toggle-comentario="${comentario.id}"
        >
          ${
            comentario.status === "oculto"
              ? "Tornar visivel"
              : "Ocultar"
          }
        </button>

        <button
          class="btn-excluir"
          data-excluir-comentario="${comentario.id}"
        >
          Excluir
        </button>
      </div>

    </div>
  `;
}
function filtrarComentariosPorPeriodo() {
  const inicioValor = document.getElementById("comentariosDataInicio")?.value || "";
  const fimValor = document.getElementById("comentariosDataFim")?.value || "";

  const inicio = inicioValor
    ? new Date(inicioValor + "T00:00:00")
    : null;

  const fim = fimValor
    ? new Date(fimValor + "T23:59:59")
    : null;

  return comentariosGlobais.filter((comentario) => {
    const dataComentario = getDataComentario(comentario);

    if (!dataComentario) return false;

    if (inicio && dataComentario < inicio) return false;
    if (fim && dataComentario > fim) return false;

    return true;
  });
}

function filtrarCurtidasPorPeriodo() {
  const inicioValor = document.getElementById("comentariosDataInicio")?.value || "";
  const fimValor = document.getElementById("comentariosDataFim")?.value || "";

  const inicio = inicioValor
    ? new Date(inicioValor + "T00:00:00")
    : null;

  const fim = fimValor
    ? new Date(fimValor + "T23:59:59")
    : null;

  return curtidasGlobais.filter((curtida) => {
    const dataCurtida = getDataCurtida(curtida);

    if (!dataCurtida) return false;

    if (inicio && dataCurtida < inicio) return false;
    if (fim && dataCurtida > fim) return false;

    return true;
  });
}

function contarPorUsuario(itens) {
  const mapaUsuarios = {};

  itens.forEach((item) => {
    const usuario = item.usuario;

    if (!usuario) return;
    if (/^user_\d+_[a-z0-9]+$/i.test(usuario)) return;

    if (!mapaUsuarios[usuario]) {
      mapaUsuarios[usuario] = 0;
    }

    mapaUsuarios[usuario]++;
  });

  return Object.entries(mapaUsuarios)
    .sort((a, b) => b[1] - a[1]);
}

function gerarResumoTexto(comentariosFiltrados) {
  const inicioValor = document.getElementById("comentariosDataInicio")?.value || "";
  const fimValor = document.getElementById("comentariosDataFim")?.value || "";

  const mapaUsuarios = {};

  comentariosFiltrados.forEach((comentario) => {
    const usuario = comentario.usuario || "usuario";

    if (!mapaUsuarios[usuario]) {
      mapaUsuarios[usuario] = 0;
    }

    mapaUsuarios[usuario]++;
  });

  const usuariosOrdenados = Object.entries(mapaUsuarios)
    .sort((a, b) => b[1] - a[1]);

  const periodoTexto =
    inicioValor || fimValor
      ? `Período: ${inicioValor ? formatarDataSimples(inicioValor) : "início"} a ${fimValor ? formatarDataSimples(fimValor) : "hoje"}`
      : "Período: todos os comentários";

  if (usuariosOrdenados.length === 0) {
    return `Resumo de interações\n${periodoTexto}\n\nNenhuma interação encontrada nesse período.`;
  }

  return [
    "Resumo de interações",
    periodoTexto,
    "",
    ...usuariosOrdenados.map(([usuario, total]) => {
      const palavra = total === 1 ? "interação" : "interações";

      return `${usuario} - ${total} ${palavra}`;
    })
  ].join("\n");
}

function renderizarComentariosFiltrados() {
  const listaBox = document.getElementById("comentariosListaAdmin");
  const resumoBox = document.getElementById("resumoComentariosTexto");
  const totalBox = document.getElementById("totalComentariosFiltrados");
  const resumoCurtidasBox = document.getElementById("resumoCurtidasUsuarios");

  const comentariosFiltrados = filtrarComentariosPorPeriodo();
  const curtidasFiltradas = filtrarCurtidasPorPeriodo()
    .filter((curtida) => {
      if (!curtida.usuario) return false;

      return !/^user_\d+_[a-z0-9]+$/i.test(curtida.usuario);
    });

  comentariosFiltrados.sort((a, b) => {
    const dataA = getDataComentario(a)?.getTime() || 0;
    const dataB = getDataComentario(b)?.getTime() || 0;

    return dataB - dataA;
  });

  if (totalBox) {
    totalBox.innerText =
      `${comentariosFiltrados.length} comentário(s) encontrado(s) no filtro.`;
  }

  if (resumoBox) {
    if (totalBox) {
      totalBox.innerText =
        `${comentariosFiltrados.length} comentario(s) e ${curtidasFiltradas.length} curtida(s) encontrado(s) no filtro.`;
    }

    resumoBox.value = gerarResumoTexto(comentariosFiltrados);

    const curtidasPorUsuario = contarPorUsuario(curtidasFiltradas);
    const resumoCurtidas = curtidasPorUsuario.length
      ? curtidasPorUsuario.map(([usuario, total]) => {
          const palavra = total === 1 ? "curtida" : "curtidas";

          return `${usuario} - ${total} ${palavra}`;
        }).join("\n")
      : "Nenhuma curtida encontrada.";

    resumoBox.value += `\n\nCurtidas por usuario:\n${resumoCurtidas}`;
  }

  if (resumoCurtidasBox) {
    const curtidasPorUsuario = contarPorUsuario(curtidasFiltradas);

    resumoCurtidasBox.innerHTML = curtidasPorUsuario.length
      ? curtidasPorUsuario.map(([usuario, total]) => `
          <tr>
            <td>@${escaparHtml(usuario)}</td>
            <td>${total}</td>
          </tr>
        `).join("")
      : `
        <tr>
          <td colspan="2">Nenhuma curtida encontrada nesse periodo.</td>
        </tr>
      `;
  }

  if (!listaBox) return;

  listaBox.innerHTML = comentariosFiltrados.length
    ? comentariosFiltrados.map((comentario) => {
        const conteudo = getConteudoComentario(comentario);

        return criarCardComentario(comentario, conteudo);
      }).join("")
    : "<p>Nenhum comentário encontrado nesse período.</p>";
}

function copiarResumoComentarios() {
  const resumoBox = document.getElementById("resumoComentariosTexto");

  if (!resumoBox) return;

  resumoBox.select();
  resumoBox.setSelectionRange(0, 99999);

  navigator.clipboard.writeText(resumoBox.value)
    .then(() => {
      alert("Resumo copiado para a área de transferência.");
    })
    .catch(() => {
      document.execCommand("copy");
      alert("Resumo copiado.");
    });
}

async function ativarAcoes(onReload) {
  document
    .querySelectorAll("[data-toggle-comentario]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.toggleComentario;

        const comentarios = await listarComentarios();
        const comentario = comentarios.find((item) => item.id === id);

        if (!comentario) return;

        await atualizarComentario(id, {
          status: comentario.status === "oculto" ? "aprovado" : "oculto"
        });

        await onReload();
      };
    });

  document
    .querySelectorAll("[data-excluir-comentario]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.excluirComentario;

        const confirmar = await window.confirmarModal({
              titulo: "Excluir comentário",
              mensagem: "Deseja excluir este comentário?",
              textoConfirmar: "Excluir"
            });

        if (!confirmar) return;

        await excluirComentario(id);

        alert("Comentário excluído.");

        await onReload();
      };
    });
}

function ativarFiltrosComentarios(onReload) {
  const inicio = document.getElementById("comentariosDataInicio");
  const fim = document.getElementById("comentariosDataFim");
  const filtrarBtn = document.getElementById("filtrarComentariosBtn");
  const limparBtn = document.getElementById("limparFiltroComentariosBtn");
  const copiarBtn = document.getElementById("copiarResumoComentariosBtn");

  if (filtrarBtn) {
    filtrarBtn.onclick = () => {
      renderizarComentariosFiltrados();
      ativarAcoes(onReload);
    };
  }

  if (limparBtn) {
    limparBtn.onclick = () => {
      if (inicio) inicio.value = "";
      if (fim) fim.value = "";

      renderizarComentariosFiltrados();
      ativarAcoes(onReload);
    };
  }

  if (copiarBtn) {
    copiarBtn.onclick = copiarResumoComentarios;
  }
}

export async function renderComentariosAdmin(onReload) {
  comentariosGlobais = await listarComentarios();
  curtidasGlobais = await listarCurtidas();
  postsGlobais = await listarPosts();
  audiobooksGlobais = await listarAudiobooksComentarios();

  comentariosGlobais.sort((a, b) => {
    const dataA = getDataComentario(a)?.getTime() || 0;
    const dataB = getDataComentario(b)?.getTime() || 0;

    return dataB - dataA;
  });

  setTimeout(() => {
    renderizarComentariosFiltrados();
    ativarFiltrosComentarios(onReload);
    ativarAcoes(onReload);
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>Painel de Comentários</h1>

          <p>
            Modere, oculte ou exclua comentários enviados nas matérias.
          </p>
        </div>
      </div>

      <div class="admin-card" style="margin-bottom:25px;">
        <h2>Filtrar interações por período</h2>

        <div class="form-grid">
          <div class="form-group">
            <label>Data inicial</label>

            <input
              id="comentariosDataInicio"
              type="date"
            >
          </div>

          <div class="form-group">
            <label>Data final</label>

            <input
              id="comentariosDataFim"
              type="date"
            >
          </div>
        </div>

        <div class="editor-actions-top" style="margin-bottom:20px;">
          <button class="btn btn-gradient" id="filtrarComentariosBtn">
            Filtrar
          </button>

          <button class="btn" id="limparFiltroComentariosBtn">
            Limpar filtro
          </button>

          <button class="btn" id="copiarResumoComentariosBtn">
            Copiar resumo
          </button>
        </div>

        <p id="totalComentariosFiltrados" style="font-weight:bold;"></p>

        <label style="font-weight:bold; display:block; margin-bottom:10px;">
          Resumo para WhatsApp
        </label>

        <textarea
          id="resumoComentariosTexto"
          class="admin-textarea"
          readonly
          style="min-height:180px;"
        ></textarea>

        <h2 style="margin-top:25px;">Curtidas por usuario</h2>

        <div style="overflow-x:auto;">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Usuario</th>
                <th>Curtidas</th>
              </tr>
            </thead>

            <tbody id="resumoCurtidasUsuarios"></tbody>
          </table>
        </div>
      </div>

      <div
        class="comentarios-admin-grid"
        id="comentariosListaAdmin"
      ></div>

    </div>
  `;
}
