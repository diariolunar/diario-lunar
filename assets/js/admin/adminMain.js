import { renderSidebar } from "./sidebar.js";
import { renderDashboard } from "./dashboard.js";
import { renderNovaMateria } from "./novaMateria.js";
import { renderListarMaterias } from "./listarMaterias.js";
import { renderCadastrarAdm } from "./cadastrarAdm.js";
import { renderGerenciarAdms } from "./gerenciarAdms.js";
import { renderComentariosAdmin } from "./comentariosAdmin.js";
import { renderRevisarMateria } from "./revisarMateria.js";
import { renderEditarPerfil } from "./profile/editarPerfil.js";

import {
  buscarPost,
  excluirPost,
  publicarAgendadosVencidos
} from "../services/postsService.js";

import {
  fazerLogin,
  fazerLogout
} from "./auth/login.js";

import {
  pegarSessao,
  limparSessao
} from "./auth/session.js";

import {
  podePublicar,
  podeEditar,
  podeExcluir,
  podeGerenciarAdmins,
  podeRevisar,
  podeModerarComentarios
} from "./auth/permissions.js";

const app = document.getElementById("adminApp");

let usuarioAtual = null;
let tipoListaAtual = "todas";

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

function renderLogin() {
  app.innerHTML = `
    <section class="admin-login">
      <div class="admin-login-card">
        <img src="/assets/images/logo-vertical.png">

        <h1>Entrar na Área ADM</h1>

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
      <p>Você não tem permissão para acessar esta área.</p>
    </div>
  `;
}

async function abrirDashboard() {
  try {
    mostrarCarregando("Carregando dashboard...");

    await publicarAgendadosVencidos(usuarioAtual);

    document.getElementById("adminPage").innerHTML =
      await renderDashboard(usuarioAtual);

  } catch (error) {
    mostrarErro(error, "Erro no dashboard");
  }
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

    mostrarCarregando("Carregando matérias...");

    await publicarAgendadosVencidos(usuarioAtual);

    const html = await renderListarMaterias(
      usuarioAtual,
      () => abrirListarMaterias(tipo),
      tipo
    );

    document.getElementById("adminPage").innerHTML = html;

    ativarAcoesMaterias();

  } catch (error) {
    mostrarErro(error, "Erro ao listar matérias");
  }
}

async function abrirRevisarMateria(postId) {
  try {
    if (!podeRevisar(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando revisão...");

    const html = await renderRevisarMateria(
      postId,
      usuarioAtual,
      (destino = "revisao") => abrirListarMaterias(destino)
    );

    document.getElementById("adminPage").innerHTML = html;

  } catch (error) {
    mostrarErro(error, "Erro ao abrir revisão");
  }
}

async function abrirComentarios() {
  try {
    if (!podeModerarComentarios(usuarioAtual)) {
      mostrarSemPermissao();
      return;
    }

    mostrarCarregando("Carregando comentários...");

    document.getElementById("adminPage").innerHTML =
      await renderComentariosAdmin(abrirComentarios);

  } catch (error) {
    mostrarErro(error, "Erro nos comentários");
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
            alert("Matéria não encontrada.");
            return;
          }

          await abrirNovaMateria(post);

        } catch (error) {
          mostrarErro(error, "Erro ao editar matéria");
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

          const confirmar = confirm(
            "Deseja realmente excluir esta matéria?"
          );

          if (!confirmar) return;

          await excluirPost(id);

          alert("Matéria excluída com sucesso.");

          await abrirListarMaterias(tipoListaAtual);

        } catch (error) {
          mostrarErro(error, "Erro ao excluir matéria");
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

  if (pagina === "comentarios") {
    await abrirComentarios();
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

const sessao = pegarSessao();

if (sessao) {
  renderPainel(sessao);
} else {
  renderLogin();
}