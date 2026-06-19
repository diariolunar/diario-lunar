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

async function carregarHistoricoSeguro(postId) {
  try {
    return await listarHistoricoPost(postId);
  } catch (error) {
    console.error("Erro ao carregar histÃ³rico da revisÃ£o:", error);
    return [];
  }
}

function travarBotoes(travar) {
  document
    .querySelectorAll(".editor-actions-top button")
    .forEach((botao) => {
      botao.disabled = travar;
    });
}

async function aprovarMateria(post, usuarioAtual, onFinalizar) {
  const confirmar = await window.confirmarModal({
        titulo: "Aprovar matéria",
        mensagem: "Deseja aprovar e publicar esta matéria?",
        textoConfirmar: "Aprovar e publicar"
      });

  if (!confirmar) return;

  travarBotoes(true);

  try {
    await atualizarPost(post.id, {
      status: "publicado",
      motivoReprovacao: "",
      atualizadoEm: new Date()
    });

    await registrarHistoricoPost({
      postId: post.id,
      acao: "MatÃ©ria aprovada",
      usuario: usuarioAtual,
      statusAnterior: post.status || "em_revisao",
      statusNovo: "publicado"
    });

    alert("MatÃ©ria aprovada e publicada.");

    await onFinalizar("publicadas");

  } catch (error) {
    console.error(error);
    alert("Erro ao aprovar matÃ©ria.");
    travarBotoes(false);
  }
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

  travarBotoes(true);

  try {
    await atualizarPost(post.id, {
      status: "agendado",
      data: new Date(data + "T12:00:00"),
      motivoReprovacao: "",
      atualizadoEm: new Date()
    });

    await registrarHistoricoPost({
      postId: post.id,
      acao: "MatÃ©ria agendada na revisÃ£o",
      usuario: usuarioAtual,
      statusAnterior: post.status || "em_revisao",
      statusNovo: "agendado",
      observacao: `Agendada para ${data}`
    });

    alert("MatÃ©ria agendada.");

    await onFinalizar("publicadas");

  } catch (error) {
    console.error(error);
    alert("Erro ao agendar matÃ©ria.");
    travarBotoes(false);
  }
}

async function reprovarMateria(post, usuarioAtual, onFinalizar) {
  const motivo = document.getElementById("motivoRevisao").value.trim();

  if (!motivo) {
    alert("Informe o motivo da reprovaÃ§Ã£o.");
    return;
  }

  travarBotoes(true);

  try {
    await atualizarPost(post.id, {
      status: "reprovado",
      motivoReprovacao: motivo,
      atualizadoEm: new Date()
    });

    await registrarHistoricoPost({
      postId: post.id,
      acao: "MatÃ©ria reprovada",
      usuario: usuarioAtual,
      statusAnterior: post.status || "em_revisao",
      statusNovo: "reprovado",
      observacao: motivo
    });

    alert("MatÃ©ria reprovada.");

    await onFinalizar("rascunhos");

  } catch (error) {
    console.error(error);
    alert("Erro ao reprovar matÃ©ria.");
    travarBotoes(false);
  }
}

function renderHistorico(historico) {
  if (!historico.length) {
    return "<p>Nenhum histÃ³rico encontrado.</p>";
  }

  return historico.map((item) => `
    <div class="historico-item">
      <strong>${item.acao || "AlteraÃ§Ã£o"}</strong>

      <p>
        ${item.statusAnterior || "-"} â†’ ${item.statusNovo || "-"}
      </p>

      <p>
        Por @${item.usuario || "admin"} em ${formatarData(item.data)}
      </p>

      ${
        item.observacao
          ? `<p><b>ObservaÃ§Ã£o:</b> ${item.observacao}</p>`
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
        <h1>MatÃ©ria nÃ£o encontrada</h1>
        <p>NÃ£o foi possÃ­vel carregar esta matÃ©ria para revisÃ£o.</p>
      </div>
    `;
  }

  const historico = await carregarHistoricoSeguro(post.id);

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
      cancelarBtn.onclick = () => onFinalizar("revisao");
    }
  }, 100);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">

        <div>
          <h1>Revisar MatÃ©ria</h1>

          <p>
            Analise a matÃ©ria abaixo antes de aprovar, agendar ou reprovar.
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
            ${post.categoria || "MatÃ©ria"}
          </p>

          <h1>
            ${post.titulo || "Sem tÃ­tulo"}
          </h1>

          <p class="revisao-meta">
            Autor: @${post.autor || "diario_lunar"} Â·
            Data: ${formatarDataPost(post.data)}
          </p>

          <div class="revisao-conteudo">
            ${post.conteudo || ""}
          </div>

        </article>

        <aside class="revisao-side">

          <div class="admin-card">
            <h2>DecisÃ£o editorial</h2>

            <p>
              Para reprovar, informe claramente o motivo para que o autor saiba o que ajustar.
            </p>

            <textarea
              id="motivoRevisao"
              class="admin-textarea"
              placeholder="Motivo da reprovaÃ§Ã£o..."
            >${post.motivoReprovacao || ""}</textarea>
          </div>

          <div class="admin-card">
            <h2>HistÃ³rico</h2>

            <div class="historico-box">
              ${renderHistorico(historico)}
            </div>
          </div>

        </aside>

      </div>

    </div>
  `;
}

