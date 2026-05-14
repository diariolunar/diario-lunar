import { iniciarEditor } from "./editorMateria.js";

import {
  criarPost,
  atualizarPost,
  registrarHistoricoPost,
  listarHistoricoPost
} from "../services/postsService.js";

import {
  uploadArquivo
} from "../utils/upload.js";

import {
  podeRevisar
} from "./auth/permissions.js";

let imagemCapaArquivo = null;
let imagemCapaUrl = "";
let postAtual = null;
let autosaveInterval = null;
let autosaveKey = "";

function pegarDataPublicacao() {
  const campoData = document.getElementById("dataMateria");

  if (campoData.value) {
    return new Date(campoData.value + "T12:00:00");
  }

  return new Date();
}

function formatarDataInput(data) {
  if (!data) return "";

  try {
    if (data.toDate) {
      return data.toDate().toISOString().split("T")[0];
    }

    return new Date(data).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

function formatarDataHistorico(data) {
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

function montarDadosMateria(status, usuario) {
  return {
    titulo: document.getElementById("tituloMateria").value.trim(),
    categoria: document.getElementById("categoriaMateria").value,
    conteudo: document.getElementById("editorArea").innerHTML.trim(),
    imagem: imagemCapaUrl,
    autor: postAtual?.autor || usuario.user || usuario.email || "diario_lunar",
    data: pegarDataPublicacao(),
    status,
    destaque: document.getElementById("destaqueMateria").checked,
    atualizadoEm: new Date()
  };
}

function validarMateria(dados, status) {
  if (!dados.titulo) {
    alert("Preencha o título da matéria.");
    return false;
  }

  if (status === "em_revisao" || status === "publicado" || status === "agendado") {
    if (!dados.categoria || !dados.conteudo || !dados.imagem) {
      alert("Preencha categoria, imagem de capa e conteúdo.");
      return false;
    }
  }

  return true;
}

async function carregarHistorico() {
  if (!postAtual?.id) {
    return `
      <div class="historico-box">
        <p>Nenhum histórico ainda. A matéria ainda não foi salva.</p>
      </div>
    `;
  }

  try {
    const historico = await listarHistoricoPost(postAtual.id);

    if (historico.length === 0) {
      return `
        <div class="historico-box">
          <p>Nenhum histórico encontrado.</p>
        </div>
      `;
    }

    return `
      <div class="historico-box">
        ${
          historico.map((item) => `
            <div class="historico-item">
              <strong>${item.acao || "Alteração"}</strong>

              <p>
                ${item.statusAnterior || "-"} → ${item.statusNovo || "-"}
              </p>

              <p>
                Por @${item.usuario || "admin"} em ${formatarDataHistorico(item.data)}
              </p>

              ${
                item.observacao
                  ? `<p><b>Observação:</b> ${item.observacao}</p>`
                  : ""
              }
            </div>
          `).join("")
        }
      </div>
    `;

  } catch (error) {
    console.error("Erro ao carregar histórico:", error);

    return `
      <div class="historico-box">
        <p>Não foi possível carregar o histórico.</p>
      </div>
    `;
  }
}

function salvarAutosaveLocal() {
  if (!autosaveKey) return;

  const dados = {
    titulo: document.getElementById("tituloMateria")?.value || "",
    categoria: document.getElementById("categoriaMateria")?.value || "Literatura",
    data: document.getElementById("dataMateria")?.value || "",
    destaque: document.getElementById("destaqueMateria")?.checked || false,
    conteudo: document.getElementById("editorArea")?.innerHTML || "",
    imagem: imagemCapaUrl || "",
    salvoEm: new Date().toISOString()
  };

  localStorage.setItem(autosaveKey, JSON.stringify(dados));

  const status = document.getElementById("autosaveStatus");

  if (status) {
    status.innerText =
      "Rascunho automático salvo às " +
      new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit"
      });
  }
}

function recuperarAutosave() {
  if (!autosaveKey) return;

  const salvo = localStorage.getItem(autosaveKey);

  if (!salvo) return;

  const confirmar = confirm(
    "Existe um rascunho automático salvo neste editor. Deseja recuperar?"
  );

  if (!confirmar) return;

  try {
    const dados = JSON.parse(salvo);

    document.getElementById("tituloMateria").value = dados.titulo || "";
    document.getElementById("categoriaMateria").value = dados.categoria || "Literatura";
    document.getElementById("dataMateria").value = dados.data || "";
    document.getElementById("destaqueMateria").checked = dados.destaque === true;
    document.getElementById("editorArea").innerHTML = dados.conteudo || "";

    if (dados.imagem) {
      imagemCapaUrl = dados.imagem;

      const preview = document.getElementById("previewCapa");

      preview.src = dados.imagem;
      preview.style.display = "block";

      document.getElementById("uploadCapaBox").innerText =
        "Imagem recuperada do rascunho automático.";
    }

  } catch {
    localStorage.removeItem(autosaveKey);
  }
}

function iniciarAutosave() {
  if (autosaveInterval) {
    clearInterval(autosaveInterval);
  }

  const campos = [
    "tituloMateria",
    "categoriaMateria",
    "dataMateria",
    "destaqueMateria",
    "editorArea"
  ];

  campos.forEach((id) => {
    const elemento = document.getElementById(id);

    if (!elemento) return;

    elemento.addEventListener("input", salvarAutosaveLocal);
    elemento.addEventListener("change", salvarAutosaveLocal);
  });

  autosaveInterval = setInterval(salvarAutosaveLocal, 10000);

  recuperarAutosave();
}

function limparAutosave() {
  if (autosaveKey) {
    localStorage.removeItem(autosaveKey);
  }
}

function abrirPreview(status = "em_revisao") {
  const usuario = window.usuarioAtualEditor || {};
  const dados = montarDadosMateria(status, usuario);

  if (!validarMateria(dados, status)) return;

  const modal = document.getElementById("previewModal");
  const conteudo = document.getElementById("previewConteudo");

  conteudo.innerHTML = `
    <article class="preview-article">
      <img
        class="preview-cover"
        src="${dados.imagem || "/assets/images/footer.png"}"
      >

      <p style="color:var(--roxo); font-weight:bold; text-transform:uppercase;">
        ${dados.categoria || "Matéria"}
      </p>

      <h1>${dados.titulo || "Sem título"}</h1>

      <div class="preview-article-content">
        ${dados.conteudo || ""}
      </div>
    </article>
  `;

  modal.classList.add("active");

  document.getElementById("confirmarPublicacaoBtn").onclick = async () => {
    modal.classList.remove("active");
    await salvarMateria(status, window.usuarioAtualEditor);
  };
}

function fecharPreview() {
  const modal = document.getElementById("previewModal");

  if (modal) {
    modal.classList.remove("active");
  }
}

function iniciarUploadCapa() {
  const uploadBox = document.getElementById("uploadCapaBox");
  const input = document.getElementById("imagemCapaInput");
  const preview = document.getElementById("previewCapa");

  uploadBox.onclick = () => {
    input.click();
  };

  input.onchange = () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    imagemCapaArquivo = arquivo;

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";

    uploadBox.innerText = "Imagem selecionada. Ela será enviada ao salvar.";

    salvarAutosaveLocal();
  };
}

