import {
  atualizarAdmin
} from "../../services/adminsService.js";

import {
  salvarSessao
} from "../auth/session.js";

import {
  uploadFotoPerfil
} from "./uploadPerfil.js";

import {
  alterarSenha
} from "./alterarSenha.js";

let novaFotoArquivo = null;

function iniciarUploadFoto(usuario) {
  const input = document.getElementById("perfilFotoInput");
  const box = document.getElementById("perfilUploadBox");
  const preview = document.getElementById("perfilPreviewFoto");

  box.onclick = () => {
    input.click();
  };

  input.onchange = () => {
    const arquivo = input.files[0];

    if (!arquivo) return;

    novaFotoArquivo = arquivo;

    preview.src = URL.createObjectURL(arquivo);
    preview.style.display = "block";
    box.innerText = "Nova foto selecionada.";
  };
}

function iniciarSalvarPerfil(usuario, onAtualizarUsuario) {
  const botao = document.getElementById("salvarPerfilBtn");

  botao.onclick = async () => {
    const nome = document.getElementById("perfilNome").value.trim();
    const user = document.getElementById("perfilUser").value.trim();
    const cargo = document.getElementById("perfilCargo").value.trim();
    const nomenclatura = document.getElementById("perfilNomenclatura").value.trim();
    const bio = document.getElementById("perfilBio").value.trim();
    const instagram = document.getElementById("perfilInstagram").value.trim();
    const wattpad = document.getElementById("perfilWattpad").value.trim();
    const site = document.getElementById("perfilSite").value.trim();

    if (!nome || !user || !cargo) {
      alert("Preencha os campos obrigatórios.");
      return;
    }

    botao.disabled = true;
    botao.innerText = "Salvando...";

    try {
      let fotoUrl = usuario.fotoUrl || "";

      if (novaFotoArquivo) {
        fotoUrl = await uploadFotoPerfil(novaFotoArquivo);
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
        fotoUrl
      };

      await atualizarAdmin(usuario.id, dadosAtualizados);

      const novoUsuario = {
        ...usuario,
        ...dadosAtualizados
      };

      salvarSessao(novoUsuario);

      if (onAtualizarUsuario) {
        onAtualizarUsuario(novoUsuario);
      }

      alert("Perfil atualizado com sucesso!");

    } catch (error) {
      console.error(error);
      alert("Erro ao atualizar perfil.");
    }

    botao.disabled = false;
    botao.innerText = "Salvar alterações";
  };
}

function iniciarAlterarSenha() {
  const botao = document.getElementById("alterarSenhaBtn");

  botao.onclick = async () => {
    const senhaAtual = document.getElementById("senhaAtual").value.trim();
    const novaSenha = document.getElementById("novaSenha").value.trim();

    if (!senhaAtual || !novaSenha) {
      alert("Preencha as senhas.");
      return;
    }

    if (novaSenha.length < 6) {
      alert("A nova senha precisa ter pelo menos 6 caracteres.");
      return;
    }

    botao.disabled = true;
    botao.innerText = "Alterando...";

    const resultado = await alterarSenha({
      senhaAtual,
      novaSenha
    });

    if (!resultado.sucesso) {
      alert(resultado.mensagem);
    } else {
      document.getElementById("senhaAtual").value = "";
      document.getElementById("novaSenha").value = "";

      alert("Senha alterada com sucesso!");
    }

    botao.disabled = false;
    botao.innerText = "Alterar senha";
  };
}

export function renderEditarPerfil(usuario, onAtualizarUsuario) {
  setTimeout(() => {
    iniciarUploadFoto(usuario);
    iniciarSalvarPerfil(usuario, onAtualizarUsuario);
    iniciarAlterarSenha();
  }, 50);

  return `
    <div class="admin-card">

      <div class="admin-header-flex">
        <div>
          <h1>Editar Perfil</h1>

          <p>
            Atualize suas informações administrativas e públicas.
          </p>
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Nome</label>

          <input
            id="perfilNome"
            type="text"
            value="${usuario.nome || ""}"
          >
        </div>

        <div class="form-group">
          <label>User</label>

          <input
            id="perfilUser"
            type="text"
            value="${usuario.user || ""}"
          >
        </div>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Cargo</label>

          <input
            id="perfilCargo"
            type="text"
            value="${usuario.cargo || ""}"
          >
        </div>

        <div class="form-group">
          <label>Nomenclatura</label>

          <input
            id="perfilNomenclatura"
            type="text"
            value="${usuario.nomenclatura || ""}"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Bio pública</label>

        <textarea
          id="perfilBio"
          class="admin-textarea"
          placeholder="Escreva uma breve bio para aparecer na página pública do autor..."
        >${usuario.bio || ""}</textarea>
      </div>

      <div class="form-grid">
        <div class="form-group">
          <label>Instagram</label>

          <input
            id="perfilInstagram"
            type="text"
            placeholder="https://instagram.com/seuuser"
            value="${usuario.redes?.instagram || ""}"
          >
        </div>

        <div class="form-group">
          <label>Wattpad</label>

          <input
            id="perfilWattpad"
            type="text"
            placeholder="https://wattpad.com/user/seuuser"
            value="${usuario.redes?.wattpad || ""}"
          >
        </div>
      </div>

      <div class="form-group">
        <label>Site ou link pessoal</label>

        <input
          id="perfilSite"
          type="text"
          placeholder="https://..."
          value="${usuario.redes?.site || ""}"
        >
      </div>

      <div class="form-group">
        <label>Foto de perfil</label>

        <input
          id="perfilFotoInput"
          type="file"
          accept="image/*"
          style="display:none;"
        >

        <div id="perfilUploadBox" class="upload-box">
          Clique para alterar foto
        </div>

        <img
          id="perfilPreviewFoto"
          class="preview-perfil-admin"
          src="${usuario.fotoUrl || "/assets/images/logo-vertical.png"}"
        >
      </div>

      <button id="salvarPerfilBtn" class="btn btn-gradient">
        Salvar alterações
      </button>

      <hr style="margin:35px 0;">

      <h2>Alterar senha</h2>

      <div class="form-grid">
        <div class="form-group">
          <label>Senha atual</label>

          <input
            id="senhaAtual"
            type="password"
          >
        </div>

        <div class="form-group">
          <label>Nova senha</label>

          <input
            id="novaSenha"
            type="password"
          >
        </div>
      </div>

      <button id="alterarSenhaBtn" class="btn">
        Alterar senha
      </button>

    </div>
  `;
}
