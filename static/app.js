/* =========================
   ENDPOINTS (misma app Flask)
========================= */
const API = {
  chat: "/mensaje",
  health: "/health"
};

/* =========================
   ELEMENTS
========================= */
const chatBody = document.getElementById("chatBody");
const txtMessage = document.getElementById("txtMessage");
const btnSend = document.getElementById("btnSend");
const btnNew = document.getElementById("btnNew");
const btnExport = document.getElementById("btnExport");
const btnTheme = document.getElementById("btnTheme");
const btnAttach = document.getElementById("btnAttach");
const typingHint = document.getElementById("typingHint");
const statusLabel = document.getElementById("statusLabel");
const statusHint = document.getElementById("statusHint");
const statusDot = document.getElementById("statusDot");

<<<<<<< HEAD
let conversation = []; // local para exportación UI
=======
const dataConsentModal = document.getElementById("dataConsentModal");
const btnAcceptData = document.getElementById("btnAcceptData");
//const btnRejectData = document.getElementById("btnRejectData");
const chatFooter = document.querySelector('.chat__footer'); // Para ocultar/mostrar
const chatBodyContent = document.querySelector('.chat__body'); // Para ocultar/mostrar

let conversation = []; // local para exportación UI
let userConsentGiven = false; // Rastrear si el usuario ha aceptado

>>>>>>> e94429f (second commit)

/* =========================
   SESSION ID (persistente por navegador)
========================= */
function getSessionId(){
  const key = "chat_session_id";
  let id = localStorage.getItem(key);
  if(!id){
    // UUID simple (sin librerías)
    id = "sess_" + crypto.getRandomValues(new Uint32Array(4)).join("-");
    localStorage.setItem(key, id);
  }
  return id;
}

function resetSessionId(){
  localStorage.removeItem("chat_session_id");
}

