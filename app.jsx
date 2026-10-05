/* ===================== JELSPRAY — UI shared layer ===================== */
const { useState, useEffect, useRef, useCallback, createContext, useContext } = React;
const D = window.JELSPRAY;

/* ---------- helpers ---------- */
const eur = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
const go = (url) => { const u = String(url).replace(/^#/, '');
  if (window.location.protocol === 'file:') { window.location.hash = u; return; }
  if (window.location.pathname + window.location.search !== u) { window.history.pushState({}, '', u); }
  window.dispatchEvent(new Event('jl:navigate')); };

/* ---------- tiny global store (cart + auth + ui) ---------- */
const Store = (() => {
  const load = (k, f) => { try { return JSON.parse(localStorage.getItem(k)) ?? f; } catch { return f; } };
  let state = {
    cart: load('jl_cart', []),          // [{ref, qty}]
    user: load('jl_user', null),        // {prenom,nom,email,tel,adresse,cp,ville} | null
    orders: load('jl_orders', []),      // historique
    cartOpen: false,
    lastPop: 0,
  };
  const subs = new Set();
  const emit = () => subs.forEach((f) => f(state));
  const persist = () => {
    localStorage.setItem('jl_cart', JSON.stringify(state.cart));
    localStorage.setItem('jl_user', JSON.stringify(state.user));
    localStorage.setItem('jl_orders', JSON.stringify(state.orders));
  };
  const set = (patch) => { state = { ...state, ...patch }; persist(); emit(); };
  return {
    get: () => state,
    subscribe: (f) => { subs.add(f); return () => subs.delete(f); },
    set,
    add(ref, qty = 1) {
      const cart = state.cart.slice();
      const i = cart.findIndex((l) => l.ref === ref);
      if (i >= 0) cart[i] = { ...cart[i], qty: cart[i].qty + qty };
      else cart.push({ ref, qty });
      set({ cart, cartOpen: true, lastPop: Date.now() });
    },
    setQty(ref, qty) {
      let cart = state.cart.slice();
      const i = cart.findIndex((l) => l.ref === ref);
      if (i >= 0) { if (qty <= 0) cart.splice(i, 1); else cart[i] = { ...cart[i], qty }; }
      set({ cart });
    },
    remove(ref) { set({ cart: state.cart.filter((l) => l.ref !== ref) }); },
    clear() { set({ cart: [] }); },
    openCart(v = true) { set({ cartOpen: v }); },
  };
})();

function useStore() {
  const [s, setS] = useState(Store.get());
  useEffect(() => Store.subscribe(setS), []);
  return s;
}

/* cart maths */
function cartLines(cart) {
  return cart.map((l) => ({ ...l, p: D.byRef[l.ref] })).filter((l) => l.p);
}
function cartTotals(cart) {
  const lines = cartLines(cart);
  const ttc = lines.reduce((s, l) => s + l.p.ttc * l.qty, 0);
  const count = lines.reduce((s, l) => s + l.qty, 0);
  const ht = ttc / (1 + D.TVA);
  const tva = ttc - ht;
  const shipping = count > 0 ? D.SHIPPING : 0;
  return { lines, count, ttc, ht, tva, shipping, grand: ttc + shipping };
}

/* ---------- icons (simple, geometric) ---------- */
const I = {
  cart: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h3l2.2 12.2a1.5 1.5 0 0 0 1.5 1.3h8.2a1.5 1.5 0 0 0 1.5-1.2L21 7H6"/></svg>,
  user: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><circle cx="12" cy="8" r="3.4"/><path d="M4.5 20a7.5 7.5 0 0 1 15 0"/></svg>,
  search: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" {...p}><circle cx="11" cy="11" r="6.5"/><path d="m21 21-4.2-4.2"/></svg>,
  plus: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  minus: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" {...p}><path d="M5 12h14"/></svg>,
  close: (p) => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" {...p}><path d="M6 6l12 12M18 6 6 18"/></svg>,
  arrow: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  arrowUR: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M7 17 17 7M8 7h9v9"/></svg>,
  check: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M20 6 9 17l-5-5"/></svg>,
  trash: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>,
  truck: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M2 6h12v9H2zM14 9h4l3 3v3h-7z"/><circle cx="7" cy="18" r="1.6"/><circle cx="17" cy="18" r="1.6"/></svg>,
  shield: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M9 12l2 2 4-4"/></svg>,
  mail: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>,
  phone: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/></svg>,
  pin: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11z"/><circle cx="12" cy="10" r="2.4"/></svg>,
  bolt: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M13 2 4 14h7l-1 8 9-12h-7z"/></svg>,
  spark: (p) => <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/></svg>,
  pkg: (p) => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" {...p}><path d="M21 8 12 3 3 8v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>,
};

/* ---------- product image (real photo over a styled placeholder fallback) ---------- */
// Convention de nommage des fichiers : photos/<REF>-product.jpg  et  photos/<REF>-usage.jpg
const optimizedImage = (src) => ('/.netlify/images?url=' + src + '&q=82');
const photoSrc = (ref, kind) => optimizedImage('/photos/' + ref + '-' + kind + '.jpg');
// Références disposant réellement de photos (les autres gardent le visuel de remplacement).
const REFS_WITH_PHOTOS = new Set(['GPAC','GPBC','GPBCM','GPCC','GPCCM','GPCCS','GPCS','GPEC','GPLG','GPLR','GPMP','GPRR','GPSBL','GPSC','GPSS','GPTPC','GPTS','GPWS','GP3243','GP3270','GP3272']);

function ProductImage({ p, usage = false, note = true }) {
  const [on, setOn] = useState(false); // photo réellement chargée -> on masque le placeholder
  const kind = usage ? 'usage' : 'product';
  const hasPhoto = REFS_WITH_PHOTOS.has(p.ref);
  const imgRef = useRef(null);
  // révélation fiable même si l'image est déjà en cache (onLoad ne se déclenche pas toujours)
  useEffect(() => {
    setOn(false);
    const el = imgRef.current;
    if (!el) return;
    if (el.complete && el.naturalWidth > 0) { setOn(true); return; }
    const h = () => setOn(true);
    el.addEventListener('load', h);
    return () => el.removeEventListener('load', h);
  }, [p.ref, usage, hasPhoto]);
  return (
    <div className={'pimg' + (usage ? ' usage' : '')}>
      {p.accent && !usage && <span className="swatch" style={{ background: p.accent }} />}
      <span className="pref">{p.ref}</span>
      <span className="pvol">{p.vol}{usage ? ' · en situation' : ''}</span>
      {note && <span className="ph-note">{usage ? 'photo d\u2019utilisation' : 'visuel produit'}</span>}
      {hasPhoto && (
        <img ref={imgRef} className={'pimg-photo' + (on ? ' on' : '')} alt={p.name + (usage ? ' — en situation' : '')}
          src={photoSrc(p.ref, kind)} loading="lazy"
          onLoad={() => setOn(true)} onError={(e) => { e.currentTarget.style.display = 'none'; }} />
      )}
    </div>
  );
}

/* deux photos qui glissent : bouteille (fond) + illustration (devant, entre au survol) */
function ProductSlide({ p }) {
  const hasPhoto = REFS_WITH_PHOTOS.has(p.ref);
  return (
    <div className="pslide">
      <div className="layer back"><ProductImage p={p} note={false} /></div>
      <div className="layer front"><ProductImage p={p} usage note={false} /></div>
      {hasPhoto && <span className="swipe-hint">{I.images ? I.images({ width: 12, height: 12 }) : null}2 photos</span>}
      {hasPhoto && <div className="swipe-dots"><i /><i /></div>}
    </div>
  );
}

/* ---------- qty stepper ---------- */
function Qty({ value, onChange, min = 1 }) {
  return (
    <div className="qty">
      <button aria-label="Diminuer" onClick={() => onChange(Math.max(min, value - 1))}>{I.minus()}</button>
      <span className="val">{value}</span>
      <button aria-label="Augmenter" onClick={() => onChange(value + 1)}>{I.plus()}</button>
    </div>
  );
}

/* ---------- product card ---------- */
function ProductCard({ p }) {
  return (
    <div className="pcard fade-in">
      <div className="card-badges">
        {p.star && <span className="tag badge-star">Best-seller</span>}
        {p.pro && <span className="tag badge-pro">Format pro</span>}
      </div>
      <a href={'/produit/' + p.slug} aria-label={p.name}>
        <ProductSlide p={p} />
      </a>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--red)', fontWeight: 600 }}>{p.ref}</span>
        <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>· {D.catLabel[p.cat]}</span>
      </div>
      <a href={'/produit/' + p.slug}><div className="pname" style={{ marginTop: 4 }}>{p.name}</div></a>
      <div className="pmeta"><span>{p.vol}</span></div>
      <div className="pbottom">
        <a href={'/produit/' + p.slug} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'space-between' }}>Voir le produit {I.arrow()}</a>
      </div>
    </div>
  );
}

