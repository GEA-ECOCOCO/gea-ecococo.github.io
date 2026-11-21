# Asistente con IA de ECOCOCO: cómo activarlo

El chat del sitio no se muestra hasta que pongas la dirección de tu Worker en `config.js` (`chatUrl`). La clave de Anthropic vive SOLO en Cloudflare, nunca en el sitio.

1. Crea una cuenta en https://console.anthropic.com, agrega saldo y en **Settings → Limits** fija un tope de gasto mensual (por ejemplo US$10). Crea una API key.
2. Crea una cuenta gratis en https://dash.cloudflare.com → **Workers & Pages → Create → Worker**. Nómbralo `ecococo-chat`, pulsa Deploy, luego **Edit code**, pega TODO el contenido de `worker.js` y despliega.
3. En el Worker: **Settings → Variables and Secrets → Add** → tipo *Secret*, nombre `ANTHROPIC_API_KEY`, valor tu clave.
4. (Recomendado) **Storage & Databases → KV → Create** un namespace `RL`; en el Worker, **Bindings → Add → KV namespace**, variable `RL`. Activa límite por visitante (20 mensajes/10 min) y tope diario (500 mensajes). Cambiables con variables `RATE_LIMIT` y `DAILY_CAP`.
5. Si compras dominio propio, agrega la variable `ALLOWED_ORIGINS` con `https://gea-ecococo.github.io,https://tudominio.com`.
6. Opcional: variable `MODEL` para cambiar de modelo (por defecto `claude-haiku-5-5`).
7. Copia la URL del Worker (termina en `workers.dev`) y pégala en `config.js`: `chatUrl:'https://ecococo-chat.TU-USUARIO.workers.dev'`. Publica y espera ~10 min.

Prueba: abre el sitio, toca el botón verde del chat y pregunta "¿cuánto cuesta el bulto?". Si algo falla, el chat ofrece WhatsApp.
Los precios del asistente se regeneran con el sitio: tras cambiar precios, vuelve a pegar `worker.js` en Cloudflare.
