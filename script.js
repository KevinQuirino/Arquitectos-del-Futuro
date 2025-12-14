// Constantes del juego, ajustadas a Pesos Mexicanos (MXN)
const PRESUPUESTO_MAXIMO = 3000000;
const COSTO_BASE = 2100000;
let costoTotalActual = COSTO_BASE;

// Modelo de datos para guardar el progreso
let prioridadesGuardadas = [{ nombre: 'Construcción Base y Acabados (Esencial para empezar)', costo: COSTO_BASE, base: true }];

// Referencias a elementos del DOM (Para eficiencia)
const listaPrioridades = document.getElementById('lista-prioridades');
const resumenEstilo = document.getElementById('resumen-estilo');
const costoTotalDisplay = document.getElementById('costo-total');
const presupuestoRestanteDisplay = document.getElementById('presupuesto-restante');
const ubicacionInput = document.getElementById('ubicacion');
const estiloInput = document.getElementById('estilo');
const nombrePrioridadInput = document.getElementById('prioridad-nombre');
const costoPrioridadInput = document.getElementById('prioridad-costo');
const historiaTextarea = document.getElementById('historia-final');

// --- Funciones de Utilidad ---

function formatoMXN(numero) {
    return `$${numero.toLocaleString('es-MX')}`;
}

function guardarJuego() {
    localStorage.setItem('arquitectosPrioridades', JSON.stringify(prioridadesGuardadas));
    localStorage.setItem('arquitectosCostoTotal', costoTotalActual);
    localStorage.setItem('arquitectosFase1Ubicacion', ubicacionInput.value);
    localStorage.setItem('arquitectosFase1Estilo', estiloInput.value);
}

function cargarJuego() {
    const prioridadesJSON = localStorage.getItem('arquitectosPrioridades');
    const costoGuardado = localStorage.getItem('arquitectosCostoTotal');

    if (prioridadesJSON) {
        prioridadesGuardadas = JSON.parse(prioridadesJSON);
        if (!prioridadesGuardadas.some(p => p.base)) {
            prioridadesGuardadas.unshift({ nombre: 'Construcción Base y Acabados (Esencial para empezar)', costo: COSTO_BASE, base: true });
        }
        costoTotalActual = parseInt(costoGuardado) || COSTO_BASE;
        
        listaPrioridades.innerHTML = '';
        prioridadesGuardadas.forEach(item => {
            renderizarPrioridad(item.nombre, item.costo, item.base);
        });
    } else {
        renderizarPrioridad(prioridadesGuardadas[0].nombre, prioridadesGuardadas[0].costo, true);
        costoTotalActual = COSTO_BASE;
    }

    const ubicacionGuardada = localStorage.getItem('arquitectosFase1Ubicacion');
    const estiloGuardado = localStorage.getItem('arquitectosFase1Estilo');
    
    if (ubicacionGuardada && estiloGuardado) {
        ubicacionInput.value = ubicacionGuardada;
        estiloInput.value = estiloGuardado;
        resumenEstilo.textContent = `${ubicacionGuardada} | Estilo: ${estiloGuardado}`;
    }

    actualizarDashboard();
}

function renderizarPrioridad(nombre, costo, esBase = false) {
    const li = document.createElement('li');
    li.className = `list-group-item d-flex justify-content-between align-items-center prioridad-item ${esBase ? 'bg-warning-subtle' : ''}`;
    
    const botonEliminar = esBase 
        ? '' 
        : `<button class="btn btn-sm btn-danger ms-2" onclick="eliminarPrioridad(this)">Eliminar</button>`;

    li.innerHTML = `
        <span>${nombre}</span>
        <div>
            <span class="badge ${esBase ? 'bg-dark' : 'bg-info text-dark'}">${formatoMXN(costo)}</span>
            ${botonEliminar}
        </div>
    `;

    listaPrioridades.appendChild(li);
}

function actualizarDashboard() {
    costoTotalDisplay.textContent = formatoMXN(costoTotalActual);
    
    let restante = PRESUPUESTO_MAXIMO - costoTotalActual;
    presupuestoRestanteDisplay.textContent = formatoMXN(restante);

    presupuestoRestanteDisplay.className = '';
    if (restante < 0) {
        presupuestoRestanteDisplay.classList.add('text-danger');
        if (!presupuestoRestanteDisplay.dataset.excedido) {
             alert(`¡Alerta de Presupuesto! Se han excedido por ${formatoMXN(Math.abs(restante))}. ¡Deben negociar y eliminar prioridades!`);
             presupuestoRestanteDisplay.dataset.excedido = 'true';
        }
    } else if (restante <= 200000) {
        presupuestoRestanteDisplay.classList.add('text-warning');
        delete presupuestoRestanteDisplay.dataset.excedido;
    } else {
        presupuestoRestanteDisplay.classList.add('text-success');
        delete presupuestoRestanteDisplay.dataset.excedido;
    }

    guardarJuego();
}

