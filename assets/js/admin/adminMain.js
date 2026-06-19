import { renderSidebar } from "./sidebar.js";
import { renderDashboard } from "./dashboard.js";
import { renderNovaMateria } from "./novaMateria.js";
import { renderListarMaterias } from "./listarMaterias.js";
import { renderCadastrarAdm } from "./cadastrarAdm.js";
import { renderGerenciarAdms } from "./gerenciarAdms.js";
import { renderComentariosAdmin } from "./comentariosAdmin.js";
import { renderRevisarMateria } from "./revisarMateria.js";
import { renderEditarPerfil } from "./profile/editarPerfil.js";
import { renderOraculoAdmin } from "./oraculoAdmin.js";
import { renderOtimizarImagens } from "./otimizarImagens.js";
import { renderRelatoriosAdmin } from "./relatoriosAdmin.js";
import { instalarModaisGlobais, mostrarModal } from "../utils/modal.js";

import {
  renderFormularioAudiobook,
  renderListarAudiobooks
} from "./audiobooksAdmin.js";

import {
  buscarPost,
  contarPostsPorStatus,
  excluirPost,
  publicarAgendadosVencidos
} from "../services/postsService.js";

import {
  fazerLogin,
  fazerLogout,
  carregarAdminAtual,
  observarAdminAuth
} from "./auth/login.js";

import {
  limparSessao
} from "./auth/session.js";

import {
  podePublicar,
  podeEditar,
  podeExcluir,
  podeGerenciarAdmins,
  podeRevisar,
  podeModerarComentarios,
  podeEditarOraculo,
  podeAcessarRelatorios
} from "./auth/permissions.js";

const app = document.getElementById("adminApp");

let usuarioAtual = null;
let tipoListaAtual = "todas";
let primeiraSincroniaAuth = true;

instalarModaisGlobais();

function renderCarregandoInicial() {
  app.innerHTML = `
    <section class="admin-login">
      <div class="admin-login-card">
        <img src="/assets/images/logo-vertical.png">
        <p>Carregando sessao...</p>
      </div>
    </section>
  `;
}

function mostrarCarregando(texto = "Carregando...") {
  document.getElementById("adminPage").innerHTML = `
    <div class="admin-card">
      <p>${texto}</p>
    </div>
  `;
}

function mostrarErro(error, contexto = "Erro") {
  console.error(contexto, error);

  document.getElementById("adminPage").innerHTML = `
    <div class="admin-card">
      <h1>Erro ao carregar</h1>

      <p>
        Ocorreu um erro nesta tela. Abra o console do navegador para ver os detalhes.
      </p>

      <pre style="white-space:pre-wrap; background:#f8fafc; padding:15px; border-radius:12px; margin-top:15px;">
${error?.message || error || "Erro desconhecido"}
      </pre>
    </div>
  `;
}

function atualizarUsuarioPainel(novoUsuario) {
  usuarioAtual = novoUsuario;
  renderPainel(usuarioAtual);
}

function atualizarSidebar(usuario) {
  const sidebar = document.querySelector(".admin-sidebar");

  if (!sidebar) return;

  sidebar.outerHTML = renderSidebar(usuario);
  ativarMenu();
  ativarLogout();
}

async function sincronizarUsuarioAtual() {
  const usuario = await carregarAdminAtual();

  if (!usuario) {
    usuarioAtual = null;
    renderLogin();
    return null;
  }

  usuarioAtual = usuario;
  atualizarSidebar(usuario);

  return usuario;
}

function renderLogin() {
  app.innerHTML = `
    <section class="admin-login">
      <div class="admin-login-card">
        <img src="/assets/images/logo-vertical.png">

        <h1>Entrar na Ãrea ADM</h1>

        <p>Digite suas credenciais para acessar.</p>

        <label>E-mail</label>

        <input
          id="loginEmail"
          type="email"
          placeholder="Digite seu e-mail"
        >

        <label>Senha</label>

        <input
          id="loginSenha"
          type="password"
          placeholder="Digite sua senha"
        >

        <button
          id="loginBtn"
          class="btn btn-gradient"
        >
          Entrar
        </button>

        <p
          id="loginErro"
          class="login-erro"
        ></p>
      </div>
    </section>
  `;

  document.getElementById("loginBtn").onclick = async () => {
    const email = document.getElementById("loginEmail").value.trim();
    const senha = document.getElementById("loginSenha").value.trim();

    const resultado = await fazerLogin(email, senha);

    if (!resultado.sucesso) {
      document.getElementById("loginErro").innerText = resultado.mensagem;
      return;
    }

    renderPainel(resultado.usuario);
  };
}

function mostrarSemPermissao() {
  document.getElementById("adminPage").innerHTML = `
    <div class="admin-card">
      <h1>Acesso negado</h1>
      <p>VocÃª nÃ£o tem permissÃ£o para acessar esta Ã¡rea.</p>
    </div>
  `;
}

