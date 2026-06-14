// --- CONFIGURACIÓN GLOBAL ---
// Capturamos el usuario de la URL actual (?user=Benjamin)
const urlParams = new URLSearchParams(window.location.search);
const USUARIO_ACTUAL = urlParams.get('user') || 'Anonimo'; 

// --- CONFIGURACIÓN DE TEMA ---
function toggleTheme() {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    html.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
}

document.addEventListener('DOMContentLoaded', () => {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Personalización visual del título según el usuario
    const tituloPrincipal = document.querySelector('h1');
    if (tituloPrincipal) tituloPrincipal.innerText = `Listas de ${USUARIO_ACTUAL}`;
    
    obtenerListas();

    // Escuchar Enter en el input de nuevas listas
    document.getElementById('nombreLista').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') crearNuevaLista();
    });

    // Escuchar Enter en el input de nuevos ítems
    document.getElementById('nuevoItemInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') crearItem();
    });
});

// --- RUTAS Y ESTADO ---
const API_LISTAS = 'api/listas.php';
const API_ITEMS  = 'api/items.php';
let listaIdActual = null;

// --- 1. LÓGICA DE LISTAS ---
async function obtenerListas() {
    try {
        const res = await fetch(`${API_LISTAS}?user=${USUARIO_ACTUAL}`);
        const textoRespuesta = await res.text(); 
        
        try {
            let listas = JSON.parse(textoRespuesta); 

            // Ordenar: Listas con 0% arriba, 100% abajo.
            listas.sort((a, b) => {
                const totalA = parseInt(a.total_items) || 0;
                const compA = parseInt(a.completados) || 0;
                const progresoA = totalA > 0 ? (compA / totalA) : 0;

                const totalB = parseInt(b.total_items) || 0;
                const compB = parseInt(b.completados) || 0;
                const progresoB = totalB > 0 ? (compB / totalB) : 0;

                return progresoA - progresoB;
            });

            renderizarListas(listas);
        } catch (errorParseo) {
            console.error("El servidor devolvió un error crudo:", textoRespuesta);
        }
        
    } catch (error) {
        console.error("Error de red al obtener listas:", error);
    }
}

async function crearNuevaLista() {
    const input = document.getElementById('nombreLista');
    const nombre = input.value.trim();

    if (!nombre) return;

    try {
        await fetch(API_LISTAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // Enviamos el USUARIO_ACTUAL capturado de la URL
            body: JSON.stringify({ nombre: nombre, creador: USUARIO_ACTUAL })
        });
        input.value = '';
        obtenerListas();
    } catch (error) {
        console.error("Error al crear lista:", error);
    }
}

// En tu sección de RUTAS Y ESTADO:
let listaIdAEditar = null;

// Reemplaza tu función editarLista actual
function editarLista(id, nombreActual) {
    listaIdAEditar = id;
    const input = document.getElementById('nuevoNombreListaInput');
    input.value = nombreActual;
    document.getElementById('modalEditar').style.display = 'flex';
    
    // Forzar el foco al final del texto cargado
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function cerrarModalEditar() {
    document.getElementById('modalEditar').style.display = 'none';
    listaIdAEditar = null;
    document.getElementById('nuevoNombreListaInput').value = '';
}

// Ejecuta la petición PUT definitiva hacia la API
async function ejecutarEdicionDefinitiva() {
    if (!listaIdAEditar) return;

    const input = document.getElementById('nuevoNombreListaInput');
    const nuevoNombre = input.value.trim();

    if (!nuevoNombre) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: listaIdAEditar, nombre: nuevoNombre })
        });
        const data = await res.json();
        if (data.success) {
            cerrarModalEditar();
            obtenerListas();
        }
    } catch (error) {
        console.error("Error al editar lista:", error);
        cerrarModalEditar();
    }
}

