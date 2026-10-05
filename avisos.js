// Avisos de clase: banner dentro de la app + notificación del sistema (si el usuario la permite).
// Funcionan mientras la app esté abierta (o instalada y en segundo plano); sin servidor push no pueden sonar con la app cerrada.
(function () {
  const E = window.ESCUELA, KEY = 'cecytem_avisos';
  const cfg = () => { let c = {}; try { c = JSON.parse(localStorage.getItem(KEY)) || {}; } catch (_) {} return Object.assign({ on:false, antes:10 }, c); };
  const guardar = c => { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (_) {} };
  const fechaKey = n => n.getFullYear() + '-' + (n.getMonth()+1) + '-' + n.getDate();

  const st = document.createElement('style');
  st.textContent = `#avToast{position:fixed;left:50%;transform:translate(-50%,-140%);top:calc(10px + env(safe-area-inset-top));width:min(94vw,440px);z-index:500;background:#0d1a27;color:#fff;border:1px solid #d4af37;border-left:6px solid var(--c,#d4af37);border-radius:12px;padding:12px 16px;box-shadow:0 10px 30px #000a;transition:transform .35s ease;cursor:pointer}
#avToast.on{transform:translate(-50%,0)}#avToast b{display:block;font-size:15px}#avToast span{font-size:13px;color:#b0c4de}`;
  document.head.appendChild(st);
  let tt;
  function toast(t, c, color) {
    let el = document.getElementById('avToast');
    if (!el) { el = document.createElement('div'); el.id = 'avToast'; el.setAttribute('role', 'status'); el.onclick = () => el.classList.remove('on'); document.body.appendChild(el); }
    el.style.setProperty('--c', color || '#d4af37'); el.innerHTML = `<b></b><span></span>`; el.firstChild.textContent = t; el.lastChild.textContent = c;
    requestAnimationFrame(() => el.classList.add('on')); clearTimeout(tt); tt = setTimeout(() => el.classList.remove('on'), 10000);
  }
  async function mostrar(t, c, color, tag) {
    toast(t, c, color);
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const op = { body:c, tag:tag || 'cecytem', renotify:true, icon:'icon-192.png', badge:'icon-192.png', vibrate:[200, 100, 200] };
    try { const r = navigator.serviceWorker && await navigator.serviceWorker.getRegistration(); if (r) return r.showNotification(t, op); new Notification(t, op); } catch (_) {}
  }
  function eventos(c) {
    const n = E.ahoraMX(), d = n.getDay(); if (d < 1 || d > 5) return [];
    const bl = E.bloquesDe(E.DIAS[d-1]), ev = [], H = E.hhmm;
    bl.forEach(b => {
      if (b.tipo === 'clase') {
        const info = `${E.aulaDe(b.materia)} · ${E.docenteDe(b.materia)}`, col = E.colorDe(b.materia);
        if (c.antes > 0) ev.push({ id:'pre' + b.ini, min:b.ini - c.antes, t:`En ${c.antes} min: ${b.materia}`, c:`${H(b.ini)} · ${info}`, color:col });
        ev.push({ id:'ini' + b.ini, min:b.ini, t:`Entramos a ${b.materia}`, c:`${info} · hasta las ${H(b.fin)}`, color:col });
      } else ev.push({ id:'rec' + b.ini, min:b.ini, t:'Receso', c:`Hasta las ${H(b.fin)} (${b.fin - b.ini} min)`, color:'#9ca3af' });
    });
    const u = bl[bl.length-1]; if (u) ev.push({ id:'fin', min:u.fin, t:'Fin de clases', c:'Terminó tu horario de hoy', color:'#d4af37' });
    return ev;
  }
  // Exámenes y entregas de la Agenda que vencen en las próximas 24 h (un aviso por día)
  function recordarEventos() {
    let ev = []; try { ev = JSON.parse(localStorage.getItem('agenda_eventos')) || []; } catch (_) {}
    const n = E.ahoraMX(), f = fechaKey(n);
    ev.filter(e => !e.hecho).forEach(e => {
      const h = (new Date(e.fecha + 'T' + (e.hora || '23:59')) - n) / 36e5, k = `aviso:${f}:ev${e.id}`;
      if (h <= 0 || h > 24 || localStorage.getItem(k)) return;
      try { localStorage.setItem(k, '1'); } catch (_) {}
      mostrar(`${e.tipo} pronto: ${e.titulo}`, `${e.materia} · faltan ${Math.max(1, Math.round(h))} h`, '#f59e0b', 'ev' + e.id);
    });
  }
  function tick() {
    const c = cfg(); if (!c.on) return;
    recordarEventos(c);
    const n = E.ahoraMX(), m = n.getHours()*60 + n.getMinutes() + n.getSeconds()/60, f = fechaKey(n);
    eventos(c).forEach(e => {
      if (m < e.min || m >= e.min + 3) return;           // si abres la app tarde, avisa solo lo de los últimos 3 min
      const k = `aviso:${f}:${e.id}:${c.antes}`; if (localStorage.getItem(k)) return;
      try { localStorage.setItem(k, '1'); } catch (_) {}
      mostrar(e.t, e.c, e.color, e.id);
    });
  }
  try { const hoy = fechaKey(E.ahoraMX()); Object.keys(localStorage).filter(k => k.startsWith('aviso:') && !k.startsWith('aviso:' + hoy + ':')).forEach(k => localStorage.removeItem(k)); } catch (_) {}
  async function activar() {
    let p = 'unsupported';
    if ('Notification' in window) { p = Notification.permission; if (p === 'default') { try { p = await Notification.requestPermission(); } catch (_) {} } }
    const c = cfg(); c.on = true; guardar(c); return p;
  }
  window.CECYTEM_AVISOS = {
    cfg, activar,
    desactivar() { const c = cfg(); c.on = false; guardar(c); },
    setAntes(n) { const c = cfg(); c.antes = n; guardar(c); },
    avisar: (t, c, col) => mostrar(t, c, col, 'agenda'),
    permiso: () => ('Notification' in window ? Notification.permission : 'unsupported'),
    probar() { mostrar('Aviso de prueba', 'Así te avisaremos antes de cada clase', '#d4af37', 'prueba'); }
  };
  setInterval(tick, 15000); document.addEventListener('visibilitychange', tick);
  // El primer chequeo espera a que la página termine de cargar (si no, el banner se pierde al pintarse)
  const primero = () => setTimeout(tick, 1200); document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', primero) : primero();
})();
