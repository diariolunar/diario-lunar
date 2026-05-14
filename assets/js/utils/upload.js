import { storage } from "../config/firebase.js";

import {
  ref,
  uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

export async function uploadArquivo(arquivo, pasta = "uploads") {
  if (!arquivo) {
    return "";
  }

  const nomeSeguro = arquivo.name
    .replace(/\s+/g, "-")
    .replace(/[^\w.-]/g, "");

  const caminho = `${pasta}/${Date.now()}-${nomeSeguro}`;

  const arquivoRef = ref(storage, caminho);

  await uploadBytes(arquivoRef, arquivo, {
    contentType: arquivo.type || "image/jpeg"
  });

  return await getDownloadURL(arquivoRef);
}
