import { renderNavbar } from "../components/navbar.js";
import { renderFooter } from "../components/footer.js";

import {
  enviarSugestaoPauta
} from "../services/contatoService.js";

document.getElementById("navbar").innerHTML = renderNavbar();
document.getElementById("footer").innerHTML = renderFooter();

document.getElementById("enviarContatoBtn").onclick = async () => {
  const nome = document.getElementById("nomeContato").value.trim();
  const contato = document.getElementById("contatoContato").value.trim();
  const assunto = document.getElementById("assuntoContato").value.trim();
  const mensagem = document.getElementById("mensagemContato").value.trim();

  if (!nome || !contato || !assunto || !mensagem) {
    alert("Preencha todos os campos.");
    return;
  }

  const botao = document.getElementById("enviarContatoBtn");

  botao.disabled = true;
  botao.innerText = "Enviando...";

  try {
    await enviarSugestaoPauta({
      nome,
      contato,
      assunto,
      mensagem
    });

    alert("Sugestão enviada com sucesso!");

    document.getElementById("nomeContato").value = "";
    document.getElementById("contatoContato").value = "";
    document.getElementById("assuntoContato").value = "";
    document.getElementById("mensagemContato").value = "";

  } catch (error) {
    console.error(error);
    alert("Erro ao enviar sugestão.");
  }

  botao.disabled = false;
  botao.innerText = "Enviar sugestão";
};
