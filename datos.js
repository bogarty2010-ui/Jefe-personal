// ==========================================
// datos.js · Datos y utilidades compartidas (jefe.html y maestros.html)
// Todo con localStorage por ahora; el backend (Supabase) se conecta después.
// ==========================================
const GRUPO = '101', PREF = '2641508227';
// Lista oficial octubre 2026 (32 alumnos). Todo se guarda por No. de control, nunca por No. de lista.
const ALUMNOS = [
 ['0061','Alvarez Alcantar Ian Alexander'],['0062','Aviles Contreras Alexander Tadeo'],['0063','Barrios Sanchez Marijose'],
 ['0064','Bedolla Angeles Nimsi Santiago'],['0114','Carmona Solache Alexis Giovvanni'],['0066','Castillo Rodriguez Ian Joshua'],
 ['0115','Chimal Iglesias Cristopher Matthew'],['0069','Cruz Sanchez Alejandra Guadalupe'],['0117','Diaz Saldivar Emmanuel De Jesus Yaocuauhtli'],
 ['0070','Duarte Aranda Cristian'],['0118','Dueñas Ramirez Baruk'],['0198','Fernandez Partida Iker Omar'],
 ['0196','Fernandez Vazquez Humberto Tadeo'],['0072','Garcia Jarquin Dulce Aimee'],['0211','Gonzalez Ibarra Ian Imanol'],
 ['0230','Hernandez Moncada Iker Antonio'],['0167','Hernandez Zuñiga Brandon Manuel'],['0241','Herrera De La Cruz Luis Fernando'],
 ['0166','Ibarra Marin Luis Eduardo'],['0094','Lona Tapia Gael Santiago'],['0237','Lopez Cruz Eumir Emiliano'],
 ['0186','Mendoza Ortega Andrea Guadalupe'],['0075','Ontiveros Bacho Cristopher Alberto'],['0098','Ortiz Rodríguez Yamilet Michelle'],
 ['0124','Palapa Hernandez Bogart Yael'],['0193','Rosas Garcia Nestor Abraham'],['0127','Sabino Muñoz Jazmin Naomi'],
 ['0128','Santiago Cuevas Edgar Tadeo'],['0129','Segura Perez Leonel Ivan'],['0008','Vazquez Chavez Juan Carlos'],
 ['0095','Vazquez Fuentes Victor Angel'],['0009','Villegas Barrera Jesus Adrian']
].map(([suf, nombre], i) => ({ id: i + 1, control: PREF + suf, nombre }));

// Días hábiles por mes (de la lista impresa). Si un mes no está aquí, se usan lunes a viernes.
const HABILES = { '2026-10': [1,2,5,6,7,8,9,12,13,14,15,16,19,20,21,22,23,26,27,28,29,30] };
const LETRA = { Presente:'P', Retardo:'R', Falta:'F', Justificado:'J' };
const DEF = { uniforme:'Completo', credencial:'Sí', cuaderno:'Sí', libro:'Sí', aseo:'Pendiente', cumplimientoAseo:'No asignado' };
const K = { asis:'jefe101_asistencia', check:'jefe101_checklist', cierre:'jefe101_cerradas', mig:'jefe101_migrado' };

const $ = id => document.getElementById(id);
const leer = (k, def) => { try { const o = JSON.parse(localStorage.getItem(k)); return o && typeof o === 'object' ? o : def; } catch (e) { return def; } };
// Solo caché local: la fuente de verdad compartida está en Supabase (asistencias + datos_grupo).
const guardar = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} };
const HOY = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Mexico_City' }).format(new Date());

let asis = leer(K.asis, {});      // { 'YYYY-MM-DD': { control: estatus } }
let check = leer(K.check, {});    // { control: { uniforme, credencial, ... } }
let cierres = leer(K.cierre, {}); // { 'YYYY-MM-DD': true }

