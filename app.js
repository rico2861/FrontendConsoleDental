// ═══ DENTAL — Console SaaS (frontend admin, responsive) ═══════════════
const $app = document.getElementById('app')
const api = async (p, body, method) => {
  const r = await fetch((window.DL_API || '') + '/admin/api' + p, { method: method || (body ? 'POST' : 'GET'), credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined })
  const j = await r.json().catch(() => ({}))
  if (!r.ok) throw Object.assign(new Error(j.error || 'Erreur'), { status: r.status, code: j.code })
  return j
}
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]))
const toast = (m, bad) => { const t = document.createElement('div'); t.className = 'toast' + (bad ? ' bad' : ''); t.textContent = m; document.getElementById('toast').appendChild(t); setTimeout(() => t.remove(), 3200) }
const money = (n, c = 'HTG') => (n == null ? '—' : new Intl.NumberFormat('fr-FR').format(n) + ' ' + c)
const D = s => s ? new Date(s).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
const rel = s => { if (!s) return ''; const d = (Date.now() - new Date(s)) / 1000; if (d < 60) return 'à l\'instant'; if (d < 3600) return Math.floor(d / 60) + ' min'; if (d < 86400) return Math.floor(d / 3600) + ' h'; return Math.floor(d / 86400) + ' j' }
const daysTo = s => Math.ceil((new Date(s) - Date.now()) / 86400000)
const STAT = { trial: ['Essai', 'b-trial'], active: ['Actif', 'b-active'], grace: ['Grâce', 'b-grace'], expired: ['Expiré', 'b-expired'], suspended: ['Suspendu', 'b-suspended'], none: ['—', 'b-none'] }
const badge = s => { const [l, c] = STAT[s] || [s, 'b-none']; return `<span class="badge ${c}">${l}</span>` }
const IC = {
  overview: '<path d="M3 13h8V3H3zM13 21h8V3h-8zM3 21h8v-6H3z"/>', clinics: '<path d="M3 21h18M5 21V7l8-4v18M19 21V11l-6-3M9 9v.01M9 13v.01M9 17v.01"/>',
  pay: '<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', backup: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 1.7 4 3 9 3s9-1.3 9-3V5"/>',
  journal: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>', logout: '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>'
}
const svg = k => `<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${IC[k]}</svg>`

let ME = null

// ─── Connexion ───────────────────────────────────────────────────────────────
function loginView(msg) {
  $app.innerHTML = `<div class="login"><div class="login-card">
    <div class="mark">D</div>
    <h2 style="margin:16px 0 2px;font-size:20px;letter-spacing:-.4px">Console DENTAL</h2>
    <p class="muted" style="margin:0 0 6px;font-size:13.5px">Administration des abonnements</p>
    <div id="le" class="err" style="display:${msg ? 'block' : 'none'}">${esc(msg || '')}</div>
    <div class="field"><label>E-mail</label><input id="lm" type="email" autocomplete="username"></div>
    <div class="field"><label>Mot de passe</label>
      <div class="pw-wrap"><input id="lp" type="password" autocomplete="current-password"><button type="button" class="pw-eye" id="lp-eye">Afficher</button></div></div>
    <button class="btn block" id="lb" style="margin-top:6px">Se connecter</button>
  </div></div>`
  const go = async () => {
    const b = document.getElementById('lb'); b.disabled = true
    try { await api('/login', { email: lm.value.trim(), password: lp.value }); location.hash = '#/'; start() }
    catch (e) { const le = document.getElementById('le'); le.textContent = e.message; le.style.display = 'block'; b.disabled = false }
  }
  lb.onclick = go
  lp.onkeydown = e => { if (e.key === 'Enter') go() }
  lm.onkeydown = e => { if (e.key === 'Enter') go() }
  document.getElementById('lp-eye').onclick = () => {
    const i = document.getElementById('lp'), show = i.type === 'password'
    i.type = show ? 'text' : 'password'; document.getElementById('lp-eye').textContent = show ? 'Masquer' : 'Afficher'; i.focus()
  }
}

