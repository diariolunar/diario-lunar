export function ehConteudoHoroscopo(post = {}) {
  const categoria = String(post.categoria || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();

  return categoria === "horoscopo" || categoria === "horoscopo lunar";
}
