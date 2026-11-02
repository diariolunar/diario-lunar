import { auth } from "../config/firebase.js";

let pushInicializado = false;

async function chamarServico(dados) {
  const usuario = auth.currentUser;

  if (!usuario) {
    throw new Error("Faça login novamente para configurar notificações.");
  }

  const idToken = await usuario.getIdToken();
  const resposta = await fetch("/api/push-publicacoes", {
    method: "POST",
    headers: {
      Authorization: "Bearer " + idToken,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(dados)
  });

  if (!resposta.ok) {
    const corpo = await resposta.json().catch(() => ({}));
    throw new Error(corpo.error || "Erro no serviço de notificações.");
  }

  return resposta.json();
}

export async function notificarPublicacao(postId) {
  if (!postId) return;

  try {
    return await chamarServico({
      action: "notifyPost",
      postId
    });
  } catch (error) {
    console.error("A matéria foi publicada, mas a notificação falhou.", error);
    return null;
  }
}

export async function inicializarPushPublicacoes(usuario) {
  if (
    pushInicializado ||
    usuario?.notificacoesPublicacao !== true ||
    !window.Capacitor?.isNativePlatform?.()
  ) {
    return;
  }

  const push = window.Capacitor?.Plugins?.PushNotifications;

  if (!push) return;

  pushInicializado = true;

  try {
    await push.createChannel({
      id: "materias_publicadas",
      name: "Matérias publicadas",
      description: "Avisos quando uma nova matéria for publicada.",
      importance: 5,
      visibility: 1,
      vibration: true
    });

    let permissao = await push.checkPermissions();

    if (permissao.receive === "prompt") {
      permissao = await push.requestPermissions();
    }

    if (permissao.receive !== "granted") {
      pushInicializado = false;
      return;
    }

    await push.addListener("registration", async ({ value }) => {
      try {
        await chamarServico({
          action: "registerToken",
          token: value,
          platform: "android"
        });
      } catch (error) {
        console.error("Erro ao registrar celular para notificações.", error);
      }
    });

    await push.addListener("registrationError", (error) => {
      console.error("Erro no registro de notificações.", error);
    });

    await push.addListener("pushNotificationReceived", (notificacao) => {
      const titulo = notificacao.title || "Diário Lunar";
      const corpo = notificacao.body || "Uma nova matéria foi publicada.";
      alert(titulo + "\n\n" + corpo);
    });

    await push.addListener("pushNotificationActionPerformed", ({ notification }) => {
      const url = notification?.data?.url;

      if (url) {
        window.location.href = url;
      }
    });

    await push.register();
  } catch (error) {
    pushInicializado = false;
    console.error("Não foi possível ativar as notificações.", error);
  }
}