// ─── Coquille ────────────────────────────────────────────────────────────────
const NAV = [['/', 'overview', 'Vue globale'], ['/clinics', 'clinics', 'Cliniques'], ['/payments', 'pay', 'Paiements'], ['/backups', 'backup', 'Sauvegardes'], ['/journal', 'journal', 'Journal']]
function shell(active, body) {
  const links = NAV.map(([h, ic, l]) => `<a href="#${h}" class="${active === h ? 'on' : ''}">${svg(ic)}<span>${l}</span></a>`).join('')
  $app.innerHTML = `<div class="shell">
    <nav class="rail"><div class="brand"><span class="mark" style="width:28px;height:28px;font-size:14px;border-radius:8px">D</span><span>DENTAL</span></div>
      ${links}<div class="spacer"></div><a href="#" id="logout">${svg('logout')}<span>Déconnexion</span></a>
      <div class="who">${esc(ME?.email || '')}</div></nav>
    <main class="main"><div class="topbar"><span class="mark">D</span> Console DENTAL</div><div id="view">${body}</div></main></div>`
  document.getElementById('logout').onclick = async e => { e.preventDefault(); await api('/logout', {}); ME = null; location.hash = ''; start() }
}
const h = (title, sub, actions = '') => `<div class="page-h"><div><h1>${title}</h1>${sub ? `<p>${sub}</p>` : ''}</div><div class="actions">${actions}</div></div>`

// ─── Vue globale ─────────────────────────────────────────────────────────────
async function overview() {
  shell('/', '<div class="muted">Chargement…</div>')
  const o = await api('/overview')
  const c = o.counts, rev = o.revenue.map(r => money(r.t, r.currency)).join(' · ') || '0 HTG'
  const kpi = (lab, val, sub, cls = '') => `<div class="kpi ${cls}"><div class="lab">${lab}</div><div class="val tnum">${val}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`
  const alertRow = (dot, ti, me, href) => `<a class="row" href="${href || '#'}" style="text-decoration:none;color:inherit"><span class="dot" style="background:${dot}"></span><div class="gro"><div class="ti">${ti}</div><div class="me">${me}</div></div></a>`
  const alerts = []
  o.pendingPayments.forEach(p => alerts.push(alertRow('var(--warn)', `Virement à confirmer — ${esc(p.clinic_name)}`, `${money(p.amount, p.currency)} · ${p.plan === '1y' ? '1 an' : '1 mois'} · ${rel(p.created_at)}`, '#/payments')))
  o.expiringSoon.forEach(c2 => alerts.push(alertRow('var(--trial)', `Abonnement expire bientôt — ${esc(c2.name)}`, `dans ${daysTo(c2.period_end)} j (${D(c2.period_end)})`, `#/clinic/${c2.id}`)))
  o.seatsFull.forEach(s => alerts.push(alertRow('var(--bad)', `Sièges pleins — ${esc(s.name)}`, `${s.hosts_used}/${s.seats} postes`, `#/clinic/${s.id}`)))
  const feed = o.recentEvents.map(e => `<div class="row"><span class="dot" style="background:${evColor(e.type)}"></span><div class="gro"><div class="ti">${evLabel(e.type)} <small>${esc(e.clinic_name || '')}</small></div><div class="me">${rel(e.created_at)}</div></div></div>`).join('') || '<div class="empty">Aucune activité</div>'
  shell('/', h('Vue globale', 'Tout ce qui transite sur la plateforme, en un coup d’œil') + `
    <div class="grid k4" style="margin-bottom:16px">
      ${kpi('Clients actifs', c.active || 0, `${c.trial || 0} en essai`, 'accent')}
      ${kpi('En grâce / expirés', (c.grace || 0) + (c.expired || 0), `${c.suspended || 0} suspendus`)}
      ${kpi('Postes actifs', c.hosts || 0, `${c.total} clinique(s)`)}
      ${kpi('Revenus confirmés', rev.split(' · ')[0], 'cumul')}
    </div>
    <div class="grid k2">
      <div class="card"><div class="sect-h"><h3>Activité récente</h3><span class="count">${o.recentEvents.length}</span></div><div class="list">${feed}</div></div>
      <div class="card"><div class="sect-h"><h3>À traiter</h3><span class="count">${alerts.length}</span></div><div class="list">${alerts.join('') || '<div class="empty">Rien à signaler</div>'}</div></div>
    </div>`)
}
const evColor = t => /revoke|suspend|reject|fail/.test(t) ? 'var(--bad)' : /payment_conf|renew|activation|reinstate/.test(t) ? 'var(--ok)' : /payment_created|backup/.test(t) ? 'var(--warn)' : 'var(--faint)'
const evLabel = t => ({ clinic_created: 'Nouvelle clinique', activation: 'Poste activé', check: 'Contrôle en ligne', renew: 'Clé renouvelée', payment_created: 'Paiement enregistré', payment_confirmed: 'Paiement confirmé', payment_rejected: 'Paiement rejeté', revoke: 'Licence révoquée', suspend: 'Clinique suspendue', reinstate: 'Clinique réactivée', backup: 'Sauvegarde', updated: 'Mise à jour' }[t] || t)

