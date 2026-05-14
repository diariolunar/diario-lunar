import { storage } from "../config/firebase.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

function gerarNomeArquivo(arquivo) {
  const extensaoOriginal =
    arquivo.name.split(".").pop() || "jpg";

  const nomeLimpo = arquivo.name
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .toLowerCase();

  return `${Date.now()}-${nomeLimpo}.${extensaoOriginal}`;
}

function arquivoEhImagem(arquivo) {
  return arquivo && arquivo.type.startsWith("image/");
}

function precisaComprimir(arquivo) {
  if (!arquivoEhImagem(arquivo)) return false;

  if (arquivo.type === "image/gif") return false;
  if (arquivo.type === "image/svg+xml") return false;

  return true;
}

async function comprimirImagem(arquivo, maxWidth = 1800, qualidade = 0.82) {
  if (!precisaComprimir(arquivo)) {
    return arquivo;
  }

  return await new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(arquivo);

    img.onload = () => {
      URL.revokeObjectURL(url);

      let largura = img.width;
      let altura = img.height;

      if (largura > maxWidth) {
        const proporcao = maxWidth / largura;
        largura = maxWidth;
        altura = Math.round(altura * proporcao);
      }

      const canvas = document.createElement("canvas");
      canvas.width = largura;
      canvas.height = altura;

      const ctx = canvas.getContext("2d");

      ctx.drawImage(img, 0, 0, largura, altura);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(arquivo);
            return;
          }

          const arquivoComprimido = new File(
            [blob],
            arquivo.name.replace(/\.[^/.]+$/, ".jpg"),
            {
              type: "image/jpeg",
              lastModified: Date.now()
            }
          );

          resolve(arquivoComprimido);
        },
        "image/jpeg",
        qualidade
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(arquivo);
    };

    img.src = url;
  });
}

export async function uploadArquivo(arquivo, pasta = "uploads") {
  if (!arquivo) {
    throw new Error("Nenhum arquivo informado para upload.");
  }

  if (!arquivoEhImagem(arquivo)) {
    throw new Error("O arquivo precisa ser uma imagem.");
  }

  const arquivoFinal = await comprimirImagem(arquivo);

  if (arquivoFinal.size > 20 * 1024 * 1024) {
    throw new Error("A imagem é muito pesada. Tente enviar uma imagem menor.");
  }

  const nomeArquivo = gerarNomeArquivo(arquivoFinal);
  const caminho = `${pasta}/${nomeArquivo}`;
  const storageRef = ref(storage, caminho);

  await uploadBytes(storageRef, arquivoFinal);

  return await getDownloadURL(storageRef);
}