// ---------- Calendario ----------
function habilesDe(ym) {
    if (HABILES[ym]) return HABILES[ym].map(d => `${ym}-${String(d).padStart(2, '0')}`);
    const [y, m] = ym.split('-').map(Number), out = [];
    for (let d = 1; d <= new Date(y, m, 0).getDate(); d++) {
        const w = new Date(y, m - 1, d).getDay();
        if (w > 0 && w < 6) out.push(`${ym}-${String(d).padStart(2, '0')}`);
    }
    return out;
}
const etiquetaDia = f => new Date(f + 'T12:00:00').toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });

// ---------- Asistencia ----------
const estatusDe = (f, c) => (asis[f] && asis[f][c]) || 'Sin registrar';

// Resumen por alumno sobre los días indicados (solo cuentan los días con lista cerrada).
function resumenAlumno(control, dias) {
    const contados = dias.filter(d => cierres[d]);
    let p = 0, r = 0, j = 0, f = 0;
    contados.forEach(d => { const e = estatusDe(d, control); if (e === 'Presente') p++; else if (e === 'Retardo') r++; else if (e === 'Justificado') j++; else f++; });
    const base = contados.length - j;
    return { p, r, j, f, pct: base > 0 ? Math.round((p + r) / base * 100) : null };
}

// ---------- Utilidades ----------
function descargar(nombre, filas) {
    const csv = '\ufeff' + filas.map(f => f.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
    const l = document.createElement('a'); l.href = url; l.download = nombre;
    document.body.appendChild(l); l.click(); l.remove(); URL.revokeObjectURL(url);
}

// ---------- Horario del Grupo 101 (mismo que horarios.html) ----------
const horarioData = [
    { hora: "07:00 - 07:50", lunes: "Pensamiento Filosófico y Humanidades I", martes: "Pensamiento Filosófico y Humanidades I", miercoles: "Ciencias Naturales, Exp. y Tec. I", jueves: "-", viernes: "Pensamiento Matemático I" },
    { hora: "07:50 - 08:40", lunes: "Pensamiento Filosófico y Humanidades I", martes: "Pensamiento Filosófico y Humanidades I", miercoles: "Lengua y Comunicación I", jueves: "Ciencias Naturales, Exp. y Tec. I", viernes: "Pensamiento Matemático I" },
    { hora: "08:40 - 09:30", lunes: "Ciencias Naturales, Exp. y Tec. I", martes: "Lengua y Comunicación I", miercoles: "Inglés I", jueves: "Cultura Digital I", viernes: "Ciencias Sociales I" },
    { hora: "09:30 - 10:20", lunes: "Ciencias Naturales, Exp. y Tec. I", martes: "Lengua y Comunicación I", miercoles: "Orientación Educativa", jueves: "Cultura Digital I", viernes: "Ciencias Sociales I" },
    { hora: "10:20 - 10:40", tipo: "receso", texto: "RECESO" },
    { hora: "10:40 - 11:30", lunes: "-", martes: "-", miercoles: "Actividades Artísticas y Culturales", jueves: "Pensamiento Matemático I", viernes: "Inglés I" },
    { hora: "11:30 - 12:20", lunes: "-", martes: "-", miercoles: "-", jueves: "Pensamiento Matemático I", viernes: "Inglés I" },
    { hora: "12:20 - 13:10", lunes: "-", martes: "-", miercoles: "-", jueves: "-", viernes: "Cultura Digital I" },
    { hora: "13:10 - 14:00", lunes: "-", martes: "-", miercoles: "-", jueves: "-", viernes: "-" }
];
const SEMANA = ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'];
const MATERIAS = [...new Set(horarioData.flatMap(f => SEMANA.map(d => f[d])).filter(m => m && m !== '-'))];
// Clases de una fecha: [{ hora, materia }] (un bloque por cada hora de clase)
function clasesDelDia(f) {
    const d = SEMANA[new Date(f + 'T12:00:00').getDay() - 1];
    return d ? horarioData.filter(r => !r.tipo && r[d] && r[d] !== '-').map(r => ({ hora: r.hora, materia: r[d] })) : [];
}
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ==========================================
// Sincronización del GRUPO con Supabase (tiempo real, compartida entre jefe, maestros y admin)
// ==========================================
const sb = () => window.supabaseClient;
function estadoSync(ok, msg) {
    const el = document.getElementById('estadoSync'); if (!el) return;
    el.textContent = ok ? '☁ Sincronizado' : '⚠ ' + (msg || 'Sin conexión: guardado solo en este dispositivo');
    el.style.color = ok ? '#2ecc71' : '#f5b84b';
}
async function cargarGrupoRemoto() {
    if (!sb()) return false;
    try {
        const [a, g] = await Promise.all([
            sb().from('asistencias').select('fecha,numero_control,estatus').eq('grupo', GRUPO).not('estatus', 'is', null),
            sb().from('datos_grupo').select('clave,valor').eq('grupo', GRUPO)
        ]);
        if (a.error || g.error) throw (a.error || g.error);
        const A = {}, C = {}, K2 = {};
        a.data.forEach(r => { (A[r.fecha] = A[r.fecha] || {})[r.numero_control] = r.estatus; });
        g.data.forEach(r => {
            if (r.clave.startsWith('cierre:') && r.valor && r.valor.cerrada) C[r.clave.slice(7)] = true;
            else if (r.clave.startsWith('check:')) K2[r.clave.slice(6)] = r.valor;
        });
        asis = A; cierres = C; check = K2;
        guardar(K.asis, asis); guardar(K.cierre, cierres); guardar(K.check, check);
        estadoSync(true); return true;
    } catch (e) { console.warn('Carga remota del grupo:', e.message); estadoSync(false); return false; }
}
// filas: [{ fecha, control, estatus }]  ('Sin registrar' borra el registro)
async function guardarAsistenciaRemoto(filas) {
    if (!sb() || !filas.length) return;
    try {
        const poner = filas.filter(f => f.estatus !== 'Sin registrar');
        if (poner.length) {
            const { error } = await sb().from('asistencias').upsert(
                poner.map(f => ({ fecha: f.fecha, numero_control: f.control, grupo: GRUPO, estatus: f.estatus })),
                { onConflict: 'numero_control,fecha' });
            if (error) throw error;
        }
        const porFecha = {};
        filas.filter(f => f.estatus === 'Sin registrar').forEach(f => (porFecha[f.fecha] = porFecha[f.fecha] || []).push(f.control));
        for (const [fecha, ctrls] of Object.entries(porFecha)) {
            const { error } = await sb().from('asistencias').delete().eq('fecha', fecha).in('numero_control', ctrls);
            if (error) throw error;
        }
        estadoSync(true);
    } catch (e) { console.warn('Asistencia remota:', e.message); estadoSync(false, 'No se pudo guardar en la nube: ' + e.message); }
}
async function guardarDatoGrupo(clave, valor) {
    if (!sb()) return;
    const { error } = await sb().from('datos_grupo').upsert({ grupo: GRUPO, clave, valor, updated_at: new Date().toISOString() }, { onConflict: 'grupo,clave' });
    error ? estadoSync(false, error.message) : estadoSync(true);
}
async function borrarDatoGrupo(clave) {
    if (!sb()) return;
    const { error } = await sb().from('datos_grupo').delete().eq('grupo', GRUPO).eq('clave', clave);
    error ? estadoSync(false, error.message) : estadoSync(true);
}
let _canalGrupo = null;
function suscribirGrupo(alCambiar) {
    if (!sb() || _canalGrupo) return;
    let t; const deb = () => { clearTimeout(t); t = setTimeout(async () => { if (await cargarGrupoRemoto()) alCambiar(); }, 300); };
    _canalGrupo = sb().channel('grupo-' + GRUPO)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'asistencias' }, deb)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'datos_grupo' }, deb)
        .subscribe();
}