/* ---------- header ---------- */
function Header({ route }) {
  const s = useStore();
  const { count } = cartTotals(s.cart);
  const [pop, setPop] = useState(false);
  useEffect(() => { if (s.lastPop) { setPop(true); const t = setTimeout(() => setPop(false), 360); return () => clearTimeout(t); } }, [s.lastPop]);
  const seg = route.split('/')[1] || '';
  const link = (href, label, key) => (
    <a href={href} className={seg === key ? 'on' : ''}>{label}</a>
  );
  return (
    <React.Fragment>
      <div className="topbar">
        <div className="wrap">
          <span className="mono hide-sm">DISTRIBUTEUR OFFICIEL · GRAFEN PROFESSIONAL</span>
          <div className="row gap16">
            <span className="mono">Particuliers & professionnels</span>
            <a href="/contact" className="mono hide-sm" style={{ display: 'inline-block' }}>contact@jeltrade.fr</a>
          </div>
        </div>
      </div>
      <header className="hdr">
        <div className="wrap hdr-in">
          <a href="/" className="logo" aria-label="JELSPRAY accueil">
            <span className="jel">JEL</span><span className="auto">SPRAY</span><span className="dot" />
          </a>
          <nav className="nav">
            {link('/produits', 'Produits', 'produits')}
            {link('/produits?cat=colles', 'GRAFLOCK', '_')}
            {link('/blog', 'Blog', 'blog')}
            {link('/contact', 'Contact', 'contact')}
          </nav>
          <div className="hdr-actions">
            <button className="icon-btn" aria-label="Rechercher" onClick={() => go('/produits')}>{I.search()}</button>
          </div>
        </div>
      </header>
    </React.Fragment>
  );
}

