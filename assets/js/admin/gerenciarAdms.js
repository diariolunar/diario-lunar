import {
  listarAdmins,
  atualizarAdmin,
  excluirAdmin
} from "../services/adminsService.js";

function badgeStatus(adm) {
  if (adm.ativo === false) {
    return `<span class="status-rascunho">Inativo</span>`;
  }

  return `<span class="status-publicado">Ativo</span>`;
}

function badgeReporter(adm) {
  if (adm.reporter === false) {
    return `<span class="status-rascunho">Interno</span>`;
  }

  return `<span class="status-publicado">Repórter</span>`;
}

function getPermissao(adm, nome) {
  return adm.permissoes?.[nome] === true;
}

function removerModalAdm() {
  const modalAntigo = document.getElementById("modalEditarAdm");

  if (modalAntigo) {
    modalAntigo.remove();
  }
}

function criarLinhaAdm(adm, usuarioAtual) {
  const bloqueiaSuperadmin =
    adm.role === "superadmin" &&
    usuarioAtual.id !== adm.id &&
    usuarioAtual.role !== "superadmin";

  return `
    <div class="adm-card-admin">

      <img
        src="${adm.fotoUrl || "/assets/images/logo-vertical.png"}"
      >

      <div class="adm-admin-info">

        <h3>${adm.nome || "Sem nome"}</h3>

        <p>@${adm.user || "sem_user"}</p>

        <p>${adm.email || "Sem e-mail"}</p>

        <p>
          ${adm.cargo || "Sem cargo"}
          ${adm.nomenclatura ? ` · ${adm.nomenclatura}` : ""}
        </p>

        <div class="materia-admin-meta">
          ${badgeStatus(adm)}
          ${badgeReporter(adm)}

          <span class="status-rascunho">
            ${adm.role || "admin"}
          </span>
        </div>

      </div>

      <div class="adm-admin-actions">

        <button
          data-editar-adm="${adm.id}"
          class="btn-editar"
          ${bloqueiaSuperadmin ? "disabled" : ""}
        >
          Editar
        </button>

        <button
          data-toggle-ativo="${adm.id}"
          class="btn-editar"
          ${bloqueiaSuperadmin ? "disabled" : ""}
        >
          ${adm.ativo === false ? "Ativar" : "Desativar"}
        </button>

        <button
          data-excluir-adm="${adm.id}"
          class="btn-excluir"
          ${bloqueiaSuperadmin ? "disabled" : ""}
        >
          Excluir
        </button>

      </div>

    </div>
  `;
}

