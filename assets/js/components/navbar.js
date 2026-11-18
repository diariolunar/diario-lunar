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

        <button
          type="button"
          class="navbar-mobile-toggle"
          aria-label="Abrir menu"
          aria-controls="navbarMenuLunar"
          aria-expanded="false"
          title="Menu"
          onclick="const header=this.closest('header'); const aberto=header.classList.toggle('navbar-aberta'); this.setAttribute('aria-expanded', String(aberto)); this.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');"
        >
          <span aria-hidden="true">&#9776;</span>
        </button>

        <nav class="navbar-menu-lunar" id="navbarMenuLunar">

          <a class="nav-link-lunar" href="/index.html">
            Início
          </a>

          <a class="nav-link-lunar" href="/materias.html">
            Todas as Matérias
          </a>

          <div class="dropdown-lunar">

            <button
              type="button"
              class="dropdown-btn-lunar"
              onclick="this.parentElement.classList.toggle('dropdown-open')"
            >
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

          <div class="dropdown-lunar">
            <button type="button" class="dropdown-btn-lunar" onclick="this.parentElement.classList.toggle('dropdown-open')">
              Mídias ▾
            </button>
            <div class="dropdown-content-lunar">
              <a href="/midias.html">Todas as Mídias</a>
              <a href="/audiobooks.html">Audiobooks</a>
              <a href="/trilhas-sonoras.html">Trilhas Sonoras</a>
              <a href="/booktrailers.html">BookTrailers</a>
            </div>
          </div>

          <a class="nav-link-lunar" href="/contato.html">
            Sugestão de Pauta
          </a>

          <form class="navbar-busca-lunar" action="/materias.html" method="get" role="search">
            <label class="sr-only" for="navbarBuscaMaterias">Buscar matérias</label>
            <input
              id="navbarBuscaMaterias"
              name="q"
              type="search"
              placeholder="Buscar matérias"
              autocomplete="off"
            >
            <button type="submit" aria-label="Buscar matérias" title="Buscar matérias">
              <span aria-hidden="true">&#128269;</span>
            </button>
          </form>

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
          border-radius:8px;
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

        .navbar-mobile-toggle{
          display:none;
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
          border-radius:8px;
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

        .dropdown-lunar.dropdown-open .dropdown-content-lunar{
          display:flex;
        }

        .btn-admin-lunar{
          background:linear-gradient(90deg,#0ea5e9,#7c3aed);
          color:#ffffff;
          padding:11px 18px;
          border-radius:8px;
          text-decoration:none;
          font-weight:800;
          margin-left:6px;
          transition:0.2s;
        }

        .btn-admin-lunar:hover{
          transform:translateY(-1px);
          opacity:0.95;
        }

        .navbar-busca-lunar{
          display:flex;
          align-items:center;
          width:min(220px, 100%);
          height:42px;
          border:1px solid #cbd5e1;
          border-radius:8px;
          overflow:hidden;
          background:#fff;
        }

        .navbar-busca-lunar input{
          width:100%;
          min-width:0;
          height:100%;
          border:0;
          padding:0 10px;
          font:inherit;
          outline:none;
        }

        .navbar-busca-lunar:focus-within{
          border-color:#7c3aed;
          box-shadow:0 0 0 3px rgba(124,58,237,.15);
        }

        .navbar-busca-lunar button{
          width:42px;
          height:42px;
          flex:0 0 42px;
          border:0;
          background:transparent;
          color:#6d28d9;
          cursor:pointer;
        }

        .sr-only{
          position:absolute;
          width:1px;
          height:1px;
          padding:0;
          margin:-1px;
          overflow:hidden;
          clip:rect(0,0,0,0);
          white-space:nowrap;
          border:0;
        }

        @media(max-width:900px){

          .navbar-lunar{
            display:grid;
            grid-template-columns:1fr 44px;
            align-items:center;
            gap:12px;
            padding:10px 15px;
          }

          .navbar-logo-lunar{
            justify-self:start;
            padding:7px 10px;
          }

          .navbar-logo-lunar img{
            height:44px;
            max-width:170px;
          }

          .navbar-mobile-toggle{
            display:inline-flex;
            align-items:center;
            justify-content:center;
            width:44px;
            height:44px;
            border:1px solid #cbd5e1;
            border-radius:8px;
            background:#fff;
            color:#0f172a;
            font-size:24px;
            cursor:pointer;
          }

          .navbar-menu-lunar{
            grid-column:1 / -1;
            width:100%;
            display:none;
            align-items:stretch;
            flex-direction:column;
            gap:2px;
            padding:8px 0 4px;
          }

          header.navbar-aberta .navbar-menu-lunar{
            display:flex;
          }

          .nav-link-lunar,
          .dropdown-btn-lunar,
          .btn-admin-lunar{
            width:100%;
            min-height:44px;
            display:flex;
            align-items:center;
            padding:10px 12px;
            margin:0;
          }

          .dropdown-lunar{
            padding:0;
          }

          .navbar-busca-lunar{
            order:-1;
            width:100%;
          }

          .dropdown-content-lunar{
            position:static;
            margin:0 0 6px;
            box-shadow:none;
            border:1px solid #e5e7eb;
          }

        }

      </style>

    </header>
  `;
}

