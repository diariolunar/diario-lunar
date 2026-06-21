import { auth, db, storage } from "../config/firebase.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  deleteObject,
  getBlob,
  listAll,
  ref
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-storage.js";

import { uploadArquivo } from "../utils/upload.js";

const IMAGEM_LOCAL = /^\/assets\//;
const JA_OTIMIZADA = /otimizadas(%2F|\/)/i;
const PASTAS_STORAGE = [
  "capas-materias",
  "materias-conteudo",
  "capas-audiobooks",
  "fotos-adms",
  "oraculo/constelacoes",
  "oraculo/signos"
];

async function garantirAdminAutenticado({ exigeGerenciamento = false } = {}) {
  const usuarioAuth = auth.currentUser;

  if (!usuarioAuth) {
    throw new Error("Sua sessao do Firebase expirou. Saia do ADM, entre novamente e tente outra vez.");
  }

  await usuarioAuth.getIdToken(true);

  const admSnap = await getDoc(doc(db, "admins", usuarioAuth.uid));

  if (!admSnap.exists() || admSnap.data().ativo === false) {
    throw new Error("Seu usuario nao esta ativo como ADM.");
  }

  const adm = admSnap.data();

  if (
    exigeGerenciamento &&
    adm.role !== "superadmin" &&
    adm.permissoes?.gerenciarAdmins !== true
  ) {
    throw new Error("Apenas superadmins ou ADMs com permissao de gerenciar admins podem apagar imagens.");
  }
}

function ehUrlOtimizavel(url) {
  const caminhoStorage = extrairCaminhoStorage(url);

  return (
    typeof url === "string" &&
    !!caminhoStorage &&
    !IMAGEM_LOCAL.test(url) &&
    !JA_OTIMIZADA.test(url)
  );
}

