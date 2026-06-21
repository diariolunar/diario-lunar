import { db } from "../config/firebase.js";

import {
  collection,
  getCountFromServer,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

let dadosRelatorio = {
  posts: [],
  comentarios: 0,
  curtidas: 0
};

function paraData(valor) {
  if (!valor) return null;

  if (valor instanceof Date) {
    return Number.isNaN(valor.getTime()) ? null : valor;
  }

  if (typeof valor.toDate === "function") {
    return valor.toDate();
  }

  const data = new Date(valor);
  return Number.isNaN(data.getTime()) ? null : data;
}

function dataReferenciaPost(post) {
  return paraData(post.data) ||
    paraData(post.atualizadoEm) ||
    paraData(post.criadoEm);
}

function estaNoPeriodo(data, inicio, fim) {
  if (!data) return false;
  if (inicio && data < inicio) return false;
  if (fim && data > fim) return false;
  return true;
}

function lerPeriodo() {
  const inicioValor = document.getElementById("relatorioDataInicio")?.value || "";
  const fimValor = document.getElementById("relatorioDataFim")?.value || "";

  return {
    inicioValor,
    fimValor,
    inicio: inicioValor ? new Date(`${inicioValor}T00:00:00`) : null,
    fim: fimValor ? new Date(`${fimValor}T23:59:59.999`) : null
  };
}

function formatarDataInput(data) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function formatarDataCurta(valor) {
  if (!valor) return "";

  return new Date(`${valor}T12:00:00`).toLocaleDateString("pt-BR");
}

function formatarNumero(valor) {
  return new Intl.NumberFormat("pt-BR").format(valor || 0);
}

function periodoPadrao() {
  const hoje = new Date();
  const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1);

  return {
    inicio: formatarDataInput(primeiroDia),
    fim: formatarDataInput(hoje)
  };
}

function extrairDocumentos(snapshot) {
  return snapshot.docs.map((item) => ({
    id: item.id,
    ...item.data()
  }));
}

function validarPeriodo(periodo) {
  if (periodo.inicio && periodo.fim && periodo.inicio > periodo.fim) {
    throw new Error("A data inicial não pode ser posterior à data final.");
  }
}

function criarConsultaPeriodo(nomeColecao, periodo) {
  const referencia = collection(db, nomeColecao);
  const filtros = [];

  if (periodo.inicio) {
    filtros.push(where("data", ">=", periodo.inicio));
  }

  if (periodo.fim) {
    filtros.push(where("data", "<=", periodo.fim));
  }

  return filtros.length
    ? query(referencia, ...filtros)
    : referencia;
}

async function carregarDados(periodo) {
  const [postsSnap, comentariosSnap, curtidasSnap] = await Promise.all([
    getDocs(criarConsultaPeriodo("posts", periodo)),
    getCountFromServer(criarConsultaPeriodo("comentarios", periodo)),
    getCountFromServer(criarConsultaPeriodo("likes", periodo))
  ]);

  dadosRelatorio = {
    posts: extrairDocumentos(postsSnap),
    comentarios: comentariosSnap.data().count || 0,
    curtidas: curtidasSnap.data().count || 0
  };
}

function calcularMetricas(periodo) {
  validarPeriodo(periodo);

  const posts = dadosRelatorio.posts.filter((post) =>
    estaNoPeriodo(dataReferenciaPost(post), periodo.inicio, periodo.fim)
  );

  const contarStatus = (status) => posts.filter((post) => {
    const statusPost = post.status || "rascunho";
    return statusPost === status;
  }).length;

  return {
    periodo,
    publicadas: contarStatus("publicado"),
    rascunhos: contarStatus("rascunho"),
    revisao: contarStatus("em_revisao"),
    agendadas: contarStatus("agendado"),
    reprovadas: contarStatus("reprovado"),
    visualizacoes: posts.reduce((total, post) => total + Number(post.views || 0), 0),
    curtidas: dadosRelatorio.curtidas,
    comentarios: dadosRelatorio.comentarios
  };
}

function cardMetrica(icone, valor, rotulo) {
  return `
    <div class="metric-card relatorio-metrica">
      <span aria-hidden="true">
        <i class="${icone}"></i>
      </span>
      <h2>${formatarNumero(valor)}</h2>
      <p>${rotulo}</p>
    </div>
  `;
}