async function abrirDashboard() {
  try {
    mostrarCarregando("Carregando dashboard...");

    await publicarAgendadosVencidos(usuarioAtual);

    document.getElementById("adminPage").innerHTML =
      await renderDashboard(usuarioAtual);

    await notificarMateriasParaRevisao(usuarioAtual);

  } catch (error) {
    mostrarErro(error, "Erro no dashboard");
  }
}

async function notificarMateriasParaRevisao(usuario) {
  const marcacao = [
    usuario?.cargo,
    usuario?.nomenclatura,
    usuario?.role
  ].join(" ").toLowerCase();
  const editorChefe = marcacao.includes("editor-chefe") || marcacao.includes("editor chefe");

  if (!podeRevisar(usuario) && !editorChefe) return;

  const chave = `notificacao_revisao_${usuario.id || usuario.email || "adm"}`;

  if (sessionStorage.getItem(chave)) return;

  const total = await contarPostsPorStatus("em_revisao");

  if (total <= 0) return;

  sessionStorage.setItem(chave, "true");

  await mostrarModal({
    titulo: "MatÃ©rias aguardando revisÃ£o",
    mensagem: total === 1
      ? "Existe 1 matÃ©ria aguardando revisÃ£o no painel."
      : `Existem ${total} matÃ©rias aguardando revisÃ£o no painel.`,
    textoBotao: "Ver painel"
  });
}

