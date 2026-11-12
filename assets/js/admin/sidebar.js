import {
  podePublicar,
  podeEditar,
  podeExcluir,
  podeRevisar,
  podeModerarComentarios,
  podeGerenciarAdmins,
  podeAcessarRelatorios
} from "./auth/permissions.js";

function linkMenu(pagina, texto) {
  return `
    <a href="/admin.html?pagina=${encodeURIComponent(pagina)}" data-page="${pagina}">
      ${texto}
    </a>
  `;
}

export function renderSidebar(usuario = {}) {
  return `
    <aside class="admin-sidebar">
      <button
        type="button"
        class="admin-menu-toggle"
        aria-expanded="false"
        aria-controls="adminSidebarBody"
      >
        <i class="fa-solid fa-bars" aria-hidden="true"></i>
        <span>Menu do painel</span>
      </button>

      <div class="admin-sidebar-body" id="adminSidebarBody">
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

        ${linkMenu("dashboard", "Painel")}

        ${
          podePublicar(usuario) || podeEditar(usuario) || podeExcluir(usuario) || podeRevisar(usuario)
            ? `
              <button type="button" onclick="this.nextElementSibling.classList.toggle('submenu-open')">
                Matérias ▾
              </button>

              <div class="admin-submenu">
                ${
                  podePublicar(usuario)
                    ? linkMenu("novaMateria", "Nova Matéria")
                    : ""
                }

                ${linkMenu("materiasPublicadas", "Matérias Publicadas")}

                ${linkMenu("materiasRascunho", "Matérias em Rascunho")}

                ${
                  podeRevisar(usuario)
                    ? `
                      ${linkMenu("materiasRevisar", "Matérias a Revisar")}
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
                ${linkMenu("novoAudiobook", "Novo Audiobook")}

                ${linkMenu("listarAudiobooks", "Listar Audiobooks")}
              </div>
            `
            : ""
        }

        ${
          podeModerarComentarios(usuario)
            ? `
              ${linkMenu("comentarios", "Comentários")}
            `
            : ""
        }

        ${
          podeAcessarRelatorios(usuario)
            ? `
              ${linkMenu("relatorios", "Relatórios")}
            `
            : ""
        }

        ${linkMenu("editarPerfil", "Editar Perfil")}

        ${
          podeGerenciarAdmins(usuario)
            ? `
              ${linkMenu("cadastrarAdm", "Cadastrar ADM")}

              ${linkMenu("gerenciarAdms", "Gerenciar ADMs")}
            `
            : ""
        }

        <button id="logoutBtn">
          Sair
        </button>

        </div>
      </div>

    </aside>
  `;
}
