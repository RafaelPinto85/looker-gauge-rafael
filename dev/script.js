const canvas = document.getElementById("gauge");
const ctx = canvas.getContext("2d");

function drawGauge(value) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  
  const startAngle = Math.PI;
  const endAngle = 2 * Math.PI;
  const radius = 70;
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 1.2;

  // Fundo
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, endAngle);
  ctx.lineWidth = 20;
  ctx.strokeStyle = "#ddd";
  ctx.stroke();

  // Valor
  const angle = startAngle + (value / 100) * Math.PI;
  ctx.beginPath();
  ctx.arc(centerX, centerY, radius, startAngle, angle);
  ctx.lineWidth = 20;
  ctx.strokeStyle = value < 40 ? "#E44352" :
                    value < 70 ? "#F4690B" :
                    value < 90 ? "#EAA711" : "#419B4A";
  ctx.stroke();

  // Texto
  ctx.font = "20px Arial";
  ctx.fillStyle = "#333";
  ctx.textAlign = "center";
  ctx.fillText(value + "%", centerX, centerY);
}

// Exemplo inicial
drawGauge(65);
