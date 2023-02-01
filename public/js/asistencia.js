import axios from "axios";

document.addEventListener("DOMContentLoaded", () => {
	const asistencia = document.querySelector("#confirmar-asistencia");

	if (asistencia) {
		asistencia.addEventListener("submit", confirmarAsistencia);
	}
});

function confirmarAsistencia(e) {
	e.preventDefault();

	const btn = document.querySelector(
		'#confirmar-asistencia input[type="submit"]'
	);
	let accion = document.querySelector("#accion").value;
    const mensaje = document.querySelector("#mensaje");

    // limpia la respuesta previa
    while(mensaje.firstChild) {
        mensaje.removeChild(mensaje.firstChild);
    }

	axios.post(this.action, { accion }).then((respuesta) => {
		if (accion === "confirmar") {
			// modifica los elementos del boton
			document.querySelector("#accion").value = "cancelar";
			btn.value = "Cancelar";
			btn.classList.remove("btn-azul");
			btn.classList.add("btn-rojo");
		} else {
			document.querySelector("#accion").value = "confirmar";
			btn.value = "Sí";
			btn.classList.remove("btn-rojo");
			btn.classList.add("btn-azul");
		}

        // mostrar un mensaje
        mensaje.appendChild(document.createTextNode(respuesta.data.label));

		// actualiza el numero de asistentes
		const asistentes = document.querySelector(".asistentes .titulo h3 span");
		asistentes.textContent = respuesta.data.value;
	});
}
