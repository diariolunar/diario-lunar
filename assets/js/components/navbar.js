export function renderNavbar() {
  return `
    <header style="
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
    ">
      <div class="container" style="
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 14px 20px;
      ">

        <a
          href="/index.html"
          style="display: flex; align-items: center; text-decoration: none;"
        >
          <img
            src="/assets/images/logo-diario-lunar2.png"
            alt="Diário Lunar"
            style="
              height: 58px;
              width: auto;
              display: block;
              object-fit: contain;
            "
          >
        </a>

        <nav style="
          display: flex;
          align-items: center;
          gap: 18px;
          flex-wrap: wrap;
          font-weight: 600;
        ">
          <a href="/index.html">Início</a>

          <a href="/materias.html">
            Todas as Matérias
          </a>

          <a href="/categoria.html?tipo=Literatura">
            Literatura
          </a>

          <a href="/categoria.html?tipo=Comunidade">
            Comunidade
          </a>

          <a href="/categoria.html?tipo=Autores">
            Autores
          </a>

          <a href="/categoria.html?tipo=Eventos">
            Eventos
          </a>

          <a href="/categoria.html?tipo=Resenhas">
            Resenhas
          </a>

          <a href="/categoria.html?tipo=Entrevistas">
            Entrevistas
          </a>

          <a href="/categoria.html?tipo=Destaques%20Lunar">
            Destaques Lunar
          </a>

          <a href="/sugestao.html">
            Sugestão de Pauta
          </a>
        </nav>

      </div>
    </header>
  `;
}