// ─── Cliniques ───────────────────────────────────────────────────────────────
async function clinics() {
  shell('/clinics', '<div class="muted">Chargement…</div>')
  const rows = await api('/clinics')
  const body = rows.map(c => {
    const st = c.status === 'suspended' ? 'suspended' : c.effective
    return `<tr class="click" data-go="#/clinic/${c.id}"><td><b>${esc(c.name)}</b><div class="faint" style="font-size:12px">${esc(c.email)}</div></td>
      <td>${badge(st)}</td><td>${c.plan === '1y' ? '1 an' : c.plan === '1m' ? '1 mois' : c.plan || '—'}</td>
      <td class="num tnum">${c.hosts_used || 0}/${c.seats || 0}</td>
      <td class="tnum">${c.period_end ? D(c.period_end) : '—'}</td>
      <td class="tnum">${c.last_backup ? rel(c.last_backup) : '<span class="faint">jamais</span>'}</td></tr>`
  }).join('') || '<tr><td colspan="6" class="empty">Aucune clinique</td></tr>'
  shell('/clinics', h('Cliniques', `${rows.length} abonné(s)`, `<button class="btn" id="newc">+ Nouvelle clinique</button>`) + `
    <div class="card ov-table"><table class="tbl"><thead><tr><th>Clinique</th><th>Statut</th><th>Formule</th><th>Postes</th><th>Fin d’abonnement</th><th>Dernière sauvegarde</th></tr></thead><tbody>${body}</tbody></table></div>`)
  document.getElementById('newc').onclick = newClinicModal
  $app.querySelectorAll('[data-go]').forEach(tr => tr.onclick = () => location.hash = tr.dataset.go)
}

