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

function pegarDataTrilhaSonora() {
  const campoData = document.getElementById("dataTrilhaSonora");

  if (campoData.value) {
    return new Date(campoData.value + "T12:00:00");
  }

  return new Date();
}

function montarDadosTrilhaSonora(status) {
  return {
    titulo: document.getElementById("tituloTrilhaSonora").value.trim(),
    autor: document.getElementById("autorTrilhaSonora").value.trim(),
    produtor: document.getElementById("produtorTrilhaSonora").value.trim(),
    descricao: document.getElementById("descricaoTrilhaSonora").value.trim(),
    categoria: document.getElementById("categoriaTrilhaSonora").value.trim() || "Trilha Sonora",
    capa: capaUrlAtual,
    audioUrl: document.getElementById("audioTrilhaSonora").value.trim(),
    status,
    data: pegarDataTrilhaSonora(),
    atualizadoEm: new Date()
  };
}

function validarTrilhaSonora(dados, status) {
  if (!dados.titulo) {
    alert("Preencha o título do trilha.");
    return false;
  }

  if (status === "publicado") {
    const temCapa = !!dados.capa || !!capaArquivo;

    if (!dados.autor || !dados.produtor || !temCapa || !dados.audioUrl) {
      alert("Para publicar, preencha autor, quem gravou o áudio, capa e link do áudio.");
      return false;
    }
  }

  return true;
}

async function salvarTrilhaSonora(status, trilhaAtual, onFinalizar) {
  const botoes = document.querySelectorAll(".editor-actions-top button");

  botoes.forEach((botao) => {
    botao.disabled = true;
  });

  try {
    const dadosAntesUpload = montarDadosTrilhaSonora(status);

    if (!validarTrilhaSonora(dadosAntesUpload, status)) {
      botoes.forEach((botao) => {
        botao.disabled = false;
      });

      return;
    }

    if (capaArquivo) {
      capaUrlAtual = await uploadArquivo(capaArquivo, "capas-trilhas-sonoras");
    }

    const dados = montarDadosTrilhaSonora(status);

    if (trilhaAtual?.id) {
      await updateDoc(doc(db, "trilhasSonoras", trilhaAtual.id), dados);

      alert(
        status === "publicado"
          ? "Trilha sonora publicada com sucesso!"
          : "Trilha sonora salva como rascunho!"
      );

    } else {
      await addDoc(collection(db, "trilhasSonoras"), {
        ...dados,
        criadoEm: new Date()
      });

      alert(
        status === "publicado"
          ? "Trilha sonora publicada com sucesso!"
          : "Trilha sonora salva como rascunho!"
      );
    }

    capaArquivo = null;

    await onFinalizar();

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao salvar trilha.");
  }

  botoes.forEach((botao) => {
    botao.disabled = false;
  });
}

