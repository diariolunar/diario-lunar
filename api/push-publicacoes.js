import crypto from "node:crypto";

import {
  criarDocumento,
  criarDocumentoComId,
  enviarMensagemFcm,
  executarComOidc,
  listarColecao,
  obterDocumento,
  salvarDocumento
} from "../lib/firebaseAdmin.js";

const FIREBASE_API_KEY = "AIzaSyAHtrL1LEtpnKZ9QdGl2ehveCOZLWM94VE";
const SITE_URL = "https://diario-lunar.vercel.app";
const GITHUB_OIDC_ISSUER = "https://token.actions.githubusercontent.com";
const GITHUB_OIDC_AUDIENCE = "diario-lunar-agendamentos";

let githubJwksCache = null;

function decodificarJwtParte(parte) {
  return JSON.parse(Buffer.from(parte, "base64url").toString("utf8"));
}

async function autenticarCronGitHub(token) {
  if (!token) return false;

  const partes = token.split(".");
  if (partes.length !== 3) return false;

  try {
    const header = decodificarJwtParte(partes[0]);
    const payload = decodificarJwtParte(partes[1]);
    const agora = Math.floor(Date.now() / 1000);

    if (
      payload.iss !== GITHUB_OIDC_ISSUER ||
      payload.aud !== GITHUB_OIDC_AUDIENCE ||
      payload.repository !== "diariolunar/diario-lunar" ||
      payload.ref !== "refs/heads/main" ||
      payload.exp <= agora ||
      payload.iat > agora + 60
    ) {
      return false;
    }

    if (!githubJwksCache || githubJwksCache.expiraEm <= Date.now()) {
      const resposta = await fetch(
        GITHUB_OIDC_ISSUER + "/.well-known/jwks"
      );

      if (!resposta.ok) return false;

      githubJwksCache = {
        chaves: (await resposta.json()).keys || [],
        expiraEm: Date.now() + 60 * 60_000
      };
    }

    const jwk = githubJwksCache.chaves.find((item) => item.kid === header.kid);
    if (!jwk) return false;

    const chave = crypto.createPublicKey({ key: jwk, format: "jwk" });

    return crypto.verify(
      "RSA-SHA256",
      Buffer.from(partes[0] + "." + partes[1]),
      chave,
      Buffer.from(partes[2], "base64url")
    );
  } catch (error) {
    console.error("Token OIDC do GitHub inválido:", error);
    return false;
  }
}

function extrairBearer(req) {
  const cabecalho = String(req.headers.authorization || "");
  return cabecalho.startsWith("Bearer ") ? cabecalho.slice(7) : "";
}

async function autenticarAdmin(idToken) {
  const resposta = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken })
    }
  );

  if (!resposta.ok) return null;

  const dados = await resposta.json();
  const uid = dados.users?.[0]?.localId;

  if (!uid) return null;

  const admin = await obterDocumento("admins", uid);

  if (!admin || admin.ativo === false) return null;

  return admin;
}

function dataEmMs(valor) {
  const timestamp = new Date(valor || 0).getTime();
  return Number.isNaN(timestamp) ? 0 : timestamp;
}

function postEstaPublico(post) {
  if (post.status === "publicado") return true;

  return (
    post.status === "agendado" &&
    dataEmMs(post.data) > 0 &&
    dataEmMs(post.data) <= Date.now()
  );
}

async function registrarToken(admin, token, plataforma = "android") {
  if (!token || token.length < 40) {
    throw new Error("Token de notificação inválido.");
  }

  const id = crypto.createHash("sha256").update(token).digest("hex");

  await salvarDocumento("pushTokens", id, {
    token,
    adminId: admin.id,
    plataforma,
    ativo: true,
    atualizadoEm: new Date()
  });

  return { registrado: true };
}

async function reservarNotificacao(postId) {
  const registro = await criarDocumentoComId("notificationDispatches", postId, {
    status: "processando",
    atualizadoEm: new Date()
  });

  return Boolean(registro);
}