// ─── Fiche clinique ──────────────────────────────────────────────────────────
let TAB = 'hosts'
async function clinicDetail(id) {
  shell('/clinics', '<div class="muted">Chargement…</div>')
  const d = await api('/clinics/' + id)
  const c = d.clinic, st = c.status === 'suspended' ? 'suspended' : d.effective
  const color = c.brand_color || '#0f766e'
  const chip = (l, v) => `<span class="chip">${l} <b>${v}</b></span>`
  const suspended = c.status === 'suspended'
  const head = `<div class="detail-h">
      <div class="avatar" style="background:${esc(color)}">${esc((c.display_name || c.name || 'D')[0])}</div>
      <div><h1>${esc(c.display_name || c.name)}</h1>
        <div class="chips">${badge(st)} ${chip('ID', `<code>${c.id}</code>`)} ${chip('Code', `<code>${esc(c.activation_code || '—')}</code> <button class="copy" data-copy="${esc(c.activation_code || '')}">copier</button>`)}
          ${chip('Formule', d.subscription ? (d.subscription.plan === '1y' ? '1 an' : d.subscription.plan === '1m' ? '1 mois' : 'essai') : '—')}
          ${chip('Postes', `${d.hosts.filter(x => x.status === 'active').length}/${d.subscription?.seats || 0}`)}
          ${chip('Échéance', D(d.subscription?.period_end))}</div></div>
      <div class="actions">
        <button class="btn" id="a-pay">Enregistrer un paiement</button>
        <button class="btn sec" id="a-key">Générer une clé</button>
        <button class="btn sec" id="a-brand">Personnaliser</button>
        ${suspended ? '<button class="btn sec" id="a-reinstate">Réactiver</button>' : '<button class="btn danger" id="a-suspend">Suspendre</button>'}
      </div></div>`
  const tabBtn = (k, l, n) => `<button class="${TAB === k ? 'on' : ''}" data-tab="${k}">${l}${n != null ? ` (${n})` : ''}</button>`
  const tabs = `<div class="tabs">${tabBtn('hosts', 'Postes', d.hosts.length)}${tabBtn('licenses', 'Licences', d.licenses.length)}${tabBtn('payments', 'Paiements', d.payments.length)}${tabBtn('backups', 'Sauvegardes', d.backups.length)}${tabBtn('events', 'Journal', d.events.length)}</div>`
  shell('/clinics', `<a href="#/clinics" class="muted" style="text-decoration:none;font-size:13px">Retour aux cliniques</a>` + head + tabs + `<div class="card ov-table" id="tabc">${tabContent(d)}</div>`)

  $app.querySelectorAll('[data-tab]').forEach(b => b.onclick = () => { TAB = b.dataset.tab; $app.querySelectorAll('[data-tab]').forEach(x => x.classList.toggle('on', x === b)); document.getElementById('tabc').innerHTML = tabContent(d) })
  wireCopy()
  document.getElementById('a-pay').onclick = () => payModal(c)
  document.getElementById('a-key').onclick = () => keyModal(c)
  document.getElementById('a-brand').onclick = () => brandModal(c, d.subscription)
  document.getElementById('a-suspend') && (document.getElementById('a-suspend').onclick = () => suspendModal(c))
  document.getElementById('a-reinstate') && (document.getElementById('a-reinstate').onclick = async () => { await api(`/clinics/${c.id}/reinstate`, {}); toast('Clinique réactivée'); clinicDetail(id) })
  // actions dans les onglets
  $app.addEventListener('click', async e => {
    const rv = e.target.closest('[data-revoke]'); if (rv) { if (!confirm('Révoquer cette licence ? Le poste sera bloqué à son prochain contrôle en ligne.')) return; await api(`/licenses/${rv.dataset.revoke}/revoke`, { reason: 'révoquée depuis la console' }); toast('Licence révoquée'); clinicDetail(id) }
    const cf = e.target.closest('[data-confirm]'); if (cf) { await api(`/payments/${cf.dataset.confirm}/confirm`, {}); toast('Paiement confirmé, abonnement prolongé'); clinicDetail(id) }
    const rj = e.target.closest('[data-reject]'); if (rj) { await api(`/payments/${rj.dataset.reject}/reject`, {}); toast('Paiement rejeté'); clinicDetail(id) }
    const vf = e.target.closest('[data-verify]'); if (vf) { const r = await api(`/payments/${vf.dataset.verify}/verify-moncash`, {}); toast(r.status === 'confirmed' ? 'Confirmé' : 'En attente côté MonCash'); clinicDetail(id) }
  }, { once: true })
}
function tabContent(d) {
  const T = { hosts, licenses: lics, payments: pays, backups: baks, events: evs }
  return T[TAB](d)
}
const hosts = d => d.hosts.length ? table(['Poste', 'Empreinte', 'Version', 'Statut', 'Dernier contact'],
  d.hosts.map(x => [esc(x.hostname || '—'), `<code>${esc(x.fingerprint.slice(0, 12))}</code>`, esc(x.app_version || '—'), x.status === 'active' ? badge('active') : badge('revoked'), x.last_seen_at ? rel(x.last_seen_at) : '<span class="faint">jamais</span>'])) : empty('Aucun poste activé')
