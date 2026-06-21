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

import {
  obterAutorIdsPost,
  obterAutoresPost
} from "../utils/autores.js";

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

function escaparHtml(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function buscarReporteres(post) {
  const snapshot = await getDocs(collection(db, "admins"));
  const porId = new Map();
  const porUser = new Map();

  snapshot.forEach((item) => {
    const adm = {
      id: item.id,
      ...item.data()
    };

    porId.set(item.id, adm);

    if (adm.user) {
      porUser.set(adm.user.toLowerCase(), adm);
    }
  });

  const autores = obterAutoresPost(post, "diario_lunar");
  const autorIds = obterAutorIdsPost(post);

  return autores.map((user, index) => ({
    user,
    reporter: porId.get(autorIds[index]) || porUser.get(user.toLowerCase()) || null
  }));
}

function formatarIdentificacaoReporter(reporter) {
  if (!reporter || reporter.reporter === false || reporter.ativo === false) {
    return "";
  }

  const partes = [];

  if (reporter.nomenclatura) {
    partes.push(`(${reporter.nomenclatura})`);
  }

  if (reporter.cargo) {
    partes.push(reporter.cargo);
  }

  return partes.join(" · ");
}

function renderAutoresPost(reporteres) {
  const container = document.getElementById("autoresPost");

  if (!container) return;

  container.innerHTML = `
    <span class="autores-prefixo">Por</span>

    <div class="autores-lista">
      ${reporteres.map(({ user, reporter }) => {
        const identificacao = formatarIdentificacaoReporter(reporter);
        const foto = reporter?.fotoUrl || "/assets/images/logo-vertical.png";

        return `
          <a
            class="autor-link"
            href="/autor.html?user=${encodeURIComponent(user)}"
          >
            <img
              src="${escaparHtml(foto)}"
              alt="${escaparHtml(reporter?.nome || user)}"
            >

            <span class="autor-texto">
              <strong>@${escaparHtml(user)}</strong>
              ${
                identificacao
                  ? `<span>${escaparHtml(identificacao)}</span>`
                  : ""
              }
            </span>
          </a>
        `;
      }).join("")}
    </div>
  `;
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

  const reporteres = await buscarReporteres(post);
  renderAutoresPost(reporteres);

  const dataFormatada = formatarData(post.data);

  document.getElementById("dataPublicacaoTexto").innerText =
    dataFormatada ? `Publicado em ${dataFormatada}` : "";

  return post;
}
