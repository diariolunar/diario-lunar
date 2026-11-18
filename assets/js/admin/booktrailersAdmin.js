import { db } from "../config/firebase.js";
import { addDoc, collection, deleteDoc, doc, getDoc, getDocs, updateDoc } from "https://www.gstatic.com/firebasejs/12.12.1/firebase-firestore.js";
import { uploadArquivo } from "../utils/upload.js";

let bannerArquivo = null;
let bannerUrl = "";
function escapar(valor) { return String(valor || "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;"); }
function dataInput(data) { try { return (data?.toDate ? data.toDate() : new Date(data)).toISOString().slice(0, 10); } catch { return ""; } }
function linkYoutubeValido(url) { try { const host = new URL(url).hostname.replace(/^www\./, ""); return host === "youtube.com" || host === "m.youtube.com" || host === "youtu.be"; } catch { return false; } }

export async function buscarBooktrailer(id) { const snap = await getDoc(doc(db, "booktrailers", id)); return snap.exists() ? { id: snap.id, ...snap.data() } : null; }

function iniciarFormulario(atual, onFinalizar) {
  const input = document.getElementById("bannerBooktrailerInput");
  document.getElementById("uploadBannerBooktrailer").onclick = () => input.click();
  input.onchange = () => { bannerArquivo = input.files[0] || null; if (bannerArquivo) { document.getElementById("previewBannerBooktrailer").src = URL.createObjectURL(bannerArquivo); document.getElementById("previewBannerBooktrailer").hidden = false; } };
  const salvar = async (status) => {
    const titulo = document.getElementById("tituloBooktrailer").value.trim();
    const descricao = document.getElementById("descricaoBooktrailer").value.trim();
    const youtubeUrl = document.getElementById("youtubeBooktrailer").value.trim();
    if (!titulo || (status === "publicado" && (!descricao || (!bannerUrl && !bannerArquivo) || !linkYoutubeValido(youtubeUrl)))) { alert("Preencha título, descrição, banner e um link válido do YouTube para publicar."); return; }
    if (bannerArquivo) bannerUrl = await uploadArquivo(bannerArquivo, "banners-booktrailers");
    const dados = { titulo, descricao, youtubeUrl, banner: bannerUrl, status, data: new Date(document.getElementById("dataBooktrailer").value + "T12:00:00"), atualizadoEm: new Date() };
    if (atual?.id) await updateDoc(doc(db, "booktrailers", atual.id), dados); else await addDoc(collection(db, "booktrailers"), { ...dados, criadoEm: new Date() });
    alert(status === "publicado" ? "BookTrailer publicado!" : "BookTrailer salvo como rascunho!"); await onFinalizar();
  };
  document.getElementById("salvarRascunhoBooktrailer").onclick = () => salvar("rascunho");
  document.getElementById("publicarBooktrailer").onclick = () => salvar("publicado");
  document.getElementById("cancelarBooktrailer").onclick = onFinalizar;
}

export async function renderFormularioBooktrailer(atual = null, onFinalizar) {
  bannerArquivo = null; bannerUrl = atual?.banner || ""; setTimeout(() => iniciarFormulario(atual, onFinalizar), 0);
  return `<div class="admin-card"><div class="admin-header-flex"><div><h1>${atual ? "Editar" : "Novo"} BookTrailer</h1><p>Cadastre um banner horizontal e o vídeo do YouTube.</p></div><div class="editor-actions-top"><button class="btn" id="cancelarBooktrailer">Cancelar</button><button class="btn" id="salvarRascunhoBooktrailer">Salvar Rascunho</button><button class="btn btn-gradient" id="publicarBooktrailer">Publicar</button></div></div>
    <div class="form-grid"><div class="form-group"><label>Título</label><input id="tituloBooktrailer" value="${escapar(atual?.titulo)}"></div><div class="form-group"><label>Data</label><input id="dataBooktrailer" type="date" value="${dataInput(atual?.data || new Date())}"></div></div>
    <div class="form-group"><label>Descrição</label><textarea id="descricaoBooktrailer" class="admin-textarea">${escapar(atual?.descricao)}</textarea></div>
    <div class="form-group"><label>Link do vídeo no YouTube</label><input id="youtubeBooktrailer" type="url" placeholder="https://www.youtube.com/watch?v=..." value="${escapar(atual?.youtubeUrl)}"></div>
    <div class="form-group"><label>Banner do BookTrailer (1 de altura por 3 de largura)</label><input id="bannerBooktrailerInput" type="file" accept="image/*" hidden><div id="uploadBannerBooktrailer" class="upload-box">Clique para enviar o banner</div><img id="previewBannerBooktrailer" class="preview-capa booktrailer-admin-preview" src="${escapar(bannerUrl)}" ${bannerUrl ? "" : "hidden"}></div></div>`;
}

export async function renderListarBooktrailers(onEditar, onReload) {
  const snap = await getDocs(collection(db, "booktrailers"));
  const lista = snap.docs.map((item) => ({ id: item.id, ...item.data() }));
  setTimeout(() => {
    document.querySelectorAll("[data-editar-booktrailer]").forEach((botao) => botao.onclick = async () => onEditar(await buscarBooktrailer(botao.dataset.editarBooktrailer)));
    document.querySelectorAll("[data-status-booktrailer]").forEach((botao) => botao.onclick = async () => {
      const item = lista.find((registro) => registro.id === botao.dataset.statusBooktrailer);
      const novoStatus = botao.dataset.novoStatus;
      if (novoStatus === "publicado" && (!item?.titulo || !item?.descricao || !item?.banner || !linkYoutubeValido(item?.youtubeUrl))) {
        alert("Complete título, descrição, banner e link do YouTube antes de publicar.");
        return;
      }
      await updateDoc(doc(db, "booktrailers", botao.dataset.statusBooktrailer), { status: novoStatus, atualizadoEm: new Date() });
      await onReload();
    });
    document.querySelectorAll("[data-excluir-booktrailer]").forEach((botao) => botao.onclick = async () => {
      if (await window.confirmarModal({ titulo: "Excluir BookTrailer", mensagem: "Deseja excluir este BookTrailer?", textoConfirmar: "Excluir" })) {
        await deleteDoc(doc(db, "booktrailers", botao.dataset.excluirBooktrailer));
        await onReload();
      }
    });
  }, 0);
  return `<div class="admin-card"><h1>BookTrailers</h1><p>Gerencie vídeos publicados e em rascunho.</p><div class="materias-admin-grid">${lista.length ? lista.map((item) => `<div class="materia-card-admin"><img src="${escapar(item.banner || "/assets/images/footer.png")}"><div class="materia-admin-info"><small>${item.status === "publicado" ? "Publicado" : "Rascunho"}</small><h3>${escapar(item.titulo || "Sem título")}</h3><p>${escapar(item.descricao || "")}</p></div><div class="materia-admin-actions"><button class="btn-editar" data-editar-booktrailer="${item.id}">Editar</button><button class="btn-editar" data-status-booktrailer="${item.id}" data-novo-status="${item.status === "publicado" ? "rascunho" : "publicado"}">${item.status === "publicado" ? "Despublicar" : "Publicar"}</button><button class="btn-excluir" data-excluir-booktrailer="${item.id}">Excluir</button></div></div>`).join("") : "<p>Nenhum BookTrailer cadastrado.</p>"}</div></div>`;
}
