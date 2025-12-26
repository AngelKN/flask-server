import os
import logging
from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__, template_folder="templates", static_folder="static")

LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=LOG_LEVEL)

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL", "http://n8n:5678/webhook/chat-alcaldia")
REQUEST_TIMEOUT = int(os.getenv("REQUEST_TIMEOUT", "180"))

# ===============================
# HEALTHCHECK
# ===============================
@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

# ===============================
# VISTA PRINCIPAL (CHAT)
# ===============================
@app.get("/")
def chat():
    return render_template("chat.html")

# ===============================
# ENDPOINT DE PRUEBA (OPCIONAL)
# ===============================
@app.post("/send")
def send():
    return jsonify({"response": "Servidor Docker activo 🚀"}), 200

# ===============================
# ENDPOINT DEL CHAT (CON MEMORIA EN CLIENTE)
# ===============================
@app.post("/mensaje")
def mensaje():
    data = request.get_json(silent=True)
    app.logger.info("JSON RECIBIDO: %s", data)

    if not data:
        return jsonify({"respuesta": "Error: no se recibió JSON"}), 400

    texto = (data.get("mensaje") or "").strip()
    session_id = (data.get("sessionId") or "").strip()

    if not texto or not session_id:
        return jsonify({"respuesta": "Error: 'mensaje' o 'sessionId' faltante"}), 400

    payload = {
        "message": texto,
        "sessionId": session_id
    }

    try:
        r = requests.post(
            N8N_WEBHOOK_URL,
            json=payload,
            timeout=REQUEST_TIMEOUT
        )

        if r.status_code != 200:
            app.logger.error("n8n error %s: %s", r.status_code, r.text)
            return jsonify({"respuesta": f"Error n8n ({r.status_code}): {r.text}"}), 502

        data_n8n = {}
        try:
            data_n8n = r.json()
        except Exception:
            # Si n8n devolvió texto plano
            return jsonify({"respuesta": r.text}), 200

        # Adapta según tu flujo n8n (estos keys son comunes)
        respuesta = (
            data_n8n.get("respuesta")
            or data_n8n.get("reply")
            or data_n8n.get("output")
            or data_n8n.get("text")
            or "Sin respuesta del agente"
        )

        return jsonify({"respuesta": respuesta}), 200

    except requests.exceptions.RequestException as e:
        app.logger.exception("Error conectando con n8n")
        return jsonify({"respuesta": f"Error de conexión con n8n: {str(e)}"}), 502


if __name__ == "__main__":
    # Solo para debug local; en docker usamos gunicorn
    app.run(host="0.0.0.0", port=5000, debug=True)