function renderizarListas(listas) {
    const contenedor = document.getElementById('contenedorListas');
    if (listas.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay listas para este usuario.</p>';
        return;
    }

    contenedor.innerHTML = listas.map(lista => {
        // Cálculo del porcentaje en frío
        const total = parseInt(lista.total_items) || 0;
        const completados = parseInt(lista.completados) || 0;
        const porcentaje = total > 0 ? Math.round((completados / total) * 100) : 0;

        return `
        <div class="list-item" onclick="verDetalleLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')" style="cursor:pointer; flex-direction: column; align-items: stretch; gap: 8px;">
            <div style="display: flex; justify-content: space-between; align-items: center; width: 100%;">
                <div class="item-content" style="margin-right: 0;">
                    <strong>${lista.nombre}</strong>
                    <small>Creado por ${lista.creador}</small>
                </div>
                <div class="actions">
                    <button class="btn-edit" onclick="event.stopPropagation(); editarLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')">✏️</button>
                    <button class="btn-delete" onclick="event.stopPropagation(); borrarLista(${lista.id})">🗑️</button>
                    <button class="btn-copy" onclick="event.stopPropagation(); copiarLista(${lista.id})">📋</button>
                </div>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 10px; height: 6px; flex-grow: 1; overflow: hidden;">
                    <div style="height: 100%; width: ${porcentaje}%; background: var(--primary); transition: width 0.3s ease;"></div>
                </div>
                <span style="font-size: 0.75rem; font-weight: 800; color: var(--text-muted); min-width: 35px; text-align: right;">${porcentaje}%</span>
            </div>
        </div>
        `;
    }).join('');
}

// Al inicio del archivo o en la sección de RUTAS Y ESTADO, declara:
let listaIdAEliminar = null;

// Reemplaza tu función borrarLista para que solo abra el modal e intercepte el ID
function borrarLista(id) {
    listaIdAEliminar = id;
    document.getElementById('modalEliminar').style.display = 'flex';
}

function cerrarModalEliminar() {
    document.getElementById('modalEliminar').style.display = 'none';
    listaIdAEliminar = null;
}

// Esta función ejecuta la petición DELETE definitiva que antes hacía el confirm nativo
async function ejecutarEliminacionDefinitiva() {
    if (!listaIdAEliminar) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: listaIdAEliminar })
        });
        const data = await res.json();
        if (data.success) {
            cerrarModalEliminar();
            obtenerListas();
        }
    } catch (error) {
        console.error("Error al borrar lista:", error);
        cerrarModalEliminar();
    }
}

// --- 2. NAVEGACIÓN ---
function verDetalleLista(id, nombre) {
    listaIdActual = id;
    document.getElementById('vistaListas').style.display = 'none';
    document.getElementById('vistaItems').style.display = 'flex'; 
    document.getElementById('tituloListaActual').innerText = nombre;
    cargarItems();
}

function regresarAListas() {
    document.getElementById('vistaListas').style.display = 'flex'; 
    document.getElementById('vistaItems').style.display = 'none';
    listaIdActual = null;
    obtenerListas();
}