/* =========================
   UTIL
========================= */
function nowTime(){
  const d = new Date();
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function scrollToBottom(){
  chatBody.scrollTop = chatBody.scrollHeight;
}

function setStatus(state, hint=""){
  if(state === "ok"){
    statusDot.style.background = "var(--ok)";
    statusDot.style.boxShadow = "0 0 0 6px rgba(39,209,124,.12)";
    statusLabel.textContent = "Listo";
  }
  if(state === "busy"){
    statusDot.style.background = "var(--primary)";
    statusDot.style.boxShadow = "0 0 0 6px rgba(42,163,255,.12)";
    statusLabel.textContent = "Procesando…";
  }
  if(state === "warn"){
    statusDot.style.background = "var(--warn)";
    statusDot.style.boxShadow = "0 0 0 6px rgba(255,200,87,.12)";
    statusLabel.textContent = "Atención";
  }
  statusHint.textContent = hint || statusHint.textContent;
}

function escapeHtml(str){
  return str
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function addMessage(role, text){
<<<<<<< HEAD
=======
   // Solo añade mensajes si el consentimiento ha sido dado
  if (!userConsentGiven && role === "assistant") return; // No mostrar respuestas del bot si no hay consentimiento

>>>>>>> e94429f (second commit)
  const wrapper = document.createElement("div");
  wrapper.className = `msg ${role === "user" ? "msg--user" : "msg--bot"}`;

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "bubble__meta";

  const who = document.createElement("span");
  who.className = "who";
  who.textContent = role === "user" ? "Tú" : "Asistente";

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = nowTime();

  meta.appendChild(who);
  meta.appendChild(time);

  const body = document.createElement("div");
  body.className = "bubble__text";
  body.innerHTML = escapeHtml(text);

  bubble.appendChild(meta);
  bubble.appendChild(body);

  wrapper.appendChild(bubble);
  chatBody.appendChild(wrapper);
  scrollToBottom();
}

function addTyping(){
<<<<<<< HEAD
=======
  // Solo muestra el indicador si el consentimiento ha sido dado
  if (!userConsentGiven) return;

>>>>>>> e94429f (second commit)
  const wrapper = document.createElement("div");
  wrapper.className = "msg msg--bot";
  wrapper.id = "typingRow";

  const bubble = document.createElement("div");
  bubble.className = "bubble";

  const meta = document.createElement("div");
  meta.className = "bubble__meta";

  const who = document.createElement("span");
  who.className = "who";
  who.textContent = "Asistente";

  const time = document.createElement("span");
  time.className = "time";
  time.textContent = nowTime();

  meta.appendChild(who);
  meta.appendChild(time);

  const body = document.createElement("div");
  body.className = "bubble__text";

  const typing = document.createElement("span");
  typing.className = "typing";
  typing.innerHTML = `
    <span class="dot"></span>
    <span class="dot"></span>
    <span class="dot"></span>
  `;

  body.appendChild(typing);
  bubble.appendChild(meta);
  bubble.appendChild(body);
  wrapper.appendChild(bubble);

  chatBody.appendChild(wrapper);
  scrollToBottom();
}

function removeTyping(){
  const row = document.getElementById("typingRow");
  if(row) row.remove();
}

function autoGrowTextarea(el){
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 160) + "px";
}

function downloadText(filename, text){
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* =========================
   BACKEND CALL (Flask -> n8n)
========================= */
async function callBackend(userText){
<<<<<<< HEAD
  const payload = {
    mensaje: userText,
    sessionId: getSessionId()
=======

  if (!userConsentGiven) {
    throw new Error("Por favor, acepta el tratamiento de datos para continuar.");
  }

  const payload = {
    mensaje: userText,
    sessionId: getSessionId(),
    ipAddress: await getClientIp()
>>>>>>> e94429f (second commit)
  };

  const res = await fetch(API.chat, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data;
  try{
    data = await res.json();
  }catch{
    const raw = await res.text();
    throw new Error("Respuesta no-JSON del servidor: " + raw);
  }

  if(!res.ok){
    throw new Error(data?.respuesta || ("Error HTTP: " + res.status));
  }

  return data.respuesta ?? "Sin respuesta del servidor.";
}

/* =========================
   SEND FLOW
========================= */
async function sendMessage(text){
  const clean = (text || "").trim();
  if(!clean) return;

<<<<<<< HEAD
=======
  // Si el consentimiento no ha sido dado, no se permite enviar mensajes
  if (!userConsentGiven) {
    displayMessageModal(); // Muestra el modal si no se ha dado el consentimiento
    return;
  }

>>>>>>> e94429f (second commit)
  addMessage("user", clean);
  conversation.push({ role: "user", content: clean, ts: new Date().toISOString() });

  txtMessage.value = "";
  autoGrowTextarea(txtMessage);

  setStatus("busy", "Consultando el asistente…");
  typingHint.textContent = "El asistente está escribiendo…";
  btnSend.disabled = true;

  addTyping();

  try{
    const reply = await callBackend(clean);

    removeTyping();
    addMessage("assistant", reply);
    conversation.push({ role: "assistant", content: reply, ts: new Date().toISOString() });

    setStatus("ok", "Respuesta recibida.");
    typingHint.textContent = "";
  }catch(err){
    removeTyping();
<<<<<<< HEAD
=======
    // Si el error es por falta de consentimiento, mostramos el modal
    if (err.message.includes("Por favor, acepta el tratamiento de datos")) {
        displayMessageModal();
        return; // Detiene el flujo aquí
    }
>>>>>>> e94429f (second commit)
    setStatus("warn", "No fue posible responder. Revisa n8n / endpoint.");
    addMessage("assistant", "En este momento no pude procesar tu solicitud. Intenta de nuevo o revisa la conexión con n8n.");
    typingHint.textContent = "";
    console.error(err);
  }finally{
    btnSend.disabled = false;
    txtMessage.focus();
  }
}

<<<<<<< HEAD
=======

/* =========================
   LÓGICA DEL MODAL DE CONSENTIMIENTO
========================= */

function displayMessageModal() {
  // Asegurarse de que el modal exista antes de intentar mostrarlo
  if (dataConsentModal) {
    dataConsentModal.style.display = "flex"; // Mostrar el modal
    chatFooter.style.opacity = '0'; // Ocultar footer del chat
    chatBodyContent.style.opacity = '0'; // Ocultar cuerpo del chat
    btnSend.disabled = true; // Deshabilitar botón de enviar
  }
}

function hideMessageModal() {
  if (dataConsentModal) {
    dataConsentModal.style.display = "none"; // Ocultar el modal
    chatFooter.style.opacity = '1'; // Mostrar footer del chat
    chatBodyContent.style.opacity = '1'; // Mostrar cuerpo del chat
    btnSend.disabled = false; // Habilitar botón de enviar
    txtMessage.focus(); // Devolver foco al campo de texto
  }
}

// Evento para aceptar el consentimiento
btnAcceptData.addEventListener("click", async () => {
  setStatus("busy", "Guardando tu decisión y conectando...");

  try {
    // 1. Obtener datos del usuario y del entorno
    const sessionId = getSessionId();
    // El IP se obtiene en el backend, pero podemos preguntar por él si es necesario
    // o basarnos en que el backend lo obtenga. Para este diseño, el backend sí lo hará.

    // 2. Enviar la aceptación al backend INCLUYENDO la IP y fecha obtenida aquí
    const response = await fetch('/api/consent', { // Ruta que crearemos en app.py
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId, // ID del chat
        ipAddress: await getClientIp(), // Función que crearemos para obtener IP
        consentStatus: true, // Indica que aceptó
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Error al registrar tu consentimiento.");
    }

    // Si la respuesta es OK:
    userConsentGiven = true; // Marcar que el consentimiento ha sido dado
    localStorage.setItem('consentGiven', 'true'); // Persistir en localStorage
    localStorage.setItem('consentTimestamp', new Date().toISOString());

    hideMessageModal(); // Ocultar el modal
    setStatus("ok", "¡Consentimiento aceptado! Puedes chatear.");
    txtMessage.focus();
    
    // Regenerar o habilitar el chat si estaba deshabilitado
    if (!document.querySelector('.chat__body.visible')) {
      document.querySelector('.chat__body').classList.add('visible');
      document.querySelector('.chat__footer').classList.add('visible');
      // Opcional: mostrar un mensaje de bienvenida después de aceptar
      addMessage("assistant", "¡Estupendo! Ahora puedes iniciar tu consulta.");
    }

  } catch (error) {
    console.error("Error al aceptar consentimiento:", error);
    setStatus("warn", "Hubo un problema al validar tu consentimiento.");
    // Opcional: mostrar un mensaje de error en el modal
    // Forzar la salida si no se puede registrar el consentimiento
    window.location.href = "/"; // Volver a la página principal o una de error
  }
});

// Evento para rechazar el consentimiento
/*btnRejectData.addEventListener("click", async () => {
  setStatus("warn", "Guardando tu decisión...");

  try {
    const sessionId = getSessionId();
    // Enviar el rechazo al backend
    const response = await fetch('/api/consent', { // Ruta que crearemos en app.py
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionId,
        ipAddress: await getClientIp(),
        consentStatus: false, // Indica que rechazó
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error al registrar rechazo de consentimiento:", errorData.error);
      // Continuar con el cierre incluso si falla el log, para la privacidad del usuario
    }
    
    // Sin importar si el log se guardó, el usuario rechazó
    localStorage.removeItem('chat_session_id'); // Limpiar sesión del chat
    localStorage.removeItem('consentGiven');
    localStorage.removeItem('consentTimestamp');

    // Redirigir o mostrar un mensaje final y no permitir más interacciones
    window.location.href = "/"; // Redirige a la página principal o a una página de "Gracias por visitarnos"
    // Opcional: mostrar un mensaje amigable antes de salir
    // alert("Gracias por tu visita. Lamentamos no poderte asistir sin tu consentimiento.");
  } catch (error) {
    console.error("Error al procesar el rechazo de consentimiento:", error);
    // Aún así, forzar la salida o redirección
    window.location.href = "/";
  }
});*/

// Función para obtener la IP del cliente (puede ser imperfecta, depende del navegador/config)
async function getClientIp() {
    try {
        // Usamos un servicio externo para obtener la IP pública.
        // Puedes usar cualquier API confiable para esto.
        const response = await fetch('https://api.ipify.org?format=json');
        const data = await response.json();
        return data.ip;
    } catch (error) {
        console.error("Error al obtener IP del cliente:", error);
        return "IP_DESCONOCIDA"; // Valor por defecto si falla
    }
}

// Función para inicializar el estado del chat al cargar la página
async function initializeChat() {

    try {
        const response = await fetch("/api/consent/status");
        const data = await response.json();

        if (data.consentGiven === true) {
            userConsentGiven = true;

            chatFooter.style.opacity = '1';
            chatBodyContent.style.opacity = '1';
            btnSend.disabled = false;

            setStatus("ok", "Consentimiento previamente registrado.");
            txtMessage.focus();

        } else {
            userConsentGiven = false;
            displayMessageModal();
            setStatus("warn", "Por favor acepta el tratamiento de datos.");
        }

    } catch (error) {
        console.error("Error verificando consentimiento:", error);
        displayMessageModal();
    }

    // Health check
    try{
      const r = await fetch(API.health);
      if(r.ok){
        setStatus("ok", "Servidor activo. SessionId: " + getSessionId());
      }else{
        setStatus("warn", "Servidor respondió con error.");
      }
    }catch{
      setStatus("warn", "No se pudo conectar al servidor.");
    }

    txtMessage.focus();
}

>>>>>>> e94429f (second commit)
/* =========================
   EVENTS
========================= */
btnSend.addEventListener("click", () => sendMessage(txtMessage.value));

txtMessage.addEventListener("keydown", (e) => {
  if(e.key === "Enter" && !e.shiftKey){
    e.preventDefault();
    sendMessage(txtMessage.value);
  }
});

txtMessage.addEventListener("input", () => autoGrowTextarea(txtMessage));

btnNew.addEventListener("click", () => {
<<<<<<< HEAD
  // limpia mensajes salvo el inicial
  const nodes = Array.from(chatBody.querySelectorAll(".msg"));
  nodes.slice(1).forEach(n => n.remove());

  conversation = [];
  resetSessionId(); // NUEVA conversación real (sessionId nuevo)
  setStatus("ok", "Nuevo chat iniciado.");
=======
// Si el usuario no ha aceptado, limpiar todo
  if (!userConsentGiven) {
    localStorage.removeItem('chat_session_id');
    localStorage.removeItem('consentGiven');
    localStorage.removeItem('consentTimestamp');
    conversation = [];
    chatBody.innerHTML = ''; // Limpiar todos los mensajes
    setStatus("ok", "Listo para iniciar.");
    typingHint.textContent = "";
    txtMessage.value = "";
    autoGrowTextarea(txtMessage);
    displayMessageModal(); // Volver a mostrar el modal de consentimiento
    return;
  }

  // Si ya aceptó, resetear sesión del chat
  const oldSessionId = getSessionId(); // Guardar current session ID for export if needed
  resetSessionId(); // Genera un nuevo sessionId
  conversation = []; // Limpia la conversación en memoria
  chatBody.innerHTML = ''; // Borra mensajes de la UI

  // Re-añadir el mensaje inicial del bot si aplica y no hay consentimiento
  // Por ahora, solo reiniciamos el chat y el estado
  setStatus("ok", "Nuevo chat iniciado. SessionId: " + getSessionId());
>>>>>>> e94429f (second commit)
  typingHint.textContent = "";
  txtMessage.value = "";
  autoGrowTextarea(txtMessage);
  txtMessage.focus();
<<<<<<< HEAD
});

btnExport.addEventListener("click", () => {
=======

  // Opcional: Podrías querer añadir de nuevo el mensaje de bienvenida del bot
  // addMessage("assistant", "¡Hola de nuevo! En qué puedo ayudarte hoy.");
});

btnExport.addEventListener("click", () => {
  // exportar solo si hay consentimiento
  if (!userConsentGiven) {
    alert("Para exportar la conversación, primero debes aceptar el tratamiento de datos.");
    return;
  }
>>>>>>> e94429f (second commit)
  const lines = conversation.map(m => {
    const who = m.role === "user" ? "USUARIO" : "ASISTENTE";
    return `[${who}] ${m.content}`;
  }).join("\n\n");

  const header = `Conversación - Alcaldía de Bucaramanga\nExportado: ${new Date().toLocaleString()}\nSessionId: ${getSessionId()}\n\n`;
  downloadText("conversacion.txt", header + (lines || "Sin mensajes."));
});

btnTheme.addEventListener("click", () => {
  const root = document.documentElement;
  const current = root.getAttribute("data-theme") || "dark";
  const next = current === "dark" ? "light" : "dark";
  root.setAttribute("data-theme", next);
  btnTheme.textContent = next === "dark" ? "☾" : "☀";
});

btnAttach.addEventListener("click", () => {
<<<<<<< HEAD
  addMessage("assistant", "Adjuntos (demo). Si quieres, te implemento carga real de archivos y envío al backend.");
});

=======
  if (!userConsentGiven) {
    alert("Por favor, acepta el tratamiento de datos para usar esta función.");
    return;
  }
  addMessage("assistant", "Adjuntos (demo). Si quieres, te implemento carga real de archivos y envío al backend.");
});

/* ========================= NUEVO EVENTO: BOTÓN DE LOGIN ADMIN ========================= */
const btnAdminLogin = document.getElementById("btnAdminLogin");

if (btnAdminLogin) { // Asegurarse de que el botón existe en la página
    btnAdminLogin.addEventListener("click", () => {
        // Redirigir al usuario a la página de login ('/login')
          window.location.href = "/login";
    });
}

>>>>>>> e94429f (second commit)
/* =========================
   INIT
========================= */
(async function init(){
<<<<<<< HEAD
=======
    // Inicializar el tema guardado al inicio
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  btnTheme.textContent = savedTheme === "dark" ? "☾" : "☀";
>>>>>>> e94429f (second commit)
  // Hora del mensaje inicial
  document.querySelectorAll("[data-time]").forEach(el => el.textContent = nowTime());

  // Chips
  document.querySelectorAll(".chip").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-quick");
      sendMessage(q);
    });
  });

  // Suggestions
  document.querySelectorAll(".suggest").forEach(btn => {
    btn.addEventListener("click", () => {
      const q = btn.getAttribute("data-suggest");
      sendMessage(q);
    });
  });

<<<<<<< HEAD
=======
    // >>> INICIALIZAR CHAT (verificar consentimiento) <<<
  await initializeChat(); // Llama a la función para verificar el consentimiento

>>>>>>> e94429f (second commit)
  // Health check
  try{
    const r = await fetch(API.health);
    if(r.ok){
      setStatus("ok", "Servidor activo. SessionId: " + getSessionId());
    }else{
      setStatus("warn", "Servidor respondió, pero con error.");
    }
  }catch{
    setStatus("warn", "No se pudo conectar al servidor Flask.");
  }

  txtMessage.focus();
})();
