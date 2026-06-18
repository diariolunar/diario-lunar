import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

const app = document.getElementById("quizSignoLunar");

const grupos = {
  P: {
    nome: "Primordiais",
    chamada: "Os que nasceram para deixar marcas eternas no mundo.",
    signos: {
      fenix: {
        nome: "Fênix Solar",
        subtitulo: "O signo dos renascimentos.",
        descricao:
          "Criativos, resistentes e intensos, os filhos da Fênix sempre encontram forças para começar outra vez, mesmo após a destruição.",
        compatibilidade: ["Dragão Astral", "Estrela Pulsante", "Lobo da Névoa"]
      },
      dragao: {
        nome: "Dragão Astral",
        subtitulo: "Os sonhadores do impossível.",
        descricao:
          "Vivem entre fantasia, imaginação e caos criativo. São almas que transformam ideias em universos inteiros.",
        compatibilidade: ["Fênix Solar", "Borboleta Prismática", "Estrela Pulsante"]
      }
    }
  },
  E: {
    nome: "Emocionais",
    chamada: "Aqueles que transformam sentimentos em arte.",
    signos: {
      borboleta: {
        nome: "Borboleta Prismática",
        subtitulo: "O signo da transformação.",
        descricao:
          "Livres, sensíveis e impossíveis de aprisionar. Mudam constantemente sem nunca perder a própria essência.",
        compatibilidade: ["Dragão Astral", "Rosa Celestial"]
      },
      rosa: {
        nome: "Rosa Celestial",
        subtitulo: "Românticos intensos.",
        descricao:
          "Amam profundamente, às vezes profundamente demais. São guiados pelo coração, mesmo quando ele sangra.",
        compatibilidade: ["Pena Partida", "Guardiã Celeste", "Borboleta Prismática"]
      }
    }
  },
  C: {
    nome: "Caóticos",
    chamada: "Onde o perigo e o fascínio caminham juntos.",
    signos: {
      lobo: {
        nome: "Lobo da Névoa",
        subtitulo: "Leais, ferozes e emocionais.",
        descricao:
          "Protegem aqueles que chamam de matilha até o último instante. Intensos no amor e perigosos na dor.",
        compatibilidade: ["Lua Sangrenta", "Fênix Solar", "Olho do Véu"]
      },
      demonio: {
        nome: "Demônio Carmesim",
        subtitulo: "Ambiciosos, magnéticos e dominantes.",
        descricao:
          "São almas que transformam intensidade em poder. O caos parece obedecer à sua presença.",
        compatibilidade: ["Lua Sangrenta", "Adaga Escarlate"]
      }
    }
  },
  A: {
    nome: "Astrais",
    chamada: "Aqueles que brilham e usam as estrelas como seus guias.",
    signos: {
      bussola: {
        nome: "Bússola Errante",
        subtitulo: "Exploradores de mundos e possibilidades.",
        descricao:
          "Vivem buscando novos caminhos, novas histórias e novos destinos.",
        compatibilidade: ["Guardiã Celeste", "Estrela Pulsante"]
      },
      pena: {
        nome: "Pena Partida",
        subtitulo: "Poetas da dor.",
        descricao:
          "Transformam cicatrizes em palavras e sentimentos em eternidade.",
        compatibilidade: ["Rosa Celestial", "Lua Sangrenta"]
      },
      estrela: {
        nome: "Estrela Pulsante",
        subtitulo: "Energia viva e imprevisível.",
        descricao:
          "Brilham intensamente mesmo à beira da explosão.",
        compatibilidade: ["Dragão Astral", "Fênix Solar", "Bússola Errante"]
      }
    }
  },
  M: {
    nome: "Místicos",
    chamada: "Aqueles que enxergam além do Véu.",
    signos: {
      olho: {
        nome: "Olho do Véu",
        subtitulo: "Os estrategistas do Oráculo.",
        descricao:
          "Sempre atentos, silenciosos e desconfiados. São observadores naturais dos segredos do mundo.",
        compatibilidade: ["Lobo da Névoa", "Espelho Sombrio"]
      },
      guardia: {
        nome: "Guardiã Celeste",
        subtitulo: "Os guias silenciosos do Projeto Lunar.",
        descricao:
          "Calmos, sábios e equilibrados, são as estrelas que mantêm o céu em ordem.",
        compatibilidade: ["Bússola Errante", "Rosa Celestial"]
      }
    }
  },
  S: {
    nome: "Sombrios",
    chamada: "As constelações da sombra, do mistério e das ruínas emocionais.",
    signos: {
      lua: {
        nome: "Lua Sangrenta",
        subtitulo: "O signo da paixão perigosa.",
        descricao:
          "Intensos, sedutores e emocionalmente destrutivos. Vivem entre desejo e tragédia.",
        compatibilidade: ["Demônio Carmesim", "Lobo da Névoa", "Pena Partida"]
      },
      espelho: {
        nome: "Espelho Sombrio",
        subtitulo: "Fragmentados, profundos e psicológicos.",
        descricao:
          "Difíceis de compreender completamente, até mesmo por si próprios.",
        compatibilidade: ["Olho do Véu", "Adaga Escarlate"]
      },
      adaga: {
        nome: "Adaga Escarlate",
        subtitulo: "Sedutores e imprevisíveis.",
        descricao:
          "Sorriem enquanto escondem segredos. São perigosamente fascinantes.",
        compatibilidade: ["Demônio Carmesim", "Espelho Sombrio", "Lua Sangrenta"]
      }
    }
  }
};

