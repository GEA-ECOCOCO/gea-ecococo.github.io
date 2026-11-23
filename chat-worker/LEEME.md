# Asistente con IA de ECOCOCO: cómo activarlo

El chat del sitio no se muestra hasta que pongas la dirección de tu Worker en `config.js` (`chatUrl`). La clave de Anthropic vive SOLO en Cloudflare, nunca en el sitio.

1. Crea una cuenta en https://console.anthropic.com, agrega saldo y en **Settings → Limits** fija un tope de gasto mensual (por ejemplo US$10). Crea una API key.
2. Crea una cuenta gratis en https://dash.cloudflare.com → **Workers & Pages → Create → Worker**. Nómbralo `ecococo-chat`, pulsa Deploy, luego **Edit code**, pega TODO el contenido de `worker.js` y despliega.
3. En el Worker: **Settings → Variables and Secrets → Add** → tipo *Secret*, nombre `ANTHROPIC_API_KEY`, valor tu clave.
4. (Recomendado) **Storage & Databases → KV → Create** un namespace `RL`; en el Worker, **Bindings → Add → KV namespace**, variable `RL`. Activa límite por visitante (20 mensajes/10 min) y tope diario (500 mensajes). Cambiables con variables `RATE_LIMIT` y `DAILY_CAP`.
5. Si compras dominio propio, agrega la variable `ALLOWED_ORIGINS` con `https://gea-ecococo.github.io,https://tudominio.com`.
6. Opcional: variable `MODEL` para cambiar de modelo (por defecto `claude-haiku-5-5`, el más económico) y `ANTHROPIC_VERSION` si la API pide otra versión (por defecto `2023-06-01`; la consola mostró `2026-10-21`).
7. Copia la URL del Worker (termina en `workers.dev`) y pégala en `config.js`: `chatUrl:'https://ecococo-chat.TU-USUARIO.workers.dev'`. Publica y espera ~10 min.

Prueba: abre el sitio, toca el botón verde del chat y pregunta "¿cuánto cuesta el bulto?". Si algo falla, el chat ofrece WhatsApp.
Los precios del asistente se regeneran con el sitio: tras cambiar precios, vuelve a pegar `worker.js` en Cloudflare.

## Correo automático de la proforma de factura (opcional)

La ruta `/factura` de este mismo Worker envía la proforma en PDF al correo que el cliente escribe (con copia a GEA) usando Resend.

1. Crea una cuenta en resend.com y verifica tu dominio (por ejemplo geaecococo.com.gt). Sin dominio verificado, Resend solo permite enviar a tu propio correo.
2. En Cloudflare, Worker `ecococo-chat` → Settings → Variables and Secrets, agrega:
   - Secreto `RESEND_API_KEY` (la clave de Resend).
   - Variable `MAIL_FROM`, por ejemplo `GEA Carbón <facturas@geaecococo.com.gt>`.
   - Opcional `MAIL_COPY` (copia interna; por defecto geaecococo.ventas@gmail.com) y `FAC_CAP` (tope diario, por defecto 100).
3. Con el KV `RL` ya conectado, aplica el límite de 4 envíos por visitante cada 10 minutos.

Mientras no estén esos datos, el formulario avisa y deja descargar o enviar por WhatsApp.

## Avisos (notificaciones push) y promociones programadas

El Worker también envía avisos a quienes los activan en el sitio o la app. Los mensajes salen de `promos.json` (en la raíz del sitio): lo edita Claude, no hace falta volver a pegar el Worker para cambiar promociones.

1. Pega de nuevo el `worker.js` actualizado en Cloudflare (Edit code → Deploy). El KV `RL` debe estar conectado (ya lo está para el chat).
2. En el Worker: **Settings → Trigger Events → Cron Triggers → Add**: expresión `*/5 * * * *` (cada 5 minutos). Ese disparador revisa el calendario y envía por lotes.
3. (Recomendado) Secreto `PUSH_ADMIN` con una clave que tú inventes, solo para pruebas.
4. Las llaves de cifrado VAPID se crean solas la primera vez y quedan en el KV. No hay nada más que copiar.

Prueba: en el sitio, pie de página → "Recibir avisos de ofertas" → acepta el permiso. Luego abre en el navegador:
`https://ecococo-chat.manolo-esau.workers.dev/push/test?key=TU_CLAVE&id=asado-1kg` y llegará el aviso. `/push/stats?key=TU_CLAVE` muestra cuántas personas están suscritas.
Horario por defecto (hora de Guatemala): miércoles 12:00 (aviso informativo) y viernes 11:00 (promoción). Plan gratuito: el Worker envía 20 avisos por ejecución (cada 5 minutos), así que 1,000 suscriptores se atienden en unas 4 horas.

## Registro de clientes (CRM) — ruta /lead
Las solicitudes del formulario de distribuidores se anotan en la hoja de Google "CRM ECOCOCO" mediante un Apps Script.
Secretos del Worker: `CRM_URL` (dirección /exec del script publicado) y `CRM_KEY` (clave compartida; la misma que la propiedad del script `CRM_KEY`).
Sin ellos la ruta responde 501 y el formulario cae al envío por WhatsApp, como antes.
