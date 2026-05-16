import {
  podePublicar,
  podeEditar,
  podeExcluir,
  podeRevisar,
  podeModerarComentarios,
  podeGerenciarAdmins
} from "./auth/permissions.js";

export function renderSidebar(usuario = {}) {
  return `
    <aside class="admin-sidebar">

      <a href="/index.html" class="admin-voltar">
        ← Voltar ao site
      </a>

      <div class="admin-logo">
        <img src="/assets/images/logo-diario-lunar2.png">
      </div>

      <div class="admin-user">
        <img src="${usuario.fotoUrl || "/assets/images/logo-vertical.png"}">

        <h3>${usuario.nome || "Administrador"}</h3>

        <p>@${usuario.user || "admin"}</p>

        <span>
          ${usuario.cargo || "Equipe Lunar"}
        </span>
      </div>

      <div class="admin-menu">

        <button data-page="dashboard">
          Painel
        </button>

        ${
          podePublicar(usuario) || podeEditar(usuario) || podeExcluir(usuario) || podeRevisar(usuario)
            ? `
              <button type="button" onclick="this.nextElementSibling.classList.toggle('submenu-open')">
                Matérias ▾
              </button>

              <div class="admin-submenu">
                ${
                  podePublicar(usuario)
                    ? `<button data-page="novaMateria">Nova Matéria</button>`
                    : ""
                }

                <button data-page="materiasPublicadas">
                  Matérias Publicadas
                </button>

                <button data-page="materiasRascunho">
                  Matérias em Rascunho
                </button>

                ${
                  podeRevisar(usuario)
                    ? `
                      <button data-page="materiasRevisar">
                        Matérias a Revisar
                      </button>
                    `
                    : ""
                }
              </div>
            `
            : ""
        }

        ${
          podePublicar(usuario) || podeEditar(usuario) || podeExcluir(usuario)
            ? `
              <button type="button" onclick="this.nextElementSibling.classList.toggle('submenu-open')">
                Audiobooks ▾
              </button>

              <div class="admin-submenu">
                <button data-page="novoAudiobook">
                  Novo Audiobook
                </button>

                <button data-page="listarAudiobooks">
                  Listar Audiobooks
                </button>
              </div>
            `
            : ""
        }

        ${
          podeModerarComentarios(usuario)
            ? `
              <button data-page="comentarios">
                Comentários
              </button>
            `
            : ""
        }

        <button data-page="editarPerfil">
          Editar Perfil
        </button>

        ${
          podeGerenciarAdmins(usuario)
            ? `
              <button data-page="cadastrarAdm">
                Cadastrar ADM
              </button>

              <button data-page="gerenciarAdms">
                Gerenciar ADMs
              </button>
            `
            : ""
        }

        <button id="logoutBtn">
          Sair
        </button>

      </div>

    </aside>
  `;
}
