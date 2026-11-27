const API_URL =
    window.location.hostname === "localhost" ||
        window.location.hostname === "127.0.0.1" ||
        window.location.protocol === "file:"
        ? "http://localhost:3000"
        : "https://proyecto-bd-7e83.onrender.com/";

// ELEMENTOS DEL DOM
const listaProductos = document.getElementById("listaProductos");
const listaCatalogo = document.getElementById("listaCatalogo");
const formulario = document.getElementById("formularioProducto");
const productoId = document.getElementById("productoId");
const imagenUrlActualInput = document.getElementById("imagenUrlActual");
const nombreInput = document.getElementById("nombre");
const precioInput = document.getElementById("precio");
const stockInput = document.getElementById("stock");
const imagenArchivoInput = document.getElementById("imagenArchivo");
const contenedorVistaPrevia = document.getElementById("contenedorVistaPrevia");
const vistaPreviaImagen = document.getElementById("vistaPreviaImagen");
const textoVistaPrevia = document.getElementById("textoVistaPrevia");
const btnGuardar = document.getElementById("btnGuardar");
const btnCancelar = document.getElementById("btnCancelar");
const tituloFormulario = document.getElementById("tituloFormulario");

// ELEMENTOS DEL DOM CONTACTO
const listaContactos = document.getElementById("listaContactos");
const formularioContacto = document.getElementById("formularioContacto");
const contactoId = document.getElementById("contactoId");
const contactoNombreInput = document.getElementById("contactoNombre");
const correoInput = document.getElementById("correo");
const asuntoInput = document.getElementById("asunto");
const mensajeInput = document.getElementById("mensaje");
const btnGuardarContacto = document.getElementById("btnGuardarContacto");
const btnCancelarContacto = document.getElementById("btnCancelarContacto");
const tituloFormularioContacto = document.getElementById("tituloFormularioContacto");
const estadoContactos = document.getElementById("estadoContactos");

// Guardamos los productos en memoria para cargarlos facilmente al editar
let productosMemoria = [];

// imagen SVG (vectorial) por defecto cuando un producto aún no tiene imagen subida a Cloudinary
const IMAGEN_POR_DEFECTO =
    "data:image/svg+xml;charset=UTF-8," +
    encodeURIComponent(`
        <svg xmlns="http://www.w3.org/2000/svg" width="400" height="200" viewBox="0 0 400 280">
        <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stop-color="#0f172a"/>
                <stop offset="100%" stop-color="#2b61de"/>
            </linearGradient>
        </defs>

        <rect width="400" height="280" fill="url(#bg)"/>
        <rect x="135" y="70" width="130" height="90" rx="10" fill="none" stroke="#60a5fa" stroke-width="4"/>
        <line x1="175" y1="180" x2="255" y2="180" fill="none" stroke="#60a5fa" stroke-width="4" stroke-linecap="round"/>
        <line x1="200" y1="160" x2="200" y2="180" fill="none" stroke="#60a5fa" stroke-width="4"/>
        <text x="200" y="220" font-family="Arial, sans-serif" font-size="15" fill="#8fcbff" text-anchor="middle">
            MiTienda Tech - Sin Imagen
        </text>
        </svg>
    `);

// Convertir un archivo seleccionado en <input type="file"> a cadena Base64
function convertirArchivoABase64(archivo) {
    return new Promise((resolve, reject) => {
        const lector = new FileReader();
        lector.onload = () => resolve(lector.result);
        lector.onerror = (error) => reject(error);
        lector.readAsDataURL(archivo)
    });
}

// Mostrar vista previa inmediata cuando el usuario escoge una imagen de su PC
if (imagenArchivoInput) {
    imagenArchivoInput.addEventListener("change", async (e) => {
        const archivo = e.target.files[0];
        if (!archivo) return;

        const Base64 = await convertirArchivoABase64(archivo);
        vistaPreviaImagen.src = Base64;
        contenedorVistaPrevia.style.display = "flex";
    });
}


