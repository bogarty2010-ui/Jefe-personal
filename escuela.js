// Datos oficiales del Grupo 101 (horario 2026-2027) + estado "ahora". Todo vive en window.ESCUELA.
window.ESCUELA = (() => {
  const DIAS = ['lunes','martes','miercoles','jueves','viernes'];
  const DIA_NOMBRE = { lunes:'Lunes', martes:'Martes', miercoles:'Miércoles', jueves:'Jueves', viernes:'Viernes' };
  const PM='Pensamiento Matemático I', ING='Inglés I', CN='Ciencias Naturales, Exp. y Tec. I', CD='Cultura Digital I',
        FIL='Pensamiento Filosófico y Humanidades I', LEN='Lengua y Comunicación I', CS='Ciencias Sociales I',
        ART='Actividades Artísticas y Culturales', ORI='Orientación Educativa', X='-';
  const HORARIO = [
   { hora:'07:00 - 07:50', lunes:FIL, martes:FIL, miercoles:CN, jueves:X, viernes:PM },
   { hora:'07:50 - 08:40', lunes:FIL, martes:FIL, miercoles:LEN, jueves:CN, viernes:PM },
   { hora:'08:40 - 09:30', lunes:CN, martes:LEN, miercoles:ING, jueves:CD, viernes:CS },
   { hora:'09:30 - 10:20', lunes:CN, martes:LEN, miercoles:ORI, jueves:CD, viernes:CS },
   { hora:'10:20 - 10:40', receso:true },
   { hora:'10:40 - 11:30', lunes:X, martes:X, miercoles:ART, jueves:PM, viernes:ING },
   { hora:'11:30 - 12:20', lunes:X, martes:X, miercoles:X, jueves:PM, viernes:ING },
   { hora:'12:20 - 13:10', lunes:X, martes:X, miercoles:X, jueves:X, viernes:CD },
   { hora:'13:10 - 14:00', lunes:X, martes:X, miercoles:X, jueves:X, viernes:X }
  ];
  const DOCENTES = [
   { materia:PM,  nombre:'Joel Álvarez López',             horas:4, color:'#60a5fa' },
   { materia:ING, nombre:'Araceli Bautista Aragón',        horas:3, color:'#c084fc' },
   { materia:CN,  nombre:'Said Karam Figueroa',            horas:4, color:'#34d399' },
   { materia:CD,  nombre:'Carmen Ibeth Martínez Aragón',   horas:3, color:'#f472b6' },
   { materia:FIL, nombre:'Juan Alejandro Cruz Velasco',    horas:4, color:'#fbbf24' },
   { materia:LEN, nombre:'Rosalía Téllez Sánchez',         horas:3, color:'#f87171' },
   { materia:CS,  nombre:'Ángel Ricardo Cruz Velasco',     horas:2, color:'#38bdf8' },
   { materia:ART, nombre:'Mario de Jesús Herrera Tarango', horas:1, color:'#2dd4bf' },
   { materia:ORI, nombre:'Erika Xichetl Gutiérrez Trejo',  horas:1, color:'#a78bfa' }
  ];
  const aulaDe = m => m === ART ? 'Cómputo 3' : 'Aula 1';
  const docenteDe = m => (DOCENTES.find(d => d.materia === m) || {}).nombre || '';
  const colorDe = m => (DOCENTES.find(d => d.materia === m) || {}).color || '#d4af37';
  const aMin = h => { const [a,b] = h.split(':').map(Number); return a*60 + b; };
  const rango = s => s.split(' - ').map(aMin);
  const hhmm = m => String(Math.floor(m/60)).padStart(2,'0') + ':' + String(m%60).padStart(2,'0');
  const ahoraMX = () => new Date(new Date().toLocaleString('en-US', { timeZone:'America/Mexico_City' }));
  // Bloques del día: horas seguidas de la misma materia se unen en uno solo
  function bloquesDe(dia) {
    const out = [];
    HORARIO.forEach(r => {
      if (r.receso) { const [i,f] = rango(r.hora); out.push({ tipo:'receso', ini:i, fin:f }); return; }
      const m = r[dia]; if (!m || m === X) return;
      const [i,f] = rango(r.hora), u = out[out.length-1];
      if (u && u.tipo === 'clase' && u.materia === m && u.fin === i) u.fin = f;
      else out.push({ tipo:'clase', materia:m, ini:i, fin:f });
    });
    while (out.length && out[out.length-1].tipo === 'receso') out.pop();
    return out;
  }
  // Qué está pasando ahora mismo (hora de Ciudad de México)
  function estadoAhora() {
    const n = ahoraMX(), seg = n.getHours()*3600 + n.getMinutes()*60 + n.getSeconds(), wd = n.getDay();
    if (wd >= 1 && wd <= 5) {
      const bl = bloquesDe(DIAS[wd-1]), cur = bl.find(b => seg >= b.ini*60 && seg < b.fin*60);
      if (cur) return { tipo:cur.tipo, b:cur, falta:cur.fin*60 - seg, prog:(seg - cur.ini*60) / ((cur.fin - cur.ini)*60), sig:bl.find(b => b.tipo === 'clase' && b.ini >= cur.fin) };
    }
    for (let k = 0; k < 8; k++) {
      const di = (wd + k) % 7; if (di < 1 || di > 5) continue;
      const d = DIAS[di-1], s = bloquesDe(d).find(b => b.tipo === 'clase' && (k > 0 || b.ini*60 > seg));
      if (s) return { tipo:'espera', b:s, cuando:k === 0 ? 'hoy' : k === 1 ? 'mañana' : DIA_NOMBRE[d].toLowerCase(), falta:k*86400 + s.ini*60 - seg };
    }
    return { tipo:'fin', falta:0 };
  }
  const fmtDur = s => { s = Math.max(0, Math.floor(s)); const d = Math.floor(s/86400), h = Math.floor(s%86400/3600), m = Math.floor(s%3600/60), x = s%60;
    return d > 0 ? `${d} d ${h} h` : h > 0 ? `${h} h ${String(m).padStart(2,'0')} min` : `${m} min ${String(x).padStart(2,'0')} s`; };
  if (!document.getElementById('esc-css')) {
    const st = document.createElement('style'); st.id = 'esc-css';
    st.textContent = `.ah{position:relative;display:flex;flex-wrap:wrap;gap:8px 20px;align-items:center;justify-content:space-between;border-left:4px solid var(--c,#d4af37);padding-bottom:20px!important}
.ah-l{display:flex;flex-direction:column;gap:3px;min-width:0;flex:1 1 220px}.ah-et{color:#d4af37;font-size:12px;font-weight:600}
.ah-t{color:#fff;font-size:clamp(17px,4.6vw,23px);line-height:1.25}.ah-s{color:#b0c4de;font-size:13px}
.ah-r{text-align:right;margin-left:auto}.ah-r b{display:block;color:#fff;font-size:clamp(18px,5vw,26px);font-variant-numeric:tabular-nums}.ah-r span{color:#8da2b8;font-size:12px}
.ah-bar{position:absolute;left:0;right:0;bottom:0;height:5px;background:rgba(255,255,255,.08);overflow:hidden;border-radius:0 0 10px 0}.ah-bar i{display:block;height:100%;background:var(--c,#d4af37);transition:width 1s linear}`;
    document.head.appendChild(st);
  }
  function renderAhora(el) {
    if (!el) return; const e = estadoAhora(); let et, tit, sub, extra = '', cap, c = '#d4af37', prog = null;
    const sigTxt = s => s ? `Sigue: ${s.materia} · ${aulaDe(s.materia)} · ${hhmm(s.ini)}` : 'Es la última clase del día';
    if (e.tipo === 'clase') { et = 'Ahora en clase'; tit = e.b.materia; sub = `${aulaDe(e.b.materia)} · ${docenteDe(e.b.materia)} · hasta las ${hhmm(e.b.fin)}`; extra = sigTxt(e.sig); cap = 'para terminar'; c = colorDe(e.b.materia); prog = e.prog; }
    else if (e.tipo === 'receso') { et = 'Receso'; tit = 'Descanso'; sub = `Hasta las ${hhmm(e.b.fin)}`; extra = sigTxt(e.sig); cap = 'para volver a clase'; c = '#9ca3af'; prog = e.prog; }
    else if (e.tipo === 'espera') { et = `Próxima clase · ${e.cuando} ${hhmm(e.b.ini)}`; tit = e.b.materia; sub = `${aulaDe(e.b.materia)} · ${docenteDe(e.b.materia)}`; cap = 'para empezar'; c = colorDe(e.b.materia); }
    else { et = 'Sin clases'; tit = 'No hay clases programadas'; sub = ''; cap = ''; }
    el.style.setProperty('--c', c);
    el.innerHTML = `<div class="ah-l"><span class="ah-et">${et}</span><b class="ah-t">${tit}</b><span class="ah-s">${sub}</span>${extra ? `<span class="ah-s">${extra}</span>` : ''}</div>` +
      (e.tipo !== 'fin' ? `<div class="ah-r"><b>${fmtDur(e.falta)}</b><span>${cap}</span></div>` : '') + (prog !== null ? `<div class="ah-bar"><i style="width:${(prog*100).toFixed(1)}%"></i></div>` : '');
  }
  return { DIAS, DIA_NOMBRE, HORARIO, DOCENTES, aulaDe, docenteDe, colorDe, rango, hhmm, ahoraMX, bloquesDe, estadoAhora, fmtDur, renderAhora };
})();
