export function renderNavbar() {
  return `
    <header style="
      background: #ffffff;
      border-bottom: 1px solid #e5e7eb;
      position: sticky;
      top: 0;
      z-index: 1000;
    ">
      <div class="container navbar-lunar">

        <a
          href="/index.html"
          class="navbar-logo-lunar"
        >
          <img
            src="/assets/images/logo-diario-lunar2.png"
            alt="Diário Lunar"
          >
        </a>

        <nav class="navbar-menu-lunar">

          <a class="nav-link-lunar" href="/index.html">
            Início
          </a>

          <a class="nav-link-lunar" href="/materias.html">
            Todas as Matérias
          </a>

          <div class="dropdown-lunar">

            <button class="dropdown-btn-lunar">
              Categorias ▾
            </button>

            <div class="dropdown-content-lunar">

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

            </div>

          </div>

          <a class="nav-link-lunar" href="/sugestao.html">
            Sugestão de Pauta
          </a>

          <a
            href="/admin.html"
            class="btn-admin-lunar"
          >
            ADM
          </a>

        </nav>

      </div>

      <style>

        .navbar-lunar{
          display:flex;
          align-items:center;
          justify-content:space-between;
          gap:24px;
          padding:14px 20px;
        }

        .navbar-logo-lunar{
          display:flex;
          align-items:center;
          justify-content:center;
          background:#07101f;
          padding:10px 18px;
          border-radius:18px;
          text-decoration:none;
          flex-shrink:0;
        }

        .navbar-logo-lunar img{
          height:62px;
          width:auto;
          max-width:240px;
          object-fit:contain;
          display:block;
        }

        .navbar-menu-lunar{
          display:flex;
          align-items:center;
          gap:12px;
          flex-wrap:wrap;
        }

        .nav-link-lunar{
          text-decoration:none;
          color:#0f172a;
          font-weight:700;
          transition:0.2s;
        }

        .nav-link-lunar:hover{
          color:#7c3aed;
        }

        .dropdown-lunar{
          position:relative;
          padding:12px 0;
        }

        .dropdown-btn-lunar{
          border:none;
          background:none;
          cursor:pointer;
          font-size:16px;
          font-weight:700;
          color:#0f172a;
          transition:0.2s;
        }

        .dropdown-btn-lunar:hover{
          color:#7c3aed;
        }

        .dropdown-content-lunar{
          position:absolute;
          top:100%;
          left:0;
          min-width:220px;
          background:#ffffff;
          border-radius:18px;
          box-shadow:0 10px 35px rgba(0,0,0,0.12);
          padding:10px;
          display:none;
          flex-direction:column;
          z-index:999;
          margin-top:0;
        }

        .dropdown-content-lunar a{
          text-decoration:none;
          color:#0f172a;
          padding:12px 14px;
          border-radius:12px;
          font-weight:600;
          transition:0.2s;
        }

        .dropdown-content-lunar a:hover{
          background:#f3f4f6;
          color:#7c3aed;
        }

        .dropdown-lunar:hover .dropdown-content-lunar{
          display:flex;
        }

        .btn-admin-lunar{
          background:linear-gradient(90deg,#0ea5e9,#7c3aed);
          color:#ffffff;
          padding:11px 18px;
          border-radius:999px;
          text-decoration:none;
          font-weight:800;
          margin-left:6px;
          transition:0.2s;
        }

        .btn-admin-lunar:hover{
          transform:translateY(-1px);
          opacity:0.95;
        }

        @media(max-width:900px){

          .navbar-lunar{
            flex-direction:column;
            align-items:flex-start;
          }

          .navbar-menu-lunar{
            width:100%;
          }

          .dropdown-content-lunar{
            position:static;
            margin-top:12px;
            box-shadow:none;
            border:1px solid #e5e7eb;
          }

        }

      </style>

    </header>
  `;
}
