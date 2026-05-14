export function salvarSessao(usuario) {

  localStorage.setItem(
    "diarioLunarUser",
    JSON.stringify(usuario)
  );
}

export function pegarSessao() {

  const usuario =
    localStorage.getItem("diarioLunarUser");

  if (!usuario) {
    return null;
  }

  try {
    return JSON.parse(usuario);
  } catch {
    return null;
  }
}

export function limparSessao() {

  localStorage.removeItem(
    "diarioLunarUser"
  );
}

export function estaLogado() {

  return !!pegarSessao();
}
