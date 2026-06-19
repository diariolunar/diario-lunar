let fila = Promise.resolve();

function garantirContainer() {
  let container = document.getElementById("modalGlobalContainer");

  if (container) {
    return container;
  }

  container = document.createElement("div");
  container.id = "modalGlobalContainer";
  document.body.appendChild(container);

  return container;
}

function criarModal({
  titulo = "Aviso",
  mensagem = "",
  tipo = "info",
  botoes = []
}) {
  const container = garantirContainer();
  const overlay = document.createElement("div");

  overlay.className = "modal-global-overlay active";
  overlay.innerHTML = `
    <div class="modal-global modal-global-${tipo}" role="dialog" aria-modal="true">
      <div class="modal-global-icon"></div>

      <div class="modal-global-body">
        <h2>${titulo}</h2>
        <p>${mensagem}</p>
      </div>

      <div class="modal-global-actions"></div>
    </div>
  `;

  const actions = overlay.querySelector(".modal-global-actions");

  botoes.forEach((botao) => {
    const elemento = document.createElement("button");
    elemento.type = "button";
    elemento.className = botao.classe || "btn btn-gradient";
    elemento.textContent = botao.texto;
    elemento.onclick = () => {
      overlay.remove();
      botao.onClick?.();
    };

    actions.appendChild(elemento);
  });

  container.appendChild(overlay);

  return overlay;
}

export function mostrarModal({
  titulo = "Aviso",
  mensagem = "",
  tipo = "info",
  textoBotao = "OK"
} = {}) {
  return new Promise((resolve) => {
    criarModal({
      titulo,
      mensagem,
      tipo,
      botoes: [
        {
          texto: textoBotao,
          classe: "btn btn-gradient",
          onClick: resolve
        }
      ]
    });
  });
}

export function confirmarModal({
  titulo = "Confirmar ação",
  mensagem = "",
  textoConfirmar = "Confirmar",
  textoCancelar = "Cancelar"
} = {}) {
  return new Promise((resolve) => {
    criarModal({
      titulo,
      mensagem,
      tipo: "warning",
      botoes: [
        {
          texto: textoCancelar,
          classe: "btn modal-global-secondary",
          onClick: () => resolve(false)
        },
        {
          texto: textoConfirmar,
          classe: "btn btn-gradient",
          onClick: () => resolve(true)
        }
      ]
    });
  });
}

export function instalarModaisGlobais() {
  if (window.__modaisGlobaisInstalados) return;

  window.__modaisGlobaisInstalados = true;
  window.alert = (mensagem = "") => {
    fila = fila.then(() => mostrarModal({
      titulo: "Diário Lunar",
      mensagem: String(mensagem || "")
    }));
  };
  window.modalAviso = mostrarModal;
  window.modalConfirmar = confirmarModal;
  window.confirmarModal = confirmarModal;
}
