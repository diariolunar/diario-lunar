import { db } from "../config/firebase.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();
const container = document.getElementById("booktrailerDetalhe");
const id = new URLSearchParams(location.search).get("id");
function escapar(valor) { return String(valor || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function youtubeId(url) { const match = String(url || "").match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/); return match?.[1] || ""; }

async function carregar() {
  if (!id) { container.innerHTML = '<div class="empty-state"><h2>BookTrailer não encontrado</h2></div>'; return; }
  const snap = await getDoc(doc(db, "booktrailers", id));
  if (!snap.exists()) { container.innerHTML = '<div class="empty-state"><h2>BookTrailer não encontrado</h2></div>'; return; }
  const item = snap.data();
  if (item.status && item.status !== "publicado") { container.innerHTML = '<div class="empty-state"><h2>BookTrailer não encontrado</h2></div>'; return; }
  const video = youtubeId(item.youtubeUrl);
  document.title = `${item.titulo || "BookTrailer"} - Diário Lunar`;
  container.innerHTML = `<a class="btn" href="/booktrailers.html">← Voltar para BookTrailers</a>
    <article class="booktrailer-detalhe">
      <img class="booktrailer-banner" src="${escapar(item.banner || "/assets/images/footer.png")}" alt="${escapar(item.titulo)}">
      <p class="arquivo-lunar-kicker">✦ BookTrailer</p><h1>${escapar(item.titulo || "Sem título")}</h1><p>${escapar(item.descricao || "")}</p>
      ${video ? `<div class="youtube-player"><iframe src="https://www.youtube.com/embed/${video}" title="${escapar(item.titulo)}" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe></div>` : '<p>Vídeo do YouTube não informado ou inválido.</p>'}
    </article>`;
}
carregar();
