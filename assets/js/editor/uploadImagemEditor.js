import { uploadArquivo } from "../utils/upload.js";

export async function uploadImagemEditor(arquivo) {
  if (!arquivo) {
    return null;
  }

  try {
    const url = await uploadArquivo(
      arquivo,
      "editor-materias"
    );

    return url;
  } catch (error) {
    console.error(error);
    alert("Erro ao enviar imagem.");
    return null;
  }
}
