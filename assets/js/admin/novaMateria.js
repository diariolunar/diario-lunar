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

let cropImagemOriginal = null;
let cropImagemObj = null;
let cropZoom = 1;
let cropOffsetX = 0;
let cropOffsetY = 0;
let cropDragging = false;
let cropStartX = 0;
let cropStartY = 0;

function navegarDepoisDeSalvar(status) {
  if (status === "publicado" || status === "agendado") {
    const botao = document.querySelector('[data-page="materiasPublicadas"]');

    if (botao) {
      botao.click();
    }

    return;
  }

  if (status === "em_revisao") {
    const botao = document.querySelector('[data-page="materiasRevisar"]');

    if (botao) {
      botao.click();
    }

    return;
  }

  const botao = document.querySelector('[data-page="materiasRascunho"]');

  if (botao) {
    botao.click();
  }
}

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

function conteudoTemTextoOuImagem(conteudo) {
  const temp = document.createElement("div");
  temp.innerHTML = conteudo || "";

  const texto = temp.innerText
    .replace(/\s+/g, "")
    .trim();

  const temImagem = temp.querySelector("img") !== null;

  return texto.length > 0 || temImagem;
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

  if (
    status === "em_revisao" ||
    status === "publicado" ||
    status === "agendado"
  ) {
    const temCategoria = !!dados.categoria;
    const temImagemCapa = !!dados.imagem || !!imagemCapaArquivo;
    const temConteudo = conteudoTemTextoOuImagem(dados.conteudo);

    if (!temCategoria || !temImagemCapa || !temConteudo) {
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

function abrirPreview(status = "em_revisao") {
  const usuario = window.usuarioAtualEditor || {};
  const dados = montarDadosMateria(status, usuario);

  if (!validarMateria(dados, status)) return;

  const modal = document.getElementById("previewModal");
  const conteudo = document.getElementById("previewConteudo");

  const imagemPreview =
    imagemCapaUrl ||
    document.getElementById("previewCapa")?.src ||
    "/assets/images/footer.png";

  conteudo.innerHTML = `
    <article class="preview-article">
      <img
        class="preview-cover"
        src="${imagemPreview}"
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

function desenharCrop() {
  const canvas = document.getElementById("cropCanvas");

  if (!canvas || !cropImagemObj) return;

  const ctx = canvas.getContext("2d");

  const largura = canvas.width;
  const altura = canvas.height;

  ctx.clearRect(0, 0, largura, altura);
  ctx.fillStyle = "#111827";
  ctx.fillRect(0, 0, largura, altura);

  const escalaBase = Math.max(
    largura / cropImagemObj.width,
    altura / cropImagemObj.height
  );

  const escala = escalaBase * cropZoom;

  const imgW = cropImagemObj.width * escala;
  const imgH = cropImagemObj.height * escala;

  const x = (largura - imgW) / 2 + cropOffsetX;
  const y = (altura - imgH) / 2 + cropOffsetY;

  ctx.drawImage(cropImagemObj, x, y, imgW, imgH);
}

function abrirCropImagem(arquivo) {
  const modal = document.getElementById("cropModal");
  const canvas = document.getElementById("cropCanvas");
  const zoom = document.getElementById("cropZoom");

  cropImagemOriginal = arquivo;
  cropZoom = 1;
  cropOffsetX = 0;
  cropOffsetY = 0;

  zoom.value = "1";

  const img = new Image();
  const url = URL.createObjectURL(arquivo);

  img.onload = () => {
    URL.revokeObjectURL(url);

    cropImagemObj = img;
    modal.classList.add("active");

    desenharCrop();
  };

  img.onerror = () => {
    URL.revokeObjectURL(url);
    alert("Não foi possível carregar essa imagem para corte.");
  };

  img.src = url;

  canvas.onmousedown = (event) => {
    cropDragging = true;
    cropStartX = event.clientX - cropOffsetX;
    cropStartY = event.clientY - cropOffsetY;
  };

  window.onmouseup = () => {
    cropDragging = false;
  };

  canvas.onmousemove = (event) => {
    if (!cropDragging) return;

    cropOffsetX = event.clientX - cropStartX;
    cropOffsetY = event.clientY - cropStartY;

    desenharCrop();
  };

  zoom.oninput = () => {
    cropZoom = Number(zoom.value);
    desenharCrop();
  };
}

function confirmarCropImagem() {
  const canvas = document.getElementById("cropCanvas");

  canvas.toBlob(
    (blob) => {
      if (!blob) {
        alert("Erro ao cortar imagem.");
        return;
      }

      const arquivoCortado = new File(
        [blob],
        cropImagemOriginal.name.replace(/\.[^/.]+$/, ".jpg"),
        {
          type: "image/jpeg",
          lastModified: Date.now()
        }
      );

      imagemCapaArquivo = arquivoCortado;
      imagemCapaUrl = "";

      const preview = document.getElementById("previewCapa");
      const urlPreview = URL.createObjectURL(arquivoCortado);

      preview.src = urlPreview;
      preview.dataset.temImagemLocal = "true";
      preview.style.display = "block";

      document.getElementById("uploadCapaBox").innerText =
        "Imagem cortada e selecionada. Ela será enviada ao salvar.";

      document.getElementById("cropModal").classList.remove("active");
    },
    "image/jpeg",
    0.9
  );
}

function iniciarCropBotoes() {
  const cancelar = document.getElementById("cancelarCropBtn");
  const confirmar = document.getElementById("confirmarCropBtn");

  if (cancelar) {
    cancelar.onclick = () => {
      document.getElementById("cropModal").classList.remove("active");
    };
  }

  if (confirmar) {
    confirmar.onclick = confirmarCropImagem;
  }
}

function iniciarUploadCapa() {
  const uploadBox = document.getElementById("uploadCapaBox");
  const input = document.getElementById("imagemCapaInput");

  uploadBox.onclick = () => {
    input.click();
  };

  input.onchange = () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    abrirCropImagem(arquivo);
  };
}

async function salvarMateria(status, usuario) {
  const botoes = document.querySelectorAll(".editor-actions-top button");

  botoes.forEach((botao) => {
    botao.disabled = true;
  });

  try {
    const dadosAntesUpload = montarDadosMateria(status, usuario);

    if (!validarMateria(dadosAntesUpload, status)) {
      botoes.forEach((botao) => {
        botao.disabled = false;
      });

      return;
    }

    if (imagemCapaArquivo) {
      imagemCapaUrl = await uploadArquivo(imagemCapaArquivo, "capas-materias");
    }

    const dados = montarDadosMateria(status, usuario);

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

    const mensagens = {
      rascunho: "Rascunho salvo com sucesso!",
      em_revisao: "Matéria enviada para revisão!",
      publicado: "Matéria publicada com sucesso!",
      agendado: "Matéria agendada com sucesso!"
    };

    alert(mensagens[status] || "Matéria salva.");

    navegarDepoisDeSalvar(status);

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao salvar matéria.");
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

  const modoEdicao = !!postExistente;
  const historicoHtml = await carregarHistorico();
  const usuarioPodeRevisar = podeRevisar(usuario);

  setTimeout(() => {
    iniciarEditor({
      onPreview: () => abrirPreview("em_revisao")
    });

    iniciarUploadCapa();
    iniciarCropBotoes();
    iniciarBotoesSalvar(usuario);
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

      <div id="cropModal" class="crop-modal">
        <div class="crop-modal-content">
          <div class="admin-header-flex">
            <div>
              <h2>Ajustar imagem de capa</h2>
              <p>Arraste a imagem e use o zoom para encaixar no formato 16:9.</p>
            </div>

            <button id="cancelarCropBtn" class="btn">
              Cancelar
            </button>
          </div>

          <canvas
            id="cropCanvas"
            width="1280"
            height="720"
          ></canvas>

          <label class="crop-label">
            Zoom da imagem
          </label>

          <input
            id="cropZoom"
            type="range"
            min="1"
            max="3"
            step="0.01"
            value="1"
          >

          <button
            id="confirmarCropBtn"
            class="btn btn-gradient"
            style="margin-top:18px;"
          >
            Usar imagem cortada
          </button>
        </div>
      </div>

    </div>
  `;
}