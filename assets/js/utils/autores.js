function normalizarChave(valor) {
  return String(valor || "").trim().toLowerCase();
}

function valoresUnicos(valores) {
  const chaves = new Set();

  return valores.filter((valor) => {
    const chave = normalizarChave(valor);

    if (!chave || chaves.has(chave)) {
      return false;
    }

    chaves.add(chave);
    return true;
  });
}

export function obterAutoresPost(post = {}, fallback = "") {
  const dadosPost = post || {};
  const autores = Array.isArray(dadosPost.autores)
    ? dadosPost.autores.filter((autor) => typeof autor === "string")
    : [];

  const autoresDoPost = valoresUnicos([
    dadosPost.autor,
    ...autores
  ].map((autor) => String(autor || "").trim()));

  if (autoresDoPost.length || !fallback) {
    return autoresDoPost;
  }

  return [String(fallback).trim()].filter(Boolean);
}

export function obterAutorIdsPost(post = {}) {
  const dadosPost = post || {};

  if (!Array.isArray(dadosPost.autorIds)) {
    return [];
  }

  return valoresUnicos(
    dadosPost.autorIds.map((id) => String(id || "").trim())
  );
}

export function postTemAutor(post, autor = {}) {
  const autorId = normalizarChave(autor.id);
  const autorUser = normalizarChave(autor.user);

  const bateId = autorId && obterAutorIdsPost(post)
    .some((id) => normalizarChave(id) === autorId);

  const bateUser = autorUser && obterAutoresPost(post)
    .some((user) => normalizarChave(user) === autorUser);

  return Boolean(bateId || bateUser);
}

export function postEhCollab(post = {}) {
  return post?.collab === true || obterAutoresPost(post).length > 1;
}

export function formatarAutoresPost(post = {}, fallback = "diario_lunar") {
  const autores = obterAutoresPost(post, fallback)
    .map((autor) => `@${autor}`);

  if (autores.length <= 1) {
    return autores[0] || `@${fallback}`;
  }

  if (autores.length === 2) {
    return `${autores[0]} e ${autores[1]}`;
  }

  return `${autores.slice(0, -1).join(", ")} e ${autores.at(-1)}`;
}