// --- FASE 1 ---

function guardarFase1() {
    const ubicacion = ubicacionInput.value.trim();
    const estilo = estiloInput.value.trim();
    
    if (ubicacion && estilo) {
        resumenEstilo.textContent = `${ubicacion} | Estilo: ${estilo}`;
        alert('Acuerdo de Ubicación/Estilo guardado. ¡Pasen a la Fase de Prioridades!');
        guardarJuego(); 
    } else {
        alert('Por favor, ingresen la Ubicación y el Estilo acordados.');
    }
}

// --- FASE 2 & 3 ---

function agregarPrioridad() {
    const nombre = nombrePrioridadInput.value.trim();
    const costo = parseInt(costoPrioridadInput.value);

    // MÍNIMO DE COSTO: $1,000 MXN
    if (!nombre || isNaN(costo) || costo < 1000) {
        alert('Por favor, ingresen un nombre válido y un costo estimado (mínimo $1,000 MXN).');
        return;
    }

    costoTotalActual += costo;
    prioridadesGuardadas.push({ nombre: nombre, costo: costo, base: false });

    renderizarPrioridad(nombre, costo);

    nombrePrioridadInput.value = '';
    costoPrioridadInput.value = '';

    actualizarDashboard();
}

function eliminarPrioridad(boton) {
    const li = boton.closest('li');
    const nombrePrioridad = li.querySelector('span:first-child').textContent;
    
    const index = prioridadesGuardadas.findIndex(item => item.nombre === nombrePrioridad && !item.base);

    if (index === -1) return; 

    const costoAEliminar = prioridadesGuardadas[index].costo;

    if (confirm(`¿Están seguros de eliminar "${nombrePrioridad}"? Se liberarán ${formatoMXN(costoAEliminar)} del presupuesto.`)) {
        
        costoTotalActual -= costoAEliminar;
        prioridadesGuardadas.splice(index, 1);

        li.remove();
        
        actualizarDashboard();
    }
}

// --- FASE 4 / UTILIDAD ---