const lics = d => d.licenses.length ? table(['Licence', 'Formule', 'Émise', 'Expire', 'État', ''],
  d.licenses.map(l => [`<code>${l.lid.slice(0, 8)}</code>`, l.plan === '1y' ? '1 an' : l.plan === '1m' ? '1 mois' : 'essai', D(l.issued_at), D(l.expires_at), l.revoked ? badge('revoked') : badge('active'), l.revoked ? '' : `<button class="btn sm danger" data-revoke="${l.lid}">Révoquer</button>`])) : empty('Aucune licence émise')
const pays = d => d.payments.length ? table(['Date', 'Méthode', 'Formule', 'Montant', 'Statut', ''],
  d.payments.map(p => [D(p.created_at), p.method, p.plan === '1y' ? '1 an' : '1 mois', money(p.amount, p.currency), badge(p.status === 'confirmed' ? 'active' : p.status === 'rejected' ? 'revoked' : 'pending'),
    p.status === 'pending' ? `${p.method === 'moncash' ? `<button class="btn sm sec" data-verify="${p.id}">Vérifier</button> ` : ''}<button class="btn sm" data-confirm="${p.id}">Confirmer</button> <button class="btn sm ghost" data-reject="${p.id}">Rejeter</button>` : ''])) : empty('Aucun paiement')
const baks = d => d.backups.length ? table(['Date', 'Taille', 'Vérifiée', 'Emplacement'],
  d.backups.map(b => [D(b.created_at) + ' ' + new Date(b.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }), b.size_bytes ? (b.size_bytes / 1048576).toFixed(1) + ' Mo' : '—', b.verified ? badge('ok') : badge('bad'), `<code>${esc(b.location || '—')}</code>`])) : empty('Aucune sauvegarde reçue')
