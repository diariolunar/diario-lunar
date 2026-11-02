import crypto from "node:crypto";
import { AsyncLocalStorage } from "node:async_hooks";

const PROJECT_ID = "diario-lunar-dee91";
const PROJECT_NUMBER = "817640390152";
const WORKLOAD_POOL = "vercel";
const WORKLOAD_PROVIDER = "vercel";
const SERVICE_ACCOUNT =
  "firebase-adminsdk-fbsvc@diario-lunar-dee91.iam.gserviceaccount.com";
const FIRESTORE_BASE =
  `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents`;

const oidcContext = new AsyncLocalStorage();
const tokenCache = new Map();

function base64Url(valor) {
  return Buffer.from(valor)
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function carregarContaServico() {
  const conteudo = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  if (!conteudo) {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON não configurado.");
  }

  return JSON.parse(conteudo);
}

export function executarComOidc(oidcToken, callback) {
  return oidcContext.run(oidcToken || "", callback);
}

async function trocarOidcPorAccessToken(oidcToken) {
  if (!oidcToken) {
    throw new Error("Token OIDC da Vercel não recebido.");
  }

  const audience =
    `//iam.googleapis.com/projects/${PROJECT_NUMBER}/locations/global/` +
    `workloadIdentityPools/${WORKLOAD_POOL}/providers/${WORKLOAD_PROVIDER}`;
  const respostaSts = await fetch("https://sts.googleapis.com/v1/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      audience,
      grant_type: "urn:ietf:params:oauth:grant-type:token-exchange",
      requested_token_type: "urn:ietf:params:oauth:token-type:access_token",
      scope: "https://www.googleapis.com/auth/cloud-platform",
      subject_token_type: "urn:ietf:params:oauth:token-type:jwt",
      subject_token: oidcToken
    })
  });

  if (!respostaSts.ok) {
    throw new Error(
      `Falha na federação OIDC: ${respostaSts.status} ${await respostaSts.text()}`
    );
  }

  const tokenFederado = await respostaSts.json();
  const respostaIam = await fetch(
    "https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/" +
      encodeURIComponent(SERVICE_ACCOUNT) +
      ":generateAccessToken",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${tokenFederado.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        scope: [
          "https://www.googleapis.com/auth/datastore",
          "https://www.googleapis.com/auth/firebase.messaging"
        ],
        lifetime: "3600s"
      })
    }
  );

  if (!respostaIam.ok) {
    throw new Error(
      `Falha ao assumir conta de serviço: ${respostaIam.status} ${await respostaIam.text()}`
    );
  }

  const dados = await respostaIam.json();

  return {
    token: dados.accessToken,
    expiraEm: new Date(dados.expireTime).getTime()
  };
}

