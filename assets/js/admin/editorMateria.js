import { uploadImagemEditor } from "../editor/uploadImagemEditor.js";

let selecaoSalva = null;
let imagemSelecionada = null;

function salvarSelecao() {
  const selecao = window.getSelection();

  if (selecao.rangeCount > 0) {
    selecaoSalva = selecao.getRangeAt(0);
  }
}

function restaurarSelecao() {
  if (!selecaoSalva) return;

  const selecao = window.getSelection();

  selecao.removeAllRanges();
  selecao.addRange(selecaoSalva);
}

function normalizarUrl(url) {
  if (!url) return "";

  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("mailto:")
  ) {
    return url;
  }

  return "https://" + url;
}

function removerControlesImagem() {
  const antigo = document.getElementById("imageEditorControls");

  if (antigo) {
    antigo.remove();
  }
}

function criarControlesImagem(img) {
  removerControlesImagem();

  imagemSelecionada = img;

  const controles = document.createElement("div");
  controles.id = "imageEditorControls";
  controles.className = "image-editor-controls";

  controles.innerHTML = `
    <button type="button" data-img-size="25">25%</button>
    <button type="button" data-img-size="50">50%</button>
    <button type="button" data-img-size="75">75%</button>
    <button type="button" data-img-size="100">100%</button>
    <button type="button" data-img-align="left">Esq.</button>
    <button type="button" data-img-align="center">Centro</button>
    <button type="button" data-img-align="right">Dir.</button>
    <button type="button" data-img-move="up">↑</button>
    <button type="button" data-img-move="down">↓</button>
    <button type="button" data-img-delete="true">Excluir</button>
  `;

  img.insertAdjacentElement("beforebegin", controles);

  controles.querySelectorAll("[data-img-size]").forEach((btn) => {
    btn.onclick = () => {
      const size = btn.dataset.imgSize;
      imagemSelecionada.style.width = size + "%";
      imagemSelecionada.style.maxWidth = "100%";
      imagemSelecionada.style.height = "auto";
    };
  });

  controles.querySelectorAll("[data-img-align]").forEach((btn) => {
    btn.onclick = () => {
      const align = btn.dataset.imgAlign;

      imagemSelecionada.style.display = "block";

      if (align === "left") {
        imagemSelecionada.style.marginLeft = "0";
        imagemSelecionada.style.marginRight = "auto";
      }

      if (align === "center") {
        imagemSelecionada.style.marginLeft = "auto";
        imagemSelecionada.style.marginRight = "auto";
      }

      if (align === "right") {
        imagemSelecionada.style.marginLeft = "auto";
        imagemSelecionada.style.marginRight = "0";
      }
    };
  });

  const btnUp = controles.querySelector("[data-img-move='up']");
  const btnDown = controles.querySelector("[data-img-move='down']");
  const btnDelete = controles.querySelector("[data-img-delete]");

  btnUp.onclick = () => {
    const bloco = imagemSelecionada;
    const anterior = bloco.previousElementSibling;

    if (anterior && anterior.id !== "imageEditorControls") {
      anterior.insertAdjacentElement("beforebegin", bloco);
      bloco.insertAdjacentElement("beforebegin", controles);
    }
  };

  btnDown.onclick = () => {
    const bloco = imagemSelecionada;
    const proximo = bloco.nextElementSibling;

    if (proximo) {
      proximo.insertAdjacentElement("afterend", bloco);
      bloco.insertAdjacentElement("beforebegin", controles);
    }
  };

  btnDelete.onclick = () => {
    const confirmar = confirm("Deseja remover esta imagem?");

    if (!confirmar) return;

    imagemSelecionada.remove();
    controles.remove();
    imagemSelecionada = null;
  };
}

function prepararImagensEditaveis() {
  const editor = document.getElementById("editorArea");

  if (!editor) return;

  editor.querySelectorAll("img").forEach((img) => {
    img.classList.add("editor-image-content");

    img.onclick = (event) => {
      event.stopPropagation();
      criarControlesImagem(img);
    };
  });

  editor.onclick = (event) => {
    if (
      event.target.tagName !== "IMG" &&
      !event.target.closest("#imageEditorControls")
    ) {
      removerControlesImagem();
    }
  };
}

function executarComando(comando) {
  const editor = document.getElementById("editorArea");

  if (!editor) return;

  editor.focus();

  if (comando === "createLink") {
    salvarSelecao();

    const urlDigitada = prompt("Digite o link completo:");

    if (!urlDigitada) return;

    const url = normalizarUrl(urlDigitada.trim());

    restaurarSelecao();

    const selecao = window.getSelection();

    if (!selecao || selecao.toString().trim() === "") {
      document.execCommand(
        "insertHTML",
        false,
        `<a href="${url}" target="_blank">${url}</a>`
      );

      return;
    }

    document.execCommand("createLink", false, url);

    const links = editor.querySelectorAll(`a[href="${url}"]`);

    links.forEach((link) => {
      link.setAttribute("target", "_blank");
    });

    return;
  }

  if (comando === "blockquote") {
    document.execCommand("formatBlock", false, "blockquote");
    return;
  }

  if (comando === "separator") {
    document.execCommand("insertHTML", false, "<hr><p><br></p>");
    return;
  }

  document.execCommand(comando, false, null);
}

async function inserirImagem() {
  const input = document.createElement("input");

  input.type = "file";
  input.accept = "image/*";

  input.onchange = async () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    const editor = document.getElementById("editorArea");

    if (!editor) return;

    const loading = document.createElement("div");
    loading.className = "editor-image-loading";
    loading.innerText = "Enviando imagem...";

    editor.appendChild(loading);

    const url = await uploadImagemEditor(arquivo);

    loading.remove();

    if (!url) return;

    restaurarSelecao();

    document.execCommand(
      "insertHTML",
      false,
      `<img src="${url}" class="editor-image-content" style="width:100%; max-width:100%; height:auto;"><p><br></p>`
    );

    prepararImagensEditaveis();
  };

  input.click();
}

export function iniciarEditor({ onPreview } = {}) {
  const editor = document.getElementById("editorArea");

  if (!editor) return;

  editor.addEventListener("mouseup", salvarSelecao);
  editor.addEventListener("keyup", salvarSelecao);
  editor.addEventListener("focus", salvarSelecao);
  editor.addEventListener("input", () => {
    salvarSelecao();
    prepararImagensEditaveis();
  });

  document
    .querySelectorAll("[data-editor]")
    .forEach((botao) => {
      botao.onclick = () => {
        executarComando(botao.dataset.editor);
      };
    });

  const botaoImagem = document.getElementById("inserirImagemBtn");

  if (botaoImagem) {
    botaoImagem.onclick = () => {
      salvarSelecao();
      inserirImagem();
    };
  }

  const previewBtn = document.getElementById("previewMateriaBtn");

  if (previewBtn && onPreview) {
    previewBtn.onclick = onPreview;
  }

  prepararImagensEditaveis();
}
