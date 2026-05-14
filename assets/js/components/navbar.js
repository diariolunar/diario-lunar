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
          style="
            display: flex;
            align-items: center;
            justify-content: center;
            background: #07101f;
            padding: 10px 18px;
            border-radius: 18px;
            text-decoration: none;
            flex-shrink: 0;
          "
        >
          <img
            src="/assets/images/logo-diario-lunar2.png"
            alt="Diário Lunar"
            style="
              height: 62px;
              width: auto;
              max-width: 230px;
              display: block;
              object-fit: contain;
            "
          >
        </a>

        <nav style="
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          flex-wrap: wrap;
          font-weight: 700;
        ">
          <a class="nav-link" href="/index.html">Início</a>
          <a class="nav-link" href="/materias.html">Todas as Matérias</a>
          <a class="nav-link" href="/categoria.html?tipo=Literatura">Literatura</a>
          <a class="nav-link" href="/categoria.html?tipo=Comunidade">Comunidade</a>
          <a class="nav-link" href="/categoria.html?tipo=Autores">Autores</a>
          <a class="nav-link" href="/categoria.html?tipo=Eventos">Eventos</a>
          <a class="nav-link" href="/categoria.html?tipo=Resenhas">Resenhas</a>
          <a class="nav-link" href="/categoria.html?tipo=Entrevistas">Entrevistas</a>
          <a class="nav-link" href="/categoria.html?tipo=Destaques%20Lunar">Destaques Lunar</a>
          <a class="nav-link" href="/sugestao.html">Sugestão de Pauta</a>

          <a
            href="/admin.html"
            style="
              background: linear-gradient(90deg, #0ea5e9, #7c3aed);
              color: #ffffff;
              padding: 11px 18px;
              border-radius: 999px;
              text-decoration: none;
              font-weight: 800;
              margin-left: 6px;
            "
          >
            ADM
          </a>
        </nav>

      </div>
    </header>
  `;
}