function generarHistoriaFinal() {
    const ubicacion = ubicacionInput.value.trim();
    const estilo = estiloInput.value.trim();
    const extras = prioridadesGuardadas.filter(p => !p.base);
    
    // *** 1. CAPTURAR LA HISTORIA ORIGINAL ESCRITA POR LOS JUGADORES ***
    const historiaFinalOriginal = historiaTextarea.value.trim();


    // Referencias para la puntuación
    const puntuacionContainer = document.getElementById('puntuacion-final-container');
    const puntuacionValor = document.getElementById('puntuacion-valor');
    const puntuacionMensaje = document.getElementById('puntuacion-mensaje');

    // --- 1. VALIDACIÓN ---
    if (!ubicacion || !estilo) {
        alert('❌ ¡Falta la Fase 1! Deben ingresar y guardar la Ubicación y el Estilo acordados.');
        return;
    }
    
    if (extras.length === 0) {
        alert('❌ ¡Faltan las Fases 2 y 3! Para completar la misión, deben añadir al menos una Prioridad (además de la construcción base) para diseñar su casa.');
        return;
    }
    
    // --- 2. CÁLCULO DE PUNTUACIÓN BASE Y PENALIZACIÓN ---
    let puntuacion = 1000;
    const restante = PRESUPUESTO_MAXIMO - costoTotalActual;
    let mensajePrincipal = "";

    // Puntos base por ahorro o penalización por exceso
    if (restante >= 0) {
        const puntosAhorro = Math.floor(restante / 10000) * 10;
        puntuacion += puntosAhorro;
        mensajePrincipal = `+${puntosAhorro} puntos por ahorrar ${formatoMXN(restante)}. `;
    } else {
        const exceso = Math.abs(restante);
        const puntosPenalizacion = Math.floor(exceso / 10000) * 50;
        puntuacion -= puntosPenalizacion;
        mensajePrincipal = `-${puntosPenalizacion} puntos por exceder el presupuesto en ${formatoMXN(exceso)}. `;
        puntuacion = Math.max(0, puntuacion); 
    }

    // --- 3. BONIFICACIONES ---
    let bonificacionesMensaje = "<br>Bonificaciones Obtenidas: ";
    let bonificacionAplicada = false;

    // Bonificación por Estilo Híbrido
    const estiloLower = estilo.toLowerCase();
    if (estiloLower.includes('-') || estiloLower.includes('híbrido') || estiloLower.includes('hibrido')) {
        puntuacion += 150;
        bonificacionesMensaje += "+150 puntos por diseño Híbrido/Creativo. ";
        bonificacionAplicada = true;
    }

    // Bonificación por Ahorro Extremo (sobrar más de 500k MXN)
    if (restante >= 500000) {
        puntuacion += 200;
        bonificacionesMensaje += "+200 puntos por Ahorro Extremo (más de 500k MXN ahorrados).";
        bonificacionAplicada = true;
    }

    if (!bonificacionAplicada) {
        bonificacionesMensaje += "Ninguna bonificación de diseño obtenida.";
    }


    // --- 4. ACTUALIZACIÓN DE LA INTERFAZ ---
    puntuacionValor.textContent = puntuacion;
    puntuacionMensaje.innerHTML = `
        ${mensajePrincipal}
        ${bonificacionesMensaje}
    `;
    puntuacionContainer.style.display = 'block';

    // --- 5. GENERACIÓN DEL RESUMEN FINAL COMBINADO ---
    let narrativa = `
        ¡Misión Cumplida! 🎉 ¡Puntuación: ${puntuacion} puntos!

        Nuestra casa, un sueño hecho realidad, se levanta con un fuerte carácter de **${estilo}** en **${ubicacion}**.
        
        El presupuesto total final es de **${formatoMXN(costoTotalActual)}** MXN.

        ### Elementos Clave Añadidos:
    `;

    narrativa += "Hemos priorizado los siguientes elementos que hacen este hogar nuestro:\n\n";
    
    extras.forEach(p => {
        narrativa += `* **${p.nombre}** (Costo: ${formatoMXN(p.costo)})\n`;
    });
    
    narrativa += `\nGracias a esta cuidadosa planificación, logramos incluir todos los elementos esenciales mientras nos manteníamos dentro del presupuesto (o negociamos con éxito!).`;
    
    // *** 2. COMBINAR LA NARRATIVA GENERADA CON LA ESCRITA POR EL USUARIO ***
    if (historiaFinalOriginal) {
        narrativa += `\n\n--- SU NARRATIVA PERSONAL ---\n`;
        narrativa += `\n${historiaFinalOriginal}`;
    } else {
        narrativa += `\n\n[El espacio para la historia final quedó vacío. ¡Recuerden añadir el toque personal!]`;
    }
    // FIN COMBINACIÓN

    historiaTextarea.value = narrativa;
    
    puntuacionContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });

    // Mostrar el botón de descarga del PDF
    document.getElementById('btn-descargar-pdf').style.display = 'inline-block';
}

function resetearJuego() {
    if (confirm('¿Están seguros de que quieren reiniciar el juego? Se borrará todo el progreso guardado (ubicación, estilo y prioridades).')) {
        localStorage.clear(); 
        window.location.reload();
    }
}


// --- FUNCIÓN PARA DESCARGAR CARTA EN PDF ---

function descargarCartaDiseno() {
    const { jsPDF } = window.jspdf;
    
    // El elemento que queremos convertir es el contenido de la Fase 4 sin el footer de botones
    const input = document.getElementById('contenido-a-exportar');

    const textarea = document.getElementById('historia-final');
    
    // Obtener el texto del textarea y ocultar el textarea original
    const textoHistoria = textarea.value;
    textarea.style.display = 'none';

    // Crear un nuevo div con el contenido del textarea (usando <pre> para mantener el formato)
    const textoDiv = document.createElement('div');
    textoDiv.innerHTML = `<pre style="font-family: 'Poppins', sans-serif; white-space: pre-wrap; margin-top: 10px; font-size: 0.95rem; color: #333;">${textoHistoria}</pre>`;
    
    // Insertar el texto formateado antes del contenedor de puntuación
    input.insertBefore(textoDiv, input.querySelector('#puntuacion-final-container'));


    html2canvas(input, {
        scale: 2, 
        logging: false,
        useCORS: true 
    }).then(canvas => {
        const imgData = canvas.toDataURL('image/png');
        const pdf = new jsPDF('p', 'mm', 'a4'); 
        const imgWidth = 210; 
        const pageHeight = 295;
        const imgHeight = canvas.height * imgWidth / canvas.width;
        let heightLeft = imgHeight;
        let position = 0;

        // Añadir la primera página
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;

        // Manejar contenido de múltiples páginas
        while (heightLeft >= 0) {
            position = heightLeft - imgHeight;
            pdf.addPage();
            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;
        }

        pdf.save('Carta_Diseno_Arquitectos.pdf');

        // Restaurar la interfaz después de la descarga
        textarea.style.display = 'block';
        input.removeChild(textoDiv); 
    });
}

// Iniciar el dashboard cargando datos si existen
window.onload = cargarJuego;