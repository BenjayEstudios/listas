// Configuración de rutas
const API_LISTAS = 'api/listas.php';
const API_ITEMS  = 'api/items.php';

// Estado de la aplicación
let listaIdActual = null;

/**
 * 1. LÓGICA DE LISTAS (PADRE)
 */

// Cargar todas las listas al iniciar
async function obtenerListas() {
    try {
        const res = await fetch(API_LISTAS);
        const listas = await res.json();
        renderizarListas(listas);
    } catch (error) {
        console.error("Error al obtener listas:", error);
    }
}

// Crear una nueva lista
async function crearNuevaLista() {
    const input = document.getElementById('nombreLista');
    const nombre = input.value.trim();

    if (!nombre) return alert("Escribe un nombre para la lista");

    try {
        await fetch(API_LISTAS, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre: nombre, creador: 'Benjamin' })
        });
        input.value = '';
        obtenerListas();
    } catch (error) {
        console.error("Error al crear lista:", error);
    }
}

// EDITAR NOMBRE DE LISTA (La función que faltaba)
async function editarLista(id, nombreActual) {
    const nuevoNombre = prompt("Editar nombre de la lista:", nombreActual);
    
    if (!nuevoNombre || nuevoNombre.trim() === "" || nuevoNombre === nombreActual) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: id, 
                nombre: nuevoNombre.trim() 
            })
        });

        const data = await res.json();
        if (data.success) {
            obtenerListas(); // Refrescar para ver el cambio
        }
    } catch (error) {
        console.error("Error al editar lista:", error);
    }
}

// Dibujar listas en el HTML
function renderizarListas(listas) {
    const contenedor = document.getElementById('contenedorListas');
    
    if (listas.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay listas creadas.</p>';
        return;
    }

    contenedor.innerHTML = listas.map(lista => `
        <div class="list-item" onclick="verDetalleLista(${lista.id}, '${lista.nombre}')" style="cursor:pointer">
            <div style="flex: 1;">
                <strong>${lista.nombre}</strong>
                <small style="display:block; opacity:0.6;">Creado por ${lista.creador}</small>
            </div>
            <button class="btn-edit" onclick="event.stopPropagation(); editarLista(${lista.id}, '${lista.nombre}')">
                ✏️
            </button>
        </div>
    `).join('');
}

/**
 * 2. LÓGICA DE NAVEGACIÓN
 */

async function verDetalleLista(id, nombre) {
    listaIdActual = id;
    
    // Intercambio visual de pantallas
    document.getElementById('vistaListas').style.display = 'none';
    document.getElementById('vistaItems').style.display = 'block';
    
    // Actualizar título
    document.getElementById('tituloListaActual').innerText = nombre;
    
    cargarItems();
}

function regresarAListas() {
    document.getElementById('vistaListas').style.display = 'block';
    document.getElementById('vistaItems').style.display = 'none';
    listaIdActual = null;
    obtenerListas();
}

/**
 * 3. LÓGICA DE ITEMS (HIJOS)
 */

async function cargarItems() {
    try {
        const res = await fetch(`${API_ITEMS}?lista_id=${listaIdActual}`);
        const items = await res.json();
        const contenedor = document.getElementById('contenedorItems');

        if (items.length === 0) {
            contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">Esta lista está vacía.</p>';
            return;
        }

        contenedor.innerHTML = items.map(item => `
            <div class="list-item" style="display: flex; align-items: center; gap: 10px;">
                <div onclick="toggleItem(${item.id}, ${item.completado})" 
                    style="cursor:pointer; width: 24px; height: 24px; border-radius: 50%; 
                            border: 2px solid var(--primary); 
                            background: ${item.completado ? 'var(--primary)' : 'transparent'};
                            display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
                    ${item.completado ? '✓' : ''}
                </div>

                <span style="flex: 1; ${item.completado ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                    ${item.contenido}
                </span>
            </div>
        `).join('');
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
            body: JSON.stringify({ 
                lista_id: listaIdActual, 
                contenido: contenido 
            })
        });

        input.value = '';
        cargarItems();
    } catch (error) {
        console.error("Error al crear item:", error);
    }
}

async function toggleItem(id, estadoActual) {
    const nuevoEstado = estadoActual === 0 ? 1 : 0;

    try {
        await fetch(API_ITEMS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: id, 
                completado: nuevoEstado 
            })
        });
        
        cargarItems();
    } catch (error) {
        console.error("Error al actualizar item:", error);
    }
}

// Iniciar la app al cargar el DOM
document.addEventListener('DOMContentLoaded', obtenerListas);