async function atualizarMetricas() {
  const grid = document.getElementById("relatorioMetricas");
  const periodoTexto = document.getElementById("relatorioPeriodoTexto");
  const erro = document.getElementById("relatorioErro");
  const botoes = document.querySelectorAll(".relatorio-acoes button");

  try {
    const periodo = lerPeriodo();
    validarPeriodo(periodo);

    botoes.forEach((botao) => {
      botao.disabled = true;
    });
    grid.classList.add("relatorio-carregando");

    await carregarDados(periodo);

    const metricas = calcularMetricas(periodo);

    erro.textContent = "";
    erro.hidden = true;

    const inicio = formatarDataCurta(metricas.periodo.inicioValor);
    const fim = formatarDataCurta(metricas.periodo.fimValor);

    periodoTexto.textContent = inicio && fim
      ? `${inicio} a ${fim}`
      : inicio
        ? `A partir de ${inicio}`
        : fim
          ? `Até ${fim}`
          : "Todo o período";

    grid.innerHTML = [
      cardMetrica("fa-regular fa-newspaper", metricas.publicadas, "Publicadas"),
      cardMetrica("fa-regular fa-file-lines", metricas.rascunhos, "Rascunhos"),
      cardMetrica("fa-solid fa-magnifying-glass", metricas.revisao, "Em revisão"),
      cardMetrica("fa-regular fa-clock", metricas.agendadas, "Agendadas"),
      cardMetrica("fa-solid fa-xmark", metricas.reprovadas, "Reprovadas"),
      cardMetrica("fa-regular fa-eye", metricas.visualizacoes, "Visualizações"),
      cardMetrica("fa-solid fa-heart", metricas.curtidas, "Curtidas"),
      cardMetrica("fa-regular fa-comment", metricas.comentarios, "Comentários")
    ].join("");
  } catch (error) {
    erro.textContent = error.message;
    erro.hidden = false;
  } finally {
    botoes.forEach((botao) => {
      botao.disabled = false;
    });
    grid.classList.remove("relatorio-carregando");
  }
}

function ativarRelatorio() {
  const botaoGerar = document.getElementById("gerarRelatorioBtn");
  const botaoLimpar = document.getElementById("limparRelatorioBtn");

  if (!botaoGerar || !botaoLimpar) return;

  botaoGerar.onclick = async () => {
    await atualizarMetricas();
  };

  botaoLimpar.onclick = async () => {
    document.getElementById("relatorioDataInicio").value = "";
    document.getElementById("relatorioDataFim").value = "";
    await atualizarMetricas();
  };

  atualizarMetricas();
}

export async function renderRelatoriosAdmin() {
  const padrao = periodoPadrao();

  setTimeout(ativarRelatorio, 0);

  return `
    <div class="admin-topo">
      <div>
        <h1>Relatórios</h1>
        <p>Acompanhe os resultados editoriais no período selecionado.</p>
      </div>

      <div class="admin-data relatorio-periodo-atual">
        <i class="fa-regular fa-calendar"></i>
        <span id="relatorioPeriodoTexto"></span>
      </div>
    </div>

    <div class="admin-card relatorio-filtros">
      <div class="relatorio-campos">
        <div class="form-group">
          <label for="relatorioDataInicio">Data inicial</label>
          <input id="relatorioDataInicio" type="date" value="${padrao.inicio}">
        </div>

        <div class="form-group">
          <label for="relatorioDataFim">Data final</label>
          <input id="relatorioDataFim" type="date" value="${padrao.fim}">
        </div>
      </div>

      <div class="relatorio-acoes">
        <button id="gerarRelatorioBtn" class="btn btn-gradient" type="button">
          <i class="fa-solid fa-filter"></i>
          Gerar relatório
        </button>

        <button id="limparRelatorioBtn" class="btn btn-secundario" type="button">
          <i class="fa-solid fa-rotate-left"></i>
          Limpar período
        </button>
      </div>

      <p id="relatorioErro" class="relatorio-erro" hidden></p>
    </div>

    <div id="relatorioMetricas" class="dashboard-grid relatorio-grid">
      <div class="admin-card relatorio-status-carregamento">
        Carregando dados do período...
      </div>
    </div>

    <p class="relatorio-observacao">
      Visualizações correspondem ao total acumulado das matérias incluídas no período.
    </p>
  `;
}
