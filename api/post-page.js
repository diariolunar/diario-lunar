const PROJECT_ID = "diario-lunar-dee91";
const FALLBACK_IMAGE = "https://diario-lunar.vercel.app/assets/images/logo-diario-lunar.png";

function escaparHtml(valor = "") {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function limparTexto(html = "") {
  return String(html)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#039;|&apos;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function valorFirestore(campo) {
  if (!campo) return null;
  if ("stringValue" in campo) return campo.stringValue;
  if ("integerValue" in campo) return Number(campo.integerValue);
  if ("doubleValue" in campo) return Number(campo.doubleValue);
  if ("booleanValue" in campo) return campo.booleanValue;
  if ("timestampValue" in campo) return campo.timestampValue;
  if ("nullValue" in campo) return null;
  if (campo.arrayValue) return (campo.arrayValue.values || []).map(valorFirestore);
  if (campo.mapValue) return converterCampos(campo.mapValue.fields || {});
  return null;
}

function converterCampos(campos = {}) {
  return Object.fromEntries(
    Object.entries(campos).map(([chave, valor]) => [chave, valorFirestore(valor)])
  );
}

function ehHoroscopo(post) {
  const categoria = String(post.categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return categoria === "horoscopo" || categoria === "horoscopo lunar";
}

function estaPublicado(post) {
  if (post.status === "publicado") return true;
  if (post.status !== "agendado" || !post.data) return false;
  return new Date(post.data).getTime() <= Date.now();
}

function paginaNaoEncontrada(res) {
  return res.status(404).send(`<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="robots" content="noindex">
  <title>Matéria não encontrada - Diário Lunar</title>
</head>
<body>
  <main><h1>Matéria não encontrada</h1><p>Esta publicação não está disponível.</p></main>
</body>
</html>`);
}

function renderizarPagina(post, postId, urlPublica) {
  const titulo = post.titulo || "Matéria";
  const categoria = post.categoria || "Matéria";
  const conteudo = post.conteudo || "";
  const descricao = limparTexto(conteudo).slice(0, 180);
  const imagem = post.imagem || FALLBACK_IMAGE;
  const data = post.data ? new Date(post.data) : null;
  const dataValida = data && !Number.isNaN(data.getTime());
  const dataFormatada = dataValida
    ? data.toLocaleDateString("pt-BR", { timeZone: "America/Fortaleza" })
    : "";
  const schema = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Article",
    headline: titulo,
    description: descricao,
    image: [imagem],
    datePublished: dataValida ? data.toISOString() : undefined,
    mainEntityOfPage: urlPublica,
    publisher: {
      "@type": "Organization",
      name: "Diário Lunar",
      logo: { "@type": "ImageObject", url: FALLBACK_IMAGE }
    }
  }).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="pt-br">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escaparHtml(titulo)} - Diário Lunar</title>
  <meta name="description" content="${escaparHtml(descricao)}">
  <meta name="robots" content="index, follow">
  <meta property="og:title" content="${escaparHtml(titulo)}">
  <meta property="og:description" content="${escaparHtml(descricao)}">
  <meta property="og:image" content="${escaparHtml(imagem)}">
  <meta property="og:type" content="article">
  <meta property="og:url" content="${escaparHtml(urlPublica)}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="canonical" href="${escaparHtml(urlPublica)}">
  <link rel="icon" href="/assets/images/favicon.png">
  <link rel="apple-touch-icon" href="/assets/images/favicon.png">
  <link rel="stylesheet" href="/assets/css/base.css">
  <link rel="stylesheet" href="/assets/css/layout.css">
  <link rel="stylesheet" href="/assets/css/components.css">
  <link rel="stylesheet" href="/assets/css/post.css">
  <script type="application/ld+json">${schema}</script>
</head>
<body>
  <div id="navbar"></div>
  <main class="post-container container">
    <a href="/index.html" class="voltar-link">← Voltar para o início</a>
    <p id="categoria" class="post-category">${escaparHtml(categoria)}</p>
    <h1 id="titulo">${escaparHtml(titulo)}</h1>
    <div class="post-meta">
      <div id="autoresPost" class="autores-post"></div>
      <div id="dataPublicacaoTexto" class="data-publicacao">${dataFormatada ? `Publicado em ${escaparHtml(dataFormatada)}` : ""}</div>
    </div>
    <img id="imagem" class="post-cover" src="${escaparHtml(imagem)}" alt="${escaparHtml(titulo)}">
    <article id="conteudo" class="post-content">${conteudo}</article>
    <section class="interaction-box">
      <h3>Interação Lunar</h3>
      <input id="usuarioWattpad" placeholder="Seu usuário do Wattpad">
      <button id="salvarUsuarioBtn" class="btn">Salvar usuário</button>
      <br><br>
      <button id="curtirBtn" class="btn">❤️ Curtir (<span id="curtidas">${Number(post.curtidas) || 0}</span>)</button>
    </section>
    <section class="interaction-box">
      <h3>Comentários</h3>
      <textarea id="comentarioInput" placeholder="Escreva um comentário..."></textarea>
      <button id="comentarBtn" class="btn">Comentar</button>
      <div id="listaComentarios"></div>
    </section>
  </main>
  <div id="footer"></div>
  <script type="module" src="/assets/js/pages/post.js"></script>
</body>
</html>`;
}

export default async function handler(req, res) {
  const postId = String(req.query?.id || "").trim();

  if (!postId || !/^[A-Za-z0-9_-]+$/.test(postId)) {
    return paginaNaoEncontrada(res);
  }

  try {
    const endpoint = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/posts/${encodeURIComponent(postId)}`;
    const resposta = await fetch(endpoint);

    if (!resposta.ok) return paginaNaoEncontrada(res);

    const documento = await resposta.json();
    const post = converterCampos(documento.fields || {});

    if (!estaPublicado(post) || ehHoroscopo(post)) {
      return paginaNaoEncontrada(res);
    }

    const urlPublica = `https://diario-lunar.vercel.app/post.html?id=${encodeURIComponent(postId)}`;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=3600");
    return res.status(200).send(renderizarPagina(post, postId, urlPublica));
  } catch (error) {
    console.error("Erro ao renderizar matéria:", error);
    return res.status(500).send("Não foi possível carregar esta matéria.");
  }
}
