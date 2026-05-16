import { db } from "../config/firebase.js";

import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  uploadArquivo
} from "../utils/upload.js";

let capaArquivo = null;
let capaUrlAtual = "";

function extrairIdDrive(url) {
  if (!url || !url.includes("drive.google.com")) {
    return "";
  }

  const match = url.match(/\/d\/([^/]+)/);

  if (match && match[1]) {
    return match[1];
  }

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

function getDataNumber(item) {
  if (item.data?.toDate) {
    return item.data.toDate().getTime();
  }

  if (item.data) {
    return new Date(item.data).getTime();
  }

  return 0;
}

function pegarDataAudiobook() {
  const campoData = document.getElementById("dataAudiobook");

  if (campoData.value) {
    return new Date(campoData.value + "T12:00:00");
  }

  return new Date();
}

function montarDadosAudiobook(status) {
  return {
    titulo: document.getElementById("tituloAudiobook").value.trim(),
    autor: document.getElementById("autorAudiobook").value.trim(),
    descricao: document.getElementById("descricaoAudiobook").value.trim(),
    categoria: document.getElementById("categoriaAudiobook").value.trim() || "Audiobook",
    capa: capaUrlAtual,
    audioUrl: document.getElementById("audioAudiobook").value.trim(),
    status,
    data: pegarDataAudiobook(),
    atualizadoEm: new Date()
  };
}

function validarAudiobook(dados, status) {
  if (!dados.titulo) {
    alert("Preencha o título do audiobook.");
    return false;
  }

  if (status === "publicado") {
    const temCapa = !!dados.capa || !!capaArquivo;

    if (!dados.autor || !temCapa || !dados.audioUrl) {
      alert("Para publicar, preencha autor, capa e link do áudio.");
      return false;
    }
  }

  return true;
}

async function salvarAudiobook(status, audiobookAtual, onFinalizar) {
  const botoes = document.querySelectorAll(".editor-actions-top button");

  botoes.forEach((botao) => {
    botao.disabled = true;
  });

  try {
    const dadosAntesUpload = montarDadosAudiobook(status);

    if (!validarAudiobook(dadosAntesUpload, status)) {
      botoes.forEach((botao) => {
        botao.disabled = false;
      });

      return;
    }

    if (capaArquivo) {
      capaUrlAtual = await uploadArquivo(capaArquivo, "capas-audiobooks");
    }

    const dados = montarDadosAudiobook(status);

    if (audiobookAtual?.id) {
      await updateDoc(doc(db, "audiobooks", audiobookAtual.id), dados);

      alert(
        status === "publicado"
          ? "Audiobook publicado com sucesso!"
          : "Audiobook salvo como rascunho!"
      );

    } else {
      await addDoc(collection(db, "audiobooks"), {
        ...dados,
        criadoEm: new Date()
      });

      alert(
        status === "publicado"
          ? "Audiobook publicado com sucesso!"
          : "Audiobook salvo como rascunho!"
      );
    }

    capaArquivo = null;

    await onFinalizar();

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao salvar audiobook.");
  }

  botoes.forEach((botao) => {
    botao.disabled = false;
  });
}

function iniciarUploadCapaAudiobook() {
  const uploadBox = document.getElementById("uploadCapaAudiobookBox");
  const input = document.getElementById("capaAudiobookInput");
  const preview = document.getElementById("previewCapaAudiobook");

  if (!uploadBox || !input || !preview) return;

  uploadBox.onclick = () => {
    input.click();
  };

  input.onchange = () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    if (!arquivo.type.startsWith("image/")) {
      alert("O arquivo precisa ser uma imagem.");
      return;
    }

    capaArquivo = arquivo;
    capaUrlAtual = "";

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";

    uploadBox.innerText =
      "Imagem selecionada. Ela será enviada ao salvar.";
  };
}

function iniciarBotoesFormulario(audiobookAtual, onFinalizar) {
  const botaoRascunho = document.getElementById("salvarRascunhoAudiobookBtn");
  const botaoPublicar = document.getElementById("publicarAudiobookBtn");
  const botaoCancelar = document.getElementById("cancelarAudiobookBtn");

  if (botaoRascunho) {
    botaoRascunho.onclick = async () => {
      await salvarAudiobook("rascunho", audiobookAtual, onFinalizar);
    };
  }

  if (botaoPublicar) {
    botaoPublicar.onclick = async () => {
      await salvarAudiobook("publicado", audiobookAtual, onFinalizar);
    };
  }

  if (botaoCancelar) {
    botaoCancelar.onclick = async () => {
      const confirmar = confirm("Deseja cancelar e sair sem salvar?");

      if (!confirmar) return;

      await onFinalizar();
    };
  }
}

