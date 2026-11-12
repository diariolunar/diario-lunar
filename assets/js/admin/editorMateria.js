import { uploadImagemEditor } from "../editor/uploadImagemEditor.js";

const EDITOR_ID = "editorArea";

function tinyDisponivel() {
  return typeof window.tinymce !== "undefined";
}

function getEditor() {
  if (!tinyDisponivel()) return null;

  return window.tinymce.get(EDITOR_ID);
}

function normalizarConteudo(html) {
  return (html || "").trim();
}

async function subirImagem(blobInfo) {
  const arquivo = blobInfo.blob();
  const nome = blobInfo.filename() || "imagem-editor.jpg";
  const file = new File([arquivo], nome, {
    type: arquivo.type,
    lastModified: Date.now()
  });

  const url = await uploadImagemEditor(file);

  if (!url) {
    throw new Error("Não foi possível enviar a imagem.");
  }

  return url;
}

function registrarAtalhos(editor) {
  editor.addShortcut("meta+alt+1", "Título 1", () => editor.execCommand("FormatBlock", false, "h1"));
  editor.addShortcut("meta+alt+2", "Título 2", () => editor.execCommand("FormatBlock", false, "h2"));
  editor.addShortcut("meta+alt+3", "Título 3", () => editor.execCommand("FormatBlock", false, "h3"));
  editor.addShortcut("meta+shift+7", "Lista numerada", () => editor.execCommand("InsertOrderedList"));
  editor.addShortcut("meta+shift+8", "Lista com marcadores", () => editor.execCommand("InsertUnorderedList"));
  editor.addShortcut("meta+shift+c", "Centralizar", () => editor.execCommand("JustifyCenter"));
  editor.addShortcut("meta+shift+l", "Alinhar à esquerda", () => editor.execCommand("JustifyLeft"));
  editor.addShortcut("meta+shift+r", "Alinhar à direita", () => editor.execCommand("JustifyRight"));
  editor.addShortcut("meta+shift+j", "Justificar", () => editor.execCommand("JustifyFull"));
  editor.addShortcut("meta+shift+q", "Citação", () => editor.execCommand("mceBlockQuote"));
  editor.addShortcut("meta+shift+k", "Inserir link", () => editor.execCommand("mceLink"));
  editor.addShortcut("meta+shift+t", "Inserir tabela", () => editor.execCommand("mceInsertTable", false, { rows: 3, columns: 3 }));
  editor.addShortcut("meta+shift+e", "Emoji", () => editor.execCommand("mceEmoticons"));
  editor.addShortcut("meta+shift+s", "Caracteres especiais", () => editor.execCommand("mceShowCharmap"));
}

export function getConteudoEditor() {
  const editor = getEditor();

  if (editor) {
    return normalizarConteudo(editor.getContent());
  }

  return normalizarConteudo(document.getElementById(EDITOR_ID)?.value || "");
}

export function setConteudoEditor(html = "") {
  const editor = getEditor();

  if (editor) {
    editor.setContent(html || "");
    return;
  }

  const area = document.getElementById(EDITOR_ID);

  if (area) {
    area.value = html || "";
  }
}

export function iniciarEditor({ onPreview } = {}) {
  const area = document.getElementById(EDITOR_ID);

  if (!area) return;

  const previewBtn = document.getElementById("previewMateriaBtn");

  if (previewBtn && onPreview) {
    previewBtn.onclick = onPreview;
  }

  if (!tinyDisponivel()) {
    area.style.minHeight = "420px";
    return;
  }

  const editorExistente = getEditor();

  if (editorExistente) {
    editorExistente.remove();
  }

  window.tinymce.init({
    selector: `#${EDITOR_ID}`,
    height: 620,
    menubar: "file edit insert view format table tools help",
    plugins: [
      "advlist",
      "autolink",
      "charmap",
      "code",
      "emoticons",
      "fullscreen",
      "image",
      "link",
      "lists",
      "media",
      "preview",
      "searchreplace",
      "table",
      "visualblocks",
      "wordcount"
    ].join(" "),
    toolbar: [
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough",
      "forecolor backcolor | alignleft aligncenter alignright alignjustify",
      "bullist numlist outdent indent | link image media table",
      "charmap emoticons blockquote hr | removeformat code fullscreen preview"
    ].join(" | "),
    font_family_formats: [
      "Arial=arial,helvetica,sans-serif",
      "Georgia=georgia,palatino,serif",
      "Times New Roman=times new roman,times,serif",
      "Verdana=verdana,geneva,sans-serif",
      "Courier New=courier new,courier,monospace"
    ].join(";"),
    font_size_formats: "12px 14px 16px 18px 20px 24px 28px 32px 36px 42px 48px",
    block_formats: "Parágrafo=p; Título 1=h1; Título 2=h2; Título 3=h3; Citação=blockquote",
    branding: false,
    promotion: false,
    convert_urls: false,
    image_caption: true,
    image_advtab: true,
    automatic_uploads: true,
    file_picker_types: "image",
    images_upload_handler: subirImagem,
    content_style: `
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #111827;
        line-height: 1.75;
        font-size: 16px;
      }
      img {
        max-width: 100%;
        height: auto;
      }
      blockquote {
        border-left: 4px solid #7c3aed;
        margin: 18px 0;
        padding: 10px 18px;
        color: #334155;
        background: #f8fafc;
      }
      table {
        border-collapse: collapse;
        width: 100%;
      }
      table td,
      table th {
        border: 1px solid #d1d5db;
        padding: 8px;
      }
    `,
    setup(editor) {
      registrarAtalhos(editor);

      editor.on("init", () => {
        editor.setContent(area.value || "");
      });
    }
  });
}
