import { uploadArquivo }
from "../../utils/upload.js";

export async function uploadFotoPerfil(arquivo) {

  if (!arquivo) {
    return null;
  }

  try {

    const url =
      await uploadArquivo(
        arquivo,
        "fotos-adms"
      );

    return url;

  } catch (error) {

    console.error(error);

    alert(
      "Erro ao enviar foto."
    );

    return null;
  }
}
