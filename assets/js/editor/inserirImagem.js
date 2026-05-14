import { uploadImagemEditor }
from "./uploadImagemEditor.js";

function criarLoading() {

  const loading =
    document.createElement("div");

  loading.className =
    "editor-image-loading";

  loading.innerHTML = `
    <div class="editor-loader"></div>

    <span>
      Enviando imagem...
    </span>
  `;

  return loading;
}

function inserirHtmlNoCursor(html) {

  document.execCommand(
    "insertHTML",
    false,
    html
  );
}

export function iniciarInsercaoImagem() {

  const botao =
    document.getElementById(
      "inserirImagemBtn"
    );

  if (!botao) return;

  const input =
    document.createElement("input");

  input.type = "file";

  input.accept = "image/*";

  input.style.display = "none";

  document.body.appendChild(input);

  botao.onclick = () => {
    input.click();
  };

  input.onchange = async () => {

    const arquivo =
      input.files[0];

    if (!arquivo) return;

    const loading =
      criarLoading();

    const editor =
      document.getElementById(
        "editorArea"
      );

    editor.appendChild(loading);

    const url =
      await uploadImagemEditor(
        arquivo
      );

    loading.remove();

    if (!url) return;

    inserirHtmlNoCursor(`
      <div class="editor-image-wrapper">

        <img
          src="${url}"
          class="editor-image-content"
        >

      </div>

      <p><br></p>
    `);
  };
}