// 1. Funcion para consultar los productos y mostrarlos en el DOM (READ)
async function cargarProductos() {
    if (!listaProductos && !listaCatalogo) return;

    try {
        const respuesta = await fetch(`${API_URL}/productos`);
        if (!respuesta.ok) {
            throw new Error(`La consulta de productos falló (${respuesta.status})`);
        }

        const productos = await respuesta.json();
        productosMemoria = Array.isArray(productos) ? productos : [];
        if (listaProductos) listaProductos.innerHTML = "";
        if (listaCatalogo) listaCatalogo.innerHTML = "";

        if (productosMemoria.length === 0) {
            if (listaProductos) listaProductos.textContent = "No hay productos registrados.";
            if (listaCatalogo) listaCatalogo.textContent = "Pronto encontrarás aquí nuestros productos.";
            return;
        }

        productosMemoria.forEach((producto) => {
            const elemento = document.createElement("div");
            elemento.classList.add("producto");

            const urlFoto = producto.imagen_url ? producto.imagen_url : IMAGEN_POR_DEFECTO;

            elemento.innerHTML = `
                <div class="producto-imagen-box">
                    <img src="${urlFoto}" alt="${producto.nombre}" class="producto-img" />
                </div>
                <div class="producto-cuerpo">
                    <div>
                        <h3>${producto.nombre}</h3>
                        <p class="producto-precio">Precio: $${producto.precio}</p>
                        <p>Stock: ${producto.stock} unidades</p>
                    </div>
                    <div class="acciones">
                        <button class="btn-editar" onclick="cargarEnFormulario(${producto.id})">Editar</button>
                        <button class="btn-eliminar" onclick="eliminarProducto(${producto.id})">Eliminar</button>
                    </div>
                </div>
`;
            // HASTA AQUI


            if (listaProductos) {
                listaProductos.appendChild(elemento);
            }

            if (listaCatalogo) {
                const tarjetaCatalogo = elemento.cloneNode(true);
                const accionesCatalogo = tarjetaCatalogo.querySelector(".acciones");
                if (accionesCatalogo) accionesCatalogo.remove();
                listaCatalogo.appendChild(tarjetaCatalogo);
            }
        });
    } catch (error) {
        console.error("Error al cargar productos:", error);
        if (listaProductos) {
            listaProductos.textContent = `No se pudieron cargar los productos: ${error.message}`;
        }
        if (listaCatalogo) {
            listaCatalogo.textContent = "No se pudo cargar el catálogo. Inténtalo de nuevo más tarde.";
        }
    }
}

// 2. Cargar datos del producto en el formulario para editar (UPDATE)
function cargarEnFormulario(id, nombre, precio, stock) {
    const producto = productosMemoria.find((p) => p.id === id);
    if (!producto) return;


    productoId.value = producto.id;
    nombreInput.value = producto.nombre;
    precioInput.value = producto.precio;
    stockInput.value = producto.stock;
    imagenUrlActualInput.value = producto.imagen_url || "";
    if (imagenArchivoInput) imagenArchivoInput.value = "";

    if (producto.imagen_url && contenedorVistaPrevia) {
        vistaPreviaImagen.src = producto.imagen_url;
        textoVistaPrevia.textContent = "Imagen actual en Cloudinary (elige otra si deseas cambiarla)";
        contenedorVistaPrevia.style.display = "flex";
    } else if (contenedorVistaPrevia) {
        contenedorVistaPrevia.style.display = "none";
    }

    tituloFormulario.textContent = "Editar Producto";
    btnGuardar.textContent = "Actualizar Producto";
    btnCancelar.hidden = false;
    nombreInput.focus();
}

// Cancelar edicion y restaurar formulario
function cancelarEdicion() {
    if (!formulario) return;
    formulario.reset();
    productoId.value = "";

    if (imagenUrlActualInput) imagenUrlActualInput.value = "none";
    if (contenedorVistaPrevia) contenedorVistaPrevia.style.display = "none";
    tituloFormulario.textContent = "Registrar producto";
    btnGuardar.textContent = "Guardar Producto";
    btnCancelar.style.display = "none";
}
if (btnCancelar) {
    btnCancelar.addEventListener("click", cancelarEdicion);
}


