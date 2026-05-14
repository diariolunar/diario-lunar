import {
  listarComentarios,
  atualizarComentario,
  excluirComentario
} from "../services/commentsService.js";

import {
  listarPosts
} from "../services/postsService.js";

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

export async function renderComentariosAdmin(onReload) {
  const comentarios = await listarComentarios();
  const posts = await listarPosts();

  comentarios.sort((a, b) => {
    const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data || 0).getTime();
    const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data || 0).getTime();

    return dataB - dataA;
  });

  setTimeout(() => {
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

      <div class="comentarios-admin-grid">
        ${
          comentarios.length
            ? comentarios.map((comentario) => {
                const post = posts.find((p) => p.id === comentario.postId);

                return criarCardComentario(comentario, post);
              }).join("")
            : "<p>Nenhum comentário encontrado.</p>"
        }
      </div>

    </div>
  `;
}
