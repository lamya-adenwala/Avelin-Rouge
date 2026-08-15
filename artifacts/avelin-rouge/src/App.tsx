import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ErrorBoundary } from "@/components/error-boundary";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { Link, Route, Switch, Router as WouterRouter, useLocation } from "wouter";

const queryClient = new QueryClient();
const IMG = `${import.meta.env.BASE_URL}images/`;

type IconKind = "heart" | "search" | "user" | "bag" | "menu" | "close";
type PanelKind = "wishlist" | "account" | "bag";

const collections = [
  { id: "courtship", name: "The Courtship Collection", image: "avelin-courtship.jpg", alt: "The Courtship Collection editorial" },
  { id: "lingering-hour", name: "The Lingering Hour Collection", image: "avelin-founder.jpg", alt: "The Lingering Hour Collection editorial" },
  { id: "riders-quadrant", name: "The Riders Quadrant", image: "avelin-house.jpg", alt: "The Riders Quadrant editorial" },
];

function Icon({ kind }: { kind: IconKind }) {
  const paths = {
    heart: <path d="M12 20.5S4 15.6 4 9.6a4.2 4.2 0 0 1 8-1.8 4.2 4.2 0 0 1 8 1.8c0 6-8 10.9-8 10.9Z" />,
    search: <><circle cx="10.8" cy="10.8" r="6.2" /><path d="m16 16 4.5 4.5" /></>,
    user: <><circle cx="12" cy="8" r="3.2" /><path d="M5.5 20c.7-3.6 2.9-5.4 6.5-5.4s5.8 1.8 6.5 5.4" /></>,
    bag: <><path d="M5.5 8.5h13l-1 12h-11l-1-12Z" /><path d="M9 9V6a3 3 0 0 1 6 0v3" /></>,
    menu: <><path d="M4 8h16M4 16h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
  };
  return <svg aria-hidden="true" viewBox="0 0 24 24" className="ar-icon">{paths[kind]}</svg>;
}

function Eyebrow({ children }: { children: ReactNode }) {
  return <p className="ar-eyebrow">{children}</p>;
}

function Reveal({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`ar-reveal ${className}`}>{children}</div>;
}

function scrollToSection(id: string) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id)?.scrollIntoView({ behavior: reducedMotion ? "auto" : "smooth", block: "start" });
}

function Panel({ kind, onClose }: { kind: PanelKind; onClose: () => void }) {
  const labels = {
    wishlist: ["Your wishlist", "A quiet place for pieces that stay with you."],
    account: ["Your account", "Private access to your appointments and house correspondence."],
    bag: ["Your bag", "There is nothing here yet. The house does not rush a decision."],
  };
  const [title, description] = labels[kind];
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <>
      <button className="ar-panel-backdrop open" type="button" aria-label="Close panel" data-testid="button-close-panel-backdrop" onClick={onClose} />
      <aside className="ar-panel open" role="dialog" aria-modal="true" aria-labelledby="panel-title">
        <button ref={closeRef} className="ar-panel-close" type="button" aria-label={`Close ${kind} panel`} data-testid={`button-close-${kind}`} onClick={onClose}>
          <Icon kind="close" />
        </button>
        <div className="ar-panel-kicker">Avelin Rouge / Private access</div>
        <h2 id="panel-title" data-testid={`text-panel-title-${kind}`}>{title}</h2>
        <p data-testid={`text-panel-description-${kind}`}>{description}</p>
        <div className="ar-panel-rule">Available by arrangement</div>
      </aside>
    </>
  );
}

