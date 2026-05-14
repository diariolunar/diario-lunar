import {
  auth
}
from "../../config/firebase.js";

import {
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

export async function alterarSenha({
  senhaAtual,
  novaSenha
}) {

  try {

    const usuario =
      auth.currentUser;

    if (!usuario) {
      throw new Error(
        "Usuário não autenticado."
      );
    }

    const credencial =
      EmailAuthProvider.credential(
        usuario.email,
        senhaAtual
      );

    await reauthenticateWithCredential(
      usuario,
      credencial
    );

    await updatePassword(
      usuario,
      novaSenha
    );

    return {
      sucesso: true
    };

  } catch (error) {

    console.error(error);

    return {
      sucesso: false,
      mensagem:
        "Não foi possível alterar a senha."
    };
  }
}
