// 1️⃣ VARIABLES GLOBALES
let globalIpList = [];
let messagesChart = null;
let topicsChart = null;
let channelChart = null;

// 2️⃣ FUNCIÓN PRINCIPAL
async function loadStats() {

    const response = await fetch("/api/admin/stats");

    if (!response.ok) {
        alert("Error cargando estadísticas");
        return;
    }

    const stats = await response.json();

    console.log("Stats cargados:", stats);

    globalIpList = stats.ipList || [];

    document.getElementById("totalSessions").textContent = stats.totalSessions;
    document.getElementById("totalMessages").textContent = stats.totalMessages;
    document.getElementById("avgMessages").textContent = stats.avgMessages;
    document.getElementById("uniqueIps").textContent = stats.uniqueIps;

    const ctx = document.getElementById("messagesPerDayChart");

if (messagesChart) {
    messagesChart.destroy();
}

messagesChart = new Chart(ctx, {
    type: "line",
    data: {
        labels: stats.dailyMessages.labels,
        datasets: [{
            label: "Mensajes por Día",
            data: stats.dailyMessages.data,

            borderColor: "#3B82F6",
            backgroundColor: "rgba(59,130,246,0.2)",

            tension: 0.4,        // curva suave
            fill: true,          // relleno tipo area
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    },

    options: {
        responsive: true,
        maintainAspectRatio: false,

        layout: {
            padding: 10
        },

        animation: {
            duration: 1400,
            easing: "easeOutQuart"
        },

        plugins: {
            legend: {
                display: false
            }
        },

        scales: {
            x: {
                grid: {
                    display: false
                }
            },
            y: {
                beginAtZero: true
            }
        }
    }
});


    // =============================
    // 🎯 GRÁFICA DISTRIBUCIÓN TEMAS
    // =============================
    const ctxTopics = document.getElementById("topicsChart");

    if (topicsChart) {
        topicsChart.destroy();
    }

    topicsChart = new Chart(ctxTopics, {
        type: "pie",
        data: {
            labels: stats.topics.labels,
            datasets: [{
                data: stats.topics.data,
                backgroundColor: [
                    "#3B82F6",
                    "#F97316",
                    "#22C55E",
                    "#EAB308",
                    "#8B5CF6"
                ],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            layout: {
                padding: 10
            },

            animation: {
                duration: 1400,
                easing: "easeOutQuart"
            },

            plugins: {

                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },

                tooltip: {
                    backgroundColor: "#111827",
                    padding: 10,
                    callbacks: {
                        label: function (context) {

                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let value = context.raw;
                            let percentage = ((value / total) * 100).toFixed(1);

                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // =============================
    // 📡 GRÁFICA MENSAJES POR CANAL
    // =============================
    const ctxChannel = document.getElementById("channelChart");

    if (channelChart) {
        channelChart.destroy();
    }

    channelChart = new Chart(ctxChannel, {
        type: "doughnut",
        data: {
            labels: stats.channels.labels,
            datasets: [{
                data: stats.channels.data,
                backgroundColor: [
                    "#60A5FA",
                    "#FB923C",
                    "#22C55E"
                ],
                borderWidth: 0
            }]
        },
        
        options: {
            responsive: true,
            maintainAspectRatio: false,

            layout: {
                padding: 10
            },

            animation: {
                duration: 1400,
                easing: "easeOutQuart"
            },

            plugins: {

                legend: {
                    position: "right",
                    labels: {
                        usePointStyle: true,
                        pointStyle: "circle",
                        padding: 15,
                        font: {
                            size: 13
                        }
                    }
                },

                tooltip: {
                    backgroundColor: "#111827",
                    padding: 10,
                    callbacks: {
                        label: function (context) {

                            let total = context.dataset.data.reduce((a, b) => a + b, 0);
                            let value = context.raw;
                            let percentage = ((value / total) * 100).toFixed(1);

                            return `${context.label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });

    // === ESTADÍSTICAS DE ENCUESTAS ===
    // === ESTADÍSTICAS DE ENCUESTAS ===
    // Cambiamos 'data' por 'stats' que es la variable definida arriba
    if (stats.survey) {
        document.getElementById("totalSurveys").textContent = stats.survey.total;
        document.getElementById("avgAmabilidad").textContent = stats.survey.avgAmabilidad;
        document.getElementById("avgRecomendacion").textContent = stats.survey.avgRecomendacion;

        // Gráfica de Claridad (Q2)
        const ctxClarity = document.getElementById('clarityChart');
        if (ctxClarity) {
            new Chart(ctxClarity, {
                type: 'doughnut',
                data: {
                    labels: stats.survey.claridad.labels.map(l => l.toUpperCase()),
                    datasets: [{
                        data: stats.survey.claridad.data,
                        backgroundColor: ['#4caf50', '#ff9800', '#f44336'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#b0bec5' } } } }
            });
        }

        // Gráfica de Resolución (Q3)
        const ctxResolution = document.getElementById('resolutionChart');
        if (ctxResolution) {
            new Chart(ctxResolution, {
                type: 'pie',
                data: {
                    labels: stats.survey.resolvio.labels.map(l => l.toUpperCase()),
                    datasets: [{
                        data: stats.survey.resolvio.data,
                        backgroundColor: ['#2196f3', '#e91e63'],
                        borderWidth: 0
                    }]
                },
                options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom', labels: { color: '#b0bec5' } } } }
            });
        }

        // Comentarios (Q5)
        const commentsContainer = document.getElementById("commentsContainer");
        if (commentsContainer) {
            commentsContainer.innerHTML = "";
            if (stats.survey.comentarios.length === 0) {
                commentsContainer.innerHTML = "<p style='color: #78909c;'>No hay comentarios registrados aún.</p>";
            } else {
                stats.survey.comentarios.forEach(c => {
                    const div = document.createElement("div");
                    div.className = "comment-item";
                    div.innerHTML = `
                    <div class="feedback-card">
                        <small>${c.fecha}</small>
                        <p class="">"${c.texto}"</p>
                    </div>
                `;
                    commentsContainer.appendChild(div);
                });
            }
        }
    }
}


// 3️⃣ DOM READY
document.addEventListener("DOMContentLoaded", async () => {

    await loadStats();

    const ipCard = document.getElementById("uniqueIpsCard");
    const modal = document.getElementById("ipModal");
    const closeModal = document.getElementById("closeModal");
    const ipListContainer = document.getElementById("ipListContainer");

    ipCard.addEventListener("click", () => {

        ipListContainer.innerHTML = "";

        if (!globalIpList || globalIpList.length === 0) {
            ipListContainer.innerHTML = "<li>No hay IPs registradas</li>";
        } else {
            globalIpList.forEach(ip => {
                const li = document.createElement("li");
                li.textContent = ip;
                ipListContainer.appendChild(li);
            });
        }

        modal.style.display = "flex";
    });

    closeModal.addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

});