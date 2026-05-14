export function renderNavbar() {
  return `
    <header class="navbar">
      <div class="container navbar-content">

        <a href="/index.html" class="navbar-logo">
          <img src="/assets/images/logo-diario-lunar2.png" alt="Diário Lunar">
        </a>

        <nav class="navbar-menu">
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