export async function obterAccessToken() {
  const contaJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const oidcToken = oidcContext.getStore() || "";
  const cacheKey = contaJson
    ? "service-account"
    : crypto.createHash("sha256").update(oidcToken).digest("hex");
  const cache = tokenCache.get(cacheKey);

  if (cache?.token && cache.expiraEm > Date.now() + 60_000) {
    return cache.token;
  }

  if (!contaJson) {
    const federado = await trocarOidcPorAccessToken(oidcToken);
    tokenCache.set(cacheKey, federado);
    return federado.token;
  }

  const conta = carregarContaServico();
  const agora = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64Url(JSON.stringify({
    iss: conta.client_email,
    sub: conta.client_email,
    aud: "https://oauth2.googleapis.com/token",
    scope: [
      "https://www.googleapis.com/auth/datastore",
      "https://www.googleapis.com/auth/firebase.messaging"
    ].join(" "),
    iat: agora,
    exp: agora + 3600
  }));
  const unsigned = `${header}.${payload}`;
  const assinatura = crypto
    .sign("RSA-SHA256", Buffer.from(unsigned), conta.private_key)
    .toString("base64url");
  const resposta = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${assinatura}`
    })
  });

  if (!resposta.ok) {
    throw new Error(`Falha na autenticação do Firebase: ${resposta.status}`);
  }

  const dados = await resposta.json();
  tokenCache.set(cacheKey, {
    token: dados.access_token,
    expiraEm: Date.now() + Number(dados.expires_in || 3600) * 1000
  });

  return dados.access_token;
}

function decodificarValor(campo) {
  if (!campo) return null;
  if ("stringValue" in campo) return campo.stringValue;
  if ("booleanValue" in campo) return campo.booleanValue;
  if ("integerValue" in campo) return Number(campo.integerValue);
  if ("doubleValue" in campo) return Number(campo.doubleValue);
  if ("timestampValue" in campo) return campo.timestampValue;
  if ("nullValue" in campo) return null;
  if (campo.arrayValue) {
    return (campo.arrayValue.values || []).map(decodificarValor);
  }
  if (campo.mapValue) {
    return decodificarCampos(campo.mapValue.fields || {});
  }
  return null;
}

function decodificarCampos(campos = {}) {
  return Object.fromEntries(
    Object.entries(campos).map(([chave, valor]) => [
      chave,
      decodificarValor(valor)
    ])
  );
}

function codificarValor(valor) {
  if (valor === null || valor === undefined) return { nullValue: null };
  if (valor instanceof Date) return { timestampValue: valor.toISOString() };
  if (Array.isArray(valor)) {
    return { arrayValue: { values: valor.map(codificarValor) } };
  }

  if (typeof valor === "boolean") return { booleanValue: valor };
  if (typeof valor === "number") {
    return Number.isInteger(valor)
      ? { integerValue: String(valor) }
      : { doubleValue: valor };
  }
  if (typeof valor === "object") {
    return { mapValue: { fields: codificarCampos(valor) } };
  }

  return { stringValue: String(valor) };
}

function codificarCampos(campos = {}) {
  return Object.fromEntries(
    Object.entries(campos).map(([chave, valor]) => [
      chave,
      codificarValor(valor)
    ])
  );
}

async function requisicaoFirestore(caminho, opcoes = {}) {
  const accessToken = await obterAccessToken();
  const resposta = await fetch(`${FIRESTORE_BASE}${caminho}`, {
    ...opcoes,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(opcoes.headers || {})
    }
  });

  return resposta;
}

export async function obterDocumento(colecao, id) {
  const resposta = await requisicaoFirestore(
    `/${encodeURIComponent(colecao)}/${encodeURIComponent(id)}`
  );

  if (resposta.status === 404) return null;
  if (!resposta.ok) {
    throw new Error(`Erro ao buscar ${colecao}/${id}: ${resposta.status}`);
  }

  const documento = await resposta.json();

  return {
    id: documento.name.split("/").pop(),
    ...decodificarCampos(documento.fields || {})
  };
}

export async function listarColecao(colecao) {
  const documentos = [];
  let pageToken = "";

  do {
    const query = new URLSearchParams({ pageSize: "300" });
    if (pageToken) query.set("pageToken", pageToken);

    const resposta = await requisicaoFirestore(
      `/${encodeURIComponent(colecao)}?${query}`
    );

    if (!resposta.ok) {
      throw new Error(`Erro ao listar ${colecao}: ${resposta.status}`);
    }

    const pagina = await resposta.json();
    (pagina.documents || []).forEach((documento) => {
      documentos.push({
        id: documento.name.split("/").pop(),
        ...decodificarCampos(documento.fields || {})
      });
    });
    pageToken = pagina.nextPageToken || "";
  } while (pageToken);

  return documentos;
}

export async function salvarDocumento(colecao, id, campos) {
  const mascara = new URLSearchParams();
  Object.keys(campos).forEach((campo) => {
    mascara.append("updateMask.fieldPaths", campo);
  });

  const resposta = await requisicaoFirestore(
    `/${encodeURIComponent(colecao)}/${encodeURIComponent(id)}?${mascara}`,
    {
      method: "PATCH",
      body: JSON.stringify({ fields: codificarCampos(campos) })
    }
  );

  if (!resposta.ok) {
    throw new Error(`Erro ao salvar ${colecao}/${id}: ${resposta.status}`);
  }

  return resposta.json();
}

export async function criarDocumento(colecao, campos) {
  const resposta = await requisicaoFirestore(
    `/${encodeURIComponent(colecao)}`,
    {
      method: "POST",
      body: JSON.stringify({ fields: codificarCampos(campos) })
    }
  );

  if (!resposta.ok) {
    throw new Error(`Erro ao criar documento em ${colecao}: ${resposta.status}`);
  }

  return resposta.json();
}

export async function criarDocumentoComId(colecao, id, campos) {
  const query = new URLSearchParams({ documentId: id });
  const resposta = await requisicaoFirestore(
    `/${encodeURIComponent(colecao)}?${query}`,
    {
      method: "POST",
      body: JSON.stringify({ fields: codificarCampos(campos) })
    }
  );

  if (resposta.status === 409) return null;
  if (!resposta.ok) {
    throw new Error(`Erro ao criar ${colecao}/${id}: ${resposta.status}`);
  }

  return resposta.json();
}

export async function enviarMensagemFcm(token, mensagem) {
  const accessToken = await obterAccessToken();
  const resposta = await fetch(
    `https://fcm.googleapis.com/v1/projects/${PROJECT_ID}/messages:send`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: {
          token,
          notification: {
            title: mensagem.titulo,
            body: mensagem.corpo
          },
          data: mensagem.dados,
          android: {
            priority: "high",
            notification: {
              channel_id: "materias_publicadas",
              sound: "default"
            }
          }
        }
      })
    }
  );

  const corpo = await resposta.text();

  if (!resposta.ok) {
    const erro = new Error(`FCM ${resposta.status}: ${corpo}`);
    erro.status = resposta.status;
    erro.corpo = corpo;
    throw erro;
  }

  return JSON.parse(corpo);
}

export { PROJECT_ID };
