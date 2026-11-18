import { db } from "../config/firebase.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();
const container = document.getElementById("booktrailers");

function dataMs(item) { return item.data?.toDate ? item.data.toDate().getTime() : new Date(item.data || 0).getTime(); }
function escapar(valor) { return String(valor || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }

async function carregar() {
  try {
    const snap = await getDocs(collection(db, "booktrailers"));
    const itens = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((item) => !item.status || item.status === "publicado")
      .sort((a, b) => dataMs(b) - dataMs(a));
    container.innerHTML = itens.length ? itens.map((item) => `
      <a class="booktrailer-card" href="/booktrailer.html?id=${encodeURIComponent(item.id)}">
        <img src="${escapar(item.banner || "/assets/images/footer.png")}" alt="${escapar(item.titulo || "BookTrailer")}" loading="lazy" onerror="this.src='/assets/images/footer.png'">
        <div><small>BOOKTRAILER</small><h2>${escapar(item.titulo || "Sem título")}</h2><p>${escapar(item.descricao || "")}</p></div>
      </a>`).join("") : '<div class="empty-state"><h2>Nenhum booktrailer publicado ainda</h2></div>';
  } catch (error) { container.innerHTML = `<div class="empty-state"><h2>Erro ao carregar booktrailers</h2><p>${escapar(error.message)}</p></div>`; }
}
carregar();
