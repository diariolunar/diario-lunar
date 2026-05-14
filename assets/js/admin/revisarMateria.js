import {
  buscarPost,
  atualizarPost,
  registrarHistoricoPost,
  listarHistoricoPost
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

function formatarDataPost(data) {
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

async function aprovarMateria(post, usuarioAtual, onFinalizar) {
  const confirmar = confirm("Deseja aprovar e publicar esta matéria?");

  if (!confirmar) return;

  await atualizarPost(post.id, {
    status: "publicado",
    motivoReprovacao: "",
    atualizadoEm: new Date()
  });

  await registrarHistoricoPost({
    postId: post.id,
    acao: "Matéria aprovada",
    usuario: usuarioAtual,
    statusAnterior: post.status || "em_revisao",
    statusNovo: "publicado"
  });

  alert("Matéria aprovada e publicada.");

  await onFinalizar();
}

async function agendarMateria(post, usuarioAtual, onFinalizar) {
  const dataAtual = post.data?.toDate
    ? post.data.toDate().toISOString().split("T")[0]
    : post.data
      ? new Date(post.data).toISOString().split("T")[0]
      : "";

  const data = prompt(
    "Informe a data de agendamento no formato AAAA-MM-DD:",
    dataAtual
  );

  if (!data) return;

  await atualizarPost(post.id, {
    status: "agendado",
    data: new Date(data + "T12:00:00"),
    motivoReprovacao: "",
    atualizadoEm: new Date()
  });

  await registrarHistoricoPost({
    postId: post.id,
    acao: "Matéria agendada na revisão",
    usuario: usuarioAtual,
    statusAnterior: post.status || "em_revisao",
    statusNovo: "agendado",
    observacao: `Agendada para ${data}`
  });

  alert("Matéria agendada.");

  await onFinalizar();
}

async function reprovarMateria(post, usuarioAtual, onFinalizar) {
  const motivo = document.getElementById("motivoRevisao").value.trim();

  if (!motivo) {
    alert("Informe o motivo da reprovação.");
    return;
  }

  await atualizarPost(post.id, {
    status: "reprovado",
    motivoReprovacao: motivo,
    atualizadoEm: new Date()
  });

  await registrarHistoricoPost({
    postId: post.id,
    acao: "Matéria reprovada",
    usuario: usuarioAtual,
    statusAnterior: post.status || "em_revisao",
    statusNovo: "reprovado",
    observacao: motivo
  });

  alert("Matéria reprovada.");

  await onFinalizar();
}

function renderHistorico(historico) {
  if (!historico.length) {
    return "<p>Nenhum histórico encontrado.</p>";
  }

  return historico.map((item) => `
    <div class="historico-item">
      <strong>${item.acao || "Alteração"}</strong>

      <p>
        ${item.statusAnterior || "-"} → ${item.statusNovo || "-"}
      </p>

      <p>
        Por @${item.usuario || "admin"} em ${formatarData(item.data)}
      </p>

      ${
        item.observacao
          ? `<p><b>Observação:</b> ${item.observacao}</p>`
          : ""
      }
    </div>
  `).join("");
}

export async function renderRevisarMateria(
  postId,
  usuarioAtual,
  onFinalizar
) {
  const post = await buscarPost(postId);

  if (!post) {
    return `
      <div class="admin-card">
        <h1>Matéria não encontrada</h1>
        <p>Não foi possível carregar esta matéria para revisão.</p>
      </div>
    `;
  }

  const historico = await listarHistoricoPost(post.id);

  setTimeout(() => {
    const aprovarBtn = document.getElementById("aprovarRevisaoBtn");
    const agendarBtn = document.getElementById("agendarRevisaoBtn");
    const reprovarBtn = document.getElementById("reprovarRevisaoBtn");
    const cancelarBtn = document.getElementById("cancelarRevisaoBtn");

    if (aprovarBtn) {
      aprovarBtn.onclick = () =>
        aprovarMateria(post, usuarioAtual, onFinalizar);
    }

    if (agendarBtn) {
      agendarBtn.onclick = () =>
        agendarMateria(post, usuarioAtual, onFinalizar);
    }

    if (reprovarBtn) {
      reprovarBtn.onclick = () =>
        reprovarMateria(post, usuarioAtual, onFinalizar);
    }

    if (cancelarBtn) {
      cancelarBtn.onclick = () => onFinalizar();
    }
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">

        <div>
          <h1>Revisar Matéria</h1>

          <p>
            Analise a matéria abaixo antes de aprovar, agendar ou reprovar.
          </p>
        </div>

        <div class="editor-actions-top">
          <button class="btn" id="cancelarRevisaoBtn">
            Voltar
          </button>

          <button class="btn" id="agendarRevisaoBtn">
            Agendar
          </button>

          <button class="btn btn-danger" id="reprovarRevisaoBtn">
            Reprovar
          </button>

          <button class="btn btn-gradient" id="aprovarRevisaoBtn">
            Aprovar/Publicar
          </button>
        </div>

      </div>

      <div class="revisao-layout">

        <article class="revisao-preview">

          <img
            src="${post.imagem || "/assets/images/footer.png"}"
            class="revisao-cover"
          >

          <p class="revisao-categoria">
            ${post.categoria || "Matéria"}
          </p>

          <h1>
            ${post.titulo || "Sem título"}
          </h1>

          <p class="revisao-meta">
            Autor: @${post.autor || "diario_lunar"} ·
            Data: ${formatarDataPost(post.data)}
          </p>

          <div class="revisao-conteudo">
            ${post.conteudo || ""}
          </div>

        </article>

        <aside class="revisao-side">

          <div class="admin-card">
            <h2>Decisão editorial</h2>

            <p>
              Para reprovar, informe claramente o motivo para que o autor saiba o que ajustar.
            </p>

            <textarea
              id="motivoRevisao"
              class="admin-textarea"
              placeholder="Motivo da reprovação..."
            >${post.motivoReprovacao || ""}</textarea>
          </div>

          <div class="admin-card">
            <h2>Histórico</h2>

            <div class="historico-box">
              ${renderHistorico(historico)}
            </div>
          </div>

        </aside>

      </div>

    </div>
  `;
}