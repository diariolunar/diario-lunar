function copiarLinkFallback(url) {
  const campo = document.createElement("textarea");
  campo.value = url;
  campo.setAttribute("readonly", "");
  campo.style.position = "fixed";
  campo.style.opacity = "0";
  document.body.appendChild(campo);
  campo.select();
  document.execCommand("copy");
  campo.remove();
}

async function copiarLink(url) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(url);
    return;
  }

  copiarLinkFallback(url);
}

export async function compartilharConteudo({
  titulo = "Diário Lunar",
  texto = "",
  url = window.location.href
} = {}) {
  const dados = {
    title: titulo,
    text: texto,
    url
  };

  try {
    const shareNativo = window.Capacitor?.Plugins?.Share;

    if (shareNativo?.share) {
      await shareNativo.share({
        ...dados,
        dialogTitle: "Compartilhar"
      });
      return;
    }

    if (navigator.share) {
      await navigator.share(dados);
      return;
    }

    await copiarLink(url);
    alert("Link copiado!");
  } catch (error) {
    if (error?.name === "AbortError") return;

    try {
      await copiarLink(url);
      alert("Link copiado!");
    } catch (clipboardError) {
      console.error("Não foi possível compartilhar o link.", error, clipboardError);
      alert("Não foi possível compartilhar agora.");
    }
  }
}
