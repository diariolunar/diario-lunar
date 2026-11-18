import { db } from "../config/firebase.js";

import {
  collection,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

const COLECOES_BACKUP = [
  "posts",
  "audiobooks",
  "trilhasSonoras",
  "booktrailers",
  "visualizacoesDiarias",
  "comentarios",
  "likes",
  "historicoPosts",
  "admins",
  "newsletter",
  "sugestoesPauta"
];

function serializar(valor) {
  if (valor?.toDate) return valor.toDate().toISOString();
  if (Array.isArray(valor)) return valor.map(serializar);
  if (valor && typeof valor === "object") {
    return Object.fromEntries(Object.entries(valor).map(([chave, item]) => [chave, serializar(item)]));
  }
  return valor;
}

async function lerColecao(nome) {
  const snapshot = await getDocs(collection(db, nome));
  return snapshot.docs.map((item) => ({ id: item.id, ...serializar(item.data()) }));
}

function baixarJson(dados) {
  const data = new Date().toISOString().slice(0, 10);
  const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `diario-lunar-backup-${data}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function extrairLinks(html = "") {
  const area = document.createElement("div");
  area.innerHTML = html;
  return [...area.querySelectorAll("a[href], img[src]")]
    .map((item) => item.getAttribute("href") || item.getAttribute("src"))
    .filter(Boolean);
}

function imagemCarrega(url) {
  return new Promise((resolve) => {
    const imagem = new Image();
    const timer = setTimeout(() => resolve(false), 8000);
    imagem.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    imagem.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    imagem.src = url;
  });
}

async function diagnosticar(posts, audiobooks, trilhas, booktrailers) {
  const problemas = [];
  const agora = Date.now();
  const imagens = [];

  posts.forEach((post) => {
    const nome = post.titulo || `Matéria ${post.id}`;
    const referencia = { destino: "novaMateria", id: post.id };
    if (!post.titulo) problemas.push({ tipo: "Conteúdo", item: nome, detalhe: "Título ausente", ...referencia });
    if (!post.imagem) problemas.push({ tipo: "Imagem", item: nome, detalhe: "Capa ausente", ...referencia });
    else imagens.push({ nome, url: post.imagem, ...referencia });
    if (!String(post.conteudo || "").trim()) problemas.push({ tipo: "Conteúdo", item: nome, detalhe: "Conteúdo vazio", ...referencia });

    const data = post.data ? new Date(post.data).getTime() : 0;
    if (post.status === "agendado" && data > 0 && data <= agora) {
      problemas.push({ tipo: "Agendamento", item: nome, detalhe: "Horário vencido e ainda não publicado", ...referencia });
    }
    if (post.notificacaoStatus === "falhou") {
      problemas.push({ tipo: "Notificação", item: nome, detalhe: "A última notificação falhou", ...referencia });
    }

    extrairLinks(post.conteudo).forEach((url) => {
      if (!/^(https?:|data:|\/)/i.test(url)) {
        problemas.push({ tipo: "Link", item: nome, detalhe: `Endereço inválido: ${url}`, ...referencia });
      }
    });
  });

  audiobooks.forEach((audio) => {
    const nome = audio.titulo || `Audiobook ${audio.id}`;
    const referencia = { destino: "novoAudiobook", id: audio.id };
    if (!audio.capa) problemas.push({ tipo: "Imagem", item: nome, detalhe: "Capa ausente", ...referencia });
    else imagens.push({ nome, url: audio.capa, ...referencia });
    if (!audio.audioUrl && !audio.linkAudio) problemas.push({ tipo: "Áudio", item: nome, detalhe: "Arquivo de áudio ausente", ...referencia });
  });

  trilhas.forEach((trilha) => {
    const nome = trilha.titulo || `Trilha ${trilha.id}`;
    const referencia = { destino: "novaTrilhaSonora", id: trilha.id };
    if (!trilha.capa) problemas.push({ tipo: "Imagem", item: nome, detalhe: "Capa ausente", ...referencia });
    else imagens.push({ nome, url: trilha.capa, ...referencia });
    if (!trilha.audioUrl) problemas.push({ tipo: "Áudio", item: nome, detalhe: "Arquivo de áudio ausente", ...referencia });
  });

  booktrailers.forEach((video) => {
    const nome = video.titulo || `BookTrailer ${video.id}`;
    const referencia = { destino: "novoBooktrailer", id: video.id };
    if (!video.banner) problemas.push({ tipo: "Imagem", item: nome, detalhe: "Banner ausente", ...referencia });
    else imagens.push({ nome, url: video.banner, ...referencia });
    if (!video.youtubeUrl) problemas.push({ tipo: "Vídeo", item: nome, detalhe: "Link do YouTube ausente", ...referencia });
  });

  const resultadosImagens = await Promise.all(
    imagens.map(async (imagem) => ({ ...imagem, ok: await imagemCarrega(imagem.url) }))
  );
  resultadosImagens.filter((imagem) => !imagem.ok).forEach((imagem) => {
    problemas.push({ tipo: "Imagem", item: imagem.nome, detalhe: "A imagem não está carregando", destino: imagem.destino, id: imagem.id });
  });

  return problemas;
}

function escaparHtml(valor) {
  return String(valor || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

async function gerarBackup() {
  const botao = document.getElementById("baixarBackupBtn");
  botao.disabled = true;
  botao.textContent = "Preparando backup...";

  try {
    const resultados = await Promise.all(COLECOES_BACKUP.map(async (nome) => [nome, await lerColecao(nome)]));
    baixarJson({
      formato: "diario-lunar-backup-v1",
      geradoEm: new Date().toISOString(),
      dados: Object.fromEntries(resultados)
    });
  } catch (error) {
    alert(error?.message || "Não foi possível gerar o backup.");
  } finally {
    botao.disabled = false;
    botao.textContent = "Baixar backup JSON";
  }
}

async function executarDiagnostico() {
  const botao = document.getElementById("executarDiagnosticoBtn");
  const resumo = document.getElementById("diagnosticoResumo");
  const lista = document.getElementById("diagnosticoLista");
  botao.disabled = true;
  resumo.textContent = "Verificando o acervo...";
  lista.innerHTML = "";

  try {
    const [posts, audiobooks, trilhas, booktrailers] = await Promise.all([
      lerColecao("posts"), lerColecao("audiobooks"), lerColecao("trilhasSonoras"), lerColecao("booktrailers")
    ]);
    const problemas = await diagnosticar(posts, audiobooks, trilhas, booktrailers);
    resumo.textContent = problemas.length
      ? `${problemas.length} item(ns) precisam de atenção.`
      : "Nenhum problema encontrado.";
    lista.innerHTML = problemas.length
      ? problemas.map((problema) => `
          <li class="diagnostico-item-clicavel">
            <a href="/admin.html?pagina=${encodeURIComponent(problema.destino)}&editar=${encodeURIComponent(problema.id)}">
            <strong>${escaparHtml(problema.tipo)}: ${escaparHtml(problema.item)}</strong>
            <span>${escaparHtml(problema.detalhe)}</span>
            </a>
          </li>
        `).join("")
      : '<li class="diagnostico-ok">O acervo está em ordem.</li>';
  } catch (error) {
    resumo.textContent = error?.message || "Não foi possível executar o diagnóstico.";
  } finally {
    botao.disabled = false;
  }
}

function ativarFerramentas() {
  document.getElementById("baixarBackupBtn")?.addEventListener("click", gerarBackup);
  document.getElementById("executarDiagnosticoBtn")?.addEventListener("click", executarDiagnostico);
  executarDiagnostico();
}

export function renderFerramentasAdmin() {
  setTimeout(ativarFerramentas, 0);

  return `
    <div class="admin-topo">
      <div>
        <h1>Saúde e backup</h1>
        <p>Confira o acervo e guarde uma cópia dos dados do Diário Lunar.</p>
      </div>
    </div>

    <div class="admin-card ferramentas-admin-acoes">
      <div>
        <h2>Backup completo</h2>
        <p>Baixa matérias, audiobooks, comentários, equipe e configurações em um arquivo JSON.</p>
      </div>
      <button type="button" class="btn btn-gradient" id="baixarBackupBtn">Baixar backup JSON</button>
    </div>

    <div class="admin-card">
      <div class="diagnostico-cabecalho">
        <div>
          <h2>Diagnóstico do site</h2>
          <p id="diagnosticoResumo" aria-live="polite">Preparando diagnóstico...</p>
        </div>
        <button type="button" class="btn" id="executarDiagnosticoBtn">Verificar novamente</button>
      </div>
      <ul id="diagnosticoLista" class="diagnostico-lista"></ul>
    </div>
  `;
}
