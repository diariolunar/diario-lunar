import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

import { carregarPost } from "../post/carregarPost.js";
import { iniciarCurtidas } from "../post/curtidas.js";
import { iniciarComentarios } from "../post/comentarios.js";
import { compartilharConteudo } from "../utils/share.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

async function iniciarPaginaPost() {
  const post = await carregarPost(postId);

  if (!post) {
    return;
  }

  iniciarCurtidas(postId);
  iniciarComentarios(postId);

  document.getElementById("compartilharPostBtn")?.addEventListener("click", () => {
    compartilharConteudo({
      titulo: post.titulo || "Matéria do Diário Lunar",
      texto: "Confira esta matéria no Diário Lunar."
    });
  });
}

iniciarPaginaPost();
