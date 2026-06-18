import { db } from "../config/firebase.js";

import {
  doc,
  getDoc,
  setDoc
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import { uploadArquivo } from "../utils/upload.js";

const gruposBase = {
  P: {
    nome: "Primordiais",
    chamada: "Os que nasceram para deixar marcas eternas no mundo.",
    signos: {
      fenix: "Fênix Solar",
      dragao: "Dragão Astral"
    }
  },
  E: {
    nome: "Emocionais",
    chamada: "Aqueles que transformam sentimentos em arte.",
    signos: {
      borboleta: "Borboleta Prismática",
      rosa: "Rosa Celestial"
    }
  },
  C: {
    nome: "Caóticos",
    chamada: "Onde o perigo e o fascínio caminham juntos.",
    signos: {
      lobo: "Lobo da Névoa",
      demonio: "Demônio Carmesim"
    }
  },
  A: {
    nome: "Astrais",
    chamada: "Aqueles que brilham e usam as estrelas como seus guias.",
    signos: {
      bussola: "Bússola Errante",
      pena: "Pena Partida",
      estrela: "Estrela Pulsante"
    }
  },
  M: {
    nome: "Místicos",
    chamada: "Aqueles que enxergam além do Véu.",
    signos: {
      olho: "Olho do Véu",
      guardia: "Guardiã Celeste"
    }
  },
  S: {
    nome: "Sombrios",
    chamada: "As constelações da sombra, do mistério e das ruínas emocionais.",
    signos: {
      lua: "Lua Sangrenta",
      espelho: "Espelho Sombrio",
      adaga: "Adaga Escarlate"
    }
  }
};

const signosBase = {
  fenix: {
    subtitulo: "O signo dos renascimentos.",
    descricao: "Criativos, resistentes e intensos, os filhos da Fênix sempre encontram forças para começar outra vez, mesmo após a destruição.",
    compatibilidade: ["Dragão Astral", "Estrela Pulsante", "Lobo da Névoa"]
  },
  dragao: {
    subtitulo: "Os sonhadores do impossível.",
    descricao: "Vivem entre fantasia, imaginação e caos criativo. São almas que transformam ideias em universos inteiros.",
    compatibilidade: ["Fênix Solar", "Borboleta Prismática", "Estrela Pulsante"]
  },
  borboleta: {
    subtitulo: "O signo da transformação.",
    descricao: "Livres, sensíveis e impossíveis de aprisionar. Mudam constantemente sem nunca perder a própria essência.",
    compatibilidade: ["Dragão Astral", "Rosa Celestial"]
  },
  rosa: {
    subtitulo: "Românticos intensos.",
    descricao: "Amam profundamente, às vezes profundamente demais. São guiados pelo coração, mesmo quando ele sangra.",
    compatibilidade: ["Pena Partida", "Guardiã Celeste", "Borboleta Prismática"]
  },
  lobo: {
    subtitulo: "Leais, ferozes e emocionais.",
    descricao: "Protegem aqueles que chamam de matilha até o último instante. Intensos no amor e perigosos na dor.",
    compatibilidade: ["Lua Sangrenta", "Fênix Solar", "Olho do Véu"]
  },
  demonio: {
    subtitulo: "Ambiciosos, magnéticos e dominantes.",
    descricao: "São almas que transformam intensidade em poder. O caos parece obedecer à sua presença.",
    compatibilidade: ["Lua Sangrenta", "Adaga Escarlate"]
  },
  bussola: {
    subtitulo: "Exploradores de mundos e possibilidades.",
    descricao: "Vivem buscando novos caminhos, novas histórias e novos destinos.",
    compatibilidade: ["Guardiã Celeste", "Estrela Pulsante"]
  },
  pena: {
    subtitulo: "Poetas da dor.",
    descricao: "Transformam cicatrizes em palavras e sentimentos em eternidade.",
    compatibilidade: ["Rosa Celestial", "Lua Sangrenta"]
  },
  estrela: {
    subtitulo: "Energia viva e imprevisível.",
    descricao: "Brilham intensamente mesmo à beira da explosão.",
    compatibilidade: ["Dragão Astral", "Fênix Solar", "Bússola Errante"]
  },
  olho: {
    subtitulo: "Os estrategistas do Oráculo.",
    descricao: "Sempre atentos, silenciosos e desconfiados. São observadores naturais dos segredos do mundo.",
    compatibilidade: ["Lobo da Névoa", "Espelho Sombrio"]
  },
  guardia: {
    subtitulo: "Os guias silenciosos do Projeto Lunar.",
    descricao: "Calmos, sábios e equilibrados, são as estrelas que mantêm o céu em ordem.",
    compatibilidade: ["Bússola Errante", "Rosa Celestial"]
  },
  lua: {
    subtitulo: "O signo da paixão perigosa.",
    descricao: "Intensos, sedutores e emocionalmente destrutivos. Vivem entre desejo e tragédia.",
    compatibilidade: ["Demônio Carmesim", "Lobo da Névoa", "Pena Partida"]
  },
  espelho: {
    subtitulo: "Fragmentados, profundos e psicológicos.",
    descricao: "Difíceis de compreender completamente, até mesmo por si próprios.",
    compatibilidade: ["Olho do Véu", "Adaga Escarlate"]
  },
  adaga: {
    subtitulo: "Sedutores e imprevisíveis.",
    descricao: "Sorriem enquanto escondem segredos. São perigosamente fascinantes.",
    compatibilidade: ["Demônio Carmesim", "Espelho Sombrio", "Lua Sangrenta"]
  }
};

let configAtual = {};

async function carregarConfig() {
  const snap = await getDoc(doc(db, "oraculoLunar", "config"));

  configAtual = snap.exists()
    ? snap.data()
    : { constelacoes: {}, signos: {} };
}

function valorConstelacao(grupo, campo) {
  return configAtual.constelacoes?.[grupo]?.[campo] || gruposBase[grupo][campo] || "";
}

function valorSigno(signoId, campo, nomePadrao = "") {
  return configAtual.signos?.[signoId]?.[campo] || signosBase[signoId]?.[campo] || (campo === "nome" ? nomePadrao : "");
}

function criarBlocoConstelacao(grupoId, grupo) {
  const imagem = valorConstelacao(grupoId, "imagem");

  return `
    <div class="admin-card" style="margin-bottom:20px;">
      <h2>${grupo.nome}</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Nome da constelação</label>
          <input id="constelacao-${grupoId}-nome" value="${valorConstelacao(grupoId, "nome")}">
        </div>

        <div class="form-group">
          <label>Imagem da constelação</label>
          <input id="constelacao-${grupoId}-arquivo" type="file" accept="image/*">
          <input id="constelacao-${grupoId}-imagem" value="${imagem}" placeholder="URL da imagem">
        </div>
      </div>

      ${
        imagem
          ? `<img src="${imagem}" class="preview-capa" style="display:block; max-width:360px;">`
          : ""
      }

      <div class="form-group">
        <label>Descrição da constelação</label>
        <textarea id="constelacao-${grupoId}-chamada" class="admin-textarea">${valorConstelacao(grupoId, "chamada")}</textarea>
      </div>
    </div>
  `;
}

function criarBlocoSigno(signoId, nomePadrao) {
  const imagem = valorSigno(signoId, "imagem");

  return `
    <div class="admin-card" style="margin-bottom:20px;">
      <h2>${nomePadrao}</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Nome do signo</label>
          <input id="signo-${signoId}-nome" value="${valorSigno(signoId, "nome", nomePadrao)}">
        </div>

        <div class="form-group">
          <label>Imagem do signo</label>
          <input id="signo-${signoId}-arquivo" type="file" accept="image/*">
          <input id="signo-${signoId}-imagem" value="${imagem}" placeholder="URL da imagem">
        </div>
      </div>

      ${
        imagem
          ? `<img src="${imagem}" class="preview-capa" style="display:block; max-width:300px;">`
          : ""
      }

      <div class="form-group">
        <label>Subtítulo</label>
        <input id="signo-${signoId}-subtitulo" value="${valorSigno(signoId, "subtitulo")}">
      </div>

      <div class="form-group">
        <label>Descrição</label>
        <textarea id="signo-${signoId}-descricao" class="admin-textarea">${valorSigno(signoId, "descricao")}</textarea>
      </div>

      <div class="form-group">
        <label>Compatibilidades, uma por linha</label>
        <textarea id="signo-${signoId}-compatibilidade" class="admin-textarea">${
          (configAtual.signos?.[signoId]?.compatibilidade || signosBase[signoId]?.compatibilidade || []).join("\n")
        }</textarea>
      </div>
    </div>
  `;
}

async function resolverImagem(inputArquivoId, inputUrlId, pasta) {
  const arquivo = document.getElementById(inputArquivoId)?.files?.[0];
  const inputUrl = document.getElementById(inputUrlId);

  if (!arquivo) {
    return inputUrl?.value.trim() || "";
  }

  const url = await uploadArquivo(arquivo, pasta);

  if (inputUrl) {
    inputUrl.value = url;
  }

  return url;
}

async function salvarOraculo(onReload) {
  const botao = document.getElementById("salvarOraculoBtn");
  botao.disabled = true;
  botao.innerText = "Salvando...";

  try {
    const constelacoes = {};
    const signos = {};

    for (const [grupoId, grupo] of Object.entries(gruposBase)) {
      constelacoes[grupoId] = {
        nome: document.getElementById(`constelacao-${grupoId}-nome`).value.trim(),
        chamada: document.getElementById(`constelacao-${grupoId}-chamada`).value.trim(),
        imagem: await resolverImagem(
          `constelacao-${grupoId}-arquivo`,
          `constelacao-${grupoId}-imagem`,
          "oraculo/constelacoes"
        )
      };

      for (const [signoId, nomePadrao] of Object.entries(grupo.signos)) {
        signos[signoId] = {
          nome: document.getElementById(`signo-${signoId}-nome`).value.trim(),
          subtitulo: document.getElementById(`signo-${signoId}-subtitulo`).value.trim(),
          descricao: document.getElementById(`signo-${signoId}-descricao`).value.trim(),
          imagem: await resolverImagem(
            `signo-${signoId}-arquivo`,
            `signo-${signoId}-imagem`,
            "oraculo/signos"
          ),
          compatibilidade: document
            .getElementById(`signo-${signoId}-compatibilidade`)
            .value
            .split("\n")
            .map((item) => item.trim())
            .filter(Boolean)
        };
      }
    }

    await setDoc(doc(db, "oraculoLunar", "config"), {
      constelacoes,
      signos,
      atualizadoEm: new Date()
    }, { merge: true });

    alert("Oráculo Lunar salvo.");
    await onReload();

  } catch (error) {
    console.error(error);
    alert(error?.message || "Erro ao salvar Oráculo Lunar.");
    botao.disabled = false;
    botao.innerText = "Salvar Oráculo Lunar";
  }
}

export async function renderOraculoAdmin(onReload) {
  await carregarConfig();

  setTimeout(() => {
    document.getElementById("salvarOraculoBtn").onclick = () => salvarOraculo(onReload);
  }, 80);

  const signosHtml = Object.entries(gruposBase)
    .map(([grupoId, grupo]) => `
      <h2 style="margin:30px 0 15px;">Signos ${grupo.nome}</h2>
      ${Object.entries(grupo.signos)
        .map(([signoId, nome]) => criarBlocoSigno(signoId, nome))
        .join("")}
    `)
    .join("");

  return `
    <div class="admin-card">
      <div class="admin-header-flex">
        <div>
          <h1>Oráculo Lunar</h1>
          <p>Cadastre imagens, descrições e compatibilidades das constelações e signos.</p>
        </div>

        <div class="editor-actions-top">
          <button id="salvarOraculoBtn" class="btn btn-gradient">
            Salvar Oráculo Lunar
          </button>
        </div>
      </div>

      <h2>Constelações</h2>

      ${Object.entries(gruposBase)
        .map(([grupoId, grupo]) => criarBlocoConstelacao(grupoId, grupo))
        .join("")}

      ${signosHtml}
    </div>
  `;
}
