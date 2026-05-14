export function renderNavbar() {
  return `
    <header class="navbar">
      <div class="logo">
        <a href="/index.html">
          <img src="/assets/images/logo-diario-lunar.png" alt="Diário Lunar">
        </a>
      </div>

      <nav class="menu">
        <a href="/index.html">Início</a>
        <a href="/materias.html">Todas as Matérias</a>
        <a href="/categoria.html?tipo=Literatura">Literatura</a>
        <a href="/categoria.html?tipo=Comunidade">Comunidade</a>
        <a href="/categoria.html?tipo=Autores">Autores</a>
        <a href="/categoria.html?tipo=Eventos">Eventos</a>
        <a href="/categoria.html?tipo=Resenhas">Resenhas</a>
        <a href="/categoria.html?tipo=Entrevistas">Entrevistas</a>
        <a href="/categoria.html?tipo=Destaques Lunar">Destaques Lunar</a>
        <a href="/contato.html">Sugestão de Pauta</a>
      </nav>

      <a href="/admin.html" class="btn">
        Área ADM
      </a>
    </header>
  `;
}
