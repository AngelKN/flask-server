import os
import logging
from flask import Flask, render_template, request, jsonify, redirect, url_for, session, send_file
import requests
from supabase import create_client
import bcrypt
from datetime import datetime, timezone
from collections import Counter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import Table, TableStyle,ListFlowable, ListItem, PageBreak
import io
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image
from reportlab.lib.units import inch
import matplotlib.pyplot as plt
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfbase import pdfmetrics


app = Flask(__name__, template_folder="templates", static_folder="static")
app.secret_key = os.getenv("FLASK_SECRET_KEY")

# ===============================
# CONFIGURACIÓN SUPABASE
# ===============================
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

supabase_client = None
if SUPABASE_URL and SUPABASE_SERVICE_KEY:
    try:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)
        app.logger.info("Supabase client initialized successfully.")
    except Exception as e:
        app.logger.error(f"Failed to initialize Supabase client: {e}")

logging.basicConfig(level="INFO")

N8N_WEBHOOK_URL = os.getenv("N8N_WEBHOOK_URL")
REQUEST_TIMEOUT = 180

# ===============================
# HEALTHCHECK
# ===============================
@app.get("/health")
def health():
    return jsonify({"status": "ok"}), 200

# ===============================
# CHAT VIEW
# ===============================
@app.get("/")
def chat():
    return render_template("chat.html")

# ===============================
# LOGIN
# ===============================
@app.get("/login")
def show_login():
    if session.get("logged_in"):
        return redirect(url_for("admin_dashboard"))
    return render_template("login.html")

@app.post("/login")
def process_login():
    data = request.get_json()
    username = data.get("username")
    password = data.get("password")

    try:
        response = supabase_client.from_("users") \
            .select("username, password_hash, role") \
            .eq("username", username) \
            .limit(1).execute()

        if response.data:
            user = response.data[0]
            if bcrypt.checkpw(password.encode(), user["password_hash"].encode()):
                session["logged_in"] = True
                session["username"] = user["username"]
                session["user_role"] = user["role"]
                return jsonify({"message": "Login exitoso"}), 200

        return jsonify({"error": "Usuario o contraseña incorrectos"}), 401

    except Exception:
        app.logger.exception("Error login")
        return jsonify({"error": "Error autenticando"}), 500

@app.get("/admin")
def admin_dashboard():
    if not session.get("logged_in"):
        return redirect(url_for("show_login"))
    return render_template("admin.html", username=session.get("username"))

@app.get("/logout")
def logout():
    session.clear()
    return redirect(url_for("show_login"))

# ===============================
# CONSENTIMIENTO
# ===============================
@app.post("/api/consent")
def consent():
    data = request.get_json()

    consent_data = {
        "session_id": data.get("sessionId"),
        "ip_address": data.get("ipAddress"),
        "consent_given": data.get("consentStatus"),
        "event_timestamp": data.get("timestamp"),
        "recorded_at": datetime.now(timezone.utc).isoformat()
    }

    try:
        supabase_client.from_("user_consent").insert(consent_data).execute()
        return jsonify({"message": "Consentimiento registrado"}), 200
    except Exception:
        app.logger.exception("Error guardando consentimiento")
        return jsonify({"error": "Error guardando consentimiento"}), 500

@app.get("/api/consent/status")
def consent_status():
    if not supabase_client:
        return jsonify({"error": "DB no disponible"}), 500

    client_ip = request.remote_addr

    try:
        response = supabase_client.from_("user_consent") \
            .select("consent_given") \
            .eq("ip_address", client_ip) \
            .order("recorded_at", desc=True) \
            .limit(1) \
            .execute()

        if response.data:
            return jsonify({
                "consentGiven": response.data[0]["consent_given"]
            }), 200

        return jsonify({"consentGiven": False}), 200

    except Exception:
        app.logger.exception("Error verificando consentimiento")
        return jsonify({"error": "Error interno"}), 500
    


        