async function salvarMateria(status, usuario) {
  const botoes = document.querySelectorAll(".editor-actions-top button");

  botoes.forEach((botao) => {
    botao.disabled = true;
  });

  try {
    if (imagemCapaArquivo) {
      imagemCapaUrl = await uploadArquivo(imagemCapaArquivo, "capas-materias");
    }

    const dados = montarDadosMateria(status, usuario);

    if (!validarMateria(dados, status)) {
      botoes.forEach((botao) => {
        botao.disabled = false;
      });

      return;
    }

    const statusAnterior = postAtual?.status || "novo";

    if (postAtual?.id) {
      await atualizarPost(postAtual.id, dados);

      await registrarHistoricoPost({
        postId: postAtual.id,
        acao: "Atualização de matéria",
        usuario,
        statusAnterior,
        statusNovo: status
      });

    } else {
      const novoPost = await criarPost({
        ...dados,
        curtidas: 0,
        views: 0,
        criadoEm: new Date()
      });

      await registrarHistoricoPost({
        postId: novoPost.id,
        acao: "Criação de matéria",
        usuario,
        statusAnterior: "novo",
        statusNovo: status
      });
    }

    limparAutosave();

    const mensagens = {
      rascunho: "Rascunho salvo com sucesso!",
      em_revisao: "Matéria enviada para revisão!",
      publicado: "Matéria publicada com sucesso!",
      agendado: "Matéria agendada com sucesso!"
    };

    alert(mensagens[status] || "Matéria salva.");

  } catch (error) {
    console.error(error);
    alert("Erro ao salvar matéria.");
  }

  botoes.forEach((botao) => {
    botao.disabled = false;
  });
}

