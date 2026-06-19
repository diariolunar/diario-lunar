import { pegarSessao } from "./session.js";

export function usuarioAtual() {
  return pegarSessao();
}

export function isSuperAdmin(usuario = null) {
  const user = usuario || pegarSessao();

  return user?.role === "superadmin";
}

export function pode(usuario, permissao) {
  if (!usuario) {
    return false;
  }

  if (usuario.role === "superadmin") {
    return true;
  }

  return usuario.permissoes?.[permissao] === true;
}

export function podePublicar(usuario) {
  return pode(usuario, "publicar");
}

export function podePublicarDireto(usuario) {
  return pode(usuario, "publicarDireto") || podeRevisar(usuario);
}

export function podeEditar(usuario) {
  return pode(usuario, "editar");
}

export function podeExcluir(usuario) {
  return pode(usuario, "excluir");
}

export function podeRevisar(usuario) {
  return pode(usuario, "revisar") || isSuperAdmin(usuario);
}

export function podeModerarComentarios(usuario) {
  return pode(usuario, "moderarComentarios") || pode(usuario, "excluir") || isSuperAdmin(usuario);
}

export function podeGerenciarAdmins(usuario) {
  return pode(usuario, "gerenciarAdmins") || isSuperAdmin(usuario);
}

export function podeEditarOraculo(usuario) {
  return pode(usuario, "editarOraculo") || isSuperAdmin(usuario);
}

export function podeAcessarRelatorios(usuario) {
  if (isSuperAdmin(usuario)) {
    return true;
  }

  const identificacao = [
    usuario?.cargo,
    usuario?.nomenclatura,
    usuario?.role
  ].join(" ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return /editor[\s-]+chefe/.test(identificacao);
}
