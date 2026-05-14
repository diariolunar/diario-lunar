const SITE_URL = "https://seudominio.com";
const SITE_NAME = "Diário Lunar";
const DEFAULT_IMAGE = `${SITE_URL}/assets/images/logo-diario-lunar.png`;

function setMeta(name, content) {
  let tag = document.querySelector(`meta[name="${name}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

function setProperty(property, content) {
  let tag = document.querySelector(`meta[property="${property}"]`);

  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("property", property);
    document.head.appendChild(tag);
  }

  tag.setAttribute("content", content);
}

export function limparResumoSeo(html, limite = 160) {
  let texto = html || "";

  texto = texto
    .replace(/<\/p>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (texto.length > limite) {
    return texto.substring(0, limite).trim() + "...";
  }

  return texto;
}

export function aplicarSeo({
  titulo,
  descricao,
  imagem,
  url,
  tipo = "website"
}) {
  const tituloFinal = titulo
    ? `${titulo} | ${SITE_NAME}`
    : SITE_NAME;

  const descricaoFinal =
    descricao || "Notícias, dicas, matérias, entrevistas e destaques do universo Lunar.";

  const imagemFinal =
    imagem || DEFAULT_IMAGE;

  const urlFinal =
    url || window.location.href;

  document.title = tituloFinal;

  setMeta("description", descricaoFinal);
  setMeta("robots", "index, follow");

  setProperty("og:title", tituloFinal);
  setProperty("og:description", descricaoFinal);
  setProperty("og:image", imagemFinal);
  setProperty("og:url", urlFinal);
  setProperty("og:type", tipo);
  setProperty("og:site_name", SITE_NAME);

  setMeta("twitter:card", "summary_large_image");
  setMeta("twitter:title", tituloFinal);
  setMeta("twitter:description", descricaoFinal);
  setMeta("twitter:image", imagemFinal);
}
