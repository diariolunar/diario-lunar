import { db } from "../config/firebase.js";

import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";

export async function criarPost(dados) {
  return await addDoc(collection(db, "posts"), dados);
}

export async function atualizarPost(id, dados) {
  return await updateDoc(doc(db, "posts", id), dados);
}

export async function buscarPost(id) {
  const snap = await getDoc(doc(db, "posts", id));

  if (!snap.exists()) {
    return null;
  }

  return {
    id: snap.id,
    ...snap.data()
  };
}

export async function listarPosts() {
  const snap = await getDocs(collection(db, "posts"));

  let posts = [];

  snap.forEach((item) => {
    posts.push({
      id: item.id,
      ...item.data()
    });
  });

  return posts;
}

export async function excluirPost(id) {
  return await deleteDoc(doc(db, "posts", id));
}

export async function registrarVisualizacaoPost(id) {
  if (!id) return;

  const chaveView = `view_post_${id}`;

  if (sessionStorage.getItem(chaveView)) {
    return;
  }

  sessionStorage.setItem(chaveView, "true");

  await updateDoc(doc(db, "posts", id), {
    views: increment(1)
  });
}

export async function registrarHistoricoPost({
  postId,
  acao,
  usuario,
  statusAnterior = "",
  statusNovo = "",
  observacao = ""
}) {
  return await addDoc(collection(db, "historicoPosts"), {
    postId,
    acao,
    usuario: usuario?.user || usuario?.email || "admin",
    nomeUsuario: usuario?.nome || "Administrador",
    statusAnterior,
    statusNovo,
    observacao,
    data: new Date()
  });
}

export async function listarHistoricoPost(postId) {
  const snap = await getDocs(collection(db, "historicoPosts"));

  let historico = [];

  snap.forEach((item) => {
    const h = item.data();

    if (h.postId === postId) {
      historico.push({
        id: item.id,
        ...h
      });
    }
  });

  historico.sort((a, b) => {
    const dataA = a.data?.toDate ? a.data.toDate().getTime() : new Date(a.data || 0).getTime();
    const dataB = b.data?.toDate ? b.data.toDate().getTime() : new Date(b.data || 0).getTime();

    return dataB - dataA;
  });

  return historico;
}

export async function publicarAgendadosVencidos(usuario = null) {
  const posts = await listarPosts();
  const agora = Date.now();

  for (const post of posts) {
    if (post.status !== "agendado") continue;

    let dataPost = 0;

    if (post.data?.toDate) {
      dataPost = post.data.toDate().getTime();
    } else if (post.data) {
      dataPost = new Date(post.data).getTime();
    }

    if (dataPost && dataPost <= agora) {
      await atualizarPost(post.id, {
        status: "publicado",
        atualizadoEm: new Date()
      });

      await registrarHistoricoPost({
        postId: post.id,
        acao: "Publicação automática de agendamento vencido",
        usuario,
        statusAnterior: "agendado",
        statusNovo: "publicado"
      });
    }
  }
}