// 3. Guardar o actualizar segun si hay un ID seleccionado (CREATE o UPDATE)
if (formulario) {
    formulario.addEventListener("submit", async (event) => {
        event.preventDefault(); // Evitar que la página se recargue

        const id = productoId.value;
        const nombre = nombreInput.value;
        const precio = precioInput.value;
        const stock = stockInput.value;
        const imagen_url = imagenUrlActualInput ? imagenUrlActualInput.value : null;
        const archivoSeleccionado = imagenArchivoInput?.files[0];

        const textoOriginalBoton = btnGuardar.textContent;

        try {
            btnGuardar.disabled = true;
            btnGuardar.textContent = archivoSeleccionado
                ? "Subiendo imagen a Cloudinary..."
                : "Guardando...";

            let imagenBase64 = null;
            if (archivoSeleccionado){
                imagenBase64 = await convertirArchivoABase64(archivoSeleccionado);
            }

            const respuesta = await fetch(id ? `${API_URL}/productos/${id}` : `${API_URL}/productos`,{
                method: id ? "PUT" : "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    nombre,
                    precio,
                    stock,
                    imagen_url,
                    imagenBase64,
                }),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok){
                alert("Aviso: " + (datos.mensaje || "No se pudo guardar el producto"));
                return;
            }

            cancelarEdicion();
            cargarProductos();


            
        } catch (error) {
            console.error("Error al guardar el producto:", error);
            alert("Error de Conexion con el servidor.");
        } finally {
            btnGuardar.disabled = false;
            btnGuardar.textContent = textoOriginalBoton;
        }
    });
}


// Boton de eliminar un producto (DELETE)
// 4. Eliminar un producto (DELETE)
async function eliminarProducto(id) {
  const confirmar = confirm("¿Deseas eliminar este producto de la base de datos?");
  if (!confirmar) return;

  try {
    await fetch(`${API_URL}/productos/${id}`, {
      method: "DELETE",
    });

    if (productoId && productoId.value == id) {
      cancelarEdicion();
    }

    cargarProductos();
  } catch (error) {
    console.error("Error al eliminar producto:", error);
  }
}

const listaMensajes = document.getElementById("listaMensajes");
const btnRecargarMensajes = document.getElementById("btnRecargarMensajes");



// CARGA Y RENDERIZADO DE CONTACTOS
async function cargarContactos() {
    if (!listaContactos) return false;

    if (estadoContactos) {
        estadoContactos.textContent = "Cargando contactos...";
    }

    try {
        const respuesta = await fetch(`${API_URL}/contactos`);
        if (!respuesta.ok) {
            const resultado = await respuesta.json();
            throw new Error(resultado.mensaje || `La consulta falló (${respuesta.status})`);
        }

        const contactos = await respuesta.json();
        listaContactos.innerHTML = "";

        if (contactos.length === 0) {
            if (estadoContactos) {
                estadoContactos.textContent = "Todavía no hay contactos registrados.";
            }
            return true;
        }

        if (estadoContactos) {
            estadoContactos.textContent = "";
        }

        contactos.forEach((contacto) => {
            const elemento = document.createElement("div");
            elemento.classList.add("contacto");

            const detalles = document.createElement("div");
            const nombreElemento = document.createElement("h3");
            nombreElemento.textContent = contacto.nombre;

            const correoElemento = document.createElement("p");
            correoElemento.classList.add("contacto-correo");
            correoElemento.textContent = `Correo: ${contacto.correo}`;

            const asuntoElemento = document.createElement("p");
            asuntoElemento.textContent = `Asunto: ${contacto.asunto}`;

            const mensajeElemento = document.createElement("p");
            mensajeElemento.classList.add("contacto-mensaje");
            mensajeElemento.textContent = `Mensaje: ${contacto.mensaje}`;

            const fechaElemento = document.createElement("p");
            fechaElemento.classList.add("contacto-fecha");
            fechaElemento.textContent = `Fecha y hora de envío o última edición: ${contacto.fecha_actualizacion}`;

            const acciones = document.createElement("div");
            acciones.classList.add("acciones");

            const btnEditar = document.createElement("button");
            btnEditar.type = "button";
            btnEditar.classList.add("btn-editar");
            btnEditar.textContent = "Editar";
            btnEditar.addEventListener("click", () => {
                cargarContactoEnFormulario(contacto);
            });

            const btnEliminar = document.createElement("button");
            btnEliminar.type = "button";
            btnEliminar.classList.add("btn-eliminar");
            btnEliminar.textContent = "Eliminar";
            btnEliminar.addEventListener("click", () => eliminarContacto(contacto.id));

            detalles.append(nombreElemento, correoElemento, asuntoElemento, mensajeElemento, fechaElemento);
            acciones.append(btnEditar, btnEliminar);
            elemento.append(detalles, acciones);
            listaContactos.appendChild(elemento);
        });
        return true;
    } catch (error) {
        console.error("Error al cargar contactos:", error);
        if (estadoContactos) {
            estadoContactos.textContent = `No se pudieron cargar los contactos: ${error.message}`;
        }
        return false;
    }
}