/* ---------- cart drawer ---------- */
function CartDrawer() {
  const s = useStore();
  const t = cartTotals(s.cart);
  return (
    <React.Fragment>
      <div className={'overlay' + (s.cartOpen ? ' show' : '')} onClick={() => Store.openCart(false)} />
      <aside className={'drawer' + (s.cartOpen ? ' show' : '')} aria-hidden={!s.cartOpen}>
        <div className="drawer-hd">
          <div className="row gap12">
            <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>Votre panier</strong>
            <span className="tag">{t.count} article{t.count > 1 ? 's' : ''}</span>
          </div>
          <button className="icon-btn" onClick={() => Store.openCart(false)} aria-label="Fermer">{I.close()}</button>
        </div>
        <div className="drawer-body">
          {t.lines.length === 0 ? (
            <div className="empty">
              <div style={{ marginBottom: 14, color: 'var(--ink-faint)' }}>{I.cart({ width: 34, height: 34 })}</div>
              <p style={{ fontWeight: 600, color: 'var(--ink)' }}>Votre panier est vide</p>
              <p style={{ fontSize: 14, marginTop: 6 }}>Parcourez la gamme GRAFEN Professional.</p>
              <button className="btn btn-dark btn-sm" style={{ marginTop: 18 }} onClick={() => { Store.openCart(false); go('/produits'); }}>Voir les produits</button>
            </div>
          ) : t.lines.map((l) => (
            <div className="cline" key={l.ref}>
              <a className="ci" href={'/produit/' + l.p.slug} onClick={() => Store.openCart(false)}><ProductImage p={l.p} note={false} /></a>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div className="row between gap8" style={{ alignItems: 'flex-start' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14.5, lineHeight: 1.25 }}>{l.p.name}</div>
                    <div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 2 }}>{l.p.ref} · {l.p.vol}</div>
                  </div>
                  <button className="icon-btn" style={{ width: 30, height: 30 }} onClick={() => Store.remove(l.ref)} aria-label="Retirer">{I.trash()}</button>
                </div>
                <div className="row between" style={{ marginTop: 10 }}>
                  <Qty value={l.qty} onChange={(q) => Store.setQty(l.ref, q)} />
                  <strong style={{ fontFamily: 'var(--font-display)', fontSize: 16 }}>{eur(l.p.ttc * l.qty)}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
        {t.lines.length > 0 && (
          <div className="drawer-ft">
            <div className="sumline"><span>Sous-total HT</span><span className="mono">{eur(t.ht)}</span></div>
            <div className="sumline"><span>TVA 20 %</span><span className="mono">{eur(t.tva)}</span></div>
            <div className="sumline"><span>Livraison</span><span className="mono">{eur(t.shipping)}</span></div>
            <div className="sumline total"><span>Total TTC</span><span>{eur(t.grand)}</span></div>
            <button className="btn btn-red btn-block btn-lg" style={{ marginTop: 16 }} onClick={() => { Store.openCart(false); go('/checkout'); }}>
              Passer la commande {I.arrow()}
            </button>
            <button className="btn btn-ghost btn-block btn-sm" style={{ marginTop: 10 }} onClick={() => { Store.openCart(false); go('/panier'); }}>Voir le panier détaillé</button>
          </div>
        )}
      </aside>
    </React.Fragment>
  );
}

/* ---------- footer ---------- */
function Footer() {
  return (
    <footer className="ftr">
      <div className="wrap">
        <div className="ftr-grid">
          <div>
            <div className="logo" style={{ fontSize: 26 }}><span className="jel">JEL</span><span className="auto">SPRAY</span><span className="dot" /></div>
            <p style={{ marginTop: 16, fontSize: 14.5, maxWidth: 320, lineHeight: 1.6 }}>
              Distributeur officiel de la gamme <strong style={{ color: '#fff' }}>GRAFEN Professional</strong> en France. Chimie automobile pour particuliers et professionnels.
            </p>
            <p className="mono" style={{ marginTop: 18, fontSize: 12, color: 'var(--on-dark)' }}>EURL JELTRADE · 49100 ANGERS FRANCE</p>
          </div>
          <div>
            <h4>Boutique</h4>
            <a href="/produits">Tous les produits</a>
            <a href="/produits?cat=nettoyage">Nettoyage</a>
            <a href="/produits?cat=lubrification">Lubrification</a>
            <a href="/produits?cat=colles">GRAFLOCK</a>
            <a href="/blog">Blog & conseils</a>
          </div>
          <div>
            <h4>Ressources</h4>
            <a href="/blog">Blog & conseils</a>
            <a href="/produits?cat=colles">GRAFLOCK</a>
            <a href="/contact">Nous contacter</a>
          </div>
          <div>
            <h4>Informations</h4>
            <a href="/contact">Contact</a>
            <a href="/mentions-legales">Mentions légales</a>
            <a href="/cgv">CGV</a>
            <a href="/contact">contact@jeltrade.fr</a>
          </div>
        </div>
        <div className="ftr-bottom">
          <span className="mono">© 2026 EURL JELTRADE · SIRET 990 453 797 00013 · TVA FR7699045379</span>
          <span className="mono">Distributeur officiel GRAFEN Professional · France</span>
        </div>
      </div>
    </footer>
  );
}

/* ---------- shared bits ---------- */
function Breadcrumb({ items }) {
  return (
    <div className="row gap8 mono" style={{ fontSize: 12, color: 'var(--ink-faint)', flexWrap: 'wrap' }}>
      {items.map((it, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span>/</span>}
          {it.href ? <a href={it.href} style={{ color: 'var(--ink-soft)' }}>{it.label}</a> : <span style={{ color: 'var(--ink)' }}>{it.label}</span>}
        </React.Fragment>
      ))}
    </div>
  );
}

function PageHead({ kicker, title, sub }) {
  return (
    <div style={{ maxWidth: 720 }}>
      {kicker && <div className="kicker" style={{ marginBottom: 12 }}>{kicker}</div>}
      <h1 className="display" style={{ fontSize: 'clamp(34px,5vw,52px)' }}>{title}</h1>
      {sub && <p style={{ marginTop: 16, fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.6 }}>{sub}</p>}
    </div>
  );
}

Object.assign(window, {
  eur, go, Store, useStore, cartLines, cartTotals, I,
  ProductImage, ProductSlide, photoSrc, REFS_WITH_PHOTOS, Qty, ProductCard, Header, CartDrawer, Footer, Breadcrumb, PageHead, D,
});
