import {
  listarPosts,
  atualizarPost,
  registrarHistoricoPost
} from "../services/postsService.js";

import {
  podeEditar,
  podeExcluir,
  podeRevisar
} from "./auth/permissions.js";

function formatarData(data) {
  if (!data) {
    return "Sem data";
  }

  try {
    if (data.toDate) {
      return data.toDate().toLocaleDateString("pt-BR");
    }

    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return "Sem data";
  }
}

function getDataNumber(post) {
  if (post.data?.toDate) {
    return post.data.toDate().getTime();
  }

  if (post.data) {
    return new Date(post.data).getTime();
  }

  return 0;
}

function statusInfo(status) {
  const mapa = {
    publicado: {
      texto: "Publicado",
      classe: "status-publicado"
    },
    rascunho: {
      texto: "Rascunho",
      classe: "status-rascunho"
    },
    em_revisao: {
      texto: "Em revisão",
      classe: "status-revisao"
    },
    reprovado: {
      texto: "Reprovado",
      classe: "status-reprovado"
    },
    agendado: {
      texto: "Agendado",
      classe: "status-agendado"
    }
  };

  return mapa[status] || mapa.rascunho;
}

function filtrarPorTipo(posts, tipo) {
  if (tipo === "publicadas" || tipo === "publicas") {
    return posts.filter((post) =>
      post.status === "publicado" ||
      post.status === "agendado"
    );
  }

  if (tipo === "rascunhos") {
    return posts.filter((post) =>
      !post.status ||
      post.status === "rascunho" ||
      post.status === "reprovado"
    );
  }

  if (tipo === "revisao") {
    return posts.filter((post) =>
      post.status === "em_revisao"
    );
  }

  return posts;
}

function tituloDaPagina(tipo) {
  const mapa = {
    publicadas: {
      titulo: "Matérias Publicadas",
      descricao: "Gerencie matérias publicadas e agendadas."
    },
    publicas: {
      titulo: "Matérias Publicadas",
      descricao: "Gerencie matérias publicadas e agendadas."
    },
    rascunhos: {
      titulo: "Matérias em Rascunho",
      descricao: "Gerencie rascunhos e matérias reprovadas."
    },
    revisao: {
      titulo: "Matérias a Revisar",
      descricao: "Revise, aprove ou reprove matérias enviadas pela equipe."
    },
    todas: {
      titulo: "Todas as Matérias",
      descricao: "Gerencie todas as matérias do Diário Lunar."
    }
  };

  return mapa[tipo] || mapa.todas;
}

function criarCard(post, usuarioAtual) {
  const status = post.status || "rascunho";
  const info = statusInfo(status);

  return `
    <div class="materia-card-admin">

      <img src="${post.imagem || "/assets/images/footer.png"}">

      <div class="materia-admin-info">

        <small>${post.categoria || "Matéria"}</small>

        <h3>${post.titulo || "Sem título"}</h3>

        <p>
          Data: ${formatarData(post.data)}
        </p>

        <div class="materia-admin-meta">

          <span class="${info.classe}">
            ${info.texto}
          </span>

          <span>
            👁️ ${post.views || 0}
          </span>

          <span>
            💜 ${post.curtidas || 0}
          </span>

        </div>

        ${
          post.motivoReprovacao
            ? `
              <p style="margin-top:12px;">
                <b>Motivo da reprovação:</b>
                ${post.motivoReprovacao}
              </p>
            `
            : ""
        }

      </div>

      <div class="materia-admin-actions">

        ${
          podeEditar(usuarioAtual)
            ? `
              <button
                data-editar="${post.id}"
                class="btn-editar"
              >
                Editar
              </button>
            `
            : ""
        }

        ${
          podeRevisar(usuarioAtual) && status === "em_revisao"
            ? `
              <button
                data-revisar="${post.id}"
                class="btn-editar"
              >
                Revisar
              </button>
            `
            : ""
        }

        ${
          podeRevisar(usuarioAtual) && status === "agendado"
            ? `
              <button
                data-status="${post.id}"
                data-novo-status="publicado"
                class="btn-editar"
              >
                Publicar agora
              </button>
            `
            : ""
        }

        ${
          podeExcluir(usuarioAtual)
            ? `
              <button
                data-excluir="${post.id}"
                class="btn-excluir"
              >
                Excluir
              </button>
            `
            : ""
        }

      </div>

    </div>
  `;
}

async function ativarMudancaStatus(usuarioAtual, onReload) {
  document
    .querySelectorAll("[data-status]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.status;
        const novoStatus = botao.dataset.novoStatus;

        const posts = await listarPosts();
        const post = posts.find((item) => item.id === id);

        if (!post) {
          alert("Matéria não encontrada.");
          return;
        }

        await atualizarPost(id, {
          status: novoStatus,
          atualizadoEm: new Date()
        });

        await registrarHistoricoPost({
          postId: id,
          acao: "Alteração de status pela listagem",
          usuario: usuarioAtual,
          statusAnterior: post.status || "rascunho",
          statusNovo: novoStatus
        });

        alert("Status atualizado.");

        await onReload();
      };
    });
}

export async function renderListarMaterias(
  usuarioAtual,
  onReload = null,
  tipo = "todas"
) {
  const posts = await listarPosts();

  let lista = filtrarPorTipo(posts, tipo);

  lista.sort((a, b) =>
    getDataNumber(b) - getDataNumber(a)
  );

  const infoPagina = tituloDaPagina(tipo);

  setTimeout(() => {
    if (onReload) {
      ativarMudancaStatus(usuarioAtual, onReload);
    }
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">

        <div>

          <h1>${infoPagina.titulo}</h1>

          <p>${infoPagina.descricao}</p>

        </div>

      </div>

      <div class="materias-admin-grid">

        ${
          lista.length
            ? lista
              .map((post) => criarCard(post, usuarioAtual))
              .join("")
            : `
              <p>
                Nenhuma matéria encontrada.
              </p>
            `
        }

      </div>

    </div>
  `;
}