const evs = d => d.events.length ? `<div class="list">${d.events.map(e => `<div class="row"><span class="dot" style="background:${evColor(e.type)}"></span><div class="gro"><div class="ti">${evLabel(e.type)}</div><div class="me">${rel(e.created_at)} — ${esc(JSON.stringify(e.data).slice(0, 80))}</div></div></div>`).join('')}</div>` : empty('Journal vide')
const table = (cols, rows) => `<table class="tbl"><thead><tr>${cols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map((c, i) => `<td${i === 3 && /^\d/.test(String(c)) ? ' class="num"' : ''}>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`
const empty = m => `<div class="empty">${m}</div>`

// ─── Autres vues ─────────────────────────────────────────────────────────────
async function payments() {
  shell('/payments', '<div class="muted">Chargement…</div>')
  const all = await api('/payments')
  const row = p => `<tr><td><b>${esc(p.clinic_name)}</b></td><td>${D(p.created_at)}</td><td>${p.method}</td><td>${p.plan === '1y' ? '1 an' : '1 mois'}</td><td class="num tnum">${money(p.amount, p.currency)}</td><td>${esc(p.reference || '—')}</td><td>${badge(p.status === 'confirmed' ? 'active' : p.status === 'rejected' ? 'revoked' : 'pending')}</td><td>${p.status === 'pending' ? `${p.method === 'moncash' ? `<button class="btn sm sec" data-verify="${p.id}">Vérifier MonCash</button> ` : ''}<button class="btn sm" data-confirm="${p.id}">Confirmer</button> <button class="btn sm ghost" data-reject="${p.id}">Rejeter</button>` : ''}</td></tr>`
  const pend = all.filter(p => p.status === 'pending'), done = all.filter(p => p.status !== 'pending')
  shell('/payments', h('Paiements', `${pend.length} en attente de confirmation`) + `
    <div class="card ov-table" style="margin-bottom:16px"><div class="sect-h"><h3>À confirmer</h3><span class="count">${pend.length}</span></div>${pend.length ? `<table class="tbl"><thead><tr><th>Clinique</th><th>Date</th><th>Méthode</th><th>Formule</th><th>Montant</th><th>Référence</th><th>Statut</th><th></th></tr></thead><tbody>${pend.map(row).join('')}</tbody></table>` : empty('Rien à confirmer')}</div>
    <div class="card ov-table"><div class="sect-h"><h3>Historique</h3><span class="count">${done.length}</span></div>${done.length ? `<table class="tbl"><thead><tr><th>Clinique</th><th>Date</th><th>Méthode</th><th>Formule</th><th>Montant</th><th>Référence</th><th>Statut</th><th></th></tr></thead><tbody>${done.map(row).join('')}</tbody></table>` : empty('Aucun paiement')}</div>`)
  wireActions(payments)
}
async function backups() {
  shell('/backups', '<div class="muted">Chargement…</div>')
  const all = await api('/backups')
  const body = all.map(b => `<tr><td><b>${esc(b.clinic_name)}</b></td><td>${D(b.created_at)} ${new Date(b.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</td><td class="tnum">${b.size_bytes ? (b.size_bytes / 1048576).toFixed(1) + ' Mo' : '—'}</td><td>${b.verified ? badge('ok') : badge('bad')}</td><td><code>${esc(b.location || '—')}</code></td></tr>`).join('') || '<tr><td colspan="5" class="empty">Aucune sauvegarde reçue</td></tr>'
  shell('/backups', h('Sauvegardes', 'État des copies de sécurité remontées par les cliniques') + `<div class="card ov-table"><table class="tbl"><thead><tr><th>Clinique</th><th>Date</th><th>Taille</th><th>Vérifiée</th><th>Emplacement</th></tr></thead><tbody>${body}</tbody></table></div>`)
}
async function journal() {
  shell('/journal', '<div class="muted">Chargement…</div>')
  const ev = await api('/events?limit=200')
  const body = ev.map(e => `<div class="row"><span class="dot" style="background:${evColor(e.type)}"></span><div class="gro"><div class="ti">${evLabel(e.type)} <small>${esc(e.clinic_name || '')}</small></div><div class="me">${D(e.created_at)} ${new Date(e.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} · ${esc(JSON.stringify(e.data).slice(0, 100))}</div></div></div>`).join('') || empty('Journal vide')
  shell('/journal', h('Journal', 'Tout ce qui se passe sur la plateforme') + `<div class="card"><div class="list">${body}</div></div>`)
}

// ─── Modals ──────────────────────────────────────────────────────────────────
function modal(title, bodyHtml, onOk, okLabel = 'Enregistrer') {
  const ov = document.createElement('div'); ov.className = 'ov'
  ov.innerHTML = `<div class="modal"><div class="mh"><h3>${title}</h3></div><div class="mb">${bodyHtml}<div class="err" id="me" style="display:none"></div></div><div class="mf"><button class="btn sec" id="mc">Annuler</button><button class="btn" id="mo">${okLabel}</button></div></div>`
  document.body.appendChild(ov)
  const close = () => ov.remove()
  ov.querySelector('#mc').onclick = close; ov.onclick = e => e.target === ov && close()
  ov.querySelector('#mo').onclick = async () => { const b = ov.querySelector('#mo'); b.disabled = true; try { await onOk(ov, close) } catch (e) { const m = ov.querySelector('#me'); m.textContent = e.message; m.style.display = 'block'; b.disabled = false } }
  return ov
}
function newClinicModal() {
  modal('Nouvelle clinique', `
    <div class="field"><label>Nom</label><input id="f-name"></div>
    <div class="field"><label>E-mail</label><input id="f-email" type="email"></div>
    <div class="field"><label>Téléphone</label><input id="f-phone"></div>
    <div class="field"><label>Ville</label><input id="f-city"></div>
    <div class="field"><label>Sièges (postes autorisés)</label><input id="f-seats" type="number" value="2" min="1"></div>
    <p class="muted" style="font-size:12.5px;margin:0">Un essai gratuit de 15 jours démarre automatiquement.</p>`,
    async (ov, close) => {
      const c = await api('/clinics', { name: ov.querySelector('#f-name').value.trim(), email: ov.querySelector('#f-email').value.trim(), phone: ov.querySelector('#f-phone').value.trim(), city: ov.querySelector('#f-city').value.trim(), seats: +ov.querySelector('#f-seats').value })
      close(); toast('Clinique créée — code : ' + c.activation_code); location.hash = '#/clinic/' + c.id; route()
    }, 'Créer')
}
function payModal(c) {
  modal('Enregistrer un paiement', `
    <div class="field"><label>Méthode</label><select id="p-method"><option value="virement">Virement bancaire</option><option value="moncash">MonCash</option></select></div>
    <div class="field"><label>Formule</label><select id="p-plan"><option value="1m">1 mois</option><option value="1y">1 an</option></select></div>
    <div class="field"><label>Montant</label><input id="p-amount" type="number" placeholder="ex. 15000"></div>
    <div class="field"><label>Devise</label><input id="p-cur" value="HTG"></div>
    <div class="field"><label>Référence</label><input id="p-ref" placeholder="n° transaction / virement"></div>
    <label style="display:flex;gap:8px;align-items:center;font-size:13.5px"><input type="checkbox" id="p-now" style="width:auto" checked> Confirmer tout de suite (génère l’abonnement)</label>`,
    async (ov, close) => {
      await api('/payments', { clinic_id: c.id, method: ov.querySelector('#p-method').value, plan: ov.querySelector('#p-plan').value, amount: +ov.querySelector('#p-amount').value, currency: ov.querySelector('#p-cur').value.trim(), reference: ov.querySelector('#p-ref').value.trim(), status: ov.querySelector('#p-now').checked ? 'confirmed' : 'pending' })
      close(); toast('Paiement enregistré'); clinicDetail(c.id)
    }, 'Enregistrer')
}
function keyModal(c) {
  modal('Générer une clé pour un poste', `
    <p class="muted" style="font-size:13px;margin:0 0 10px">Demandez à la clinique l’empreinte affichée sur son écran de licence, puis collez-la ici.</p>
    <div class="field"><label>Empreinte du poste</label><input id="k-fp" placeholder="ex. cfa165388af4"></div>
    <div class="field"><label>Nom du poste (optionnel)</label><input id="k-host" placeholder="ex. PC-Accueil"></div>
    <div id="k-out" style="display:none"><label style="font-size:12.5px;font-weight:600;color:#556071">Clé (licence.key)</label><textarea id="k-tok" rows="4" readonly style="font-size:11px;font-family:ui-monospace,monospace"></textarea>
      <div style="display:flex;gap:8px;margin-top:8px"><button class="btn sm" id="k-copy" type="button">Copier</button><button class="btn sm sec" id="k-dl" type="button">Télécharger licence.key</button></div></div>`,
    async (ov, close) => {
      const r = await api(`/clinics/${c.id}/key`, { fingerprint: ov.querySelector('#k-fp').value.trim(), hostname: ov.querySelector('#k-host').value.trim() })
      const out = ov.querySelector('#k-out'); out.style.display = 'block'; ov.querySelector('#k-tok').value = r.token
      ov.querySelector('#mo').style.display = 'none'
      ov.querySelector('#k-copy').onclick = () => { navigator.clipboard.writeText(r.token); toast('Clé copiée') }
      ov.querySelector('#k-dl').onclick = () => { const b = new Blob([r.token], { type: 'text/plain' }); const a = document.createElement('a'); a.href = URL.createObjectURL(b); a.download = 'licence.key'; a.click() }
      toast('Clé générée')
    }, 'Générer')
}
function brandModal(c, sub) {
  modal('Personnalisation & sièges', `
    <div class="field"><label>Nom affiché</label><input id="b-name" value="${esc(c.display_name || c.name)}"></div>
    <div class="field"><label>Couleur de marque</label><input id="b-color" type="color" value="${esc(c.brand_color || '#0f766e')}" style="height:42px;padding:4px"></div>
    <div class="field"><label>Logo (URL)</label><input id="b-logo" value="${esc(c.logo_url || '')}" placeholder="https://…"></div>
    <div class="field"><label>Sièges (postes autorisés)</label><input id="b-seats" type="number" min="1" value="${sub?.seats || 2}"></div>`,
    async (ov, close) => {
      await api('/clinics/' + c.id, { display_name: ov.querySelector('#b-name').value.trim(), brand_color: ov.querySelector('#b-color').value, logo_url: ov.querySelector('#b-logo').value.trim(), seats: +ov.querySelector('#b-seats').value }, 'PATCH')
      close(); toast('Enregistré'); clinicDetail(c.id)
    })
}
function suspendModal(c) {
  modal('Suspendre la clinique', `<p style="margin:0 0 10px;font-size:13.5px">Tous les postes seront bloqués à leur prochain contrôle en ligne. Les données ne sont pas touchées.</p><div class="field"><label>Motif</label><input id="s-reason" placeholder="ex. impayé"></div>`,
    async (ov, close) => { await api(`/clinics/${c.id}/suspend`, { reason: ov.querySelector('#s-reason').value.trim() }); close(); toast('Clinique suspendue'); clinicDetail(c.id) }, 'Suspendre')
}

// ─── Utilitaires UI ──────────────────────────────────────────────────────────
function wireCopy() { $app.querySelectorAll('[data-copy]').forEach(b => b.onclick = () => { navigator.clipboard.writeText(b.dataset.copy); toast('Copié') }) }
function wireActions(reload) {
  $app.querySelectorAll('[data-confirm]').forEach(b => b.onclick = async () => { await api(`/payments/${b.dataset.confirm}/confirm`, {}); toast('Confirmé'); reload() })
  $app.querySelectorAll('[data-reject]').forEach(b => b.onclick = async () => { await api(`/payments/${b.dataset.reject}/reject`, {}); toast('Rejeté'); reload() })
  $app.querySelectorAll('[data-verify]').forEach(b => b.onclick = async () => { const r = await api(`/payments/${b.dataset.verify}/verify-moncash`, {}); toast(r.status === 'confirmed' ? 'Paiement MonCash confirmé' : 'Toujours en attente côté MonCash'); reload() })
}

// ─── Routeur ─────────────────────────────────────────────────────────────────
function route() {
  const hash = location.hash.replace(/^#/, '') || '/'
  if (hash.startsWith('/clinic/')) return clinicDetail(hash.split('/')[2]).catch(err)
  const map = { '/': overview, '/clinics': clinics, '/payments': payments, '/backups': backups, '/journal': journal }
  ;(map[hash] || overview)().catch(err)
}
function err(e) { if (e.status === 401) { ME = null; return loginView('Session terminée, reconnectez-vous.') } toast(e.message || 'Erreur', true) }
window.addEventListener('hashchange', () => ME && route())

async function start() {
  try { ME = await api('/me') } catch { return loginView() }
  route()
}
start()