const perguntasConstelacao = [
  {
    texto: "O que mais move suas decisões?",
    opcoes: [
      { texto: "Deixar uma marca no mundo.", valor: "P" },
      { texto: "Sentimentos e conexões profundas.", valor: "E" },
      { texto: "Instinto e intensidade.", valor: "C" },
      { texto: "Descobrir algo novo.", valor: "A" },
      { texto: "Entender aquilo que ninguém vê.", valor: "M" },
      { texto: "Explorar emoções proibidas ou complexas.", valor: "S" }
    ]
  },
  {
    texto: "Em um grupo você costuma ser escolhido como?",
    opcoes: [
      { texto: "O líder natural.", valor: "P" },
      { texto: "O coração do grupo.", valor: "E" },
      { texto: "O imprevisível.", valor: "C" },
      { texto: "O aventureiro.", valor: "A" },
      { texto: "O observador silencioso.", valor: "M" },
      { texto: "O mais misterioso.", valor: "S" }
    ]
  },
  {
    texto: "Qual ambiente parece mais confortável?",
    opcoes: [
      { texto: "Um reino em guerra.", valor: "P" },
      { texto: "Um jardim iluminado pela lua.", valor: "E" },
      { texto: "Uma floresta durante uma tempestade.", valor: "C" },
      { texto: "Uma estrada sem destino.", valor: "A" },
      { texto: "Uma biblioteca secreta.", valor: "M" },
      { texto: "Um castelo abandonado.", valor: "S" }
    ]
  },
  {
    texto: "O que mais admira em alguém?",
    opcoes: [
      { texto: "Coragem.", valor: "P" },
      { texto: "Sensibilidade.", valor: "E" },
      { texto: "Lealdade.", valor: "C" },
      { texto: "Liberdade.", valor: "A" },
      { texto: "Sabedoria.", valor: "M" },
      { texto: "Profundidade emocional.", valor: "S" }
    ]
  },
  {
    texto: "Qual defeito mais te representa?",
    opcoes: [
      { texto: "Orgulho.", valor: "P" },
      { texto: "Apego.", valor: "E" },
      { texto: "Impulsividade.", valor: "C" },
      { texto: "Inquietação.", valor: "A" },
      { texto: "Distanciamento.", valor: "M" },
      { texto: "Obsessão.", valor: "S" }
    ]
  },
  {
    texto: "Quando enfrenta um problema, o que pensa?",
    opcoes: [
      { texto: "Luta até vencer.", valor: "P" },
      { texto: "Procura proteger quem ama.", valor: "E" },
      { texto: "Age primeiro e pensa depois.", valor: "C" },
      { texto: "Procura novos caminhos.", valor: "A" },
      { texto: "Analisa tudo antes de agir.", valor: "M" },
      { texto: "Enfrenta sozinho.", valor: "S" }
    ]
  },
  {
    texto: "Qual frase combina mais com você?",
    opcoes: [
      { texto: "Nasci para deixar minha marca.", valor: "P" },
      { texto: "Tudo que sinto vira arte.", valor: "E" },
      { texto: "O caos também faz parte de mim.", valor: "C" },
      { texto: "Sempre existe algo além do horizonte.", valor: "A" },
      { texto: "Nem tudo precisa ser revelado.", valor: "M" },
      { texto: "Toda sombra possui uma história.", valor: "S" }
    ]
  }
];

