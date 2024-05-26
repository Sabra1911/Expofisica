// script.js

function calcular() {
  // Obtener los valores de entrada
  var alcance_cm = parseFloat(document.getElementById('alcance_cm').value);
  var angulo = parseFloat(document.getElementById('angulo').value);

  // Validar los valores de entrada
  if (!validarEntradas(alcance_cm, angulo)) {
      alert('Por favor, ingrese valores válidos.');
      return;
  }

  // Convertir unidades y calcular variables
  var alcance = convertirCmAMetros(alcance_cm);
  var anguloRadianes = convertirGradosARadianes(angulo);
  var g = 9.81; // Gravedad en m/s^2

  // Calcular la velocidad inicial
  var v0 = calcularVelocidadInicial(alcance, anguloRadianes, g);
  var { v0x, v0y } = calcularComponentesVelocidad(v0, anguloRadianes);
  var tiempoVuelo = calcularTiempoVuelo(v0y, g);
  var alturaMax = calcularAlturaMaxima(v0y, g);

  // Mostrar resultados
  mostrarResultados(v0, alturaMax, tiempoVuelo, v0x, v0y);

  // Simular el movimiento parabólico
  simularMovimiento(v0x, v0y, tiempoVuelo, alcance, alturaMax);
}

function validarEntradas(alcance, angulo) {
  return !isNaN(alcance) && alcance > 0 && !isNaN(angulo) && angulo >= 0 && angulo <= 90;
}

function convertirCmAMetros(cm) {
  return cm / 100;
}

function convertirGradosARadianes(grados) {
  return grados * (Math.PI / 180);
}

function calcularVelocidadInicial(alcance, anguloRadianes, g) {
  return Math.sqrt((alcance * g) / Math.sin(2 * anguloRadianes));
}

function calcularComponentesVelocidad(v0, anguloRadianes) {
  return {
      v0x: v0 * Math.cos(anguloRadianes),
      v0y: v0 * Math.sin(anguloRadianes)
  };
}

function calcularTiempoVuelo(v0y, g) {
  return (2 * v0y) / g;
}

function calcularAlturaMaxima(v0y, g) {
  return (Math.pow(v0y, 2) / (2 * g)) * 100; // Convertir a centímetros
}

function mostrarResultados(v0, alturaMax, tiempoVuelo, v0x, v0y) {
  var resultadoHTML = `
      <p>Velocidad Inicial: ${v0.toFixed(2)} m/s</p>
      <p>Altura Máxima: ${alturaMax.toFixed(2)} cm</p>
      <p>Tiempo de Vuelo: ${tiempoVuelo.toFixed(2)} s</p>
      <p>Componente Horizontal de la Velocidad (Vx): ${v0x.toFixed(2)} m/s</p>
      <p>Componente Vertical de la Velocidad Inicial (Vy): ${v0y.toFixed(2)} m/s</p>
  `;
  document.getElementById('resultados').innerHTML = resultadoHTML;
}

function simularMovimiento(v0x, v0y, tiempoVuelo, alcance, alturaMax) {
  var canvas = document.getElementById('simulacion');
  var ctx = canvas.getContext('2d');

  // Limpiar el canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Configurar la simulación
  var g = 9.81; // Gravedad en m/s^2
  var escala = 50; // Escala de metros a píxeles

  // Dibujar suelo y medidas
  dibujarSuelo(ctx);
  dibujarMedidas(ctx, escala);

  // Configurar la catapulta
  var catapulta = {
      x: 50,
      y: canvas.height - 20,
      angulo: 45,
      draw: function () {
          ctx.fillStyle = 'brown';
          ctx.fillRect(this.x - 10, this.y - 50, 20, 50);
          ctx.beginPath();
          ctx.moveTo(this.x, this.y - 50);
          ctx.lineTo(this.x + 50 * Math.cos(this.angulo * Math.PI / 180), this.y - 50 - 50 * Math.sin(this.angulo * Math.PI / 180));
          ctx.stroke();
      }
  };

  // Animar la catapulta
  animarCatapulta(ctx, catapulta, function() {
      lanzarProyectil(ctx, catapulta, v0x, v0y, tiempoVuelo, g, escala);
  });

  function dibujarSuelo(ctx) {
      ctx.fillStyle = 'green';
      ctx.fillRect(0, canvas.height - 20, canvas.width, 20);
  }

  function dibujarMedidas(ctx, escala) {
      var metros = canvas.width / escala;
      for (var i = 0; i <= metros; i++) {
          var x = i * escala;
          ctx.strokeStyle = 'black';
          ctx.beginPath();
          ctx.moveTo(x, canvas.height - 20);
          ctx.lineTo(x, canvas.height - 10);
          ctx.stroke();
          ctx.fillText(i + 'm', x + 2, canvas.height - 10);
      }
  }

  function animarCatapulta(ctx, catapulta, callback) {
      var anguloInicial = catapulta.angulo;
      var anguloFinal = 0; // Ángulo final de la catapulta
      var duracion = 1000; // Duración de la animación en milisegundos
      var inicio = null;

      function animar(timestamp) {
          if (!inicio) inicio = timestamp;
          var tiempoPasado = timestamp - inicio;
          var progreso = tiempoPasado / duracion;

          // Interpolación lineal del ángulo
          catapulta.angulo = anguloInicial + (anguloFinal - anguloInicial) * progreso;

          // Limpiar el canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          dibujarSuelo(ctx);
          dibujarMedidas(ctx, escala);
          catapulta.draw();

          if (progreso < 1) {
              // Continuar la animación
              requestAnimationFrame(animar);
          } else {
              // Llamar al callback cuando la animación haya terminado
              callback();
          }
      }

      // Iniciar la animación
      requestAnimationFrame(animar);
  }

  function lanzarProyectil(ctx, catapulta, v0x, v0y, tiempoVuelo, g, escala) {
      var t = 0;
      var dt = 0.01; // Incremento de tiempo en segundos
      var trayectoria = [];
      var tocandoSuelo = false;

      // Ajustar el punto de inicio verticalmente
      var inicioY = catapulta.y - 50; // Ajustar la altura según sea necesario

      function dibujar() {
          if (t <= tiempoVuelo || !tocandoSuelo) {
              var x = v0x * t;
              var y = (v0y * t) - (0.5 * g * Math.pow(t, 2));

              var xPixel = catapulta.x + x * escala;
              var yPixel = inicioY - y * escala; // Usar la nueva posición vertical

              trayectoria.push({ x: xPixel, y: yPixel });

              ctx.clearRect(0, 0, canvas.width, canvas.height);
              dibujarSuelo(ctx);
              dibujarMedidas(ctx, escala);
              catapulta.draw();

              ctx.strokeStyle = 'blue';
              ctx.lineWidth = 2;
              ctx.beginPath();
              for (var i = 0; i < trayectoria.length; i++) {
                  if (i === 0) {
                      ctx.moveTo(trayectoria[i].x, trayectoria[i].y);
                  } else {
                      ctx.lineTo(trayectoria[i].x, trayectoria[i].y);
                  }
              }
              ctx.stroke();

              ctx.fillStyle = 'red';
              ctx.beginPath();
              ctx.arc(xPixel, yPixel, 5, 0, 2 * Math.PI);
              ctx.fill();

              // Verificar si el proyectil está tocando el suelo
              if (yPixel >= canvas.height - 20) {
                  tocandoSuelo = true;
                  yPixel = canvas.height - 20; // Posicionar sobre el suelo
              }

              t += dt;
              requestAnimationFrame(dibujar);
          }
      }

      dibujar();
  }
}