async function abrirNovaMateria(postExistente = null) {
  try {
    if (!postExistente && !podePublicar(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    if (postExistente && !podeEditar(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando editor...");

    const html = await renderNovaMateria(
      usuarioAtual,
      postExistente
    );

    document.getElementById("adminPage").innerHTML = html;

  } catch (error) {
    mostrarErro(error, "Erro ao abrir editor");
  }
}

async function abrirListarMaterias(tipo = "todas") {
  try {
    tipoListaAtual = tipo;

    if (
      !podePublicar(usuarioAtual) &&
      !podeEditar(usuarioAtual) &&
      !podeExcluir(usuarioAtual) &&
      !podeRevisar(usuarioAtual)
    ) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando matÃ©rias...");

    await publicarAgendadosVencidos(usuarioAtual);

    const html = await renderListarMaterias(
      usuarioAtual,
      () => abrirListarMaterias(tipo),
      tipo
    );

    document.getElementById("adminPage").innerHTML = html;

    ativarAcoesMaterias();

  } catch (error) {
    mostrarErro(error, "Erro ao listar matÃ©rias");
  }
}

async function abrirRevisarMateria(postId) {
  try {
    if (!podeRevisar(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando revisÃ£o...");

    const html = await renderRevisarMateria(
      postId,
      usuarioAtual,
      (destino = "revisao") => abrirListarMaterias(destino)
    );

    document.getElementById("adminPage").innerHTML = html;

  } catch (error) {
    mostrarErro(error, "Erro ao abrir revisÃ£o");
  }
}

async function abrirFormularioAudiobook(audiobookAtual = null) {
  try {
    if (!podePublicar(usuarioAtual) && !podeEditar(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando editor de audiobook...");

    document.getElementById("adminPage").innerHTML =
      await renderFormularioAudiobook(
        audiobookAtual,
        abrirListaAudiobooks
      );

  } catch (error) {
    mostrarErro(error, "Erro ao abrir formulÃ¡rio de audiobook");
  }
}

async function abrirListaAudiobooks() {
  try {
    if (
      !podePublicar(usuarioAtual) &&
      !podeEditar(usuarioAtual) &&
      !podeExcluir(usuarioAtual)
    ) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando audiobooks...");

    document.getElementById("adminPage").innerHTML =
      await renderListarAudiobooks(
        abrirFormularioAudiobook,
        abrirListaAudiobooks
      );

  } catch (error) {
    mostrarErro(error, "Erro ao listar audiobooks");
  }
}

async function abrirComentarios() {
  try {
    if (!podeModerarComentarios(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando comentÃ¡rios...");

    document.getElementById("adminPage").innerHTML =
      await renderComentariosAdmin(abrirComentarios);

  } catch (error) {
    mostrarErro(error, "Erro nos comentÃ¡rios");
  }
}

async function abrirOraculoLunar() {
  try {
    if (!podeEditarOraculo(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando OrÃ¡culo Lunar...");

    document.getElementById("adminPage").innerHTML =
      await renderOraculoAdmin(abrirOraculoLunar);

  } catch (error) {
    mostrarErro(error, "Erro no OrÃ¡culo Lunar");
  }
}

async function abrirRelatorios() {
  try {
    if (!podeAcessarRelatorios(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando relatórios...");

    document.getElementById("adminPage").innerHTML =
      await renderRelatoriosAdmin();

  } catch (error) {
    mostrarErro(error, "Erro nos relatórios");
  }
}

function abrirCadastrarAdm() {
  try {
    if (!podeGerenciarAdmins(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    document.getElementById("adminPage").innerHTML =
      renderCadastrarAdm(async () => {
        await abrirGerenciarAdms();
      });

  } catch (error) {
    mostrarErro(error, "Erro ao cadastrar ADM");
  }
}

async function abrirGerenciarAdms() {
  try {
    if (!podeGerenciarAdmins(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando ADMs...");

    document.getElementById("adminPage").innerHTML =
      await renderGerenciarAdms(
        usuarioAtual,
        abrirGerenciarAdms
      );

  } catch (error) {
    mostrarErro(error, "Erro ao gerenciar ADMs");
  }
}

function abrirEditarPerfil() {
  try {
    document.getElementById("adminPage").innerHTML =
      renderEditarPerfil(
        usuarioAtual,
        atualizarUsuarioPainel
      );

  } catch (error) {
    mostrarErro(error, "Erro ao editar perfil");
  }
}

function abrirOtimizarImagens() {
  try {
    if (!podeGerenciarAdmins(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    document.getElementById("adminPage").innerHTML =
      renderOtimizarImagens();

  } catch (error) {
    mostrarErro(error, "Erro ao abrir otimizador de imagens");
  }
}

async function ativarAcoesMaterias() {
  document
    .querySelectorAll("[data-editar]")
    .forEach((botao) => {
      botao.onclick = async () => {
        try {
          if (!podeEditar(usuarioAtual)) {
            mostrarSemPermissao();
            return;
          }

          const id = botao.dataset.editar;
          const post = await buscarPost(id);

          if (!post) {
            alert("MatÃ©ria nÃ£o encontrada.");
            return;
          }

          await abrirNovaMateria(post);

        } catch (error) {
          mostrarErro(error, "Erro ao editar matÃ©ria");
        }
      };
    });

  document
    .querySelectorAll("[data-revisar]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.revisar;
        await abrirRevisarMateria(id);
      };
    });

  document
    .querySelectorAll("[data-excluir]")
    .forEach((botao) => {
      botao.onclick = async () => {
        try {
          if (!podeExcluir(usuarioAtual)) {
            mostrarSemPermissao();
            return;
          }

          const id = botao.dataset.excluir;

          const confirmar = await window.confirmarModal({
                titulo: "Excluir matéria",
                mensagem: "Deseja realmente excluir esta matéria?",
                textoConfirmar: "Excluir"
              });

          if (!confirmar) return;

          await excluirPost(id);

          alert("MatÃ©ria excluÃ­da com sucesso.");

          await abrirListarMaterias(tipoListaAtual);

        } catch (error) {
          mostrarErro(error, "Erro ao excluir matÃ©ria");
        }
      };
    });
}

async function abrirPagina(pagina) {
  if (pagina === "dashboard") {
    await abrirDashboard();
    return;
  }

  if (pagina === "novaMateria") {
    await abrirNovaMateria();
    return;
  }

  if (pagina === "materiasPublicadas") {
    await abrirListarMaterias("publicadas");
    return;
  }

  if (pagina === "materiasPublicas") {
    await abrirListarMaterias("publicadas");
    return;
  }

  if (pagina === "materiasRascunho") {
    await abrirListarMaterias("rascunhos");
    return;
  }

  if (pagina === "materiasRevisar") {
    await abrirListarMaterias("revisao");
    return;
  }

  if (pagina === "listarMaterias") {
    await abrirListarMaterias("todas");
    return;
  }

  if (pagina === "novoAudiobook") {
    await abrirFormularioAudiobook();
    return;
  }

  if (pagina === "listarAudiobooks") {
    await abrirListaAudiobooks();
    return;
  }

  if (pagina === "comentarios") {
    await abrirComentarios();
    return;
  }

  if (pagina === "oraculoLunar") {
    await abrirOraculoLunar();
    return;
  }

  if (pagina === "relatorios") {
    await abrirRelatorios();
    return;
  }

  if (pagina === "cadastrarAdm") {
    abrirCadastrarAdm();
    return;
  }

  if (pagina === "gerenciarAdms") {
    await abrirGerenciarAdms();
    return;
  }

  if (pagina === "otimizarImagens") {
    abrirOtimizarImagens();
    return;
  }

  if (pagina === "editarPerfil") {
    abrirEditarPerfil();
    return;
  }
}

function ativarMenu() {
  document
    .querySelectorAll("[data-page]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const usuario = await sincronizarUsuarioAtual();

        if (!usuario) return;

        const pagina = botao.dataset.page;
        await abrirPagina(pagina);
      };
    });
}

function ativarLogout() {
  document.getElementById("logoutBtn").onclick = async () => {
    await fazerLogout();

    limparSessao();

    usuarioAtual = null;

    renderLogin();
  };
}

function renderPainel(usuario) {
  usuarioAtual = usuario;

  app.innerHTML = `
    <div class="admin-layout">

      ${renderSidebar(usuario)}

      <main class="admin-content">
        <div id="adminPage"></div>
      </main>

    </div>
  `;

  ativarMenu();
  ativarLogout();
  abrirDashboard();
}

renderCarregandoInicial();

observarAdminAuth((usuario) => {
  if (usuario) {
    renderPainel(usuario);
    primeiraSincroniaAuth = false;
    return;
  }

  if (primeiraSincroniaAuth || usuarioAtual) {
    primeiraSincroniaAuth = false;
    usuarioAtual = null;
    renderLogin();
  }
});