export async function renderFormularioAudiobook(
  audiobookAtual = null,
  onFinalizar
) {
  capaArquivo = null;
  capaUrlAtual = audiobookAtual?.capa || "";

  setTimeout(() => {
    iniciarUploadCapaAudiobook();
    iniciarBotoesFormulario(audiobookAtual, onFinalizar);
  }, 80);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>
            ${audiobookAtual ? "Editar Audiobook" : "Novo Audiobook"}
          </h1>

          <p>
            Cadastre ou edite uma produção em áudio do Diário Lunar.
          </p>
        </div>

        <div class="editor-actions-top">
          <button class="btn" id="cancelarAudiobookBtn">
            Cancelar
          </button>

          <button class="btn" id="salvarRascunhoAudiobookBtn">
            Salvar Rascunho
          </button>

          <button class="btn btn-gradient" id="publicarAudiobookBtn">
            Publicar
          </button>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Título</label>

          <input
            id="tituloAudiobook"
            type="text"
            placeholder="Digite o título do audiobook"
            value="${audiobookAtual?.titulo || ""}"
          >
        </div>

        <div class="form-group">
          <label>Categoria</label>

          <input
            id="categoriaAudiobook"
            type="text"
            value="${audiobookAtual?.categoria || "Audiobook"}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Autor</label>

          <input
            id="autorAudiobook"
            type="text"
            placeholder="Nome do autor"
            value="${audiobookAtual?.autor || ""}"
          >
        </div>

        <div class="form-group">
          <label>Data</label>

          <input
            id="dataAudiobook"
            type="date"
            value="${formatarDataInput(audiobookAtual?.data)}"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Descrição</label>

        <textarea
          id="descricaoAudiobook"
          class="admin-textarea"
          placeholder="Descrição curta do audiobook..."
        >${audiobookAtual?.descricao || ""}</textarea>
      </div>

      <div class="form-group">
        <label>Capa do audiobook</label>

        <input
          id="capaAudiobookInput"
          type="file"
          accept="image/*"
          style="display:none;"
        >

        <div id="uploadCapaAudiobookBox" class="upload-box">
          Clique para enviar a capa
        </div>

        <small>
          A capa será enviada para o Firebase Storage. Audiobooks antigos com capa do Drive continuam funcionando.
        </small>

        <img
          id="previewCapaAudiobook"
          class="preview-capa"
          src="${montarImagemCapa(capaUrlAtual)}"
          style="${capaUrlAtual ? "display:block;" : "display:none;"}"
        >
      </div>

      <div class="form-group">
        <label>Link do áudio</label>

        <input
          id="audioAudiobook"
          type="text"
          placeholder="Cole aqui o link do áudio do Google Drive"
          value="${audiobookAtual?.audioUrl || ""}"
        >

        <small>
          O arquivo precisa estar como “Qualquer pessoa com o link pode visualizar”.
        </small>
      </div>

    </div>
  `;
}

function criarCardAudiobookAdmin(audio) {
  return `
    <div class="materia-card-admin">

      <img src="${montarImagemCapa(audio.capa || "")}">

      <div class="materia-admin-info">

        <small>
          ${audio.categoria || "Audiobook"}
        </small>

        <h3>
          ${audio.titulo || "Sem título"}
        </h3>

        <p>
          Autor: ${audio.autor || "Não informado"}
        </p>

        <p>
          Data: ${formatarData(audio.data)}
        </p>

        <div class="materia-admin-meta">
          <span class="${audio.status === "publicado" ? "status-publicado" : "status-rascunho"}">
            ${audio.status === "publicado" ? "Publicado" : "Rascunho"}
          </span>
        </div>

      </div>

      <div class="materia-admin-actions">

        <button
          data-editar-audiobook="${audio.id}"
          class="btn-editar"
        >
          Editar
        </button>

        ${
          audio.status === "publicado"
            ? `
              <button
                data-status-audiobook="${audio.id}"
                data-novo-status="rascunho"
                class="btn-editar"
              >
                Despublicar
              </button>
            `
            : `
              <button
                data-status-audiobook="${audio.id}"
                data-novo-status="publicado"
                class="btn-editar"
              >
                Publicar
              </button>
            `
        }

        <button
          data-excluir-audiobook="${audio.id}"
          class="btn-excluir"
        >
          Excluir
        </button>

      </div>

    </div>
  `;
}

async function listarAudiobooks() {
  const snap = await getDocs(collection(db, "audiobooks"));

  let lista = [];

  snap.forEach((item) => {
    lista.push({
      id: item.id,
      ...item.data(),
      dataNum: getDataNumber(item.data())
    });
  });

  lista.sort((a, b) => b.dataNum - a.dataNum);

  return lista;
}

async function buscarAudiobook(id) {
  const snap = await getDoc(doc(db, "audiobooks", id));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data()
  };
}

function iniciarAcoesLista(onEditar, onReload) {
  document
    .querySelectorAll("[data-editar-audiobook]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.editarAudiobook;
        const audiobook = await buscarAudiobook(id);

        if (!audiobook) {
          alert("Audiobook não encontrado.");
          return;
        }

        await onEditar(audiobook);
      };
    });

  document
    .querySelectorAll("[data-status-audiobook]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.statusAudiobook;
        const novoStatus = botao.dataset.novoStatus;

        await updateDoc(doc(db, "audiobooks", id), {
          status: novoStatus,
          atualizadoEm: new Date()
        });

        alert("Status atualizado.");

        await onReload();
      };
    });

  document
    .querySelectorAll("[data-excluir-audiobook]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.excluirAudiobook;

        const confirmar = confirm("Deseja realmente excluir este audiobook?");

        if (!confirmar) return;

        await deleteDoc(doc(db, "audiobooks", id));

        alert("Audiobook excluído.");

        await onReload();
      };
    });
}

export async function renderListarAudiobooks(onEditar, onReload) {
  const lista = await listarAudiobooks();

  setTimeout(() => {
    iniciarAcoesLista(onEditar, onReload);
  }, 80);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>Listar Audiobooks</h1>

          <p>
            Gerencie os audiobooks publicados e em rascunho.
          </p>
        </div>
      </div>

      <div class="materias-admin-grid">
        ${
          lista.length
            ? lista.map(criarCardAudiobookAdmin).join("")
            : `
              <p>
                Nenhum audiobook cadastrado ainda.
              </p>
            `
        }
      </div>

    </div>
  `;
}
