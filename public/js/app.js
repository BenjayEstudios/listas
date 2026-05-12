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
        // Enviamos el usuario como parámetro GET para filtrar en el servidor
        const res = await fetch(`${API_LISTAS}?user=${USUARIO_ACTUAL}`);
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
            // Enviamos el USUARIO_ACTUAL capturado de la URL
            body: JSON.stringify({ nombre: nombre, creador: USUARIO_ACTUAL })
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
        contenedor.innerHTML = '<p style="color: var(--text-muted); text-align:center; padding:20px;">No hay listas para este usuario.</p>';
        return;
    }

    contenedor.innerHTML = listas.map(lista => `
        <div class="list-item" onclick="verDetalleLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')" style="cursor:pointer">
            <div class="item-content">
                <strong>${lista.nombre}</strong>
                <small>Creado por ${lista.creador}</small>
            </div>
            <div class="actions">
                <button class="btn-edit" onclick="event.stopPropagation(); editarLista(${lista.id}, '${lista.nombre.replace(/'/g, "\\'")}')">✏️</button>
                <button class="btn-delete" onclick="event.stopPropagation(); borrarLista(${lista.id})">🗑️</button>
                <button class="btn-copy" onclick="event.stopPropagation(); copiarLista(${lista.id})">📋</button>
            </div>
        </div>
    `).join('');
}

async function borrarLista(id) {
    const confirmacion = confirm("¿Estás seguro? Se borrará la lista y todos sus elementos.");
    if (!confirmacion) return;

    try {
        const res = await fetch(API_LISTAS, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) obtenerListas();
    } catch (error) {
        console.error("Error al borrar lista:", error);
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
            return `
                <div class="list-item ${estaCompletado ? 'item-completed' : ''}" 
                     onclick="toggleItem(${item.id}, ${estaCompletado ? 1 : 0})" 
                     style="cursor:pointer;">
                    <div class="check-circle ${estaCompletado ? 'active' : ''}">${estaCompletado ? '✓' : ''}</div>
                    <div class="item-content" style="${estaCompletado ? 'text-decoration: line-through; opacity: 0.5;' : ''}">
                        <strong>${item.contenido}</strong>
                    </div>
                    <div class="actions">
                        <button class="btn-edit" onclick="event.stopPropagation(); editarItem(${item.id}, '${item.contenido.replace(/'/g, "\\'")}')">✏️</button>
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

async function editarItem(id, contenidoActual) {
    const nuevoContenido = prompt("Editar tarea:", contenidoActual);
    if (!nuevoContenido || nuevoContenido.trim() === "" || nuevoContenido === contenidoActual) return;

    try {
        const res = await fetch(API_ITEMS, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, contenido: nuevoContenido.trim(), op: 'update_text' })
        });
        if ((await res.json()).success) cargarItems();
    } catch (error) {
        console.error("Error al editar item:", error);
    }
}

async function borrarItem(id) {
    if (!confirm("¿Eliminar este elemento?")) return;
    try {
        const res = await fetch(API_ITEMS, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        if ((await res.json()).success) cargarItems();
    } catch (error) {
        console.error("Error al borrar item:", error);
    }
}

async function copiarLista(id) {
    try {
        const res = await fetch(API_LISTAS, {
            method: 'COPY', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id })
        });
        if ((await res.json()).success) obtenerListas();
    } catch (error) {
        console.error("Error al copiar lista:", error);
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