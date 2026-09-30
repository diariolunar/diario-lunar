import { auth, db }
from "../../config/firebase.js";

import {
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-auth.js";

import {
  doc,
  getDoc
}
from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

import {
  salvarSessao,
  limparSessao
}
from "./session.js";

async function buscarAdminPorUid(uid) {
  const admSnap =
    await getDoc(doc(db, "admins", uid));

  if (!admSnap.exists()) {
    return null;
  }

  const adm = {
    id: uid,
    ...admSnap.data()
  };

  if (adm.ativo === false) {
    return null;
  }

  salvarSessao(adm);

  return adm;
}

export async function carregarAdminAtual() {
  const usuarioAuth = auth.currentUser;

  if (!usuarioAuth) {
    limparSessao();
    return null;
  }

  await usuarioAuth.getIdToken(true);

  const adm = await buscarAdminPorUid(usuarioAuth.uid);

  if (!adm) {
    limparSessao();
    await signOut(auth);
  }

  return adm;
}

export function observarAdminAuth(onChange) {
  return onAuthStateChanged(auth, async (usuarioAuth) => {
    if (!usuarioAuth) {
      limparSessao();
      onChange(null);
      return;
    }

    try {
      const adm = await buscarAdminPorUid(usuarioAuth.uid);

      if (!adm) {
        limparSessao();
        await signOut(auth);
        onChange(null);
        return;
      }

      onChange(adm);

    } catch (error) {
      console.error("Erro ao sincronizar sessao administrativa:", error);
      limparSessao();
      onChange(null);
    }
  });
}

export async function fazerLogin(email, senha) {
  try {
    const credencial =
      await signInWithEmailAndPassword(auth, email, senha);

    const adm = await buscarAdminPorUid(credencial.user.uid);

    if (!adm) {
      await signOut(auth);

      return {
        sucesso: false,
        mensagem: "Usuario sem permissao administrativa."
      };
    }

    return {
      sucesso: true,
      usuario: adm
    };

  } catch {
    return {
      sucesso: false,
      mensagem: "E-mail ou senha invalidos."
    };
  }
}

export async function enviarRecuperacaoSenha(email) {
  const emailNormalizado = String(email || "").trim().toLowerCase();

  if (!emailNormalizado) {
    return {
      sucesso: false,
      mensagem: "Digite seu e-mail para recuperar a senha."
    };
  }

  try {
    await sendPasswordResetEmail(auth, emailNormalizado);

    return {
      sucesso: true,
      mensagem: "Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha."
    };
  } catch (error) {
    if (error?.code === "auth/invalid-email") {
      return {
        sucesso: false,
        mensagem: "Digite um endereço de e-mail válido."
      };
    }

    if (error?.code === "auth/too-many-requests") {
      return {
        sucesso: false,
        mensagem: "Muitas tentativas foram feitas. Aguarde alguns minutos e tente novamente."
      };
    }

    if (error?.code === "auth/network-request-failed") {
      return {
        sucesso: false,
        mensagem: "Não foi possível conectar ao serviço. Verifique sua internet e tente novamente."
      };
    }

    // A resposta genérica evita revelar quais e-mails possuem conta no painel.
    return {
      sucesso: true,
      mensagem: "Se esse e-mail estiver cadastrado, você receberá um link para criar uma nova senha."
    };
  }
}

export async function fazerLogout() {
  limparSessao();
  await signOut(auth);
}
