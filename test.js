
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
            cutout: "65%",
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
