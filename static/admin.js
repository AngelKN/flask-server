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

    // =============================
    // 📊 GRÁFICA MENSAJES POR DÍA
    // =============================
    const ctx = document.getElementById("messagesPerDayChart");

    if (messagesChart) {
        messagesChart.destroy();
    }

    messagesChart = new Chart(ctx, {
        type: "bar",
        data: {
            labels: stats.dailyMessages.labels,
            datasets: [{
                borderRadius: 8,
barThickness: 35,
                label: "Mensajes por Día",
                data: stats.dailyMessages.data
            }]
        },
        options: {
    responsive: true,
    animation: {
    duration: 1600,
    easing: 'easeOutQuart'
},
hover: {
    mode: 'nearest',
    intersect: true
},
    plugins: {
        legend: {
            display: false
        },
        tooltip: {
            backgroundColor: "#111827",
            padding: 12,
            titleFont: { size: 14, weight: "600" },
            bodyFont: { size: 13 }
        }
    },
    scales: {
        x: {
            grid: {
                display: false
            },
            ticks: {
                font: { size: 12, weight: "500" }
            }
        },
        y: {
            grid: {
                color: "rgba(255,255,255,0.05)",
                drawBorder: false
            },
            ticks: {
                font: { size: 12 }
            }
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
                data: stats.topics.data
            }]
        },
        options: {
    responsive: true,
    layout: {
        padding: 10
    },
    animation: {
        duration: 1400,
        easing: 'easeOutQuart'
    },
hover: {
    mode: 'nearest',
    intersect: true
},

    plugins: {
        legend: {
            position: "bottom",
            labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20,
                font: { size: 12, weight: "500" }
            }
        },
        tooltip: {
            backgroundColor: "#111827",
            padding: 10
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
                label: "Mensajes por Canal",
                data: stats.channels.data
            }]
        },
        options: {
    responsive: true,
    layout: {
        padding: 10
    },
    animation: {
        duration: 1600,
        easing: 'easeOutQuart'
    },
hover: {
    mode: 'nearest',
    intersect: true
},
    plugins: {
        legend: {
            position: "bottom",
            labels: {
                usePointStyle: true,
                pointStyle: "circle",
                padding: 20
            }
        }
    }
}
    });
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