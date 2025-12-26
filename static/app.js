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

let conversation = []; // local para exportación UI

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
  const payload = {
    mensaje: userText,
    sessionId: getSessionId()
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
    setStatus("warn", "No fue posible responder. Revisa n8n / endpoint.");
    addMessage("assistant", "En este momento no pude procesar tu solicitud. Intenta de nuevo o revisa la conexión con n8n.");
    typingHint.textContent = "";
    console.error(err);
  }finally{
    btnSend.disabled = false;
    txtMessage.focus();
  }
}

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
  // limpia mensajes salvo el inicial
  const nodes = Array.from(chatBody.querySelectorAll(".msg"));
  nodes.slice(1).forEach(n => n.remove());

  conversation = [];
  resetSessionId(); // NUEVA conversación real (sessionId nuevo)
  setStatus("ok", "Nuevo chat iniciado.");
  typingHint.textContent = "";
  txtMessage.value = "";
  autoGrowTextarea(txtMessage);
  txtMessage.focus();
});

btnExport.addEventListener("click", () => {
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
  addMessage("assistant", "Adjuntos (demo). Si quieres, te implemento carga real de archivos y envío al backend.");
});

/* =========================
   INIT
========================= */
(async function init(){
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