function renderModalEditarAdm(adm, usuarioAtual) {
  const podeMudarRole =
    usuarioAtual.role === "superadmin";

  return `
    <div class="modal-admin-content">

      <div class="admin-header-flex">

        <div>
          <h2>Editar ADM</h2>

          <p>
            Atualize dados públicos, status e permissões.
          </p>
        </div>

        <button
          id="fecharModalAdm"
          class="btn"
        >
          Fechar
        </button>

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Nome</label>

          <input
            id="editAdmNome"
            type="text"
            value="${adm.nome || ""}"
          >
        </div>

        <div class="form-group">
          <label>User</label>

          <input
            id="editAdmUser"
            type="text"
            value="${adm.user || ""}"
          >
        </div>

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>E-mail</label>

          <input
            id="editAdmEmail"
            type="email"
            value="${adm.email || ""}"
            disabled
          >

          <small>
            Alteração do e-mail de login será feita depois com Cloud Function.
          </small>
        </div>

        <div class="form-group">
          <label>Senha</label>

          <input
            id="editAdmSenha"
            type="password"
            placeholder="Alteração de senha será feita depois"
            disabled
          >

          <small>
            Alterar senha de outro usuário precisa de backend seguro.
          </small>
        </div>

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Cargo</label>

          <input
            id="editAdmCargo"
            type="text"
            value="${adm.cargo || ""}"
          >
        </div>

        <div class="form-group">
          <label>Nomenclatura</label>

          <input
            id="editAdmNomenclatura"
            type="text"
            value="${adm.nomenclatura || ""}"
          >
        </div>

      </div>

      <div class="form-group">

        <label>Bio pública</label>

        <textarea
          id="editAdmBio"
          class="admin-textarea"
          placeholder="Bio pública do repórter..."
        >${adm.bio || ""}</textarea>

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Instagram</label>

          <input
            id="editAdmInstagram"
            type="text"
            value="${adm.redes?.instagram || ""}"
          >
        </div>

        <div class="form-group">
          <label>Wattpad</label>

          <input
            id="editAdmWattpad"
            type="text"
            value="${adm.redes?.wattpad || ""}"
          >
        </div>

      </div>

      <div class="form-group">

        <label>Site ou link pessoal</label>

        <input
          id="editAdmSite"
          type="text"
          value="${adm.redes?.site || ""}"
        >

      </div>

      <div class="form-grid">

        <div class="form-group">
          <label>Nível de acesso</label>

          <select
            id="editAdmRole"
            ${podeMudarRole ? "" : "disabled"}
          >
            <option
              value="admin"
              ${adm.role !== "superadmin" ? "selected" : ""}
            >
              Admin
            </option>

            <option
              value="superadmin"
              ${adm.role === "superadmin" ? "selected" : ""}
            >
              Superadmin
            </option>
          </select>
        </div>

        <div class="form-group">
          <label>Status</label>

          <div class="permissions-grid">

            <label>
              <input
                id="editAdmAtivo"
                type="checkbox"
                ${adm.ativo === false ? "" : "checked"}
              >
              Usuário ativo
            </label>

            <label>
              <input
                id="editAdmReporter"
                type="checkbox"
                ${adm.reporter === false ? "" : "checked"}
              >
              É repórter
            </label>

          </div>
        </div>

      </div>

      <div class="form-group">

        <label>Permissões sobre matérias</label>

        <div class="permissions-grid">

          <label>
            <input
              id="editPermPublicar"
              type="checkbox"
              ${getPermissao(adm, "publicar") ? "checked" : ""}
            >
            Criar matéria
          </label>

          <label>
            <input
              id="editPermEditar"
              type="checkbox"
              ${getPermissao(adm, "editar") ? "checked" : ""}
            >
            Editar matéria
          </label>

          <label>
            <input
              id="editPermExcluir"
              type="checkbox"
              ${getPermissao(adm, "excluir") ? "checked" : ""}
            >
            Excluir matéria
          </label>

          <label>
            <input
              id="editPermRevisar"
              type="checkbox"
              ${getPermissao(adm, "revisar") ? "checked" : ""}
            >
            Revisar/Aprovar matéria
          </label>

        </div>

      </div>

      <div class="form-group">

        <label>Permissões sobre comentários e sistema</label>

        <div class="permissions-grid">

          <label>
            <input
              id="editPermModerarComentarios"
              type="checkbox"
              ${getPermissao(adm, "moderarComentarios") ? "checked" : ""}
            >
            Moderar comentários
          </label>

          <label>
            <input
              id="editPermGerenciarAdmins"
              type="checkbox"
              ${getPermissao(adm, "gerenciarAdmins") ? "checked" : ""}
            >
            Gerenciar ADMs
          </label>

        </div>

      </div>

      <button
        id="salvarEdicaoAdmBtn"
        class="btn btn-gradient"
      >
        Salvar alterações
      </button>

    </div>
  `;
}

