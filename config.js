/* Configuración pública del sitio. Aquí NUNCA van claves privadas.
   formEndpoint: dirección de un servicio externo de formularios (por ejemplo Web3Forms o Formspree).
   formKey: clave PÚBLICA del servicio, si la requiere (Web3Forms la llama access_key).
   ga4Id: ID de medición de Google Analytics 4 (G-XXXXXXXXXX). Vacío = analítica apagada.
   usdRate: quetzales por 1 USD, solo para la equivalencia aproximada en la versión en inglés (tipo de cambio de referencia del Banguat, 20 nov 2026: 7.6478). Actualízalo cuando cambie.
   chatUrl: dirección del Worker de Cloudflare del asistente con IA (ver chat-worker/LEEME.md). Vacío = el chat no se muestra.
   panelUrl: dirección pública (termina en /exec) del servidor del panel de GEA. Recibe los pedidos del carrito. Vacío = el carrito solo envía por WhatsApp.
   reportUrl: enlace de inserción (embed) de un informe de Looker Studio con permisos solo para GEA. Vacío = no se muestra. */
window.GEA_CONFIG={chatUrl:'https://ecococo-chat.manolo-esau.workers.dev',formEndpoint:'https://ecococo-chat.manolo-esau.workers.dev/lead',formKey:'',ga4Id:'G-W9EH1L3LKN',reportUrl:'',panelUrl:'https://script.google.com/macros/s/AKfycbymgXbz6KD3sh9tF2m6OD9FAGQS4B30g1XmaD4hUQkMw5lIG3gjUDB2u16rO0ZTbEur/exec',whatsapp:'50242794894',nit:'70960682',usdRate:7.65,usdDate:'Nov 20, 2026'};
