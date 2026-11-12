import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  registrarVisualizacaoPost
} from "../services/postsService.js";

import {
  aplicarSeo,
  limparResumoSeo
} from "../utils/seo.js";

import {
  ehConteudoHoroscopo,
  postEstaPublico
} from "../utils/posts.js";

import {
  obterAutorIdsPost,
  obterAutoresPost
} from "../utils/autores.js";

function formatarData(data) {
  if (!data) return "";

  try {
    if (data.toDate) {
      return data.toDate().toLocaleString("pt-BR", {
        dateStyle: "long",
        timeStyle: "short"
      });
    }

    return new Date(data).toLocaleString("pt-BR", {
      dateStyle: "long",
      timeStyle: "short"
    });
  } catch {
    return "";
  }
}

function resumoTexto(html, limite = 110) {
  const area = document.createElement("div");
  area.innerHTML = html || "";
  const texto = (area.textContent || "").replace(/\s+/g, " ").trim();
  return texto.length > limite ? `${texto.slice(0, limite).trim()}...` : texto;
}

async function carregarMateriasRelacionadas(postAtual) {
  const secao = document.getElementById("materiasRelacionadas");
  const lista = document.getElementById("listaMateriasRelacionadas");

  if (!secao || !lista) return;

  try {
    const snapshot = await getDocs(
      query(collection(db, "posts"), where("status", "in", ["publicado", "agendado"]))
    );
    const autoresAtuais = new Set(obterAutoresPost(postAtual).map((autor) => autor.toLowerCase()));
    const relacionadas = snapshot.docs
      .map((item) => ({ id: item.id, ...item.data() }))
      .filter((post) => post.id !== postAtual.id && postEstaPublico(post) && !ehConteudoHoroscopo(post))
      .map((post) => {
        const mesmaCategoria = post.categoria === postAtual.categoria;
        const mesmoAutor = obterAutoresPost(post).some((autor) => autoresAtuais.has(autor.toLowerCase()));
        return { post, pontuacao: (mesmaCategoria ? 2 : 0) + (mesmoAutor ? 1 : 0) };
      })
      .filter((item) => item.pontuacao > 0)
      .sort((a, b) => b.pontuacao - a.pontuacao)
      .slice(0, 3)
      .map((item) => item.post);

    if (!relacionadas.length) return;

    lista.innerHTML = relacionadas.map((post) => `
      <a class="related-post-card" href="/post.html?id=${encodeURIComponent(post.id)}">
        <img
          src="${escaparHtml(post.imagem || "/assets/images/footer.png") }"
          alt="${escaparHtml(post.imagemAlt || post.titulo || "Matéria") }"
          loading="lazy"
          onerror="this.src='/assets/images/footer.png'"
        >
        <span>${escaparHtml(post.categoria || "Matéria")}</span>
        <h3>${escaparHtml(post.titulo || "Sem título")}</h3>
        <p>${escaparHtml(resumoTexto(post.conteudo || ""))}</p>
      </a>
    `).join("");
    secao.hidden = false;
  } catch (error) {
    console.error("Não foi possível carregar matérias relacionadas.", error);
  }
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
  const porId = new Map();
  const porUser = new Map();
  const autores = obterAutoresPost(post, "diario_lunar");
  const autorIds = obterAutorIdsPost(post);
  const idsUnicos = [...new Set(autorIds.filter(Boolean))];

  await Promise.all(idsUnicos.map(async (id) => {
    const item = await getDoc(doc(db, "admins", id));

    if (!item.exists()) return;

    const adm = { id: item.id, ...item.data() };
    porId.set(item.id, adm);

    if (adm.user) {
      porUser.set(adm.user.toLowerCase(), adm);
    }
  }));

  const usersSemCadastro = autores.filter((user, index) => (
    !porId.has(autorIds[index])
  ));

  if (usersSemCadastro.length) {
    const snapshot = await getDocs(
      query(
        collection(db, "admins"),
        where("user", "in", usersSemCadastro.slice(0, 30))
      )
    );

    snapshot.forEach((item) => {
      const adm = { id: item.id, ...item.data() };
      porId.set(item.id, adm);

      if (adm.user) {
        porUser.set(adm.user.toLowerCase(), adm);
      }
    });
  }

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

  if (!postEstaPublico(post) || ehConteudoHoroscopo(post)) {
    mostrarMateriaNaoEncontrada();
    return null;
  }

  await registrarVisualizacaoPost(postId);

  document.getElementById("titulo").innerText = post.titulo || "";
  document.getElementById("categoria").innerText = post.categoria || "";
  document.getElementById("imagem").src = post.imagem || "/assets/images/footer.png";
  document.getElementById("imagem").alt = post.imagemAlt || post.titulo || "Capa da matéria";
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
  carregarMateriasRelacionadas(post);

  const dataFormatada = formatarData(post.data);

  document.getElementById("dataPublicacaoTexto").innerText =
    dataFormatada ? `Publicado em ${dataFormatada}` : "";

  return post;
}