function cargarContactoEnFormulario(contacto) {
    contactoId.value = contacto.id;
    contactoNombreInput.value = contacto.nombre;
    correoInput.value = contacto.correo;
    asuntoInput.value = contacto.asunto;
    mensajeInput.value = contacto.mensaje;

    tituloFormularioContacto.textContent = "Editar contacto";
    btnGuardarContacto.textContent = "Actualizar contacto";
    btnCancelarContacto.hidden = false;
    contactoNombreInput.focus();
}

function cancelarEdicionContacto() {
    formularioContacto.reset();
    contactoId.value = "";
    tituloFormularioContacto.textContent = "Contacto";
    btnGuardarContacto.textContent = "Guardar contacto";
    btnCancelarContacto.hidden = true;
}

async function guardarContacto(event) {
    event.preventDefault();

    const editando = contactoId.value !== "";
    const url = editando
        ? `${API_URL}/contactos/${encodeURIComponent(contactoId.value)}`
        : `${API_URL}/contactos`;
    const contacto = {
        nombre: contactoNombreInput.value.trim(),
        correo: correoInput.value.trim(),
        asunto: asuntoInput.value.trim(),
        mensaje: mensajeInput.value.trim()
    };

    btnGuardarContacto.disabled = true;
    try {
        const respuesta = await fetch(url, {
            method: editando ? "PUT" : "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(contacto)
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || `La operación falló (${respuesta.status})`);
        }

        const listaActualizada = await cargarContactos();
        cancelarEdicionContacto();
        if (listaActualizada && estadoContactos) {
            estadoContactos.textContent = resultado.mensaje;
        }
    } catch (error) {
        console.error("Error al guardar contacto:", error);
        if (estadoContactos) {
            estadoContactos.textContent = `No se pudo guardar el contacto: ${error.message}`;
        }
    } finally {
        btnGuardarContacto.disabled = false;
    }
}

async function eliminarContacto(id) {
    if (!window.confirm("¿Seguro que deseas eliminar este contacto?")) {
        return;
    }

    try {
        const respuesta = await fetch(`${API_URL}/contactos/${encodeURIComponent(id)}`, {
            method: "DELETE"
        });
        const resultado = await respuesta.json();
        if (!respuesta.ok) {
            throw new Error(resultado.mensaje || `La eliminación falló (${respuesta.status})`);
        }

        if (contactoId.value === String(id)) {
            cancelarEdicionContacto();
        }
        const listaActualizada = await cargarContactos();
        if (listaActualizada && estadoContactos) {
            estadoContactos.textContent = resultado.mensaje;
        }
    } catch (error) {
        console.error("Error al eliminar contacto:", error);
        if (estadoContactos) {
            estadoContactos.textContent = `No se pudo eliminar el contacto: ${error.message}`;
        }
    }
}

if (formularioContacto) {
    formularioContacto.addEventListener("submit", guardarContacto);
}

if (btnCancelarContacto) {
    btnCancelarContacto.addEventListener("click", cancelarEdicionContacto);
    btnCancelarContacto.hidden = true;
}





// llamado inicial al cargar la pagina
cargarProductos();
cargarContactos();