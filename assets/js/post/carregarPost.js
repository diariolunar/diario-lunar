import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  registrarVisualizacaoPost
} from "../services/postsService.js";

import {
  aplicarSeo,
  limparResumoSeo
} from "../utils/seo.js";

function formatarData(data) {
  if (!data) return "";

  try {
    if (data.toDate) {
      return data.toDate().toLocaleDateString("pt-BR");
    }

    return new Date(data).toLocaleDateString("pt-BR");
  } catch {
    return "";
  }
}

function getDataNumber(post) {
  if (post.data?.toDate) {
    return post.data.toDate().getTime();
  }

  if (post.data) {
    return new Date(post.data).getTime();
  }

  return 0;
}

function postEstaPublico(post) {
  const status = post.status || "rascunho";

  if (status === "publicado") {
    return true;
  }

  if (status === "agendado") {
    const dataPost = getDataNumber(post);
    const agora = Date.now();

    return dataPost && dataPost <= agora;
  }

  return false;
}

function mostrarMateriaNaoEncontrada() {
  document.querySelector(".post-container").innerHTML = `
    <div class="card" style="padding:35px; margin-top:25px;">
      <h1>Matéria não encontrada</h1>

      <p>
        Essa matéria não está disponível publicamente.
      </p>

      <a href="/materias.html" class="btn">
        Ver matérias publicadas
      </a>
    </div>
  `;

  aplicarSeo({
    titulo: "Matéria não encontrada",
    descricao: "Essa matéria não está disponível publicamente."
  });
}

async function buscarReporter(userAutor) {
  const snapshot = await getDocs(collection(db, "admins"));

  let reporter = null;

  snapshot.forEach((item) => {
    const adm = item.data();

    if (
      adm.user &&
      userAutor &&
      adm.user.toLowerCase() === userAutor.toLowerCase()
    ) {
      reporter = adm;
    }
  });

  return reporter;
}

export async function carregarPost(postId) {
  if (!postId) {
    mostrarMateriaNaoEncontrada();
    return null;
  }

  const postRef = doc(db, "posts", postId);
  const postSnap = await getDoc(postRef);

  if (!postSnap.exists()) {
    mostrarMateriaNaoEncontrada();
    return null;
  }

  const post = {
    id: postSnap.id,
    ...postSnap.data()
  };

  if (!postEstaPublico(post)) {
    mostrarMateriaNaoEncontrada();
    return null;
  }

  await registrarVisualizacaoPost(postId);

  document.getElementById("titulo").innerText = post.titulo || "";
  document.getElementById("categoria").innerText = post.categoria || "";
  document.getElementById("imagem").src = post.imagem || "/assets/images/footer.png";
  document.getElementById("conteudo").innerHTML = post.conteudo || "";
  document.getElementById("curtidas").innerText = post.curtidas || 0;

  aplicarSeo({
    titulo: post.titulo || "Matéria",
    descricao: limparResumoSeo(post.conteudo || ""),
    imagem: post.imagem || "/assets/images/logo-diario-lunar.png",
    url: window.location.href,
    tipo: "article"
  });

  const autorUser = post.autor || "diario_lunar";
  const reporter = await buscarReporter(autorUser);

  document.getElementById("autorUser").innerText = "@" + autorUser;

  const autorLink = document.getElementById("autorLink");

  if (autorLink) {
    autorLink.href = `/autor.html?user=${encodeURIComponent(autorUser)}`;
  }

  if (reporter && reporter.reporter !== false) {
    document.getElementById("fotoReporter").src =
      reporter.fotoUrl || "/assets/images/logo-vertical.png";

    let identificacao = "";

    if (reporter.nomenclatura) {
      identificacao += `(${reporter.nomenclatura})`;
    }

    if (reporter.cargo) {
      identificacao += reporter.nomenclatura
        ? ` · ${reporter.cargo}`
        : reporter.cargo;
    }

    document.getElementById("autorNomenclatura").innerText = identificacao;
  } else {
    document.getElementById("fotoReporter").src = "/assets/images/logo-vertical.png";
    document.getElementById("autorNomenclatura").innerText = "";
  }

  const dataFormatada = formatarData(post.data);

  document.getElementById("dataPublicacaoTexto").innerText =
    dataFormatada ? `Publicado em ${dataFormatada}` : "";

  return post;
}