// --- 3. LÓGICA DE ÍTEMS ---
async function cargarItems() {
    try {
        const res = await fetch(`${API_ITEMS}?lista_id=${listaIdActual}`);
        let items = await res.json();
        const contenedor = document.getElementById('contenedorItems');

        if (items.length === 0) {
            contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">Esta lista está vacía.</p>';
            return;
        }

        items.sort((a, b) => Number(a.completado) - Number(b.completado));

        contenedor.innerHTML = items.map(item => {
            const estaCompletado = Number(item.completado) === 1;
            const tieneEtiqueta = item.etiqueta && item.etiqueta.trim() !== "";
            // Si tiene etiqueta, la renderiza anteponiendo el '#' automáticamente
            const etiquetaHTML = tieneEtiqueta ? `<span class="badge-tag">#${item.etiqueta}</span>` : '';

            return `
                <div class="list-item ${estaCompletado ? 'item-completed' : ''}" 
                    onclick="toggleItem(${item.id}, ${estaCompletado ? 1 : 0})" 
                    style="cursor:pointer;">
                    <div class="check-circle ${estaCompletado ? 'active' : ''}">${estaCompletado ? '✓' : ''}</div>
                    <div class="item-content">
                        <strong>${item.contenido}</strong>
                        ${etiquetaHTML}
                    </div>
                    <div class="actions">
                        <button class="btn-edit" onclick="event.stopPropagation(); editarItem(${item.id}, '${item.contenido.replace(/'/g, "\\'")}', '${(item.etiqueta || '').replace(/'/g, "\\'")}')">✏️</button>
                        <button class="btn-delete" onclick="event.stopPropagation(); borrarItem(${item.id})">🗑️</button> 
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        console.error("Error al cargar items:", error);
    }
}

async function crearItem() {
    const input = document.getElementById('nuevoItemInput');
    const contenido = input.value.trim();
    if (!contenido) return;

    try {
        await fetch(API_ITEMS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ lista_id: listaIdActual, contenido: contenido })
        });
        input.value = '';
        cargarItems();
    } catch (error) {
        console.error("Error al crear item:", error);
    }
}

// --- VARIABLES DE ESTADO GLOBALES (Agrega estas dos) ---
let itemIdAEditar = null;
let itemIdAEliminar = null;

// --- REEMPLAZO: LÓGICA DE EDICIÓN DE ÍTEM ---
// --- REEMPLAZO DE CONTROL DE MODALES PARA ÍTEMS ---
function editarItem(id, contenidoActual, etiquetaActual) {
    itemIdAEditar = id;
    document.getElementById('nuevoContenidoItemInput').value = contenidoActual;
    document.getElementById('nuevoEtiquetaItemInput').value = etiquetaActual || '';
    document.getElementById('modalEditarItem').style.display = 'flex';
    
    const input = document.getElementById('nuevoContenidoItemInput');
    input.focus();
    input.setSelectionRange(input.value.length, input.value.length);
}

function cerrarModalEditarItem() {
    document.getElementById('modalEditarItem').style.display = 'none';
    itemIdAEditar = null;
    document.getElementById('nuevoContenidoItemInput').value = '';
    document.getElementById('nuevoEtiquetaItemInput').value = '';
}

async function ejecutarEdicionItemDefinitiva() {
    if (!itemIdAEditar) return;
    
    const contenido = document.getElementById('nuevoContenidoItemInput').value.trim();
    let etiqueta = document.getElementById('nuevoEtiquetaItemInput').value.trim();
    
    // Control en frío: Limpia el '#' inicial si el usuario lo escribe por duplicado
    if (etiqueta.startsWith('#')) {
        etiqueta = etiqueta.replace(/^#+/, '').trim();
    }
    
    if (!contenido) return;

    try {
        const res = await fetch(API_ITEMS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: itemIdAEditar, 
                contenido: contenido, 
                etiqueta: etiqueta || null, // Guarda NULL si el campo queda vacío
                op: 'update_text' 
            })
        });
        if ((await res.json()).success) {
            cerrarModalEditarItem();
            cargarItems();
        }
    } catch (error) {
        console.error("Error al editar item:", error);
        cerrarModalEditarItem();
    }
}

// --- REEMPLAZO: LÓGICA DE ELIMINACIÓN DE ÍTEM ---
function borrarItem(id) {
    itemIdAEliminar = id;
    document.getElementById('modalEliminarItem').style.display = 'flex';
}

function cerrarModalEliminarItem() {
    document.getElementById('modalEliminarItem').style.display = 'none';
    itemIdAEliminar = null;
}

async function ejecutarEliminacionItemDefinitiva() {
    if (!itemIdAEliminar) return;

    try {
        const res = await fetch(API_ITEMS, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: itemIdAEliminar })
        });
        if ((await res.json()).success) {
            cerrarModalEliminarItem();
            cargarItems();
        }
    } catch (error) {
        console.error("Error al borrar item:", error);
        cerrarModalEliminarItem();
    }
}

// En tu sección de RUTAS Y ESTADO:
let listaIdACopiar = null;

// Reemplaza tu función copiarLista actual
function copiarLista(id) {
    listaIdACopiar = id;
    document.getElementById('modalCopiar').style.display = 'flex';
}

function cerrarModalCopiar() {
    document.getElementById('modalCopiar').style.display = 'none';
    listaIdACopiar = null;
}

// Ejecuta la petición COPY hacia la API
async function ejecutarCopiaDefinitiva() {
    if (!listaIdACopiar) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'COPY', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: listaIdACopiar })
        });
        const data = await res.json();
        if (data.success) {
            cerrarModalCopiar();
            obtenerListas();
        }
    } catch (error) {
        console.error("Error al copiar lista:", error);
        cerrarModalCopiar();
    }
}

async function toggleItem(id, estadoActual) {
    const nuevoEstado = estadoActual === 0 ? 1 : 0;
    try {
        await fetch(API_ITEMS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, completado: nuevoEstado })
        });
        cargarItems();
    } catch (error) {
        console.error("Error al actualizar item:", error);
    }
}