async function enviarNotificacaoPost(post) {
  if (!postEstaPublico(post)) {
    return { ignorado: "nao_publicado" };
  }

  if (!await reservarNotificacao(post.id)) {
    return { ignorado: "ja_enviado" };
  }

  const [admins, tokens] = await Promise.all([
    listarColecao("admins"),
    listarColecao("pushTokens")
  ]);
  const destinatarios = new Set(
    admins
      .filter((admin) => (
        admin.ativo !== false &&
        admin.notificacoesPublicacao === true
      ))
      .map((admin) => admin.id)
  );
  const tokensValidos = tokens.filter((item) => (
    item.ativo !== false &&
    item.token &&
    destinatarios.has(item.adminId)
  ));
  let enviados = 0;

  for (const item of tokensValidos) {
    try {
      await enviarMensagemFcm(item.token, {
        titulo: "Nova matéria no Diário Lunar",
        corpo: post.titulo || "Uma nova matéria foi publicada.",
        dados: {
          tipo: "materia_publicada",
          postId: post.id,
          url: `${SITE_URL}/post.html?id=${encodeURIComponent(post.id)}`
        }
      });
      enviados += 1;
    } catch (error) {
      const tokenInvalido =
        error.status === 404 ||
        error.corpo?.includes("UNREGISTERED");

      if (tokenInvalido) {
        await salvarDocumento("pushTokens", item.id, {
          ativo: false,
          atualizadoEm: new Date()
        });
        continue;
      }

      console.error("Erro ao enviar push:", error);
    }
  }

  await salvarDocumento("notificationDispatches", post.id, {
    status: "enviado",
    enviados,
    titulo: post.titulo || "",
    atualizadoEm: new Date()
  });

  return { enviados };
}

async function processarAgendamentos() {
  const posts = await listarColecao("posts");
  const vencidos = posts.filter((post) => (
    post.status === "agendado" &&
    dataEmMs(post.data) > 0 &&
    dataEmMs(post.data) <= Date.now()
  ));
  const resultados = [];

  for (const post of vencidos) {
    await salvarDocumento("posts", post.id, {
      status: "publicado",
      atualizadoEm: new Date()
    });
    await criarDocumento("historicoPosts", {
      postId: post.id,
      acao: "Publicação automática de agendamento vencido",
      usuario: "sistema",
      nomeUsuario: "Sistema de agendamentos",
      statusAnterior: "agendado",
      statusNovo: "publicado",
      data: new Date()
    });

    resultados.push({
      postId: post.id,
      ...(await enviarNotificacaoPost({
        ...post,
        status: "publicado"
      }))
    });
  }

  return resultados;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Método não permitido." });
  }

  const oidcToken = String(req.headers["x-vercel-oidc-token"] || "");
  let chamadaCron = false;

  return executarComOidc(oidcToken, async () => {
    try {
      const bearer = extrairBearer(req);
      const acao = req.body?.action || "";
      chamadaCron = await autenticarCronGitHub(bearer);

      if (acao === "processScheduled") {
        if (!chamadaCron) {
          return res.status(401).json({ error: "Não autorizado." });
        }

        const resultados = await processarAgendamentos();
        return res.status(200).json({
          processados: resultados.length,
          resultados
        });
      }

      const admin = await autenticarAdmin(bearer);

      if (!admin) {
        return res.status(401).json({ error: "Sessão administrativa inválida." });
      }

      if (acao === "registerToken") {
        const resultado = await registrarToken(
          admin,
          String(req.body?.token || ""),
          String(req.body?.platform || "android")
        );
        return res.status(200).json(resultado);
      }

      if (acao === "notifyPost") {
        const postId = String(req.body?.postId || "");
        const post = await obterDocumento("posts", postId);

        if (!post) {
          return res.status(404).json({ error: "Matéria não encontrada." });
        }

        const resultado = await enviarNotificacaoPost(post);
        return res.status(200).json(resultado);
      }

      return res.status(400).json({ error: "Ação inválida." });
    } catch (error) {
      console.error("Erro no serviço de notificações:", error);
      const identidadeVercel = chamadaCron && oidcToken
        ? decodificarJwtParte(oidcToken.split(".")[1])
        : null;
      return res.status(500).json({
        error: "Não foi possível processar as notificações.",
        ...(chamadaCron ? {
          detalhe: error.message,
          identidadeVercel: identidadeVercel && {
            iss: identidadeVercel.iss,
            aud: identidadeVercel.aud,
            sub: identidadeVercel.sub
          }
        } : {})
      });
    }
  });
}
