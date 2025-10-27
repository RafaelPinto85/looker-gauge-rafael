(function(global){
  // Shim mínimo do dscc para permitir testes locais.
  // O Looker Studio injeta a versão real em ambiente de produção.
  var dscc = {
    // subscribe recebe uma função draw; aqui chamamos draw com dados de exemplo ao carregar
    subscribe: function(drawFn){
      // quando o script for carregado, chama drawFn com dados de exemplo para render local
      function tryDraw(){
        try {
          var exampleData = {
            tables: { DEFAULT: { rows: [[\"\", 62]] } },
            config: {}
          };
          drawFn(exampleData, document.getElementById('gauge-root'));
        } catch(e) {
          // ignore
        }
      }
      if (document.readyState === 'complete' || document.readyState === 'interactive') {
        setTimeout(tryDraw, 10);
      } else {
        window.addEventListener('load', tryDraw);
      }
    }
  };
  // expõe global
  global.dscc = dscc;
})(window);
(function() {
  // Vis code for Looker Studio community visualization
  // Dependências: dscc (injetado no bundle)
  const dscc = window.dscc || {};

  function drawGauge(container, value, config) {
    // parâmetros
    const min = config.min ?? 0;
    const max = config.max ?? 100;
    const zones = config.zones ?? [];
    const showValue = config.showValue ?? true;
    const needleColor = config.needleColor ?? '#222';

    // normaliza
    const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
    const angle = -90 + pct * 180; // -90..+90

    // limpa container
    container.innerHTML = '';

    // cria SVG
    const svgNS = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', '-10 -10 220 110'); // proporção wide
    svg.setAttribute('preserveAspectRatio','xMidYMid meet');

    const centerX = 100, centerY = 80, radius = 60;

    // desenha zonas (arcs)
    let startAngle = -90;
    for (let i=0;i<zones.length;i++) {
      const z = zones[i];
      const to = (z.to - min) / (max - min); // 0..1
      const endAngle = -90 + to*180;
      const largeArc = (endAngle - startAngle) > 180 ? 1 : 0;

      const r = radius;
      const x1 = centerX + r * Math.cos(startAngle * Math.PI/180);
      const y1 = centerY + r * Math.sin(startAngle * Math.PI/180);
      const x2 = centerX + r * Math.cos(endAngle * Math.PI/180);
      const y2 = centerY + r * Math.sin(endAngle * Math.PI/180);

      const path = document.createElementNS(svgNS, 'path');
      const d = M   A   0  1  ;
      path.setAttribute('d', d);
      path.setAttribute('stroke', z.color || '#ccc');
      path.setAttribute('stroke-width', 12);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke-linecap','butt');
      svg.appendChild(path);

      startAngle = endAngle;
    }

    // base do medidor (linha inferior)
    const base = document.createElementNS(svgNS, 'circle');
    base.setAttribute('cx', centerX);
    base.setAttribute('cy', centerY);
    base.setAttribute('r', 2);
    base.setAttribute('fill', '#444');
    svg.appendChild(base);

    // agulha
    const needle = document.createElementNS(svgNS, 'line');
    needle.setAttribute('x1', centerX);
    needle.setAttribute('y1', centerY);
    const nx = centerX + (radius-8) * Math.cos(angle * Math.PI/180);
    const ny = centerY + (radius-8) * Math.sin(angle * Math.PI/180);
    needle.setAttribute('x2', nx);
    needle.setAttribute('y2', ny);
    needle.setAttribute('stroke', needleColor);
    needle.setAttribute('stroke-width', 3);
    needle.setAttribute('stroke-linecap','round');
    svg.appendChild(needle);

    // valor no centro
    if (showValue) {
      const text = document.createElementNS(svgNS, 'text');
      text.setAttribute('x', centerX);
      text.setAttribute('y', centerY + 35);
      text.setAttribute('font-size', '14');
      text.setAttribute('text-anchor','middle');
      text.textContent = ${value};
      svg.appendChild(text);
    }

    container.appendChild(svg);
  }

  // Função principal que o Looker Studio chama
  function draw(data, element) {
    // data: objeto do dscc com campos e metricas
    const container = element || document.getElementById('gauge-root');
    // pega o primeiro valor da primeira linha/coluna (assume 1 metric)
    let numericValue = 0;
    try {
      // dscc fornece data via data.tables ou data.metrics dependendo da API usada
      const table = data.tables && data.tables.DEFAULT && data.tables.DEFAULT.rows ? data.tables.DEFAULT.rows : null;
      if (table && table.length > 0) {
        // Assume a primeira coluna é dimensão, segunda é métrica
        const row = table[0];
        // tenta encontrar valor numérico
        for (let i=0;i<row.length;i++) {
          const v = Number(row[i]);
          if (!isNaN(v)) { numericValue = v; break; }
        }
      } else if (data && data.metrics && data.metrics[0] && data.metrics[0].values) {
        numericValue = Number(data.metrics[0].values[0]) || 0;
      }
    } catch(e) {
      numericValue = 0;
    }

    // lê config (passado pelo config.json + propriedades)
    const config = (window._ds_config || {});
    // se dscc config estiver presente
    if (data && data.config && Object.keys(data.config).length>0) {
      // merge seguro
      for (const k in data.config) { config[k]=data.config[k]; }
    }

    drawGauge(container, numericValue, config);
  }

  // Export ou registro do componente para o dscc
  if (typeof dscc !== 'undefined' && dscc.subscribe) {
    dscc.subscribe(draw);
  } else {
    // fallback para testar localmente
    window.addEventListener('load', function() {
      // tenta ler config do arquivo dev/config.json (não via fetch em produção)
      fetch('dev/config.json').then(r=>r.json()).then(cfg=>{
        window._ds_config = cfg;
        draw({tables:{DEFAULT:{rows:[ [\"\", 62] ]}}}, document.getElementById('gauge-root'));
      }).catch(()=> {
        draw({tables:{DEFAULT:{rows:[ [\"\", 62] ]}}}, document.getElementById('gauge-root'));
      });
    });
  }
})();
