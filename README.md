# CECYTEM Ecatepec II · Grupo 101 · v6 (Supabase verificado)

Sitio estático (HTML/JS/CSS) + Supabase. Funciona en celular, tablet, laptop y monitor grande; se puede instalar como app (PWA).

## Pasos para activarlo (en este orden)
1. **Supabase → SQL Editor:** pega y ejecuta `supabase/migrations/20261003000000_integracion_supabase_existente.sql` (es idempotente; se puede repetir sin riesgo).
2. **Regístrate** en `index.html` con el No. de control del admin y luego ejecuta `supabase/admin_setup.sql` (cambia el correo) para darte rol admin / jefe.
3. Abre `test-supabase.html` (solo lectura) para confirmar que todo responde.
4. **Authentication → Providers → Email:** si no quieres que los alumnos confirmen correo, desactiva "Confirm email" (o confírmalos desde Users).
5. Publica (GitHub Pages / Vercel) o prueba local: `iniciar_servidor.bat` / `./iniciar_servidor.sh` y abre http://localhost:8080.

## Roles
| Rol | Qué puede |
|---|---|
| alumno | su perfil, su dashboard y sus propias asistencias |
| jefe (alumno con `es_jefe`) | pase de lista, cierres, uniforme/credencial/material/aseo del Grupo 101 |
| maestro | ver lista del grupo en sus días de clase (materias en `asignaciones_docentes`) |
| moderador | editar datos del grupo |
| admin | todo |
| padre | rol reservado (sin acceso a datos de alumnos todavía) |

La seguridad real la imponen las políticas RLS de Supabase; ocultar botones en la página es solo comodidad.

## Tiempo real
`asistencias` y `datos_grupo` están en la publicación Realtime: lo que registra el jefe aparece solo en la pantalla de maestros y admin. Los checklists se guardan una fila por alumno y las cierres una fila por día, así dos personas no se pisan.

## Seguridad
- El navegador usa solo la clave publishable. Nunca pongas `service_role` en este proyecto.
- Los QR se generan en el dispositivo (ya no se envían datos de alumnos a servicios externos).
- Un usuario no puede cambiarse su propio rol/jefe/activo (trigger `proteger_perfil`).
- Cuentas que no coinciden con un alumno/docente registrado quedan **inactivas** hasta que un admin las active.
- Limitaciones conocidas: la CURP como contraseña es débil (la CURP no es secreta); y quien conozca un No. de control sin cuenta podría registrarlo antes que su dueño. Para endurecerlo, que el admin cargue la CURP/correo de cada alumno y se valide en el registro, o se reparta un código de invitación.
- Si se pierde la conexión mientras se pasa lista, el cambio queda solo en ese dispositivo y la página lo avisa (⚠). No hay cola de reintentos.

## Archivos
`index.html` login/registro · `dashboard.html` académico · `personal.html` credencial · `jefe.html` panel del jefe · `maestros.html` panel docente · `horarios.html` horario · `app.js` núcleo (sesión, roles, menú) · `datos.js` datos del grupo + sincronización · `sw.js` offline/PWA · `test-supabase.html` diagnóstico.
