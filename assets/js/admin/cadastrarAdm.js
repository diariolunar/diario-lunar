import {
  criarAdminAuth
} from "../services/adminsService.js";

import {
  uploadArquivo
} from "../utils/upload.js";

let fotoAdmArquivo = null;
let fotoAdmUrl = "";

function getPermissoes() {
  return {
    publicar: document.getElementById("permPublicar").checked,
    editar: document.getElementById("permEditar").checked,
    excluir: document.getElementById("permExcluir").checked,
    gerenciarAdmins: document.getElementById("permGerenciarAdmins").checked
  };
}

function limparFormulario() {
  document.getElementById("nomeAdm").value = "";
  document.getElementById("emailAdm").value = "";
  document.getElementById("userAdm").value = "";
  document.getElementById("cargoAdm").value = "";
  document.getElementById("nomenclaturaAdm").value = "";
  document.getElementById("senhaAdm").value = "";
  document.getElementById("bioAdm").value = "";
  document.getElementById("instagramAdm").value = "";
  document.getElementById("wattpadAdm").value = "";
  document.getElementById("siteAdm").value = "";
  document.getElementById("previewFotoAdm").style.display = "none";
  document.getElementById("uploadFotoAdmBox").innerText =
    "Clique para enviar foto de perfil";

  fotoAdmArquivo = null;
  fotoAdmUrl = "";
}

function iniciarUploadFoto() {
  const input = document.getElementById("fotoAdmInput");
  const box = document.getElementById("uploadFotoAdmBox");
  const preview = document.getElementById("previewFotoAdm");

  box.onclick = () => {
    input.click();
  };

  input.onchange = () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    fotoAdmArquivo = arquivo;

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";

    box.innerText =
      "Foto selecionada. Ela será enviada ao cadastrar.";
  };
}

function iniciarCadastro(onSuccess) {
  const botao = document.getElementById("cadastrarAdmBtn");

  botao.onclick = async () => {
    const nome = document.getElementById("nomeAdm").value.trim();
    const email = document.getElementById("emailAdm").value.trim();
    const user = document.getElementById("userAdm").value.trim();
    const cargo = document.getElementById("cargoAdm").value.trim();
    const nomenclatura = document.getElementById("nomenclaturaAdm").value.trim();
    const senha = document.getElementById("senhaAdm").value.trim();
    const bio = document.getElementById("bioAdm").value.trim();
    const instagram = document.getElementById("instagramAdm").value.trim();
    const wattpad = document.getElementById("wattpadAdm").value.trim();
    const site = document.getElementById("siteAdm").value.trim();

    const reporter = document.getElementById("reporterAdm").checked;
    const role = document.getElementById("roleAdm").value;
    const ativo = document.getElementById("ativoAdm").checked;

    if (!nome || !email || !user || !cargo || !nomenclatura || !senha) {
      alert("Preencha todos os campos obrigatórios.");
      return;
    }

    if (senha.length < 6) {
      alert("A senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    botao.disabled = true;
    botao.innerText = "Cadastrando...";

    try {
      if (fotoAdmArquivo) {
        fotoAdmUrl = await uploadArquivo(fotoAdmArquivo, "fotos-adms");
      }

      await criarAdminAuth({
        nome,
        email,
        user,
        cargo,
        nomenclatura,
        senha,
        fotoUrl: fotoAdmUrl,
        reporter,
        role,
        ativo,
        bio,
        redes: {
          instagram,
          wattpad,
          site
        },
        permissoes: getPermissoes()
      });

      alert("ADM cadastrado com sucesso!");

      limparFormulario();

      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error(error);

      alert(
        "Erro ao cadastrar ADM. Verifique se o e-mail já não está cadastrado."
      );
    }

    botao.disabled = false;
    botao.innerText = "Cadastrar ADM";
  };
}

export function renderCadastrarAdm(onSuccess) {
  setTimeout(() => {
    iniciarUploadFoto();
    iniciarCadastro(onSuccess);
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>Cadastrar ADM</h1>

          <p>
            Cadastre um novo usuário administrativo
            do Diário Lunar.
          </p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Nome</label>

          <input
            id="nomeAdm"
            type="text"
            placeholder="Nome completo"
          >
        </div>

        <div class="form-group">
          <label>E-mail</label>

          <input
            id="emailAdm"
            type="email"
            placeholder="email@exemplo.com"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>User</label>

          <input
            id="userAdm"
            type="text"
            placeholder="ex: PhynxPride"
          >
        </div>

        <div class="form-group">
          <label>Senha de acesso</label>

          <input
            id="senhaAdm"
            type="password"
            placeholder="Mínimo 6 caracteres"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Cargo</label>

          <input
            id="cargoAdm"
            type="text"
            placeholder="Ex: Repórter, Editor, Revisor"
          >
        </div>

        <div class="form-group">
          <label>Nomenclatura</label>

          <input
            id="nomenclaturaAdm"
            type="text"
            placeholder="Ex: A Voz Lunar, Phynx, Kymae"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Bio pública</label>

        <textarea
          id="bioAdm"
          class="admin-textarea"
          placeholder="Breve descrição pública do repórter/autor..."
        ></textarea>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Instagram</label>

          <input
            id="instagramAdm"
            type="text"
            placeholder="https://instagram.com/seuuser"
          >
        </div>

        <div class="form-group">
          <label>Wattpad</label>

          <input
            id="wattpadAdm"
            type="text"
            placeholder="https://wattpad.com/user/seuuser"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Site ou link pessoal</label>

        <input
          id="siteAdm"
          type="text"
          placeholder="https://..."
        >
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Nível de acesso</label>

          <select id="roleAdm">
            <option value="admin">Admin</option>
            <option value="superadmin">Superadmin</option>
          </select>
        </div>

        <div class="form-group">
          <label>Foto de perfil</label>

          <input
            id="fotoAdmInput"
            type="file"
            accept="image/*"
            style="display:none;"
          >

          <div id="uploadFotoAdmBox" class="upload-box">
            Clique para enviar foto de perfil
          </div>

          <img
            id="previewFotoAdm"
            class="preview-perfil-admin"
            style="display:none;"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Tipo de usuário</label>

        <div class="permissions-grid">
          <label>
            <input id="reporterAdm" type="checkbox" checked>
            É repórter
          </label>

          <label>
            <input id="ativoAdm" type="checkbox" checked>
            Usuário ativo
          </label>
        </div>
      </div>

      <div class="form-group">
        <label>Permissões</label>

        <div class="permissions-grid">
          <label>
            <input id="permPublicar" type="checkbox" checked>
            Publicar matéria
          </label>

          <label>
            <input id="permEditar" type="checkbox" checked>
            Editar matéria
          </label>

          <label>
            <input id="permExcluir" type="checkbox">
            Excluir matéria
          </label>

          <label>
            <input id="permGerenciarAdmins" type="checkbox">
            Gerenciar ADMs
          </label>
        </div>
      </div>

      <button id="cadastrarAdmBtn" class="btn btn-gradient">
        Cadastrar ADM
      </button>

    </div>
  `;
}
