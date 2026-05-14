import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

function criarCardEquipe(adm) {
  return `
    <a
      href="/autor.html?user=${encodeURIComponent(adm.user || "")}"
      class="card equipe-card"
      style="text-decoration:none; color:inherit;"
    >
      <img
        src="${adm.fotoUrl || "/assets/images/logo-vertical.png"}"
        alt="${adm.nome || "Membro da equipe"}"
      >

      <div class="equipe-card-content">
        <h3>${adm.nome || "Membro da equipe"}</h3>

        <p class="equipe-user">@${adm.user || "diario_lunar"}</p>

        <span>${adm.nomenclatura || adm.cargo || "Equipe Lunar"}</span>

        <p>${adm.cargo || "Colaborador do Diário Lunar"}</p>
      </div>
    </a>
  `;
}

async function carregarEquipe() {
  const snapshot = await getDocs(collection(db, "admins"));
  const container = document.getElementById("equipeLista");

  let equipe = [];

  snapshot.forEach((item) => {
    const adm = item.data();

    if (adm.ativo === false) return;
    if (adm.reporter === false) return;

    equipe.push({
      id: item.id,
      ...adm
    });
  });

  equipe.sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "")
  );

  if (equipe.length === 0) {
    container.innerHTML = `
      <div class="card" style="padding: 30px;">
        <h2>Nenhum membro encontrado</h2>
        <p>A equipe ainda não foi cadastrada publicamente.</p>
      </div>
    `;
    return;
  }

  container.innerHTML =
    equipe.map(criarCardEquipe).join("");
}

carregarEquipe();
