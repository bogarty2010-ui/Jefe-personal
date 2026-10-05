// ==========================================
// CECYTEM · Núcleo compartido
// Supabase Auth + perfil + sincronización multidispositivo
// ==========================================

const REMOTE_KEYS = new Set([
  'cecytem_perfil', 'dashboard_materias_sellos', 'dashboard_tareas',
  'cecytem_calif_materias', 'cecytem_calif_actividades', 'horarios_personales',
  'maestros_lista'
]);


// ===== MODO DEMO: sin login, sin roles, sin red =====
const PERFIL_DEMO = {
  id: 'demo', activo: true, rol: 'admin', es_jefe: true, tipo_usuario: 'admin',
  numero_control: '26415082270124', nombre_completo: 'Bogart Yael Palapa Hernández',
  correo: 'demo@cecytem.local'
};

function toggleMenu(forzarCerrar) {
  const sidebar = document.getElementById('appSidebar');
  if (!sidebar) return;
  const abrir = forzarCerrar === true ? false : !sidebar.classList.contains('open');
  sidebar.classList.toggle('open', abrir);
  let bd = document.getElementById('sidebarBackdrop');
  if (!bd) {
    bd = document.createElement('div'); bd.id = 'sidebarBackdrop'; bd.className = 'sidebar-backdrop';
    bd.addEventListener('click', () => toggleMenu(true)); document.body.appendChild(bd);
  }
  bd.classList.toggle('show', abrir);
}
document.addEventListener('click', e => { if (e.target.closest && e.target.closest('#appSidebar .nav-btn')) toggleMenu(true); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') toggleMenu(true); });

function iniciarReloj() {
  const el = document.getElementById('global-reloj-fecha');
  if (!el) return;
  const actualizar = () => {
    const now = new Date();
    el.innerHTML = `<strong>📅 ${now.toLocaleDateString('es-MX', {weekday:'short', month:'short', day:'numeric'})}</strong><br>⏰ ${now.toLocaleTimeString('es-MX')}`;
  };
  actualizar();
  setInterval(actualizar, 1000);
}

function obtenerDatosSeguros(key, fallback) {
  try {
    const item = localStorage.getItem(key);
    if (!item) return fallback;
    const parsed = JSON.parse(item);
    return Array.isArray(parsed) ? parsed : (parsed && typeof parsed === 'object' ? parsed : fallback);
  } catch (_) { return fallback; }
}

function escGlobal(t) {
  return String(t ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

function mostrarUsuarioEnUI(perfil) {
  if (!perfil) return;
  const nombre = perfil.nombre_completo || perfil.nombre || '';
  const control = perfil.numero_control || perfil.matricula || '';
  const rol = perfil.rol || (perfil.tipo_usuario === 'personal' ? 'maestro' : perfil.tipo_usuario === 'admin' ? 'admin' : 'alumno');
  document.querySelectorAll('[data-usuario-nombre]').forEach(el => el.textContent = nombre);
  document.querySelectorAll('[data-usuario-control]').forEach(el => el.textContent = control);
  document.querySelectorAll('[data-usuario-rol]').forEach(el => el.textContent = rol.toUpperCase());
  // Oculta del menú los módulos que este rol no puede usar (la seguridad real la hace RLS en Supabase).
  const staff = ['admin', 'moderador'].includes(rol);
  const verJefe = staff || rol === 'maestro' || perfil.es_jefe;
  const verMaestros = staff || rol === 'maestro';
  document.querySelectorAll('a.nav-btn[href="jefe.html"]').forEach(a => a.hidden = !verJefe);
  document.querySelectorAll('a.nav-btn[href="maestros.html"]').forEach(a => a.hidden = !verMaestros);
}

async function obtenerPerfilActual() {
  if (!window.supabaseClient) return null;
  const { data: { user } } = await supabaseClient.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabaseClient.from('perfiles').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  if (data) {
    localStorage.setItem('usuarioActual', JSON.stringify(data));
    mostrarUsuarioEnUI(data);
  }
  return data;
}

async function requerirSesion() {
  localStorage.setItem('usuarioActual', JSON.stringify(PERFIL_DEMO));
  mostrarUsuarioEnUI(PERFIL_DEMO);
  return PERFIL_DEMO;
}

async function cerrarSesion() {
  location.replace('index.html');
}

async function guardarDatoRemoto(clave, valor) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    await supabaseClient.from('datos_usuario').upsert({ user_id:user.id, clave, valor, updated_at:new Date().toISOString() }, { onConflict:'user_id,clave' });
  } catch (e) { console.warn('Sincronización no disponible:', e.message); }
}

async function cargarDatoRemoto(clave, fallback) {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return fallback;
    const { data, error } = await supabaseClient.from('datos_usuario').select('valor').eq('user_id', user.id).eq('clave', clave).maybeSingle();
    if (error || !data) return fallback;
    localStorage.setItem(clave, JSON.stringify(data.valor));
    return data.valor;
  } catch (_) { return fallback; }
}

async function sincronizarClavesRemotas() {
  for (const clave of REMOTE_KEYS) {
    const local = localStorage.getItem(clave);
    const fallback = local ? JSON.parse(local) : null;
    await cargarDatoRemoto(clave, fallback);
  }
}

async function sincronizarTodoUsuario() {
  try {
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) return;
    await sincronizarClavesRemotas();
    const { data } = await supabaseClient.from('asistencias').select('fecha,numero_control,estatus,grupo').eq('grupo','101');
    if (Array.isArray(data) && window.__CECYTEM_ASISTENCIA_HOOK__) window.__CECYTEM_ASISTENCIA_HOOK__(data);
  } catch (e) { console.warn('Sincronización general:', e.message); }
}

function instalarSincronizacionLocal() {
  const original = localStorage.setItem.bind(localStorage);
  // Solo interceptamos claves de datos de la app; usuarioActual queda local por diseño.
  localStorage.setItem = function(key, value) {
    original(key, value);
    if (REMOTE_KEYS.has(key) && window.supabaseClient && window.__CECYTEM_AUTH_READY__) {
      try { guardarDatoRemoto(key, JSON.parse(value)); } catch (_) {}
    }
  };
}

function mostrarEstadoAuth() {
  const perfil = obtenerDatosSeguros('usuarioActual', null);
  if (perfil) mostrarUsuarioEnUI(perfil);
}

// Demo: todas las páginas abren directo, con permisos de administrador y datos locales.
document.addEventListener('DOMContentLoaded', async () => {
  iniciarReloj();
  await requerirSesion();
  document.querySelectorAll('[data-cerrar-sesion]').forEach(b => b.addEventListener('click', cerrarSesion));
});

// Compatibilidad con el código existente del proyecto.
async function handleRegister(event) { if (event) event.preventDefault(); }
async function handleLogin(event) { if (event) event.preventDefault(); }

if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost' || location.hostname === '127.0.0.1')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(err => console.warn('PWA:', err)));
}