function iniciarUploadCapaTrilhaSonora() {
  const uploadBox = document.getElementById("uploadCapaTrilhaSonoraBox");
  const input = document.getElementById("capaTrilhaSonoraInput");
  const preview = document.getElementById("previewCapaTrilhaSonora");

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

function iniciarBotoesFormulario(trilhaAtual, onFinalizar) {
  const botaoRascunho = document.getElementById("salvarRascunhoTrilhaSonoraBtn");
  const botaoPublicar = document.getElementById("publicarTrilhaSonoraBtn");
  const botaoCancelar = document.getElementById("cancelarTrilhaSonoraBtn");

  if (botaoRascunho) {
    botaoRascunho.onclick = async () => {
      await salvarTrilhaSonora("rascunho", trilhaAtual, onFinalizar);
    };
  }

  if (botaoPublicar) {
    botaoPublicar.onclick = async () => {
      await salvarTrilhaSonora("publicado", trilhaAtual, onFinalizar);
    };
  }

  if (botaoCancelar) {
    botaoCancelar.onclick = async () => {
      const confirmar = await window.confirmarModal({
            titulo: "Cancelar edição",
            mensagem: "Deseja cancelar e sair sem salvar?",
            textoConfirmar: "Sair sem salvar"
          });

      if (!confirmar) return;

      await onFinalizar();
    };
  }
}

export async function renderFormularioTrilhaSonora(
  trilhaAtual = null,
  onFinalizar
) {
  capaArquivo = null;
  capaUrlAtual = trilhaAtual?.capa || "";

  setTimeout(() => {
    iniciarUploadCapaTrilhaSonora();
    iniciarBotoesFormulario(trilhaAtual, onFinalizar);
  }, 80);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>
            ${trilhaAtual ? "Editar Trilha Sonora" : "Nova Trilha Sonora"}
          </h1>

          <p>
            Cadastre ou edite uma produção em áudio do Diário Lunar.
          </p>
        </div>

        <div class="editor-actions-top">
          <button class="btn" id="cancelarTrilhaSonoraBtn">
            Cancelar
          </button>

          <button class="btn" id="salvarRascunhoTrilhaSonoraBtn">
            Salvar Rascunho
          </button>

          <button class="btn btn-gradient" id="publicarTrilhaSonoraBtn">
            Publicar
          </button>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Título</label>

          <input
            id="tituloTrilhaSonora"
            type="text"
            placeholder="Digite o título do trilha"
            value="${trilhaAtual?.titulo || ""}"
          >
        </div>

        <div class="form-group">
          <label>Categoria</label>

          <input
            id="categoriaTrilhaSonora"
            type="text"
            value="${trilhaAtual?.categoria || "Trilha Sonora"}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Autor</label>

          <input
            id="autorTrilhaSonora"
            type="text"
            placeholder="Nome do autor"
            value="${trilhaAtual?.autor || ""}"
          >
        </div>

        <div class="form-group">
          <label>Produzido por</label>

          <input
            id="produtorTrilhaSonora"
            type="text"
            placeholder="Nome de quem produziu a trilha"
            value="${trilhaAtual?.produtor || ""}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Data</label>

          <input
            id="dataTrilhaSonora"
            type="date"
            value="${formatarDataInput(trilhaAtual?.data)}"
          >
        </div>

        <div class="form-group">
          <label>Link do áudio</label>

          <input
            id="audioTrilhaSonora"
            type="text"
            placeholder="Cole aqui o link do áudio do Google Drive"
            value="${trilhaAtual?.audioUrl || ""}"
          >

          <small>
            O arquivo precisa estar como “Qualquer pessoa com o link pode visualizar”.
          </small>
        </div>
      </div>

      <div class="form-group">
        <label>Descrição</label>

        <textarea
          id="descricaoTrilhaSonora"
          class="admin-textarea"
          placeholder="Descrição curta do trilha..."
        >${trilhaAtual?.descricao || ""}</textarea>
      </div>

      <div class="form-group">
        <label>Capa do trilha</label>

        <input
          id="capaTrilhaSonoraInput"
          type="file"
          accept="image/*"
          style="display:none;"
        >

        <div id="uploadCapaTrilhaSonoraBox" class="upload-box">
          Clique para enviar a capa
        </div>

        <small>
          A capa será comprimida e enviada para o serviço de imagens. Trilhas Sonoras antigos com capa do Drive continuam funcionando.
        </small>

        <img
          id="previewCapaTrilhaSonora"
          class="preview-capa"
          src="${montarImagemCapa(capaUrlAtual)}"
          style="${capaUrlAtual ? "display:block;" : "display:none;"}"
        >
      </div>

    </div>
  `;
}

function criarCardTrilhaSonoraAdmin(audio) {
  return `
    <div class="materia-card-admin">

      <img src="${montarImagemCapa(audio.capa || "")}">

      <div class="materia-admin-info">

        <small>
          ${audio.categoria || "Trilha Sonora"}
        </small>

        <h3>
          ${audio.titulo || "Sem título"}
        </h3>

        <p>
          Autor: ${audio.autor || "Não informado"}
        </p>

        <p>
          Produzido por: ${audio.produtor || "Não informado"}
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
          data-editar-trilha="${audio.id}"
          class="btn-editar"
        >
          Editar
        </button>

        ${
          audio.status === "publicado"
            ? `
              <button
                data-status-trilha="${audio.id}"
                data-novo-status="rascunho"
                class="btn-editar"
              >
                Despublicar
              </button>
            `
            : `
              <button
                data-status-trilha="${audio.id}"
                data-novo-status="publicado"
                class="btn-editar"
              >
                Publicar
              </button>
            `
        }

        <button
          data-excluir-trilha="${audio.id}"
          class="btn-excluir"
        >
          Excluir
        </button>

      </div>

    </div>
  `;
}

async function listarTrilhasSonoras() {
  const snap = await getDocs(collection(db, "trilhasSonoras"));

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

export async function buscarTrilhaSonora(id) {
  const snap = await getDoc(doc(db, "trilhasSonoras", id));

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
    .querySelectorAll("[data-editar-trilha]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.editarTrilha;
        const trilha = await buscarTrilhaSonora(id);

        if (!trilha) {
          alert("Trilha sonora não encontrada.");
          return;
        }

        await onEditar(trilha);
      };
    });

  document
    .querySelectorAll("[data-status-trilha]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.statusTrilha;
        const novoStatus = botao.dataset.novoStatus;

        await updateDoc(doc(db, "trilhasSonoras", id), {
          status: novoStatus,
          atualizadoEm: new Date()
        });

        alert("Status atualizado.");

        await onReload();
      };
    });

  document
    .querySelectorAll("[data-excluir-trilha]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.excluirTrilha;

        const confirmar = await window.confirmarModal({
              titulo: "Excluir trilha",
              mensagem: "Deseja realmente excluir esta trilha?",
              textoConfirmar: "Excluir"
            });

        if (!confirmar) return;

        await deleteDoc(doc(db, "trilhasSonoras", id));

        alert("Trilha sonora excluída.");

        await onReload();
      };
    });
}

export async function renderListarTrilhasSonoras(onEditar, onReload) {
  const lista = await listarTrilhasSonoras();

  setTimeout(() => {
    iniciarAcoesLista(onEditar, onReload);
  }, 80);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>Listar Trilhas Sonoras</h1>

          <p>
            Gerencie as trilhas sonoras publicadas e em rascunho.
          </p>
        </div>
      </div>

      <div class="materias-admin-grid">
        ${
          lista.length
            ? lista.map(criarCardTrilhaSonoraAdmin).join("")
            : `
              <p>
                Nenhuma trilha cadastrada ainda.
              </p>
            `
        }
      </div>

    </div>
  `;
}