const perguntasSigno = {
  P: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Resiliente, criativo e impossível de derrubar.", valor: "fenix" },
      { texto: "Sonhador, imaginativo e criador de universos.", valor: "dragao" }
    ]
  },
  E: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Está sempre se transformando.", valor: "borboleta" },
      { texto: "Ama intensamente e vive emoções profundas.", valor: "rosa" }
    ]
  },
  C: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Proteger sua matilha.", valor: "lobo" },
      { texto: "Ambição e intensidade.", valor: "demonio" }
    ]
  },
  A: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Aventuras e novos horizontes.", valor: "bussola" },
      { texto: "Transformar dor em arte.", valor: "pena" },
      { texto: "Brilhar mesmo quando tudo parece ruir.", valor: "estrela" }
    ]
  },
  M: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Observar e compreender o invisível.", valor: "olho" },
      { texto: "Proteger e orientar aqueles ao redor.", valor: "guardia" }
    ]
  },
  S: {
    texto: "Qual frase mais combina com você?",
    opcoes: [
      { texto: "Vivo emoções que poucos suportariam.", valor: "lua" },
      { texto: "Nem eu compreendo todos os meus fragmentos.", valor: "espelho" },
      { texto: "Meus segredos são parte da minha força.", valor: "adaga" }
    ]
  }
};

const compatibilidadesOraculo = {
  melhores: [
    "Fênix Solar + Rosa Celestial",
    "Dragão Astral + Borboleta Prismática",
    "Bússola Errante + Estrela Pulsante",
    "Pena Partida + Espelho Sombrio",
    "Guardiã Celeste + Lobo da Névoa",
    "Olho do Véu + Dragão Astral",
    "Lua Sangrenta + Rosa Celestial",
    "Adaga Escarlate + Demônio Carmesim"
  ],
  unicas: [
    "Fênix Solar + Dragão Astral",
    "Guardiã Celeste + Olho do Véu",
    "Estrela Pulsante + Pena Partida",
    "Rosa Celestial + Borboleta Prismática"
  ],
  naoCombinam: [
    "Fênix Solar × Demônio Carmesim",
    "Guardiã Celeste × Adaga Escarlate",
    "Rosa Celestial × Espelho Sombrio",
    "Lobo da Névoa × Lua Sangrenta"
  ]
};

let indicePergunta = 0;
let pontuacaoConstelacao = {};
let grupoFinal = "";

function somarPontuacao(chave) {
  pontuacaoConstelacao[chave] = (pontuacaoConstelacao[chave] || 0) + 1;
}

function maiorPontuacao(mapa) {
  return Object.entries(mapa)
    .sort((a, b) => b[1] - a[1])[0]?.[0] || "P";
}

function renderInicio() {
  app.innerHTML = `
    <div class="quiz-lunar-card">
      <p class="quiz-lunar-tag">Oráculo Lunar</p>

      <h1>Descubra sua Constelação e seu Signo Lunar</h1>

      <p>
        Responda ao quiz oficial para descobrir qual Constelação guia sua alma
        dentro do Projeto Lunar. Depois, escolha a frase que mais combina com você
        para revelar seu Signo Lunar.
      </p>

      <button id="iniciarQuizLunarBtn" class="btn btn-gradient">
        Começar
      </button>
    </div>
  `;

  document.getElementById("iniciarQuizLunarBtn").onclick = () => {
    indicePergunta = 0;
    pontuacaoConstelacao = {};
    grupoFinal = "";

    renderPerguntaConstelacao();
  };
}

