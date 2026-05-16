import {
  listarComentarios,
  atualizarComentario,
  excluirComentario
} from "../services/commentsService.js";

import {
  listarPosts
} from "../services/postsService.js";

let comentariosGlobais = [];
let postsGlobais = [];

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

function statusComentario(comentario) {
  if (comentario.status === "oculto") {
    return `<span class="status-rascunho">Oculto</span>`;
  }

  return `<span class="status-publicado">Visível</span>`;
}

function criarCardComentario(comentario, post) {
  return `
    <div class="comentario-admin-card">

      <div>
        <strong>@${comentario.usuario || "usuario"}</strong>

        <p class="comentario-admin-texto">
          ${comentario.texto || ""}
        </p>

        <p class="comentario-admin-meta">
          Matéria: <b>${post?.titulo || "Matéria não encontrada"}</b>
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
              ? "Tornar visível"
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
    return `📊 Resumo de interações\n${periodoTexto}\n\nNenhuma interação encontrada nesse período.`;
  }

  return [
    "📊 Resumo de interações",
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

  const comentariosFiltrados = filtrarComentariosPorPeriodo();

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
    resumoBox.value = gerarResumoTexto(comentariosFiltrados);
  }

  if (!listaBox) return;

  listaBox.innerHTML = comentariosFiltrados.length
    ? comentariosFiltrados.map((comentario) => {
        const post = postsGlobais.find((p) => p.id === comentario.postId);

        return criarCardComentario(comentario, post);
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

        const confirmar = confirm("Deseja excluir este comentário?");

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
  postsGlobais = await listarPosts();

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
      </div>

      <div
        class="comentarios-admin-grid"
        id="comentariosListaAdmin"
      ></div>

    </div>
  `;
}