function iniciarBotoesSalvar(usuario) {
  window.usuarioAtualEditor = usuario;

  const botaoCancelar = document.getElementById("cancelarBtn");
  const botaoRascunho = document.getElementById("salvarRascunhoBtn");
  const botaoRevisao = document.getElementById("enviarRevisaoBtn");
  const botaoPublicar = document.getElementById("publicarBtn");
  const botaoAgendar = document.getElementById("agendarBtn");
  const botaoFecharPreview = document.getElementById("fecharPreviewBtn");

  if (botaoFecharPreview) {
    botaoFecharPreview.onclick = fecharPreview;
  }

  if (botaoCancelar) {
    botaoCancelar.onclick = () => {
      const confirmar = confirm("Deseja cancelar e sair sem salvar agora?");

      if (!confirmar) return;

      const botaoListar = document.querySelector('[data-page="materiasRascunho"]');

      if (botaoListar) {
        botaoListar.click();
      }
    };
  }

  if (botaoRascunho) {
    botaoRascunho.onclick = async () => {
      await salvarMateria("rascunho", usuario);
    };
  }

  if (botaoRevisao) {
    botaoRevisao.onclick = () => {
      abrirPreview("em_revisao");
    };
  }

  if (botaoPublicar) {
    botaoPublicar.onclick = () => {
      abrirPreview("publicado");
    };
  }

  if (botaoAgendar) {
    botaoAgendar.onclick = async () => {
      const data = document.getElementById("dataMateria").value;

      if (!data) {
        alert("Escolha uma data para agendar.");
        return;
      }

      await salvarMateria("agendado", usuario);
    };
  }
}