# ===============================
# CHAT
# ===============================
@app.post("/mensaje")
def mensaje():
    data = request.get_json()
    texto = data.get("mensaje")
    session_id = data.get("sessionId")

    if not texto or not session_id:
        return jsonify({"respuesta": "Datos incompletos"}), 400

    client_ip = data.get("ipAddress")

    payload = {
        "message": texto,
        "sessionId": session_id,
        "ip_address": client_ip,
    }

    try:
        r = requests.post(N8N_WEBHOOK_URL, json=payload, timeout=REQUEST_TIMEOUT)

        if r.status_code != 200:
            print("Error webhook:", r.status_code, r.text)
            return jsonify({"respuesta": "Error en servicio externo"}), 500
        respuesta = r.json().get("reply", "Sin respuesta")


        return jsonify({"respuesta": respuesta}), 200

    except Exception:
        app.logger.exception("Error en chat")
        return jsonify({"respuesta": "Error interno"}), 500

# ===============================
# ESTADÍSTICAS ADMIN
# ===============================
@app.get("/api/admin/stats")
def admin_stats():
    if not session.get("logged_in"):
        return jsonify({"error": "No autorizado"}), 401

    try:
        response = supabase_client.from_("historial_mensajes").select("*").execute()
        data = response.data or []

        total_messages = len(data)
        session_ids = set()
        ips = set()
        channels = Counter()
        daily_counter = Counter()
        hourly_counter = Counter()
        topic_counter = Counter()

        for row in data:
            session_ids.add(row.get("session_id"))

            ip_value = row.get("ID_unico")
            if ip_value and str(ip_value).strip() != "":
                ips.add(ip_value)

            channels[row.get("canal")] += 1

            # 📅 Fecha
            if row.get("created_at"):
                dt = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
                daily_counter[dt.strftime("%Y-%m-%d")] += 1
                hourly_counter[dt.strftime("%H")] += 1

            # 🎯 NUEVO: Clasificación por tema (desde BD)
            tema = row.get("tema")
            if tema and str(tema).strip() != "":
                topic_counter[tema] += 1

        total_sessions = len(session_ids)
        unique_ips = len(ips)
        avg_messages = round(total_messages / total_sessions, 2) if total_sessions else 0
        top_channel = channels.most_common(1)[0][0] if channels else "-"
        top_day = daily_counter.most_common(1)[0][0] if daily_counter else "-"
        top_topic = topic_counter.most_common(1)[0][0] if topic_counter else "-"

        return jsonify({
            "totalSessions": total_sessions,
            "totalMessages": total_messages,
            "avgMessages": avg_messages,
            "uniqueIps": unique_ips,
            "topChannel": top_channel,
            "topDay": top_day,
            "topTopic": top_topic,
            "ipList": list(ips),
            "dailyMessages": {
                "labels": list(daily_counter.keys()),
                "data": list(daily_counter.values())
            },
            "hourlyMessages": {
                "labels": list(hourly_counter.keys()),
                "data": list(hourly_counter.values())
            },
            "topics": {
                "labels": list(topic_counter.keys()),
                "data": list(topic_counter.values())
            },
            "channels": {
                "labels": list(channels.keys()),
                "data": list(channels.values())
            }
        }), 200

    except Exception:
        app.logger.exception("Error generando estadísticas")
        return jsonify({"error": "Error interno"}), 500
    


@app.get("/consentimiento")
def consentimiento_page():
    return render_template("consentimiento.html")