function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const normalizedQuery = query.trim().toLowerCase();
  const results = collections.filter((collection) => collection.name.toLowerCase().includes(normalizedQuery));

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  const chooseResult = (id: string) => {
    onClose();
    window.requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <div className={`ar-search ${open ? "open" : ""}`} role="dialog" aria-modal="false" aria-labelledby="search-title">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <label id="search-title" htmlFor="ar-search-input">Search the maison</label>
        <button type="button" aria-label="Close search" data-testid="button-close-search" onClick={onClose} style={{ border: 0, background: "none", color: "var(--burg)", cursor: "pointer", padding: 5 }}>
          <Icon kind="close" />
        </button>
      </div>
      <input ref={inputRef} id="ar-search-input" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the collections" data-testid="input-search-maison" />
      {open && results.length > 0 && (
        <ul className="ar-search-results" aria-label="Collection suggestions">
          {results.map((collection) => (
            <li key={collection.id}>
              <button type="button" data-testid={`button-search-result-${collection.id}`} onClick={() => chooseResult(collection.id)}>
                {collection.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && results.length === 0 && <p className="ar-search-empty" data-testid="text-search-empty">No stories found in the maison.</p>}
    </div>
  );
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (open) closeRef.current?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);
  const go = (id: string) => {
    onClose();
    window.requestAnimationFrame(() => scrollToSection(id));
  };

  return (
    <div className={`ar-mobile-menu ${open ? "open" : ""}`} aria-label="Mobile navigation" aria-hidden={!open}>
      <button ref={closeRef} className="ar-menu-close" type="button" aria-label="Close menu" data-testid="button-close-mobile-menu" onClick={onClose}>
        <Icon kind="close" />
      </button>
      <span className="ar-mobile-kicker">The private digital front door</span>
      <a tabIndex={open ? 0 : -1} href="#house" data-testid="link-mobile-house" onClick={() => go("house")}>The House</a>
      <a tabIndex={open ? 0 : -1} href="#world" data-testid="link-mobile-world" onClick={() => go("world")}>The World</a>
      <a tabIndex={open ? 0 : -1} href="#collections" data-testid="link-mobile-journal" onClick={() => go("collections")}>Journal</a>
      <a tabIndex={open ? 0 : -1} href="#collections" data-testid="link-mobile-shop" onClick={() => go("collections")}>Shop</a>
    </div>
  );
}

function Navigation({ onPanel, onSearch }: { onPanel: (kind: PanelKind) => void; onSearch: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  useEffect(() => {
    document.body.style.overflow = menu ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menu]);

  const closeMenu = () => setMenu(false);
  return (
    <>
      <header className={`ar-nav ${scrolled ? "is-scrolled" : ""}`} data-testid="navigation-header">
        <a className="ar-wordmark" href="#top" aria-label="Avelin Rouge home" data-testid="link-home-wordmark">AVELIN ROUGE<small>MAISON DE COUTURE</small></a>
        <nav className="ar-links" aria-label="Primary navigation">
          <a href="#house" data-testid="link-nav-house">The House</a>
          <a href="#world" data-testid="link-nav-world">The World</a>
          <a href="#collections" data-testid="link-nav-journal">Journal</a>
          <a href="#collections" data-testid="link-nav-shop">Shop</a>
        </nav>
        <div className="ar-utils" aria-label="House utilities">
          <button type="button" aria-label="Open wishlist" data-testid="button-open-wishlist" onClick={() => onPanel("wishlist")}><Icon kind="heart" /></button>
          <button type="button" aria-label="Open search" data-testid="button-open-search" onClick={onSearch}><Icon kind="search" /></button>
          <button type="button" aria-label="Open account" data-testid="button-open-account" onClick={() => onPanel("account")}><Icon kind="user" /></button>
          <button type="button" aria-label="Open bag" data-testid="button-open-bag" onClick={() => onPanel("bag")}><Icon kind="bag" /></button>
          <button className="ar-menu-btn" type="button" aria-label="Open menu" data-testid="button-open-mobile-menu" onClick={() => setMenu(true)}><Icon kind="menu" /></button>
        </div>
      </header>
      <MobileMenu open={menu} onClose={closeMenu} />
    </>
  );
}

function Home() {
  const [search, setSearch] = useState(false);
  const [panel, setPanel] = useState<PanelKind | null>(null);
  const closeSearch = () => setSearch(false);

  useEffect(() => {
    const locked = search || Boolean(panel);
    document.body.style.overflow = locked ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [search, panel]);

  useEffect(() => {
    if (!panel) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setPanel(null);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [panel]);

  return (
    <div className="ar-page" data-testid="page-home">
      <Navigation onPanel={setPanel} onSearch={() => setSearch((value) => !value)} />
      <SearchOverlay open={search} onClose={closeSearch} />
      {panel && <Panel kind={panel} onClose={() => setPanel(null)} />}
      <main id="top">
        <section className="ar-hero" aria-labelledby="hero-title" data-testid="section-hero">
          <img className="ar-hero-img" src={`${IMG}avelin-house.jpg`} alt="The Avelin Rouge house at dusk" />
          <div className="ar-hero-content">
            <div className="ar-hero-kicker">Since 1896 · Paris / The Cotswolds</div>
            <h1 id="hero-title">A quiet<br /><em>force.</em></h1>
            <p className="ar-hero-note">A house of considered silhouettes, made slowly for those who know the difference.</p>
          </div>
          <div className="ar-scroll" aria-hidden="true">Enter the house</div>
        </section>
        <Reveal>
          <section id="house" className="ar-section ar-story" aria-labelledby="house-title" data-testid="section-house">
            <div className="ar-story-copy">
              <Eyebrow>The House / Est. 1896</Eyebrow>
              <h2 id="house-title" className="ar-display">A lineage of<br />beautiful restraint.</h2>
              <p className="ar-body" data-testid="text-house-story">Avelin Rouge began in a quiet Parisian courtyard, where Madeleine Avelin cut her first coat by hand. Four generations later, the house remains an intimate conversation between memory and the present.</p>
              <a className="ar-link" href="#vision" data-testid="link-read-story">Read our story</a>
            </div>
            <div className="ar-story-image"><img src={`${IMG}avelin-house.jpg`} alt="Limestone architecture of the Avelin Rouge house" data-testid="img-house-architecture" /></div>
          </section>
        </Reveal>
        <Reveal>
          <section id="vision" className="ar-section ar-vision" aria-labelledby="vision-title" data-testid="section-vision">
            <div className="ar-vision-image"><img src={`${IMG}avelin-founder.jpg`} alt="Founder of Avelin Rouge in the atelier" data-testid="img-founder" /></div>
            <div className="ar-vision-copy">
              <Eyebrow>The Founder's Vision</Eyebrow>
              <blockquote id="vision-title" className="ar-quote">“Clothing should not announce a woman. It should make room for her.”</blockquote>
              <p className="ar-body">Elise Avelin protects the house’s original instinct: to make fewer things, with more feeling. Her vision is not nostalgia, but a form of attention — to the body, the cloth, and the life that will be lived in it.</p>
              <div className="ar-signature" data-testid="text-founder-signature">Elise Avelin</div>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section className="ar-section ar-pillars" aria-labelledby="standard-title" data-testid="section-standard">
            <Eyebrow>The Avelin Standard</Eyebrow>
            <h2 id="standard-title" className="ar-display">Three gestures.<br />One signature.</h2>
            <div className="ar-pillar-grid">
              <div className="ar-pillar" data-testid="pillar-cut"><span className="ar-pillar-index">01 — THE CUT</span><h3>Architecture for the body</h3><p>Every line is drawn to follow movement, never to constrain it.</p></div>
              <div className="ar-pillar" data-testid="pillar-cloth"><span className="ar-pillar-index">02 — THE CLOTH</span><h3>Materials with a memory</h3><p>Rare wools, washed silks, and linens chosen for how they age.</p></div>
              <div className="ar-pillar" data-testid="pillar-hand"><span className="ar-pillar-index">03 — THE HAND</span><h3>Time, made visible</h3><p>Each piece passes through the hands of one dedicated artisan.</p></div>
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section id="collections" className="ar-section ar-collections" aria-labelledby="collections-title" data-testid="section-collections">
            <div className="ar-collection-intro">
              <div><Eyebrow>From the Journal</Eyebrow><h2 id="collections-title" className="ar-display">The collections.</h2></div>
              <a className="ar-link" href="#collections" data-testid="link-enter-journal">Enter the journal</a>
            </div>
            <div className="ar-collection-grid">
              {collections.map((collection, index) => (
                <a className="ar-collection" href={`#${collection.id}`} key={collection.id} data-testid={`link-collection-${collection.id}`} aria-label={`Read ${collection.name}`}>
                  <div id={collection.id} className="ar-collection-visual"><img src={`${IMG}${collection.image}`} alt={collection.alt} data-testid={`img-collection-${collection.id}`} /></div>
                  <div className="ar-collection-label"><h3>{collection.name}</h3><span data-testid={`text-collection-action-${index}`}>View story →</span></div>
                </a>
              ))}
            </div>
          </section>
        </Reveal>
        <Reveal>
          <section id="world" className="ar-section ar-atelier" aria-labelledby="atelier-title" data-testid="section-atelier">
            <div className="ar-atelier-copy">
              <Eyebrow>The World / The Atelier</Eyebrow>
              <h2 id="atelier-title" className="ar-display">Where a garment<br />learns to breathe.</h2>
              <p className="ar-body">In our Cotswolds atelier, a jacket is given the patience of a conversation. Pattern cutters, embroiderers and tailors work in a shared silence, shaping cloth into something unmistakably alive.</p>
              <a className="ar-link" href="#appointment" data-testid="link-discover-atelier">Discover the atelier</a>
            </div>
            <div className="ar-atelier-image"><img src={`${IMG}avelin-atelier.jpg`} alt="Avelin Rouge artisan hand-stitching a jacket" data-testid="img-atelier" /><div className="ar-atelier-meta" data-testid="text-atelier-meta">The hand remembers.</div></div>
          </section>
        </Reveal>
        <Reveal>
          <section id="appointment" className="ar-appointment" aria-labelledby="appointment-title" data-testid="section-appointment">
            <Eyebrow>A private invitation</Eyebrow>
            <h2 id="appointment-title" className="ar-display">The door is open<br />when you are ready.</h2>
            <p>Discover Avelin Rouge in a private appointment, by invitation or arrangement at our maisons in Paris and London.</p>
            <Link className="ar-cta" href="/appointments" data-testid="link-request-appointment">Request an appointment</Link>
          </section>
        </Reveal>
      </main>
      <footer id="footer" className="ar-footer" data-testid="section-footer">
        <a className="ar-wordmark" href="#top" aria-label="Avelin Rouge home" data-testid="link-footer-home">AVELIN ROUGE<small>MAISON DE COUTURE</small></a>
        <nav aria-label="Footer navigation"><a href="#house" data-testid="link-footer-house">The House</a><a href="#world" data-testid="link-footer-world">The World</a><a href="#collections" data-testid="link-footer-journal">Journal</a></nav>
        <small data-testid="text-copyright">© 2025 Avelin Rouge · Paris</small>
      </footer>
    </div>
  );
}

function Appointments() {
  const [, setLocation] = useLocation();
  return (
    <main className="ar-appointment-page" data-testid="page-appointments">
      <a className="ar-wordmark" href="/" aria-label="Avelin Rouge home" data-testid="link-appointments-wordmark">AVELIN ROUGE<small>MAISON DE COUTURE</small></a>
      <div className="ar-appointment-page-main">
        <Eyebrow>A private invitation</Eyebrow>
        <h1 data-testid="text-appointments-title">The house is<br /><em>expecting you.</em></h1>
        <p data-testid="text-appointments-description">Appointments are arranged personally in Paris, London, and our Cotswolds atelier. A member of the house will be in touch to continue the conversation.</p>
        <button className="ar-cta" type="button" data-testid="button-appointments-request" onClick={() => setLocation("/")}>Return to the house</button>
      </div>
    </main>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/appointments" component={Appointments} />
      <Route component={NotFound} />
    </Switch>
  );
}

function RoutedErrorBoundary({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  return <ErrorBoundary resetKey={location}>{children}</ErrorBoundary>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <RoutedErrorBoundary><Router /></RoutedErrorBoundary>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;