export async function renderNovaMateria(usuario, postExistente = null) {
  postAtual = postExistente;
  imagemCapaArquivo = null;
  imagemCapaUrl = postExistente?.imagem || "";

  autosaveKey = postExistente?.id
    ? `diarioLunarAutosave_editar_${postExistente.id}`
    : `diarioLunarAutosave_nova_${usuario.id || usuario.user || "admin"}`;

  const modoEdicao = !!postExistente;
  const historicoHtml = await carregarHistorico();
  const usuarioPodeRevisar = podeRevisar(usuario);

  setTimeout(() => {
    iniciarEditor({
      onPreview: () => abrirPreview("em_revisao")
    });

    iniciarUploadCapa();
    iniciarBotoesSalvar(usuario);
    iniciarAutosave();
  }, 100);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>${modoEdicao ? "Editar Matéria" : "Nova Matéria"}</h1>

          <p>
            ${
              usuarioPodeRevisar
                ? "Você pode publicar diretamente por ser editor-chefe/revisor."
                : "A matéria será enviada para revisão antes da publicação."
            }
          </p>

          ${
            postExistente?.status
              ? `<span class="status-${postExistente.status}">${postExistente.status}</span>`
              : ""
          }
        </div>

        <div class="editor-actions-top">
          <button class="btn" id="cancelarBtn">
            Cancelar
          </button>

          <button class="btn" id="salvarRascunhoBtn">
            Salvar Rascunho
          </button>

          <button class="btn" id="enviarRevisaoBtn">
            Enviar para Revisão
          </button>

          <button class="btn" id="previewMateriaBtn">
            Pré-visualizar
          </button>

          ${
            usuarioPodeRevisar
              ? `
                <button class="btn" id="agendarBtn">
                  Agendar
                </button>

                <button class="btn btn-gradient" id="publicarBtn">
                  Publicar Direto
                </button>
              `
              : ""
          }
        </div>
      </div>

      <p id="autosaveStatus" class="autosave-status">
        Autosave ativo.
      </p>

      <div class="form-grid">
        <div class="form-group">
          <label>Título</label>

          <input
            id="tituloMateria"
            type="text"
            placeholder="Digite o título da matéria"
            value="${postExistente?.titulo || ""}"
          >
        </div>

        <div class="form-group">
          <label>Categoria</label>

          <select id="categoriaMateria">
            <option value="Literatura" ${postExistente?.categoria === "Literatura" ? "selected" : ""}>Literatura</option>
            <option value="Comunidade" ${postExistente?.categoria === "Comunidade" ? "selected" : ""}>Comunidade</option>
            <option value="Autores" ${postExistente?.categoria === "Autores" ? "selected" : ""}>Autores</option>
            <option value="Eventos" ${postExistente?.categoria === "Eventos" ? "selected" : ""}>Eventos</option>
            <option value="Resenhas" ${postExistente?.categoria === "Resenhas" ? "selected" : ""}>Resenhas</option>
            <option value="Entrevistas" ${postExistente?.categoria === "Entrevistas" ? "selected" : ""}>Entrevistas</option>
            <option value="Destaques Lunar" ${postExistente?.categoria === "Destaques Lunar" ? "selected" : ""}>Destaques Lunar</option>
          </select>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Data da publicação/agendamento</label>

          <input
            id="dataMateria"
            type="date"
            value="${formatarDataInput(postExistente?.data)}"
          >
        </div>

        <div class="form-group">
          <label>Autor</label>

          <input
            disabled
            value="@${postExistente?.autor || usuario.user || usuario.email || "diario_lunar"}"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Configurações da matéria</label>

        <div class="permissions-grid">
          <label>
            <input
              id="destaqueMateria"
              type="checkbox"
              ${postExistente?.destaque ? "checked" : ""}
            >
            Definir como destaque
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>Imagem de capa</label>

        <input
          id="imagemCapaInput"
          type="file"
          accept="image/*"
          style="display:none;"
        >

        <div id="uploadCapaBox" class="upload-box">
          Clique para enviar imagem
        </div>

        <img
          id="previewCapa"
          class="preview-capa"
          src="${postExistente?.imagem || ""}"
          style="${postExistente?.imagem ? "display:block;" : "display:none;"}"
        >
      </div>

      <div class="form-group editor-wrapper">
        <label>Conteúdo da matéria</label>

        <div class="editor-toolbar">

          <button type="button" data-editor="bold" title="Negrito">
            <i class="fa-solid fa-bold"></i>
          </button>

          <button type="button" data-editor="italic" title="Itálico">
            <i class="fa-solid fa-italic"></i>
          </button>

          <button type="button" data-editor="underline" title="Sublinhado">
            <i class="fa-solid fa-underline"></i>
          </button>

          <button type="button" data-editor="justifyLeft" title="Esquerda">
            <i class="fa-solid fa-align-left"></i>
          </button>

          <button type="button" data-editor="justifyCenter" title="Centro">
            <i class="fa-solid fa-align-center"></i>
          </button>

          <button type="button" data-editor="justifyRight" title="Direita">
            <i class="fa-solid fa-align-right"></i>
          </button>

          <button type="button" data-editor="justifyFull" title="Justificado">
            <i class="fa-solid fa-align-justify"></i>
          </button>

          <button type="button" data-editor="insertUnorderedList" title="Lista">
            <i class="fa-solid fa-list-ul"></i>
          </button>

          <button type="button" data-editor="insertOrderedList" title="Lista numerada">
            <i class="fa-solid fa-list-ol"></i>
          </button>

          <button type="button" data-editor="createLink" title="Link">
            <i class="fa-solid fa-link"></i>
          </button>

          <button type="button" data-editor="blockquote" title="Citação">
            <i class="fa-solid fa-quote-left"></i>
          </button>

          <button type="button" data-editor="separator" title="Separador">
            <i class="fa-solid fa-minus"></i>
          </button>

          <button type="button" id="inserirImagemBtn" title="Imagem">
            <i class="fa-solid fa-image"></i>
          </button>

        </div>

        <div
          id="editorArea"
          class="editor-area"
          contenteditable="true"
        >${postExistente?.conteudo || ""}</div>
      </div>

      <div class="admin-card" style="margin-top:25px;">
        <h2>Histórico de alterações</h2>
        ${historicoHtml}
      </div>

      <div id="previewModal" class="preview-modal">
        <div class="preview-modal-content">

          <div class="preview-actions">
            <button id="fecharPreviewBtn" class="btn">
              Fechar
            </button>

            <button id="confirmarPublicacaoBtn" class="btn btn-gradient">
              Confirmar
            </button>
          </div>

          <div id="previewConteudo"></div>

        </div>
      </div>

    </div>
  `;
}