function nomeArquivoSeguro(nome = "imagem") {
  return nome
    .replace(/\.[^/.]+$/, "")
    .replace(/[^a-zA-Z0-9-_]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase() || "imagem";
}

async function baixarImagemComoArquivo(url, nome) {
  const caminhoStorage = extrairCaminhoStorage(url);
  let blob = null;

  if (caminhoStorage) {
    try {
      blob = await getBlob(ref(storage, caminhoStorage));
    } catch (error) {
      if (error?.code === "storage/retry-limit-exceeded") {
        throw new Error(
          "O Firebase Storage excedeu o tempo de download. Normalmente isso acontece quando o CORS do bucket não permite baixar arquivos pelo site. Aplique o arquivo firebase-storage-cors.json no bucket e tente novamente."
        );
      }

      throw error;
    }
  } else {
    let resposta = null;

    try {
      resposta = await fetch(url, { mode: "cors" });
    } catch {
      throw new Error("O domínio da imagem bloqueou o download pelo navegador. Reenvie essa imagem manualmente pelo ADM.");
    }

    if (!resposta.ok) {
      throw new Error(`Falha ao baixar imagem (${resposta.status}).`);
    }

    blob = await resposta.blob();
  }

  if (!blob.type.startsWith("image/")) {
    throw new Error("A URL não retornou uma imagem válida.");
  }

  const extensao = blob.type.split("/")[1] || "jpg";

  return new File(
    [blob],
    `${nomeArquivoSeguro(nome)}.${extensao}`,
    {
      type: blob.type,
      lastModified: Date.now()
    }
  );
}

async function otimizarUrl(url, pasta, nome) {
  if (!ehUrlOtimizavel(url)) {
    return {
      status: "pulada",
      url
    };
  }

  const arquivo = await baixarImagemComoArquivo(url, nome);
  const novaUrl = await uploadArquivo(arquivo, `${pasta}/otimizadas`);

  return {
    status: "otimizada",
    url: novaUrl
  };
}

function escreverLog(linha) {
  const log = document.getElementById("otimizarImagensLog");

  if (!log) return;

  log.textContent += `${linha}\n`;
  log.scrollTop = log.scrollHeight;
}

function atualizarResumo(resumo, rotuloPrincipal = "otimizada(s)") {
  const box = document.getElementById("otimizarImagensResumo");

  if (!box) return;

  box.innerHTML = `
    <b>${resumo.otimizadas}</b> ${rotuloPrincipal} ·
    <b>${resumo.puladas}</b> pulada(s) ·
    <b>${resumo.erros}</b> erro(s)
  `;
}

function extrairCaminhoStorage(url) {
  if (!url || typeof url !== "string") return "";

  try {
    const parsed = new URL(url);
    const match = parsed.pathname.match(/\/o\/([^?]+)/);

    if (!match?.[1]) return "";

    return decodeURIComponent(match[1]);
  } catch {
    return "";
  }
}

function coletarImagensConteudo(conteudo, usados) {
  if (!conteudo?.includes("<img")) return;

  const parser = new DOMParser();
  const docHtml = parser.parseFromString(conteudo, "text/html");

  docHtml.querySelectorAll("img[src]").forEach((imagem) => {
    const caminho = extrairCaminhoStorage(imagem.getAttribute("src"));

    if (caminho) {
      usados.add(caminho);
    }
  });
}

async function coletarCaminhosEmUso() {
  const usados = new Set();
  const postsSnap = await getDocs(collection(db, "posts"));
  const audiobooksSnap = await getDocs(collection(db, "audiobooks"));
  const adminsSnap = await getDocs(collection(db, "admins"));
  const oraculoSnap = await getDoc(doc(db, "posts", "oraculo-lunar-config"));

  postsSnap.forEach((item) => {
    const post = item.data();
    const imagem = extrairCaminhoStorage(post.imagem);

    if (imagem) {
      usados.add(imagem);
    }

    coletarImagensConteudo(post.conteudo, usados);
  });

  audiobooksSnap.forEach((item) => {
    const capa = extrairCaminhoStorage(item.data().capa);

    if (capa) {
      usados.add(capa);
    }
  });

  adminsSnap.forEach((item) => {
    const foto = extrairCaminhoStorage(item.data().fotoUrl);

    if (foto) {
      usados.add(foto);
    }
  });

  if (oraculoSnap.exists()) {
    const config = oraculoSnap.data();

    Object.values(config.constelacoes || {}).forEach((dados) => {
      const imagem = extrairCaminhoStorage(dados?.imagem);

      if (imagem) {
        usados.add(imagem);
      }
    });

    Object.values(config.signos || {}).forEach((dados) => {
      const imagem = extrairCaminhoStorage(dados?.imagem);

      if (imagem) {
        usados.add(imagem);
      }
    });
  }

  return usados;
}

async function listarArquivosRecursivo(pasta) {
  const raiz = ref(storage, pasta);
  const resultado = await listAll(raiz);
  const arquivos = [...resultado.items];

  for (const prefixo of resultado.prefixes) {
    arquivos.push(...await listarArquivosRecursivo(prefixo.fullPath));
  }

  return arquivos;
}

async function limparImagensOrfas() {
  const confirmar = await window.confirmarModal({
        titulo: "Limpar imagens órfãs",
        mensagem: "Deseja apagar do Storage as imagens que não estão mais sendo usadas no Firestore? Essa ação não pode ser desfeita.",
        textoConfirmar: "Apagar órfãs"
      });

  if (!confirmar) return;

  const botao = document.getElementById("limparImagensOrfasBtn");
  const resumo = {
    otimizadas: 0,
    puladas: 0,
    erros: 0
  };

  botao.disabled = true;
  botao.innerText = "Limpando...";

  try {
    await garantirAdminAutenticado({ exigeGerenciamento: true });
  } catch (error) {
    escreverLog(`! ${error.message}`);
    alert(error.message);
    botao.disabled = false;
    botao.innerText = "Limpar imagens órfãs";
    return;
  }

  escreverLog("Mapeando imagens ainda em uso...");

  const usados = await coletarCaminhosEmUso();

  escreverLog(`${usados.size} arquivo(s) referenciado(s) no Firestore.`);
  escreverLog("Procurando arquivos órfãos no Storage...");

  for (const pasta of PASTAS_STORAGE) {
    try {
      const arquivos = await listarArquivosRecursivo(pasta);

      for (const arquivoRef of arquivos) {
        if (usados.has(arquivoRef.fullPath)) {
          resumo.puladas++;
          atualizarResumo(resumo, "apagada(s)");
          continue;
        }

        try {
          await deleteObject(arquivoRef);
          resumo.otimizadas++;
          escreverLog(`✓ Apagada órfã: ${arquivoRef.fullPath}`);
        } catch (error) {
          resumo.erros++;
          escreverLog(`! Erro ao apagar ${arquivoRef.fullPath}: ${error.message}`);
        }

        atualizarResumo(resumo, "apagada(s)");
      }
    } catch (error) {
      resumo.erros++;
      escreverLog(`! Erro ao listar ${pasta}: ${error.message}`);
      atualizarResumo(resumo, "apagada(s)");
    }
  }

  escreverLog("Limpeza de imagens órfãs finalizada.");

  botao.disabled = false;
  botao.innerText = "Limpar imagens órfãs";
}

async function processarItem({ rotulo, url, pasta, nome, salvar }, resumo) {
  try {
    const resultado = await otimizarUrl(url, pasta, nome);

    if (resultado.status === "pulada") {
      resumo.puladas++;
      escreverLog(`- Pulada: ${rotulo}`);
      atualizarResumo(resumo);
      return;
    }

    await salvar(resultado.url);

    resumo.otimizadas++;
    escreverLog(`✓ Otimizada: ${rotulo}`);
    atualizarResumo(resumo);

  } catch (error) {
    resumo.erros++;
    escreverLog(`! Erro em ${rotulo}: ${error.message}`);
    atualizarResumo(resumo);
  }
}

async function otimizarMaterias(resumo) {
  const snap = await getDocs(collection(db, "posts"));

  for (const item of snap.docs) {
    const post = item.data();

    if (post.imagem) {
      await processarItem({
      rotulo: `Matéria: ${post.titulo || item.id}`,
      url: post.imagem,
      pasta: "capas-materias",
      nome: post.titulo || item.id,
      salvar: (url) => updateDoc(doc(db, "posts", item.id), {
        imagem: url,
        imagemOtimizadaEm: new Date()
      })
      }, resumo);
    }

    if (post.conteudo?.includes("<img")) {
      const parser = new DOMParser();
      const docHtml = parser.parseFromString(post.conteudo, "text/html");
      const imagens = [...docHtml.querySelectorAll("img[src]")];
      let alterouConteudo = false;

      for (const [index, imagem] of imagens.entries()) {
        const src = imagem.getAttribute("src");

        await processarItem({
          rotulo: `Imagem interna: ${post.titulo || item.id} #${index + 1}`,
          url: src,
          pasta: "materias-conteudo",
          nome: `${post.titulo || item.id}-${index + 1}`,
          salvar: async (url) => {
            imagem.setAttribute("src", url);
            imagem.setAttribute("loading", "lazy");
            imagem.setAttribute("decoding", "async");
            alterouConteudo = true;
          }
        }, resumo);
      }

      if (alterouConteudo) {
        await updateDoc(doc(db, "posts", item.id), {
          conteudo: docHtml.body.innerHTML,
          conteudoOtimizadoEm: new Date()
        });
      }
    }
  }
}

async function otimizarAudiobooks(resumo) {
  const snap = await getDocs(collection(db, "audiobooks"));

  for (const item of snap.docs) {
    const audio = item.data();

    if (!audio.capa) continue;

    await processarItem({
      rotulo: `Audiobook: ${audio.titulo || item.id}`,
      url: audio.capa,
      pasta: "capas-audiobooks",
      nome: audio.titulo || item.id,
      salvar: (url) => updateDoc(doc(db, "audiobooks", item.id), {
        capa: url,
        capaOtimizadaEm: new Date()
      })
    }, resumo);
  }
}

async function otimizarPerfis(resumo) {
  const snap = await getDocs(collection(db, "admins"));

  for (const item of snap.docs) {
    const adm = item.data();

    if (!adm.fotoUrl) continue;

    await processarItem({
      rotulo: `Perfil: ${adm.nome || adm.user || item.id}`,
      url: adm.fotoUrl,
      pasta: "fotos-adms",
      nome: adm.user || adm.nome || item.id,
      salvar: (url) => updateDoc(doc(db, "admins", item.id), {
        fotoUrl: url,
        fotoOtimizadaEm: new Date()
      })
    }, resumo);
  }
}

async function otimizarOraculo(resumo) {
  const ref = doc(db, "posts", "oraculo-lunar-config");
  const snap = await getDoc(ref);

  if (!snap.exists()) return;

  const config = snap.data();
  const constelacoes = { ...(config.constelacoes || {}) };
  const signos = { ...(config.signos || {}) };
  let alterou = false;

  for (const [id, dados] of Object.entries(constelacoes)) {
    if (!dados?.imagem) continue;

    await processarItem({
      rotulo: `Oráculo constelação: ${dados.nome || id}`,
      url: dados.imagem,
      pasta: "oraculo/constelacoes",
      nome: dados.nome || id,
      salvar: async (url) => {
        constelacoes[id] = {
          ...dados,
          imagem: url
        };
        alterou = true;
      }
    }, resumo);
  }

  for (const [id, dados] of Object.entries(signos)) {
    if (!dados?.imagem) continue;

    await processarItem({
      rotulo: `Oráculo signo: ${dados.nome || id}`,
      url: dados.imagem,
      pasta: "oraculo/signos",
      nome: dados.nome || id,
      salvar: async (url) => {
        signos[id] = {
          ...dados,
          imagem: url
        };
        alterou = true;
      }
    }, resumo);
  }

  if (alterou) {
    await updateDoc(ref, {
      constelacoes,
      signos,
      imagensOtimizadasEm: new Date()
    });
  }
}

async function iniciarOtimizacao() {
  const botao = document.getElementById("otimizarImagensBtn");
  const log = document.getElementById("otimizarImagensLog");
  const resumo = {
    otimizadas: 0,
    puladas: 0,
    erros: 0
  };

  botao.disabled = true;
  botao.innerText = "Otimizando...";
  log.textContent = "";
  atualizarResumo(resumo);

  try {
    await garantirAdminAutenticado();
  } catch (error) {
    escreverLog(`! ${error.message}`);
    alert(error.message);
    botao.disabled = false;
    botao.innerText = "Otimizar imagens antigas";
    return;
  }

  escreverLog("Iniciando otimização das imagens antigas...");

  await otimizarMaterias(resumo);
  await otimizarAudiobooks(resumo);
  await otimizarPerfis(resumo);
  await otimizarOraculo(resumo);

  escreverLog("Finalizado.");

  botao.disabled = false;
  botao.innerText = "Otimizar imagens antigas";
}

export function renderOtimizarImagens() {
  setTimeout(() => {
    document.getElementById("otimizarImagensBtn").onclick = iniciarOtimizacao;
    document.getElementById("limparImagensOrfasBtn").onclick = limparImagensOrfas;
  }, 50);

  return `
    <div class="admin-card">
      <div class="admin-header-flex">
        <div>
          <h1>Otimizar imagens antigas</h1>
          <p>
            Reenvia imagens antigas do Firebase Storage em versão comprimida e atualiza os links salvos no Firestore.
          </p>
        </div>

        <div class="editor-actions-top">
          <button id="otimizarImagensBtn" class="btn btn-gradient">
            Otimizar imagens antigas
          </button>

          <button id="limparImagensOrfasBtn" class="btn">
            Limpar imagens órfãs
          </button>
        </div>
      </div>

      <p>
        Essa ação pode demorar alguns minutos. Links do Google Drive e de outros domínios serão ignorados.
      </p>

      <p>
        A limpeza apaga do Storage apenas arquivos das pastas usadas pelo site que não aparecem mais em
        matérias, audiobooks, perfis, Oráculo ou imagens internas de matérias.
      </p>

      <div id="otimizarImagensResumo" style="margin:18px 0;">
        <b>0</b> otimizada(s) · <b>0</b> pulada(s) · <b>0</b> erro(s)
      </div>

      <pre
        id="otimizarImagensLog"
        style="min-height:260px; max-height:420px; overflow:auto; white-space:pre-wrap; background:#f8fafc; border:1px solid #e5e7eb; padding:16px; border-radius:12px;"
      ></pre>
    </div>
  `;
}
