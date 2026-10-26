export function ehConteudoHoroscopo(post = {}) {
  const categoria = String(post.categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return categoria === "horoscopo" || categoria === "horoscopo lunar";
}

export function obterDataPostMs(post = {}) {
  const data = post.data;

  if (!data) return 0;
  if (typeof data.toMillis === "function") return data.toMillis();
  if (typeof data.toDate === "function") return data.toDate().getTime();

  const timestamp = new Date(data).getTime();

  return Number.isNaN(timestamp) ? 0 : timestamp;
}

export function postEstaPublico(post = {}, agora = Date.now()) {
  const status = post.status || "rascunho";

  if (status === "publicado") {
    return true;
  }

  const dataPost = obterDataPostMs(post);

  return status === "agendado" && dataPost > 0 && dataPost <= agora;
}
