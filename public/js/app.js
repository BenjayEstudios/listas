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
    obtenerListas();
});

// --- RUTAS Y ESTADO ---
const API_LISTAS = 'api/listas.php';
const API_ITEMS  = 'api/items.php';
let listaIdActual = null;

// --- 1. LÓGICA DE LISTAS ---
async function obtenerListas() {
    try {
        const res = await fetch(API_LISTAS);
        const listas = await res.json();
        renderizarListas(listas);
    } catch (error) {
        console.error("Error al obtener listas:", error);
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
            body: JSON.stringify({ nombre: nombre, creador: 'Benjamin' })
        });
        input.value = '';
        obtenerListas();
    } catch (error) {
        console.error("Error al crear lista:", error);
    }
}

async function editarLista(id, nombreActual) {
    const nuevoNombre = prompt("Editar nombre de la lista:", nombreActual);
    if (!nuevoNombre || nuevoNombre.trim() === "" || nuevoNombre === nombreActual) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, nombre: nuevoNombre.trim() })
        });
        const data = await res.json();
        if (data.success) obtenerListas();
    } catch (error) {
        console.error("Error al editar lista:", error);
    }
}

function renderizarListas(listas) {
    const contenedor = document.getElementById('contenedorListas');
    if (listas.length === 0) {
        contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay listas creadas.</p>';
        return;
    }

    contenedor.innerHTML = listas.map(lista => `
        <div class="list-item" onclick="verDetalleLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')" style="cursor:pointer">
            <div class="item-content">
                <strong>${lista.nombre}</strong>
                <small>Creado por ${lista.creador}</small>
            </div>
            <button class="btn-edit" onclick="event.stopPropagation(); editarLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')">✏️</button>
        </div>
    `).join('');
}

// --- 2. NAVEGACIÓN ---
function verDetalleLista(id, nombre) {
    listaIdActual = id;
    // Usamos 'flex' en lugar de 'block' para no romper el layout
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
        const items = await res.json();
        const contenedor = document.getElementById('contenedorItems');

        if (items.length === 0) {
            contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">Esta lista está vacía.</p>';
            return;
        }

        contenedor.innerHTML = items.map(item => {
            const estaCompletado = Number(item.completado) === 1;
            return `
                <div class="list-item" onclick="toggleItem(${item.id}, ${estaCompletado ? 1 : 0})" style="cursor:pointer;">
                    <div class="check-circle ${estaCompletado ? 'active' : ''}">${estaCompletado ? '✓' : ''}</div>
                    <div class="item-content" style="${estaCompletado ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                        <strong>${item.contenido}</strong>
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