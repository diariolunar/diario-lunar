import { cadastrarNewsletter } from "../services/newsletterService.js";
import { instalarModaisGlobais } from "../utils/modal.js";

instalarModaisGlobais();

window.salvarNewsletter = async function () {
  const input = document.getElementById("newsletterEmail");

  if (!input) return;

  const email = input.value.trim();

  if (!email) {
    alert("Digite seu e-mail.");
    return;
  }

  if (!email.includes("@")) {
    alert("Digite um e-mail válido.");
    return;
  }

  const resultado = await cadastrarNewsletter(email);

  alert(resultado.mensagem);

  if (resultado.sucesso) {
    input.value = "";
  }
};

export function renderFooter() {
  return `
    <footer class="footer">

      <div>
        <img
          src="/assets/images/logo-diario-lunar2.png"
          style="height:60px; margin-bottom:12px;"
        >

        <p>
          O DiÃ¡rio Lunar Ã© um espaÃ§o dedicado Ã  literatura,
          Ã  comunidade e Ã s histÃ³rias que merecem ser contadas.
        </p>

        <a
          href="https://www.instagram.com/_projeto.lunar?igsh=YWd2enkzMjJmeGxv"
          target="_blank"
        >
          Instagram
        </a>

        <a
          href="https://projetolunar.com.br"
          target="_blank"
        >
          Site Lunar
        </a>

        <a href="mailto:diariolunar47@gmail.com">
          E-mail
        </a>
      </div>

      <div class="newsletter-box">
        <h3>Receba novidades lunares</h3>

        <p>
          Fique por dentro das matÃ©rias,
          destaques e novidades da comunidade.
        </p>

        <input
          id="newsletterEmail"
          type="email"
          placeholder="Seu melhor e-mail"
        >

        <button
          class="btn"
          type="button"
          onclick="window.salvarNewsletter()"
        >
          Inscrever-se
        </button>
      </div>

      <div>
        <h3>Institucional</h3>

        <a href="/sobre.html">
          Sobre o DiÃ¡rio Lunar
        </a>

        <a href="/equipe.html">
          Equipe
        </a>

        <a href="/contato.html">
          SugestÃ£o de pauta
        </a>

        <a href="/privacidade.html">
          PolÃ­tica de Privacidade
        </a>
      </div>

    </footer>
  `;
}

