/* ===================== JELSPRAY — UI shared layer ===================== */
import React, { useState, useEffect, useRef, useCallback, createContext, useContext } from 'react';
import { createRoot } from 'react-dom/client';
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

/* ===================== JELSPRAY — Accueil ===================== */
function Hero() {
  const feat = D.byRef['GPMP'];
  return (
    <section style={{ position: 'relative', overflow: 'hidden' }}>
      {/* subtle red glow accent */}
      <div style={{ position: 'absolute', top: -120, right: -80, width: 520, height: 520, borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(204,0,0,.10), transparent 65%)', pointerEvents: 'none' }} />
      <div className="wrap" style={{ paddingTop: 72, paddingBottom: 84, position: 'relative' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.05fr .95fr', gap: 56, alignItems: 'center' }} className="hero-grid">
          <div>
            <div className="eyebrow-row" style={{ maxWidth: 360 }}>
              <span className="kicker">Distributeur officiel</span>
              <span className="line" />
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(42px,6.2vw,76px)' }}>
              La chimie auto<span style={{ color: 'var(--red)' }}>.</span><br />de niveau pro.
            </h1>
            <p style={{ marginTop: 22, fontSize: 19, color: 'var(--ink-soft)', lineHeight: 1.6, maxWidth: 480 }}>
              La gamme <strong style={{ color: 'var(--ink)' }}>GRAFEN Professional</strong> — nettoyants, lubrifiants, dérouillants et étanchéité filetage GRAFLOCK. Pour les garages comme pour les passionnés.
            </p>
            <div className="row gap12" style={{ marginTop: 30, flexWrap: 'wrap' }}>
              <a href="/produits" className="btn btn-red btn-lg">Découvrir la gamme {I.arrow()}</a>
              <a href="/produits?cat=colles" className="btn btn-ghost btn-lg">Étanchéité filetage GRAFLOCK</a>
            </div>
            <div className="row gap24" style={{ marginTop: 38, flexWrap: 'wrap' }}>
              {[['21', 'références'], ['7', 'catégories'], ['24 h', 'réponse conseil']].map(([n, l]) => (
                <div key={l}>
                  <div className="display" style={{ fontSize: 26 }}>{n}</div>
                  <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.08em', marginTop: 2 }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* featured composition */}
          <div style={{ position: 'relative' }}>
            <div className="card" style={{ padding: 26, boxShadow: 'var(--shadow-lg)', borderRadius: 'var(--radius-lg)' }}>
              <div className="row between" style={{ marginBottom: 16 }}>
                <span className="tag badge-star">Best-seller</span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{feat.ref}</span>
              </div>
              <a href={'/produit/' + feat.slug}><ProductImage p={feat} note /></a>
              <div className="row between" style={{ marginTop: 18, alignItems: 'flex-end' }}>
                <div>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 20 }}>{feat.name}</div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 3 }}>{feat.vol} · {feat.bullets[0]}</div>
                </div>
              </div>
              <a href={'/produit/' + feat.slug} className="btn btn-dark btn-block" style={{ marginTop: 18 }}>Voir le produit {I.arrow()}</a>
            </div>
            {/* floating spec chip */}
            <div className="card" style={{ position: 'absolute', bottom: -22, left: -26, padding: '12px 16px', boxShadow: 'var(--shadow-lg)', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span className="ico">{I.shield({ width: 26, height: 26 })}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14, fontFamily: 'var(--font-display)' }}>5 actions en 1</div>
                <div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>Lubrifie · protège · pénètre</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function TrustBand() {
  const items = [
    [I.shield, 'Distributeur officiel', 'Gamme GRAFEN Professional authentique'],
    [I.truck, 'Livraison France', 'Métropole & Outre-mer'],
    [I.user, 'Particuliers & pros', 'Du flacon au bidon 5 litres'],
    [I.mail, 'Conseil & devis', 'Réponse sous 24 h'],
  ];
  return (
    <div className="wrap" style={{ marginTop: -40, position: 'relative', zIndex: 2 }}>
      <div className="trust" style={{ boxShadow: 'var(--shadow)' }}>
        {items.map(([ic, tt, td], i) => (
          <div className="ti" key={i}>
            <span className="ico">{ic({ width: 22, height: 22 })}</span>
            <div><div className="tt">{tt}</div><div className="td">{td}</div></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Categories() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Le catalogue</div>
            <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>7 familles de produits</h2>
          </div>
          <a href="/produits" className="btn btn-ghost">Tout voir {I.arrow()}</a>
        </div>
        <div className="grid-4">
          {D.CATEGORIES.map((c, i) => {
            const n = D.PRODUCTS.filter((p) => p.cat === c.id).length;
            return (
              <a className="cat-tile" key={c.id} href={'/produits?cat=' + c.id}>
                <span className="carrow">{I.arrowUR()}</span>
                <span className="cnum">0{i + 1} · {n} réf.</span>
                <div className="cname">{c.label}</div>
                <div className="cblurb">{c.blurb}</div>
              </a>
            );
          })}
          <a className="cat-tile" href="/produits" style={{ background: 'var(--ink)', color: '#fff', borderColor: 'var(--ink)' }}>
            <span className="carrow" style={{ color: 'rgba(255,255,255,.6)' }}>{I.arrowUR()}</span>
            <span className="cnum" style={{ color: 'rgba(255,255,255,.55)' }}>Catalogue complet</span>
            <div className="cname" style={{ color: '#fff' }}>Tous les produits</div>
            <div className="cblurb" style={{ color: 'rgba(255,255,255,.65)' }}>Les 21 références GRAFEN</div>
          </a>
        </div>
      </div>
    </section>
  );
}

function BestSellers() {
  const items = D.bestSellers.slice(0, 4).map((r) => D.byRef[r]);
  return (
    <section className="section tight">
      <div className="wrap">
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Les plus demandés</div>
            <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>Best-sellers</h2>
          </div>
          <a href="/produits" className="btn btn-ghost">Voir tout {I.arrow()}</a>
        </div>
        <div className="grid-4">{items.map((p) => <ProductCard key={p.ref} p={p} />)}</div>
      </div>
    </section>
  );
}

function GraflockBand() {
  const locks = ['GP3243', 'GP3270', 'GP3272'].map((r) => D.byRef[r]);
  return (
    <section style={{ background: 'var(--dark)', color: 'var(--on-dark)' }} className="section">
      <div className="wrap">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 48, alignItems: 'center' }} className="hero-grid">
          <div>
            <div className="kicker" style={{ marginBottom: 14 }}>Colles & Fixations</div>
            <h2 className="display" style={{ fontSize: 'clamp(30px,4.4vw,46px)', color: '#fff' }}>GRAFLOCK<br />étanchéité filetage</h2>
            <p style={{ marginTop: 18, fontSize: 16.5, color: 'var(--on-dark-soft)', lineHeight: 1.65, maxWidth: 380 }}>
              Bleu, vert, rouge : trois résistances de <strong style={{ color: '#fff' }}>colle anaérobie</strong> pour sécuriser vos assemblages vissés contre les vibrations. Équivalent des LOCTITE 243 / 270 / 272 — le bon code couleur pour chaque charge et chaque température.
            </p>
            <a href="/blog/graflock-quelle-colle" className="btn btn-light" style={{ marginTop: 24 }}>Quelle colle choisir ? {I.arrow()}</a>
          </div>
          <div className="grid-3">
            {locks.map((p) => (
              <a key={p.ref} href={'/produit/' + p.slug} className="card" style={{ background: 'var(--dark-2)', borderColor: 'rgba(255,255,255,.1)', padding: 18, borderRadius: 'var(--radius-lg)', transition: 'transform .16s' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: p.accent, marginBottom: 16, boxShadow: '0 6px 18px -6px ' + p.accent }} />
                <div className="mono" style={{ fontSize: 11.5, color: 'var(--on-dark-soft)' }}>{p.ref}</div>
                <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 16, color: '#fff', marginTop: 4, lineHeight: 1.2 }}>{p.name.split('—')[1]}</div>
                <div style={{ fontSize: 12.5, color: 'var(--on-dark-soft)', marginTop: 8 }}>{p.bullets.slice(0, 2).join(' · ')}</div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function AtelierBand() {
  const ref = useRef(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { setSeen(true); io.disconnect(); } });
    }, { threshold: 0.32 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  const src = optimizedImage('/photos/atelier-expedition.jpg');
  const imgStyle = {
    width: '100%', height: '100%', objectFit: 'cover', display: 'block',
    transition: 'clip-path 1.15s cubic-bezier(.16,.84,.3,1), transform 1.3s cubic-bezier(.16,.84,.3,1)',
    clipPath: seen ? 'polygon(0 0,100% 0,100% 100%,0 100%)' : 'polygon(100% 0,100% 0,100% 100%,100% 100%)',
    transform: seen ? 'scale(1)' : 'scale(1.06)',
  };
  return (
    <section className="section tight">
      <div className="wrap">
        <div ref={ref} className={'atelier-grid' + (seen ? ' atelier-in' : '')}>
          <div className="atelier-photo">
            <img src={src} alt="Entrepôt JELSPRAY — préparation et expédition des commandes" loading="lazy" style={imgStyle} />
            <span className="sheen" />
            <span className="atelier-tag">
              {I.truck({ width: 18, height: 18 })}
              <span className="mono" style={{ fontSize: 11.5, letterSpacing: '.04em' }}>Expédition depuis nos locaux</span>
            </span>
          </div>
          <div className="atelier-copy">
            <div className="kicker" style={{ marginBottom: 12 }}>Au plus près de vous</div>
            <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>Stock, préparation<br />et expédition maison</h2>
            <p style={{ marginTop: 18, fontSize: 16.5, color: 'var(--ink-soft)', lineHeight: 1.65, maxWidth: 420 }}>
              Nos références GRAFEN sont stockées, contrôlées et expédiées directement depuis nos locaux. Chaque commande est préparée à la main et confirmée sous 24 h — du flacon unitaire à la palette complète.
            </p>
            <a href="/contact" className="btn btn-ghost" style={{ marginTop: 24 }}>Nous rendre visite {I.arrow()}</a>
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogTeaser() {
  return (
    <section className="section">
      <div className="wrap">
        <div className="row between" style={{ alignItems: 'flex-end', marginBottom: 30, flexWrap: 'wrap', gap: 14 }}>
          <div>
            <div className="kicker" style={{ marginBottom: 10 }}>Conseils & guides</div>
            <h2 className="display" style={{ fontSize: 'clamp(28px,4vw,42px)' }}>Le blog JELSPRAY</h2>
          </div>
          <a href="/blog" className="btn btn-ghost">Tous les articles {I.arrow()}</a>
        </div>
        <div className="grid-3">{D.POSTS.map((post) => <BlogCard key={post.slug} post={post} />)}</div>
      </div>
    </section>
  );
}

function CtaBand() {
  return (
    <section className="wrap" style={{ paddingBottom: 90 }}>
      <div className="card" style={{ background: 'var(--red)', borderColor: 'var(--red)', borderRadius: 'var(--radius-lg)', padding: 'clamp(32px,5vw,56px)', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 24 }}>
        <div>
          <h2 className="display" style={{ fontSize: 'clamp(26px,3.6vw,40px)', color: '#fff' }}>Une question sur un produit ?</h2>
          <p style={{ marginTop: 12, fontSize: 17, color: 'rgba(255,255,255,.88)', maxWidth: 460 }}>Notre équipe répond aux particuliers comme aux professionnels et confirme chaque commande sous 24 h.</p>
        </div>
        <div className="row gap12" style={{ flexWrap: 'wrap' }}>
          <a href="/contact" className="btn" style={{ background: '#fff', color: 'var(--red)' }}>Nous contacter</a>
          <a href="/produits" className="btn btn-light">Voir le catalogue</a>
        </div>
      </div>
    </section>
  );
}

function HomePage() {
  return (
    <div className="fade-in">
      <Hero />
      <TrustBand />
      <Categories />
      <BestSellers />
      <GraflockBand />
      <AtelierBand />
      <BlogTeaser />
      <CtaBand />
    </div>
  );
}

Object.assign(window, { HomePage });

/* ===================== JELSPRAY — Catalogue & fiche produit ===================== */
function CatalogPage({ params }) {
  const initialCat = params.cat || 'all';
  const [cat, setCat] = useState(initialCat);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('featured');
  useEffect(() => { setCat(params.cat || 'all'); }, [params.cat]);

  let list = D.PRODUCTS.filter((p) => cat === 'all' || p.cat === cat);
  if (q.trim()) {
    const t = q.toLowerCase();
    list = list.filter((p) => (p.name + ' ' + p.ref + ' ' + D.catLabel[p.cat]).toLowerCase().includes(t));
  }
  if (sort === 'price-asc') list = [...list].sort((a, b) => a.ttc - b.ttc);
  if (sort === 'price-desc') list = [...list].sort((a, b) => b.ttc - a.ttc);
  if (sort === 'name') list = [...list].sort((a, b) => a.name.localeCompare(b.name));

  const counts = Object.fromEntries(D.CATEGORIES.map((c) => [c.id, D.PRODUCTS.filter((p) => p.cat === c.id).length]));

  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 40, paddingBottom: 14 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Produits' }]} />
        <div style={{ marginTop: 20 }}>
          <PageHead kicker="Catalogue GRAFEN Professional" title="Tous les produits"
            sub="Chimie automobile professionnelle — nettoyants, lubrifiants, traitements et étanchéité filetage GRAFLOCK." />
        </div>
      </div>

      <div className="wrap" style={{ paddingBottom: 80 }}>
        {/* filter bar */}
        <div className="row between" style={{ flexWrap: 'wrap', gap: 16, marginBottom: 24, alignItems: 'center' }}>
          <div className="row gap8" style={{ flexWrap: 'wrap' }}>
            <button className={'chip' + (cat === 'all' ? ' active' : '')} onClick={() => { setCat('all'); go('/produits'); }}>
              Tous <span className="count">{D.PRODUCTS.length}</span>
            </button>
            {D.CATEGORIES.map((c) => (
              <button key={c.id} className={'chip' + (cat === c.id ? ' active' : '')} onClick={() => { setCat(c.id); go('/produits?cat=' + c.id); }}>
                {c.label} <span className="count">{counts[c.id]}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 12, marginBottom: 26 }}>
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 360 }}>
            <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-faint)' }}>{I.search({ width: 18, height: 18 })}</span>
            <input className="input" style={{ paddingLeft: 42 }} placeholder="Rechercher une référence, un produit…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div className="row gap12">
            <span className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)' }}>{list.length} résultat{list.length > 1 ? 's' : ''}</span>
            <select className="input" style={{ width: 'auto', padding: '10px 14px' }} value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="featured">Tri : pertinence</option>
              <option value="name">Nom A→Z</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="empty"><p style={{ fontWeight: 600, color: 'var(--ink)' }}>Aucun produit trouvé</p><p style={{ marginTop: 6 }}>Essayez un autre mot-clé ou une autre catégorie.</p></div>
        ) : (
          <div className="grid-4">{list.map((p) => <ProductCard key={p.ref} p={p} />)}</div>
        )}
      </div>
    </div>
  );
}

function ProductPage({ params }) {
  const p = D.bySlug[params.slug];
  const [qty, setQty] = useState(1);
  const [view, setView] = useState('product');
  useEffect(() => { setQty(1); setView('product'); window.scrollTo(0, 0); }, [params.slug]);
  if (!p) return <NotFound />;

  const related = D.PRODUCTS.filter((x) => x.cat === p.cat && x.ref !== p.ref).slice(0, 4);
  const posts = D.POSTS.filter((post) => post.related.includes(p.ref));

  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 28 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Produits', href: '/produits' }, { label: D.catLabel[p.cat], href: '/produits?cat=' + p.cat }, { label: p.ref }]} />
      </div>

      <div className="wrap" style={{ paddingTop: 26, paddingBottom: 70 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 52, alignItems: 'start' }} className="hero-grid">
          {/* gallery */}
          <div style={{ position: 'sticky', top: 96 }}>
            <div className="card" style={{ padding: 22, borderRadius: 'var(--radius-lg)' }}>
              <div className="pgal">
                <div className="pgal-track" style={{ transform: view === 'usage' ? 'translateX(-50%)' : 'translateX(0)' }}>
                  <ProductImage p={p} note />
                  <ProductImage p={p} usage note />
                </div>
              </div>
            </div>
            <div className="row gap12" style={{ marginTop: 14 }}>
              {[['product', 'Produit'], ['usage', 'En situation']].map(([v, label]) => (
                <button key={v} onClick={() => setView(v)} className="card" style={{ flex: 1, padding: 10, borderRadius: 12, borderColor: view === v ? 'var(--ink)' : 'var(--line)', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 46, height: 46, flex: 'none' }}><div className={'pimg' + (v === 'usage' ? '' : '')} style={{ borderRadius: 8 }}><span className="pref" style={{ fontSize: 11 }}>{p.ref}</span></div></div>
                  <span style={{ fontSize: 13, fontWeight: 600, color: view === v ? 'var(--ink)' : 'var(--ink-soft)' }}>{label}</span>
                </button>
              ))}
            </div>
            <div className="note" style={{ marginTop: 14 }}>Visuels JELTRADE — <span className="mono" style={{ fontSize: 12 }}>{p.ref}-product.png</span> (bouteille) et <span className="mono" style={{ fontSize: 12 }}>{p.ref}-usage.png</span> (en situation).</div>
          </div>

          {/* info */}
          <div>
            <div className="row gap8" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
              <span className="tag" style={{ color: 'var(--red)', borderColor: '#F3CFCF', background: 'var(--red-tint)' }}>{p.ref}</span>
              <span className="tag">{D.catLabel[p.cat]}</span>
              <span className="tag">{p.vol}</span>
              {p.star && <span className="tag badge-star">Best-seller</span>}
              {p.pro && <span className="tag badge-pro">Format pro</span>}
            </div>
            <h1 className="display" style={{ fontSize: 'clamp(30px,4.2vw,44px)' }}>{p.name}</h1>

            <p style={{ marginTop: 22, fontSize: 16, color: 'var(--ink-soft)', lineHeight: 1.7 }}>{p.desc}</p>

            <div className="grid-2" style={{ gap: 10, marginTop: 24 }}>
              {p.bullets.map((b, i) => (
                <div key={i} className="row gap8" style={{ fontSize: 14.5 }}>
                  <span style={{ color: 'var(--red)', flex: 'none' }}>{I.check({ width: 17, height: 17 })}</span>{b}
                </div>
              ))}
            </div>

            <div className="row gap16" style={{ marginTop: 30, flexWrap: 'wrap' }}>
              <a href="/contact" className="btn btn-red btn-lg" style={{ flex: '1 1 220px', justifyContent: 'center' }}>Demander un devis · nous contacter {I.arrow()}</a>
            </div>

            {p.fds ? (
              <a href={(window.location.protocol==='file:' ? p.fds.replace(/^\//,'') : p.fds)} target="_blank" rel="noopener" download className="btn btn-ghost btn-block" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                <span className="row gap8"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5"/><path d="M14 3H6v18h12V8z"/><path d="M12 12v5M9.5 14.5 12 17l2.5-2.5"/></svg>Fiche de données de sécurité</span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>PDF</span>
              </a>
            ) : (
              <a href="/contact" className="btn btn-ghost btn-block" style={{ marginTop: 12, justifyContent: 'space-between' }}>
                <span className="row gap8"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5"/><path d="M14 3H6v18h12V8z"/><path d="M10 13h4M9 17h6"/></svg>Fiche de données de sécurité</span>
                <span className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>SUR DEMANDE</span>
              </a>
            )}

            <div className="card" style={{ marginTop: 24, padding: 18, display: 'flex', gap: 22, flexWrap: 'wrap' }}>
              <div className="row gap8" style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}><span className="ico">{I.truck({ width: 19, height: 19 })}</span>Livraison France métropolitaine & Outre-mer</div>
              <div className="row gap8" style={{ fontSize: 13.5, color: 'var(--ink-soft)' }}><span className="ico">{I.shield({ width: 19, height: 19 })}</span>Produit GRAFEN Professional authentique</div>
            </div>

            {posts.length > 0 && (
              <div style={{ marginTop: 28 }}>
                <div className="kicker muted" style={{ marginBottom: 12 }}>À lire sur le blog</div>
                {posts.map((post) => (
                  <a key={post.slug} href={'/blog/' + post.slug} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', marginBottom: 10 }}>
                    <span style={{ fontWeight: 600, fontSize: 14.5 }}>{post.title}</span>
                    <span style={{ color: 'var(--red)' }}>{I.arrow()}</span>
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {related.length > 0 && (
          <div style={{ marginTop: 70 }}>
            <div className="eyebrow-row"><h2 className="display" style={{ fontSize: 26 }}>Dans la même catégorie</h2><span className="line" /></div>
            <div className="grid-4">{related.map((r) => <ProductCard key={r.ref} p={r} />)}</div>
          </div>
        )}
      </div>
    </div>
  );
}

function NotFound() {
  return (
    <div className="wrap section" style={{ textAlign: 'center' }}>
      <div className="display" style={{ fontSize: 80, color: 'var(--line-strong)' }}>404</div>
      <h1 className="display" style={{ fontSize: 30, marginTop: 8 }}>Page introuvable</h1>
      <p style={{ marginTop: 12, color: 'var(--ink-soft)' }}>Cette page n'existe pas ou a été déplacée.</p>
      <a href="/" className="btn btn-red" style={{ marginTop: 24 }}>Retour à l'accueil {I.arrow()}</a>
    </div>
  );
}

Object.assign(window, { CatalogPage, ProductPage, NotFound });

/* ===================== JELSPRAY — Panier, Checkout, Compte ===================== */
function CartPage() {
  const s = useStore();
  const t = cartTotals(s.cart);
  if (t.lines.length === 0) {
    return (
      <div className="wrap section fade-in" style={{ textAlign: 'center' }}>
        <PageHead title="Votre panier est vide" sub="Parcourez la gamme GRAFEN Professional pour composer votre commande." />
        <a href="/produits" className="btn btn-red btn-lg" style={{ marginTop: 24 }}>Voir le catalogue {I.arrow()}</a>
      </div>
    );
  }
  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Panier' }]} />
        <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,46px)', marginTop: 18 }}>Votre panier</h1>
      </div>
      <div className="wrap" style={{ paddingTop: 28, paddingBottom: 80, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
        <div className="cart-main">
          <div className="card" style={{ padding: '4px 22px' }}>
            {t.lines.map((l) => (
              <div className="cline" key={l.ref}>
                <a className="ci" href={'/produit/' + l.p.slug}><ProductImage p={l.p} note={false} /></a>
                <div style={{ flex: 1 }}>
                  <div className="row between" style={{ alignItems: 'flex-start' }}>
                    <div>
                      <a href={'/produit/' + l.p.slug}><div style={{ fontWeight: 600, fontSize: 15.5 }}>{l.p.name}</div></a>
                      <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 3 }}>{l.p.ref} · {l.p.vol} · {eur(l.p.ttc)} l'unité</div>
                    </div>
                    <button className="icon-btn" style={{ width: 32, height: 32 }} onClick={() => Store.remove(l.ref)} aria-label="Retirer">{I.trash()}</button>
                  </div>
                  <div className="row between" style={{ marginTop: 12 }}>
                    <Qty value={l.qty} onChange={(q) => Store.setQty(l.ref, q)} />
                    <strong style={{ fontFamily: 'var(--font-display)', fontSize: 18 }}>{eur(l.p.ttc * l.qty)}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <a href="/produits" className="btn btn-ghost" style={{ marginTop: 18 }}>{I.arrow({ style: { transform: 'rotate(180deg)' } })} Continuer mes achats</a>
        </div>
        <OrderSummary t={t} cta />
      </div>
    </div>
  );
}

function OrderSummary({ t, cta }) {
  return (
    <div className="card" style={{ padding: 22, position: 'sticky', top: 96 }}>
      <h3 style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>Récapitulatif</h3>
      <div style={{ marginTop: 14 }}>
        <div className="sumline"><span>Sous-total HT</span><span className="mono">{eur(t.ht)}</span></div>
        <div className="sumline"><span>TVA 20 %</span><span className="mono">{eur(t.tva)}</span></div>
        <div className="sumline"><span>Livraison (forfait)</span><span className="mono">{eur(t.shipping)}</span></div>
        <div className="sumline total"><span>Total TTC</span><span>{eur(t.grand)}</span></div>
      </div>
      {cta && <a href="/checkout" className="btn btn-red btn-block btn-lg" style={{ marginTop: 18 }}>Passer la commande {I.arrow()}</a>}
      <p className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 14, lineHeight: 1.5 }}>Phase 1 — aucun paiement en ligne. Votre commande est transmise par email, confirmée sous 24 h.</p>
    </div>
  );
}

function genOrderNo() {
  const n = String(Math.floor(40 + Math.random() * 99950)).padStart(5, '0');
  return 'JT-2026-' + n;
}

function CheckoutPage() {
  const s = useStore();
  const t = cartTotals(s.cart);
  const u = s.user || {};
  const [f, setF] = useState({ prenom: u.prenom || '', nom: u.nom || '', email: u.email || '', tel: u.tel || '', adresse: u.adresse || '', cp: u.cp || '', ville: u.ville || '', message: '' });
  const [errs, setErrs] = useState({});
  const [sending, setSending] = useState(false);
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));

  useEffect(() => { if (t.lines.length === 0) go('/panier'); }, []);

  const validate = () => {
    const e = {};
    ['prenom', 'nom', 'email', 'tel', 'adresse', 'cp', 'ville'].forEach((k) => { if (!f[k].trim()) e[k] = 'Requis'; });
    if (f.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) e.email = 'Email invalide';
    if (f.cp && !/^\d{5}$/.test(f.cp.trim())) e.cp = 'Code postal à 5 chiffres';
    setErrs(e);
    return Object.keys(e).length === 0;
  };

  const submit = () => {
    if (!validate()) { window.scrollTo(0, 0); return; }
    setSending(true);
    const no = genOrderNo();
    const recap = t.lines.map((l) => l.qty + '× ' + l.p.name + ' (' + l.ref + ' · ' + l.p.vol + ')').join('\n');
    window.netlifySubmit('commande', {
      numero: no,
      nom: f.prenom + ' ' + f.nom,
      email: f.email,
      tel: f.tel,
      adresse: f.adresse + ', ' + f.cp + ' ' + f.ville,
      commande: recap,
      total: eur(t.grand),
      message: f.message || '',
    }).catch(function () {});
    setTimeout(() => {
      const order = {
        no, date: new Date().toISOString(), status: 'pending',
        items: t.lines.map((l) => ({ ref: l.ref, name: l.p.name, vol: l.p.vol, qty: l.qty, ttc: l.p.ttc })),
        ht: t.ht, tva: t.tva, shipping: t.shipping, grand: t.grand,
        client: { ...f },
      };
      const orders = [order, ...s.orders];
      localStorage.setItem('jl_lastorder', JSON.stringify(order));
      Store.set({ orders, cart: [] });
      go('/checkout/success');
    }, 1100);
  };

  if (t.lines.length === 0) return null;
  const F = (k, label, opts = {}) => (
    <div className="field" style={opts.span ? { gridColumn: '1 / -1' } : {}}>
      <label>{label} {!opts.optional && <span className="req">*</span>}</label>
      {opts.area
        ? <textarea className="input" value={f[k]} onChange={set(k)} placeholder={opts.ph || ''} />
        : <input className="input" value={f[k]} onChange={set(k)} placeholder={opts.ph || ''} style={errs[k] ? { borderColor: 'var(--red)' } : {}} />}
      {errs[k] && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errs[k]}</span>}
    </div>
  );

  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Panier', href: '/panier' }, { label: 'Commande' }]} />
        <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,46px)', marginTop: 18 }}>Finaliser la commande</h1>
        {!s.user && (
          <div className="note" style={{ marginTop: 18, maxWidth: 640, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <span>Déjà client ? Connectez-vous pour préremplir vos informations.</span>
            <a href="/compte/connexion" className="btn btn-ghost btn-sm">Se connecter</a>
          </div>
        )}
      </div>
      <div className="wrap" style={{ paddingTop: 26, paddingBottom: 80, display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
        <div className="cart-main">
          <div className="card" style={{ padding: 24 }}>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Vos coordonnées</h3>
            <div className="grid-2" style={{ gap: 16 }}>
              {F('prenom', 'Prénom')}
              {F('nom', 'Nom')}
              {F('email', 'Email', { ph: 'vous@exemple.fr' })}
              {F('tel', 'Téléphone', { ph: '06 12 34 56 78' })}
            </div>
            <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', margin: '24px 0 16px' }}>Adresse de livraison <span className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', fontWeight: 400 }}>· France uniquement</span></h3>
            <div className="grid-2" style={{ gap: 16 }}>
              {F('adresse', 'Adresse', { span: true, ph: 'N° et rue' })}
              {F('cp', 'Code postal', { ph: '49100' })}
              {F('ville', 'Ville')}
              {F('message', 'Message (optionnel)', { span: true, area: true, optional: true, ph: 'Précisions sur votre commande…' })}
            </div>
          </div>
        </div>
        <div>
          <div className="card" style={{ padding: 22 }}>
            <h3 style={{ fontSize: 17, fontFamily: 'var(--font-display)' }}>Votre commande</h3>
            <div style={{ margin: '14px 0', maxHeight: 220, overflowY: 'auto' }}>
              {t.lines.map((l) => (
                <div key={l.ref} className="row between" style={{ padding: '7px 0', fontSize: 13.5 }}>
                  <span style={{ color: 'var(--ink-soft)' }}><span className="mono" style={{ color: 'var(--ink)' }}>{l.qty}×</span> {l.p.name}</span>
                  <span className="mono">{eur(l.p.ttc * l.qty)}</span>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '6px 0 10px' }} />
            <div className="sumline"><span>Sous-total HT</span><span className="mono">{eur(t.ht)}</span></div>
            <div className="sumline"><span>TVA 20 %</span><span className="mono">{eur(t.tva)}</span></div>
            <div className="sumline"><span>Livraison</span><span className="mono">{eur(t.shipping)}</span></div>
            <div className="sumline total"><span>Total TTC</span><span>{eur(t.grand)}</span></div>
            <button className="btn btn-red btn-block btn-lg" style={{ marginTop: 18 }} disabled={sending} onClick={submit}>
              {sending ? <React.Fragment><span className="spin" /> Envoi…</React.Fragment> : <React.Fragment>Envoyer ma commande {I.arrow()}</React.Fragment>}
            </button>
            <p className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', marginTop: 14, lineHeight: 1.5 }}>Votre commande sera transmise à contact@jeltrade.fr. L'équipe vous contactera sous 24 h pour confirmer et organiser le paiement.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function SuccessPage() {
  const order = (() => { try { return JSON.parse(localStorage.getItem('jl_lastorder')); } catch { return null; } })();
  useEffect(() => { window.scrollTo(0, 0); }, []);
  if (!order) return <NotFound />;
  return (
    <div className="wrap fade-in" style={{ paddingTop: 56, paddingBottom: 90, maxWidth: 720 }}>
      <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--red-tint)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>{I.check({ width: 30, height: 30 })}</div>
      <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,44px)' }}>Commande bien reçue !</h1>
      <p style={{ marginTop: 16, fontSize: 17, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
        Votre commande a bien été reçue. L'équipe JELSPRAY vous contactera sous 24 h pour confirmer et organiser le paiement.
      </p>
      <div className="card" style={{ marginTop: 26, padding: 24 }}>
        <div className="row between" style={{ flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div className="kicker muted">Numéro de commande</div>
            <div className="display" style={{ fontSize: 26, marginTop: 6 }}>{order.no}</div>
          </div>
          <span className="tag" style={{ alignSelf: 'flex-start' }}>Statut : en attente</span>
        </div>
        <div className="divider" style={{ margin: '20px 0' }} />
        {order.items.map((it) => (
          <div key={it.ref} className="row between" style={{ padding: '6px 0', fontSize: 14 }}>
            <span><span className="mono">{it.qty}×</span> {it.name} <span className="mono" style={{ color: 'var(--ink-faint)', fontSize: 12 }}>({it.ref})</span></span>
            <span className="mono">{eur(it.ttc * it.qty)}</span>
          </div>
        ))}
        <div className="divider" style={{ margin: '14px 0 10px' }} />
        <div className="sumline"><span>Sous-total HT</span><span className="mono">{eur(order.ht)}</span></div>
        <div className="sumline"><span>TVA 20 %</span><span className="mono">{eur(order.tva)}</span></div>
        <div className="sumline"><span>Livraison</span><span className="mono">{eur(order.shipping)}</span></div>
        <div className="sumline total"><span>Total TTC</span><span>{eur(order.grand)}</span></div>
      </div>
      <div className="note" style={{ marginTop: 20, display: 'flex', gap: 12 }}>
        <span className="ico">{I.mail({ width: 20, height: 20 })}</span>
        <span>Un email de confirmation a été envoyé à <strong>{order.client.email}</strong>, et la commande transmise à contact@jeltrade.fr.</span>
      </div>
      <div className="row gap12" style={{ marginTop: 26, flexWrap: 'wrap' }}>
        <a href="/produits" className="btn btn-dark">Continuer mes achats</a>
        <a href="/compte/commandes" className="btn btn-ghost">Voir mes commandes</a>
      </div>
    </div>
  );
}

Object.assign(window, { CartPage, OrderSummary, CheckoutPage, SuccessPage });

/* ===================== JELSPRAY — Blog, Compte, Contact, Légal ===================== */
const fmtDate = (iso) => new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

function BlogCard({ post }) {
  return (
    <a href={'/blog/' + post.slug} className="card fade-in" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column', transition: 'transform .16s, box-shadow .16s' }}
      onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = 'var(--shadow-lg)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
      <div style={{ aspectRatio: '16/10', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#EFEDE7 0 2px,transparent 2px 11px), linear-gradient(160deg,#FBFAF8,#ECEAE3)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {(() => { const cr = post.related.find((r) => REFS_WITH_PHOTOS.has(r)); const cv = post.cover ? optimizedImage(post.cover) : (cr ? photoSrc(cr, 'usage') : null); return cv
          ? <img src={cv} alt={post.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : <span className="mono" style={{ fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>image de couverture</span>; })()}
        <span className="tag" style={{ position: 'absolute', top: 14, left: 14, background: 'var(--surface)' }}>{post.cat}</span>
      </div>
      <div style={{ padding: 20, display: 'flex', flexDirection: 'column', flex: 1 }}>
        <div className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)' }}>{fmtDate(post.date)} · {post.read}</div>
        <h3 style={{ fontSize: 18.5, marginTop: 8, lineHeight: 1.22 }}>{post.title}</h3>
        <p style={{ marginTop: 10, fontSize: 14, color: 'var(--ink-soft)', lineHeight: 1.55 }}>{post.excerpt}</p>
        <span className="row gap8" style={{ marginTop: 16, color: 'var(--red)', fontWeight: 600, fontSize: 14 }}>Lire l'article {I.arrow()}</span>
      </div>
    </a>
  );
}

function BlogList({ params }) {
  const cats = ['Tous', ...Array.from(new Set(D.POSTS.map((p) => p.cat)))];
  const [cat, setCat] = useState('Tous');
  const list = D.POSTS.filter((p) => cat === 'Tous' || p.cat === cat);
  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Blog' }]} />
        <div style={{ marginTop: 20 }}>
          <PageHead kicker="Conseils & guides" title="Le blog JELSPRAY" sub="Mode d'emploi, comparatifs et entretien : tirez le meilleur de la gamme GRAFEN Professional." />
        </div>
        <div className="row gap8" style={{ marginTop: 26, flexWrap: 'wrap' }}>
          {cats.map((c) => <button key={c} className={'chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)}>{c}</button>)}
        </div>
      </div>
      <div className="wrap" style={{ paddingTop: 30, paddingBottom: 80 }}>
        <div className="grid-3">{list.map((p) => <BlogCard key={p.slug} post={p} />)}</div>
      </div>
    </div>
  );
}

function BlogArticle({ params }) {
  const post = D.POSTS.find((p) => p.slug === params.slug);
  useEffect(() => { window.scrollTo(0, 0); }, [params.slug]);
  if (!post) return <NotFound />;
  const related = post.related.map((r) => D.byRef[r]).filter(Boolean);
  const coverRef = post.related.find((r) => REFS_WITH_PHOTOS.has(r));
  const coverSrc = post.cover ? optimizedImage(post.cover) : (coverRef ? photoSrc(coverRef, 'usage') : null);
  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 36, maxWidth: 800 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Blog', href: '/blog' }, { label: post.cat }]} />
        <span className="tag" style={{ marginTop: 22, display: 'inline-flex' }}>{post.cat}</span>
        <h1 className="display" style={{ fontSize: 'clamp(30px,4.6vw,48px)', marginTop: 14 }}>{post.title}</h1>
        <div className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 14 }}>{fmtDate(post.date)} · {post.read} de lecture</div>
      </div>
      <div className="wrap" style={{ maxWidth: 800, paddingTop: 26 }}>
        <div style={{ aspectRatio: '16/8', borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'repeating-linear-gradient(135deg,#EFEDE7 0 2px,transparent 2px 11px), linear-gradient(160deg,#FBFAF8,#ECEAE3)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {coverSrc
            ? <img src={coverSrc} alt={post.title} loading="lazy" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            : <span className="mono" style={{ fontSize: 11, letterSpacing: '.12em', textTransform: 'uppercase', color: 'var(--ink-faint)' }}>image de couverture</span>}
        </div>
      </div>
      <article className="wrap" style={{ maxWidth: 720, paddingTop: 36, paddingBottom: 30 }}>
        <p style={{ fontSize: 19, lineHeight: 1.6, color: 'var(--ink)', fontWeight: 500 }}>{post.excerpt}</p>
        {post.body.map((b, i) => (
          <div key={i} style={{ marginTop: 34 }}>
            <h2 className="display" style={{ fontSize: 23, marginBottom: b.sub ? 4 : 11, color: b.accent || 'var(--ink)' }}>
              {b.h}{b.note && <span className="mono" style={{ fontSize: 13, fontWeight: 400, letterSpacing: '.02em', color: 'var(--ink-faint)', marginLeft: 8 }}>({b.note})</span>}
            </h2>
            {b.sub && <div className="mono" style={{ fontSize: 12, letterSpacing: '.05em', textTransform: 'uppercase', color: b.accent || 'var(--ink-faint)', marginBottom: 13 }}>{b.sub}</div>}
            {(Array.isArray(b.p) ? b.p : b.p ? [b.p] : []).map((para, j) => (
              <p key={j} style={{ fontSize: 16.5, lineHeight: 1.75, color: 'var(--ink-soft)', marginTop: j ? 14 : 0 }}>{para}</p>
            ))}
            {b.bullets && (
              <ul style={{ margin: '17px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {b.bullets.map((it, j) => (
                  <li key={j} style={{ position: 'relative', paddingLeft: 20, fontSize: 16.5, lineHeight: 1.7, color: 'var(--ink-soft)' }}>
                    <span style={{ position: 'absolute', left: 0, top: 11, width: 7, height: 7, borderRadius: '50%', background: 'var(--red)' }} />
                    {typeof it === 'string' ? it : <React.Fragment><strong style={{ color: 'var(--ink)' }}>{it.lead}</strong> — {it.text}</React.Fragment>}
                  </li>
                ))}
              </ul>
            )}
            {(Array.isArray(b.after) ? b.after : b.after ? [b.after] : []).map((para, j) => (
              <p key={'a' + j} style={{ fontSize: 16.5, lineHeight: 1.75, color: 'var(--ink-soft)', marginTop: 16 }}>{para}</p>
            ))}
            {b.table && (
              <div style={{ overflowX:'auto', marginTop:18 }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:14 }}>
                  <thead><tr>{b.table.head.map((h,j)=><th key={j} style={{textAlign:'left',padding:'10px 12px',borderBottom:'1px solid var(--line)',color:'var(--ink)'}}>{h}</th>)}</tr></thead>
                  <tbody>{b.table.rows.map((row,i)=><tr key={i}>{row.map((cell,j)=><td key={j} style={{padding:'10px 12px',borderBottom:'1px solid var(--line)',color:'var(--ink-soft)'}}>{cell}</td>)}</tr>)}</tbody>
                </table>
              </div>
            )}
            {(b.usage || b.temp) && (
              <div style={{ marginTop: 16, borderLeft: '2px solid ' + (b.accent || 'var(--line)'), paddingLeft: 16, display: 'flex', flexDirection: 'column', gap: 7 }}>
                {b.usage && <div style={{ fontSize: 15, lineHeight: 1.55, color: 'var(--ink-soft)' }}><strong style={{ color: 'var(--ink)' }}>Utilisations typiques :</strong> {b.usage}</div>}
                {b.temp && <div style={{ fontSize: 15, color: 'var(--ink-soft)' }}><strong style={{ color: 'var(--ink)' }}>Plage de température :</strong> {b.temp}</div>}
              </div>
            )}
            {b.table && (
              <div style={{ marginTop: 14, overflowX: 'auto' }}>
                <table className="cmp-table">
                  <thead><tr>{b.table.head.map((c, k) => <th key={k}>{c}</th>)}</tr></thead>
                  <tbody>
                    {b.table.rows.map((r, k) => (
                      <tr key={k}>{r.map((c, m) => (
                        <td key={m}>{m === 1
                          ? <span className="row gap8" style={{ alignItems: 'center' }}><span style={{ width: 11, height: 11, borderRadius: '50%', background: (b.table.dots || [])[k], flex: '0 0 auto' }}></span>{c}</span>
                          : c}</td>
                      ))}</tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {b.img && (
              <figure style={{ margin: '22px 0 0' }}>
                <img src={optimizedImage(b.img)} alt={b.cap || post.title} loading="lazy" style={{ width: '100%', borderRadius: 'var(--radius-lg)', border: '1px solid var(--line)', display: 'block' }} />
                {b.cap && <figcaption className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginTop: 9, letterSpacing: '.03em' }}>{b.cap}</figcaption>}
              </figure>
            )}
          </div>
        ))}
      </article>

      {related.length > 0 && (
        <div className="wrap" style={{ paddingBottom: 80, maxWidth: 1000 }}>
          <div className="card" style={{ padding: 28, background: 'var(--surface-2)' }}>
            <div className="kicker" style={{ marginBottom: 6 }}>Produits associés</div>
            <h2 className="display" style={{ fontSize: 24, marginBottom: 20 }}>Les produits de cet article</h2>
            <div className={'grid-' + Math.min(related.length, 3)}>
              {related.map((p) => (
                <div key={p.ref} className="card" style={{ padding: 14, background: 'var(--surface)' }}>
                  <a href={'/produit/' + p.slug}><ProductImage p={p} note={false} /></a>
                  <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 15, marginTop: 12 }}>{p.name}</div>
                  <div className="row between" style={{ marginTop: 10, alignItems: 'center' }}>
                    <a href={'/produit/' + p.slug} className="btn btn-ghost btn-sm" style={{ width: '100%', justifyContent: 'space-between' }}>Voir le produit {I.arrow()}</a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 

/* ---------------- Compte ---------------- */
function LoginPage() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ prenom: '', nom: '', email: '', tel: '', password: '' });
  const [err, setErr] = useState('');
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!f.email.trim() || !f.password.trim()) { setErr('Email et mot de passe requis.'); return; }
    if (mode === 'register' && (!f.prenom.trim() || !f.nom.trim())) { setErr('Prénom et nom requis.'); return; }
    const user = {
      prenom: f.prenom || 'Client', nom: f.nom || 'JELSPRAY', email: f.email,
      tel: f.tel || '', adresse: '', cp: '', ville: '',
    };
    Store.set({ user });
    go('/compte/profil');
  };
  return (
    <div className="wrap fade-in" style={{ paddingTop: 56, paddingBottom: 90, maxWidth: 460 }}>
      <PageHead title={mode === 'login' ? 'Connexion' : 'Créer un compte'} />
      <div className="card" style={{ padding: 26, marginTop: 24 }}>
        {mode === 'register' && (
          <div className="grid-2" style={{ gap: 14, marginBottom: 14 }}>
            <div className="field"><label>Prénom</label><input className="input" value={f.prenom} onChange={set('prenom')} /></div>
            <div className="field"><label>Nom</label><input className="input" value={f.nom} onChange={set('nom')} /></div>
          </div>
        )}
        <div className="field" style={{ marginBottom: 14 }}><label>Email</label><input className="input" type="email" value={f.email} onChange={set('email')} placeholder="vous@exemple.fr" /></div>
        {mode === 'register' && <div className="field" style={{ marginBottom: 14 }}><label>Téléphone</label><input className="input" value={f.tel} onChange={set('tel')} placeholder="06 12 34 56 78" /></div>}
        <div className="field"><label>Mot de passe</label><input className="input" type="password" value={f.password} onChange={set('password')} placeholder="••••••••" /></div>
        {err && <p style={{ color: 'var(--red)', fontSize: 13, marginTop: 12 }}>{err}</p>}
        <button className="btn btn-red btn-block btn-lg" style={{ marginTop: 18 }} onClick={submit}>{mode === 'login' ? 'Se connecter' : 'Créer mon compte'} {I.arrow()}</button>
        <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: 'var(--ink-soft)' }}>
          {mode === 'login' ? 'Pas encore de compte ? ' : 'Déjà client ? '}
          <button style={{ color: 'var(--red)', fontWeight: 600 }} onClick={() => { setErr(''); setMode(mode === 'login' ? 'register' : 'login'); }}>{mode === 'login' ? 'Créer un compte' : 'Se connecter'}</button>
        </p>
      </div>
      <div className="note" style={{ marginTop: 16, textAlign: 'center' }}>Prototype — la connexion est simulée (aucune donnée réelle n'est enregistrée).</div>
    </div>
  );
}

function AccountShell({ active, children }) {
  const s = useStore();
  if (!s.user) { useEffect(() => { go('/compte/connexion'); }, []); return null; }
  const tabs = [['/compte/profil', 'Mon profil', 'profil'], ['/compte/commandes', 'Mes commandes', 'commandes']];
  return (
    <div className="wrap fade-in" style={{ paddingTop: 40, paddingBottom: 80 }}>
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Mon compte' }]} />
      <div className="row between" style={{ marginTop: 18, flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 className="display" style={{ fontSize: 'clamp(28px,4vw,40px)' }}>Bonjour, {s.user.prenom}</h1>
          <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 6 }}>{s.user.email}</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => { Store.set({ user: null }); go('/'); }}>Se déconnecter</button>
      </div>
      <div className="row gap8" style={{ marginTop: 24, marginBottom: 30, borderBottom: '1px solid var(--line)' }}>
        {tabs.map(([href, label, key]) => (
          <a key={key} href={href} style={{ padding: '12px 4px', marginRight: 22, fontWeight: 600, fontSize: 15, color: active === key ? 'var(--ink)' : 'var(--ink-faint)', borderBottom: active === key ? '2px solid var(--red)' : '2px solid transparent', marginBottom: -1 }}>{label}</a>
        ))}
      </div>
      {children}
    </div>
  );
}

function ProfilePage() {
  const s = useStore();
  const [f, setF] = useState(s.user || {});
  const [saved, setSaved] = useState(false);
  useEffect(() => { setF(s.user || {}); }, [s.user]);
  const set = (k) => (e) => { setF((p) => ({ ...p, [k]: e.target.value })); setSaved(false); };
  const save = () => { Store.set({ user: f }); setSaved(true); setTimeout(() => setSaved(false), 2500); };
  return (
    <AccountShell active="profil">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'start' }} className="hero-grid">
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Informations personnelles</h3>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="field"><label>Prénom</label><input className="input" value={f.prenom || ''} onChange={set('prenom')} /></div>
            <div className="field"><label>Nom</label><input className="input" value={f.nom || ''} onChange={set('nom')} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Email</label><input className="input" value={f.email || ''} onChange={set('email')} /></div>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Téléphone</label><input className="input" value={f.tel || ''} onChange={set('tel')} /></div>
          </div>
        </div>
        <div className="card" style={{ padding: 24 }}>
          <h3 style={{ fontSize: 16, fontFamily: 'var(--font-display)', marginBottom: 16 }}>Adresse de livraison</h3>
          <p className="mono" style={{ fontSize: 11.5, color: 'var(--ink-faint)', marginBottom: 16 }}>Préremplie automatiquement au checkout.</p>
          <div className="grid-2" style={{ gap: 14 }}>
            <div className="field" style={{ gridColumn: '1 / -1' }}><label>Adresse</label><input className="input" value={f.adresse || ''} onChange={set('adresse')} /></div>
            <div className="field"><label>Code postal</label><input className="input" value={f.cp || ''} onChange={set('cp')} /></div>
            <div className="field"><label>Ville</label><input className="input" value={f.ville || ''} onChange={set('ville')} /></div>
          </div>
        </div>
      </div>
      <div className="row gap16" style={{ marginTop: 22 }}>
        <button className="btn btn-red" onClick={save}>Enregistrer</button>
        {saved && <span className="row gap8" style={{ color: 'var(--red)', fontSize: 14, fontWeight: 600 }}>{I.check({ width: 16, height: 16 })} Modifications enregistrées</span>}
      </div>
    </AccountShell>
  );
}

const STATUS = { pending: ['En attente', 'var(--ink-soft)'], confirmed: ['Confirmée', '#2A6FDB'], shipped: ['Expédiée', '#B8860B'], delivered: ['Livrée', '#1F8A4C'] };

function OrdersPage() {
  const s = useStore();
  return (
    <AccountShell active="commandes">
      {s.orders.length === 0 ? (
        <div className="empty"><span className="ico" style={{ color: 'var(--ink-faint)' }}>{I.pkg({ width: 32, height: 32 })}</span><p style={{ fontWeight: 600, color: 'var(--ink)', marginTop: 12 }}>Aucune commande pour le moment</p><a href="/produits" className="btn btn-dark btn-sm" style={{ marginTop: 18 }}>Découvrir la gamme</a></div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {s.orders.map((o) => {
            const st = STATUS[o.status] || STATUS.pending;
            return (
              <a key={o.no} href={'/compte/commande/' + o.no} className="card" style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 14 }}>
                <div>
                  <div className="row gap12" style={{ alignItems: 'center' }}>
                    <span className="display" style={{ fontSize: 18 }}>{o.no}</span>
                    <span className="tag" style={{ color: st[1], borderColor: st[1] + '40' }}>{st[0]}</span>
                  </div>
                  <div className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)', marginTop: 6 }}>{fmtDate(o.date)} · {o.items.reduce((s, i) => s + i.qty, 0)} article(s)</div>
                </div>
                <div className="row gap16" style={{ alignItems: 'center' }}>
                  <span className="price" style={{ fontSize: 19 }}>{eur(o.grand)}</span>
                  <span style={{ color: 'var(--red)' }}>{I.arrow()}</span>
                </div>
              </a>
            );
          })}
        </div>
      )}
    </AccountShell>
  );
}

function OrderDetailPage({ params }) {
  const s = useStore();
  const o = s.orders.find((x) => x.no === params.id);
  if (!s.user) { useEffect(() => { go('/compte/connexion'); }, []); return null; }
  if (!o) return <NotFound />;
  const st = STATUS[o.status] || STATUS.pending;
  return (
    <div className="wrap fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>
      <Breadcrumb items={[{ label: 'Mon compte', href: '/compte/profil' }, { label: 'Commandes', href: '/compte/commandes' }, { label: o.no }]} />
      <div className="row between" style={{ marginTop: 18, flexWrap: 'wrap', gap: 12 }}>
        <h1 className="display" style={{ fontSize: 'clamp(26px,4vw,38px)' }}>Commande {o.no}</h1>
        <span className="tag" style={{ color: st[1], borderColor: st[1] + '40', alignSelf: 'center' }}>{st[0]}</span>
      </div>
      <div className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 8 }}>Passée le {fmtDate(o.date)}</div>

      {/* statut timeline */}
      <div className="card" style={{ padding: 22, marginTop: 24, display: 'flex', justifyContent: 'space-between', gap: 8 }}>
        {Object.entries(STATUS).map(([key, val], i) => {
          const order = ['pending', 'confirmed', 'shipped', 'delivered'];
          const done = order.indexOf(key) <= order.indexOf(o.status);
          return (
            <div key={key} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', background: done ? 'var(--red)' : 'var(--line)', color: done ? '#fff' : 'var(--ink-faint)' }}>{done ? I.check({ width: 15, height: 15 }) : <span className="mono" style={{ fontSize: 12 }}>{i + 1}</span>}</div>
              <div style={{ fontSize: 12, marginTop: 8, color: done ? 'var(--ink)' : 'var(--ink-faint)', fontWeight: done ? 600 : 400 }}>{val[0]}</div>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 14 }}>Articles</h3>
        {o.items.map((it) => (
          <div key={it.ref} className="row between" style={{ padding: '8px 0', fontSize: 14.5, borderBottom: '1px solid var(--line)' }}>
            <span><span className="mono">{it.qty}×</span> {it.name} <span className="mono" style={{ fontSize: 12, color: 'var(--ink-faint)' }}>{it.ref} · {it.vol}</span></span>
            <span className="mono">{eur(it.ttc * it.qty)}</span>
          </div>
        ))}
        <div style={{ marginTop: 14 }}>
          <div className="sumline"><span>Sous-total HT</span><span className="mono">{eur(o.ht)}</span></div>
          <div className="sumline"><span>TVA 20 %</span><span className="mono">{eur(o.tva)}</span></div>
          <div className="sumline"><span>Livraison</span><span className="mono">{eur(o.shipping)}</span></div>
          <div className="sumline total"><span>Total TTC</span><span>{eur(o.grand)}</span></div>
        </div>
      </div>

      <div className="card" style={{ padding: 24, marginTop: 18 }}>
        <h3 style={{ fontSize: 15, fontFamily: 'var(--font-display)', marginBottom: 12 }}>Livraison</h3>
        <p style={{ fontSize: 14.5, color: 'var(--ink-soft)', lineHeight: 1.6 }}>
          {o.client.prenom} {o.client.nom}<br />{o.client.adresse}<br />{o.client.cp} {o.client.ville}<br />{o.client.tel}
        </p>
      </div>
    </div>
  );
}

/* ---------------- Contact ---------------- */
function ContactPage() {
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [err, setErr] = useState('');
  const [f, setF] = useState({ nom: '', email: '', message: '' });
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const submit = () => {
    if (!f.nom.trim() || !f.email.trim() || !f.message.trim()) { setErr('Merci de remplir tous les champs.'); return; }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(f.email)) { setErr('Adresse email invalide.'); return; }
    setErr(''); setSending(true);
    window.netlifySubmit('contact', { nom: f.nom, email: f.email, message: f.message })
      .then(() => { setSending(false); setSent(true); })
      .catch(() => { setSending(false); setErr("Envoi impossible pour le moment. \u00c9crivez-nous \u00e0 contact@jeltrade.fr."); });
  };
  return (
    <div className="fade-in">
      <div className="wrap" style={{ paddingTop: 40 }}>
        <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: 'Contact' }]} />
      </div>
      <div className="wrap" style={{ paddingTop: 22, paddingBottom: 80, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'start' }} >
        <div>
          <PageHead kicker="Nous contacter" title="Une question ?" sub="Particuliers ou professionnels, notre équipe vous répond et confirme chaque commande sous 24 h." />
          <div style={{ marginTop: 30, display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[[I.mail, 'Email', 'contact@jeltrade.fr'], [I.pin, 'Localisation', '49100 ANGERS FRANCE']].map(([ic, t, v], i) => (
              <div key={i} className="row gap16" style={{ padding: '16px 0', borderBottom: '1px solid var(--line)' }}>
                <span className="ico">{ic({ width: 20, height: 20 })}</span>
                <div><div className="mono" style={{ fontSize: 11, color: 'var(--ink-faint)', textTransform: 'uppercase', letterSpacing: '.08em' }}>{t}</div><div style={{ fontWeight: 600, marginTop: 2 }}>{v}</div></div>
              </div>
            ))}
          </div>
          <div className="note" style={{ marginTop: 24 }}>EURL JELTRADE — distributeur officiel de la gamme GRAFEN Professional en France.</div>
        </div>
        <div className="card" style={{ padding: 26 }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '30px 10px' }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--red-tint)', color: 'var(--red)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>{I.check({ width: 26, height: 26 })}</div>
              <h3 style={{ fontSize: 20 }}>Message envoyé</h3>
              <p style={{ marginTop: 10, color: 'var(--ink-soft)' }}>Merci ! Nous vous répondons sous 24 h.</p>
            </div>
          ) : (
            <React.Fragment>
              <h3 style={{ fontSize: 18, fontFamily: 'var(--font-display)', marginBottom: 18 }}>Écrivez-nous</h3>
              <div className="field" style={{ marginBottom: 14 }}><label>Nom</label><input className="input" value={f.nom} onChange={set('nom')} /></div>
              <div className="field" style={{ marginBottom: 14 }}><label>Email</label><input className="input" value={f.email} onChange={set('email')} placeholder="vous@exemple.fr" /></div>
              <div className="field" style={{ marginBottom: 18 }}><label>Message</label><textarea className="input" value={f.message} onChange={set('message')} /></div>
              {err && <p style={{ fontSize: 13, color: 'var(--red)', marginBottom: 14 }}>{err}</p>}
              <button className="btn btn-red btn-block btn-lg" disabled={sending} onClick={submit}>{sending ? <React.Fragment><span className="spin" /> Envoi…</React.Fragment> : <React.Fragment>Envoyer {I.arrow()}</React.Fragment>}</button>
            </React.Fragment>
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------------- Légal ---------------- */
function LegalPage({ kind }) {
  const mentions = [
    ['Éditeur du site', 'Le site JELSPRAY est édité par EURL JELTRADE, distributeur officiel de la gamme GRAFEN Professional en France — 49100 ANGERS FRANCE. SIRET : 990 453 797 00013. TVA intracommunautaire : FR7699045379.'],
    ['Contact', 'Email : contact@jeltrade.fr.'],
    ['Hébergement', 'Le site est hébergé sur une infrastructure cloud sécurisée, conforme aux standards en vigueur.'],
    ['Propriété intellectuelle', "L'ensemble des contenus (textes, marques, visuels) est protégé. La marque GRAFEN Professional est distribuée par JELTRADE dans le respect des droits du fabricant."],
    ['Données personnelles (RGPD)', "Les données collectées servent uniquement au traitement des commandes et à la relation client. Elles ne font l'objet d'aucune revente à des tiers. Vous disposez d'un droit d'accès, de rectification et de suppression en écrivant à contact@jeltrade.fr."],
  ];
  const cgv = [
    ['Objet et champ d’application', [
      "Les présentes Conditions Générales de Vente (CGV) régissent exclusivement les ventes de produits et services effectuées par JELTRADE auprès de clients professionnels (B2B), en France et à l’international.",
      "Toute commande implique l’adhésion sans réserve du client aux présentes CGV, qui prévalent sur tout autre document, sauf accord écrit et signé par JELTRADE.",
      "JELTRADE se réserve le droit de modifier ses tarifs et les présentes CGV à tout moment et sans préavis. Les conditions applicables sont celles en vigueur à la date de confirmation de la commande par JELTRADE.",
    ]],
    ['Produits et services', [
      "JELTRADE est spécialisée dans le négoce, l’import-export et la commercialisation de pièces techniques et équipements industriels ainsi que dans la prestation de services associés (formation, consulting, support technique).",
      "Les caractéristiques techniques et visuels figurant dans nos catalogues, fiches techniques et documents commerciaux sont donnés à titre indicatif et peuvent être modifiés sans préavis.",
    ]],
    ['Devis et commandes', [
      { lead: '3.1 Devis', text: "Les devis émis par JELTRADE ont une validité de 30 jours à compter de leur date d’émission, sauf mention contraire." },
      { lead: '3.2 Commandes', text: "Une commande n’est définitive qu’après confirmation écrite de JELTRADE (accusé de réception ou proforma) et, le cas échéant, encaissement de l’acompte convenu." },
      { lead: '3.3 Modification / annulation', text: "Toute demande de modification ou d’annulation doit être validée par JELTRADE et pourra donner lieu à facturation des frais engagés." },
    ]],
    ['Prix', [
      "Les prix sont exprimés en euros, hors taxes et hors frais de transport, droits de douane et assurances.",
      "Ils sont fixés selon les tarifs en vigueur au jour de l’acceptation de la commande.",
      "Les tarifs peuvent être révisés à tout moment sans préavis. Les modifications ne s’appliquent pas aux commandes déjà confirmées.",
      "JELTRADE se réserve le droit de les réviser en cas de variation significative des coûts (matières premières, transport, taux de change, etc.).",
    ]],
    ['Conditions de paiement', [
      { lead: '5.1 Modalités', text: "Sauf stipulation contraire, les factures sont payables à 30 jours fin de mois, par virement bancaire." },
      { lead: '5.2 Acompte', text: "Un acompte de 50 % du montant total TTC pourra être exigé à la commande, le solde étant payable selon les modalités convenues." },
      { lead: '5.3 Retard de paiement', text: "Tout retard entraîne de plein droit :" },
      { bullets: [
        "Des pénalités calculées au taux BCE + 10 points,",
        "Une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 du Code de commerce),",
      ] },
      "sans préjudice des dommages et intérêts supplémentaires.",
      { lead: '5.4 Suspension', text: "En cas de retard, JELTRADE pourra suspendre ou annuler les commandes en cours." },
    ]],
    ['Livraison', [
      { lead: '6.1 Incoterms', text: "Sauf accord contraire, les livraisons sont effectuées EXW (Ex Works) depuis notre entrepôt." },
      { lead: '6.2 Délais', text: "Les délais sont donnés à titre indicatif. Un retard ne peut justifier l’annulation de la commande ni donner lieu à pénalités, sauf engagement écrit." },
      { lead: '6.3 Transfert de risques', text: "Les risques sont transférés au client dès la remise des marchandises au transporteur." },
      { lead: '6.4 Réserves', text: "Le client doit vérifier l’état des marchandises à réception et émettre toute réserve sur le bon de livraison, confirmée par écrit sous 48 h." },
    ]],
    ['Réserve de propriété', [
      "JELTRADE conserve la propriété des produits livrés jusqu’au paiement intégral du prix (loi n°80-335 du 12 mai 1980).",
      "En cas de non-paiement, JELTRADE pourra exiger la restitution immédiate des produits, aux frais du client.",
    ]],
    ['Garanties, retours et responsabilité', [
      { lead: '8.1 Garantie légale', text: "Les produits bénéficient de la garantie légale contre les vices cachés (art. 1641 et s. du Code civil), limitée au remplacement ou au remboursement des produits défectueux." },
      { lead: '8.2 Exclusions', text: "La garantie ne couvre pas les défauts dus à une mauvaise utilisation, un stockage inadapté, une usure normale ou une modification du produit." },
      { lead: '8.3 Retours', text: "Tout retour doit faire l’objet d’une demande préalable écrite auprès de JELTRADE et être validé par écrit. Les retours doivent être effectués franco de port et d’emballage à l’adresse indiquée par JELTRADE." },
      "En cas d’erreur imputable au client (mauvaise commande, référence incorrecte…), un abattement forfaitaire de 20 % sera appliqué sur le montant des produits retournés, afin de couvrir les frais de gestion.",
      "En cas d’erreur imputable à JELTRADE, le remboursement ou l’échange sera effectué sans frais pour le client.",
      { lead: '8.4 Limitation de responsabilité', text: "La responsabilité de JELTRADE est limitée au montant de la commande et ne couvre pas les pertes indirectes (perte d’exploitation, manque à gagner…)." },
    ]],
    ['Force majeure', [
      "Aucune des parties ne pourra être tenue responsable si l’exécution du contrat est retardée ou empêchée par un cas de force majeure (grève, incendie, inondation, épidémie, guerre, blocage des transports, pénurie de matières premières…).",
    ]],
    ['Propriété intellectuelle et confidentialité', [
      "Tous documents techniques, visuels, devis, plans et données fournis par JELTRADE restent sa propriété exclusive. Ils ne peuvent être reproduits ou communiqués à des tiers sans accord écrit.",
      "Les informations confidentielles échangées entre les parties ne peuvent être divulguées sans autorisation.",
    ]],
    ['Protection des données', [
      "JELTRADE traite les données à caractère personnel de ses clients conformément à la réglementation en vigueur (RGPD).",
      "Les données sont conservées pendant la durée de la relation commerciale et peuvent être supprimées sur simple demande écrite.",
    ]],
    ['Loi applicable et juridiction compétente', [
      "Les présentes CGV sont soumises au droit français.",
      "Tout litige sera soumis au Tribunal de commerce d’Angers, même en cas de pluralité de défendeurs ou d’appel en garantie.",
    ]],
  ];
  const data = kind === 'cgv' ? cgv : mentions;
  const renderBody = (p) => (Array.isArray(p) ? p : [p]).map((blk, j) => {
    if (typeof blk === 'string') return <p key={j} style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-soft)', marginTop: j ? 12 : 0 }}>{blk}</p>;
    if (blk.bullets) return <ul key={j} style={{ margin: '12px 0 0', paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 7 }}>{blk.bullets.map((b, k) => <li key={k} style={{ fontSize: 15.5, lineHeight: 1.6, color: 'var(--ink-soft)' }}>{b}</li>)}</ul>;
    return <p key={j} style={{ fontSize: 15.5, lineHeight: 1.7, color: 'var(--ink-soft)', marginTop: j ? 12 : 0 }}><strong style={{ color: 'var(--ink)' }}>{blk.lead}</strong> — {blk.text}</p>;
  });
  return (
    <div className="wrap fade-in" style={{ paddingTop: 40, paddingBottom: 80, maxWidth: 760 }}>
      <Breadcrumb items={[{ label: 'Accueil', href: '/' }, { label: kind === 'cgv' ? 'CGV' : 'Mentions légales' }]} />
      <h1 className="display" style={{ fontSize: 'clamp(30px,4.4vw,44px)', marginTop: 18 }}>{kind === 'cgv' ? 'Conditions Générales de Vente' : 'Mentions légales'}</h1>
      <p className="mono" style={{ fontSize: 12.5, color: 'var(--ink-faint)', marginTop: 10, lineHeight: 1.65 }}>{kind === 'cgv' ? 'EURL JELTRADE · Siège : 105 rue de la Chalouère, 49100 Angers · RCS Angers · Capital social : 1 000 € · contact@jeltrade.fr' : 'EURL JELTRADE · 49100 ANGERS FRANCE'}</p>
      <div style={{ marginTop: 30 }}>
        {data.map(([h, p], i) => (
          <div key={i} style={{ paddingBottom: 24, marginBottom: 24, borderBottom: i < data.length - 1 ? '1px solid var(--line)' : 'none' }}>
            <h2 className="display" style={{ fontSize: 19, marginBottom: 8 }}>{i + 1}. {h}</h2>
            {renderBody(p)}
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { BlogCard, BlogList, BlogArticle, LoginPage, ProfilePage, OrdersPage, OrderDetailPage, ContactPage, LegalPage });

/* ===================== JELSPRAY — Router & App ===================== */
function parsePath() {
  var FILE = window.location.protocol === 'file:';
  let h = FILE ? (window.location.hash.replace(/^#/, '') || '/')
               : (window.location.pathname || '/') + (window.location.search || '');
  const [path, query] = h.split('?');
  const params = {};
  if (query) query.split('&').forEach((kv) => { const [k, v] = kv.split('='); params[decodeURIComponent(k)] = decodeURIComponent(v || ''); });
  const seg = path.split('/').filter(Boolean); // e.g. ['produit','slug']
  return { path, seg, params };
}

function Router() {
  const [route, setRoute] = useState(parsePath());
  useEffect(() => {
    const onNav = () => { setRoute(parsePath()); window.scrollTo(0, 0); if (window.jlSeo) window.jlSeo(); };
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);
    window.addEventListener('jl:navigate', onNav);
    onNav();
    return () => { window.removeEventListener('popstate', onNav);
      window.removeEventListener('hashchange', onNav);
      window.removeEventListener('jl:navigate', onNav); };
  }, []);

  const { seg, params } = route;
  const a = seg[0] || '';
  let page;

  if (a === '' ) page = <HomePage />;
  else if (a === 'produits') page = <CatalogPage params={params} />;
  else if (a === 'produit') page = <ProductPage params={{ slug: seg[1] }} />;
  else if (a === 'blog') page = seg[1] ? <BlogArticle params={{ slug: seg[1] }} /> : <BlogList params={params} />;
  else if (a === 'contact') page = <ContactPage />;
  else if (a === 'mentions-legales') page = <LegalPage kind="mentions" />;
  else if (a === 'cgv') page = <LegalPage kind="cgv" />;
  else page = <NotFound />;

  const routePath = '/' + seg.join('/');
  return (
    <React.Fragment>
      <Header route={routePath} />
      <main style={{ flex: 1 }}>{page}</main>
      <Footer />
    </React.Fragment>
  );
}

const rootEl = document.getElementById('root');
createRoot(rootEl).render(<Router />);