function renderPergunta(pergunta, subtitulo, onResponder) {
  app.innerHTML = `
    <div class="quiz-lunar-card">
      <p class="quiz-lunar-tag">${subtitulo}</p>

      <h1>${pergunta.texto}</h1>

      <div class="quiz-lunar-opcoes">
        ${pergunta.opcoes.map((opcao) => `
          <button
            class="quiz-lunar-opcao"
            type="button"
            data-valor="${opcao.valor}"
          >
            ${opcao.texto}
          </button>
        `).join("")}
      </div>
    </div>
  `;

  document
    .querySelectorAll("[data-valor]")
    .forEach((botao) => {
      botao.onclick = () => onResponder(botao.dataset.valor);
    });
}

function renderPerguntaConstelacao() {
  const pergunta = perguntasConstelacao[indicePergunta];

  renderPergunta(
    pergunta,
    `Etapa 1 de 2 · Pergunta ${indicePergunta + 1} de ${perguntasConstelacao.length}`,
    (valor) => {
      somarPontuacao(valor);
      indicePergunta++;

      if (indicePergunta < perguntasConstelacao.length) {
        renderPerguntaConstelacao();
        return;
      }

      grupoFinal = maiorPontuacao(pontuacaoConstelacao);
      renderTransicaoSigno();
    }
  );
}

function renderTransicaoSigno() {
  const grupo = grupos[grupoFinal];

  app.innerHTML = `
    <div class="quiz-lunar-card">
      <p class="quiz-lunar-tag">Sua Constelação Principal</p>

      <h1>${grupo.nome}</h1>

      <p>${grupo.chamada}</p>

      <button id="continuarSignoBtn" class="btn btn-gradient">
        Descobrir meu Signo Lunar
      </button>
    </div>
  `;

  document.getElementById("continuarSignoBtn").onclick = renderPerguntaSigno;
}

function renderPerguntaSigno() {
  const pergunta = perguntasSigno[grupoFinal];

  renderPergunta(
    pergunta,
    `Etapa 2 de 2 · Signos ${grupos[grupoFinal].nome}`,
    renderResultado
  );
}

function renderListaCompatibilidades(titulo, itens) {
  return `
    <div class="quiz-lunar-compat-card">
      <h3>${titulo}</h3>

      <ul>
        ${itens.map((item) => `<li>${item}</li>`).join("")}
      </ul>
    </div>
  `;
}

function renderResultado(signoFinal) {
  const grupo = grupos[grupoFinal];
  const signo = grupo.signos[signoFinal];

  app.innerHTML = `
    <div class="quiz-lunar-card">
      <p class="quiz-lunar-tag">Resultado Lunar</p>

      <h1>${signo.nome}</h1>

      <p>
        Constelação: <b>${grupo.nome}</b>
      </p>

      <p><b>${signo.subtitulo}</b></p>

      <p>${signo.descricao}</p>

      <div class="quiz-lunar-compat">
        ${renderListaCompatibilidades("Compatibilidade do signo", signo.compatibilidade)}
        ${renderListaCompatibilidades("Melhores combinações do Oráculo", compatibilidadesOraculo.melhores)}
        ${renderListaCompatibilidades("Combinações únicas", compatibilidadesOraculo.unicas)}
        ${renderListaCompatibilidades("Não combinam", compatibilidadesOraculo.naoCombinam)}
      </div>

      <div class="quiz-lunar-actions">
        <button id="refazerQuizBtn" class="btn btn-gradient">
          Refazer quiz
        </button>

        <a href="/horoscopo.html" class="btn">
          Ver Horóscopo
        </a>
      </div>
    </div>
  `;

  document.getElementById("refazerQuizBtn").onclick = renderInicio;
}

renderInicio();