async function abrirModalEditarAdm(id, usuarioAtual, onReload) {
  removerModalAdm();

  const admins = await listarAdmins();
  const adm = admins.find((item) => item.id === id);

  if (!adm) {
    alert("ADM não encontrado.");
    return;
  }

  const modal = document.createElement("div");
  modal.id = "modalEditarAdm";
  modal.className = "modal-admin active";
  modal.innerHTML = renderModalEditarAdm(adm, usuarioAtual);

  document.body.appendChild(modal);

  document.body.style.overflow = "hidden";

  function fecharModal() {
    modal.remove();
    document.body.style.overflow = "";
  }

  document.getElementById("fecharModalAdm").onclick = fecharModal;

  modal.onclick = (event) => {
    if (event.target === modal) {
      fecharModal();
    }
  };

  document.getElementById("salvarEdicaoAdmBtn").onclick = async () => {
    const nome = document.getElementById("editAdmNome").value.trim();
    const user = document.getElementById("editAdmUser").value.trim();
    const cargo = document.getElementById("editAdmCargo").value.trim();
    const nomenclatura = document.getElementById("editAdmNomenclatura").value.trim();
    const bio = document.getElementById("editAdmBio").value.trim();
    const instagram = document.getElementById("editAdmInstagram").value.trim();
    const wattpad = document.getElementById("editAdmWattpad").value.trim();
    const site = document.getElementById("editAdmSite").value.trim();
    const role = document.getElementById("editAdmRole").value;
    const ativo = document.getElementById("editAdmAtivo").checked;
    const reporter = document.getElementById("editAdmReporter").checked;

    if (!nome || !user || !cargo) {
      alert("Nome, user e cargo são obrigatórios.");
      return;
    }

    const dadosAtualizados = {
      nome,
      user,
      cargo,
      nomenclatura,
      bio,
      redes: {
        instagram,
        wattpad,
        site
      },
      ativo,
      reporter,
      permissoes: {
        publicar: document.getElementById("editPermPublicar").checked,
        editar: document.getElementById("editPermEditar").checked,
        excluir: document.getElementById("editPermExcluir").checked,
        revisar: document.getElementById("editPermRevisar").checked,
        moderarComentarios: document.getElementById("editPermModerarComentarios").checked,
        gerenciarAdmins: document.getElementById("editPermGerenciarAdmins").checked
      }
    };

    if (usuarioAtual.role === "superadmin") {
      dadosAtualizados.role = role;
    }

    await atualizarAdmin(id, dadosAtualizados);

    alert("ADM atualizado com sucesso.");

    fecharModal();

    await onReload();
  };
}

async function ativarAcoes(usuarioAtual, onReload) {
  document
    .querySelectorAll("[data-editar-adm]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.editarAdm;

        await abrirModalEditarAdm(
          id,
          usuarioAtual,
          onReload
        );
      };
    });

  document
    .querySelectorAll("[data-toggle-ativo]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.toggleAtivo;
        const admins = await listarAdmins();
        const adm = admins.find((item) => item.id === id);

        if (!adm) return;

        await atualizarAdmin(id, {
          ativo: adm.ativo === false
        });

        await onReload();
      };
    });

  document
    .querySelectorAll("[data-excluir-adm]")
    .forEach((botao) => {
      botao.onclick = async () => {
        const id = botao.dataset.excluirAdm;

        if (id === usuarioAtual.id) {
          alert("Você não pode excluir seu próprio usuário.");
          return;
        }

        const confirmar =
          confirm("Deseja excluir este ADM da lista administrativa?");

        if (!confirmar) return;

        await excluirAdmin(id);

        alert("ADM removido da lista administrativa.");

        await onReload();
      };
    });
}

export async function renderGerenciarAdms(
  usuarioAtual,
  onReload
) {
  removerModalAdm();

  const admins = await listarAdmins();

  admins.sort((a, b) =>
    (a.nome || "").localeCompare(b.nome || "")
  );

  setTimeout(() => {
    ativarAcoes(usuarioAtual, onReload);
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">

        <div>
          <h1>Gerenciar ADMs</h1>

          <p>
            Controle usuários, cargos, status e permissões da equipe.
          </p>
        </div>

      </div>

      <div class="materias-admin-grid">

        ${
          admins.length
            ? admins
              .map((adm) => criarLinhaAdm(adm, usuarioAtual))
              .join("")
            : `
              <p>
                Nenhum ADM cadastrado.
              </p>
            `
        }

      </div>

    </div>
  `;
}