@app.get("/admin/reporte")
def generar_reporte_pdf():
    if not session.get("logged_in"):
        return redirect(url_for("show_login"))

    response = supabase_client.from_("historial_mensajes").select("*").execute()
    data = response.data or []

    total_messages = len(data)
    session_ids = set()
    ips = set()
    daily_counter = Counter()
    topic_counter = Counter()
    channel_counter = Counter()

    for row in data:
        session_ids.add(row.get("session_id"))

        if row.get("ID_unico"):
            ips.add(row.get("ID_unico"))

        if row.get("created_at"):
            dt = datetime.fromisoformat(row["created_at"].replace("Z", "+00:00"))
            daily_counter[dt.strftime("%Y-%m-%d")] += 1

        if row.get("tema"):
            topic_counter[row.get("tema")] += 1

        if row.get("canal"):
            channel_counter[row.get("canal")] += 1

    total_sessions = len(session_ids)
    unique_ips = len(ips)
    avg_messages = round(total_messages / total_sessions, 2) if total_sessions else 0
    top_topic = topic_counter.most_common(1)[0][0] if topic_counter else "N/A"
    top_channel = channel_counter.most_common(1)[0][0] if channel_counter else "N/A"

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        rightMargin=40,
        leftMargin=40,
        topMargin=60,
        bottomMargin=40
    )

    styles = getSampleStyleSheet()
    elements = []

    # =========================
    # PORTADA
    # =========================
    elements.append(Paragraph("<b>ALCALDÍA DE BUCARAMANGA</b>", styles["Title"]))
    elements.append(Spacer(1, 20))
    elements.append(Paragraph("<b>INFORME EJECUTIVO DEL CHAT INSTITUCIONAL</b>", styles["Heading1"]))
    elements.append(Spacer(1, 30))
    elements.append(Paragraph(f"Fecha de generación: {datetime.now().strftime('%d/%m/%Y %H:%M')}", styles["Normal"]))
    elements.append(Paragraph("Responsable: Sistema Automatizado de Reportes", styles["Normal"]))
    elements.append(Spacer(1, 40))

    # =========================
    # RESUMEN EJECUTIVO
    # =========================
    resumen = f"""
    Durante el periodo evaluado se registraron <b>{total_sessions}</b> conversaciones 
    con un total de <b>{total_messages}</b> mensajes procesados. 
    El tema más consultado fue <b>{top_topic}</b> y el canal con mayor interacción fue 
    <b>{top_channel}</b>.
    """

    elements.append(Paragraph("1. Resumen Ejecutivo", styles["Heading2"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(resumen, styles["Normal"]))
    elements.append(Spacer(1, 25))

    # =========================
    # MÉTRICAS GENERALES
    # =========================
    elements.append(Paragraph("2. Indicadores Generales", styles["Heading2"]))
    elements.append(Spacer(1, 10))

    table_data = [
        ["Indicador", "Valor"],
        ["Total Conversaciones", total_sessions],
        ["Total Mensajes", total_messages],
        ["Usuarios Únicos", unique_ips],
        ["Promedio Mensajes por Conversación", avg_messages],
    ]

    table = Table(table_data, colWidths=[250, 150])
    table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#003366")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (1, 1), (-1, -1), "CENTER"),
        ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
    ]))

    elements.append(table)
    elements.append(Spacer(1, 30))

    # =========================
    # GRÁFICA MENSAJES POR DÍA
    # =========================
    img1 = io.BytesIO()
    plt.figure()
    plt.bar(daily_counter.keys(), daily_counter.values())
    plt.xticks(rotation=45)
    plt.title("Mensajes por Día")
    plt.tight_layout()
    plt.savefig(img1, format='png')
    plt.close()
    img1.seek(0)

    elements.append(Paragraph("3. Análisis Estadístico", styles["Heading2"]))
    elements.append(Spacer(1, 15))
    elements.append(Image(img1, width=5*inch, height=3*inch))
    elements.append(Spacer(1, 30))

    # =========================
    # CONCLUSIONES
    # =========================
    conclusion = f"""
    El sistema presenta una alta concentración de consultas relacionadas con <b>{top_topic}</b>, 
    lo cual puede indicar una necesidad de fortalecer la información pública en ese ámbito.
    Se recomienda evaluar estrategias de comunicación digital y optimización del canal 
    <b>{top_channel}</b>.
    """

    elements.append(Paragraph("4. Conclusiones", styles["Heading2"]))
    elements.append(Spacer(1, 10))
    elements.append(Paragraph(conclusion, styles["Normal"]))
    elements.append(Spacer(1, 20))

    # =========================
    # LISTA DE IPS
    # =========================
    elements.append(Paragraph("5. Usuarios Registrados", styles["Heading2"]))
    elements.append(Spacer(1, 10))

    ip_list = [ListItem(Paragraph(ip, styles["Normal"])) for ip in ips]
    elements.append(ListFlowable(ip_list))

    doc.build(elements)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name="Informe_Ejecutivo_Chat_Institucional.pdf",
        mimetype="application/pdf"
    )


# ===============================
# MAIN
# ===============================
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
