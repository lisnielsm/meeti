const { OpenStreetMapProvider } = require("leaflet-geosearch");
import asistencia from "./asistencia";
import eliminarComentario from "./eliminarComentario";

//obtener valores de la base de datos

const lat = document.querySelector("#lat")?.value || 23.107639;
const lng = document.querySelector("#lng")?.value || -82.42432;
const direccion = document.querySelector("#direccion")?.value || "";

const map = L.map("mapa").setView([lat, lng], 17);

const markers = new L.LayerGroup().addTo(map);
let marker;

function obtenerPin(latitud, longitude, dir) {
	// agregar el pin
	marker = new L.marker([latitud, longitude], {
		draggable: true,
		autoPan: true,
	})
		.addTo(map)
		.bindPopup(dir)
		.openPopup();

	markers.addLayer(marker);

	// detectar el movimiento del marker
	marker.on("moveend", function (e) {
		marker = e.target;
		const posicion = marker.getLatLng();
		map.panTo(new L.LatLng(posicion.lat, posicion.lng));

		fetch(
			`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&langCode=EN&location=${posicion.lng},${posicion.lat}`
		)
			.then((res) => res.json())
			.then((myJson) => {
				marker.bindPopup(myJson.address.LongLabel).openPopup();
				llenarInputs(myJson);
			});
	});
}

// colocar el pin en edicion
if (document.querySelector("#lat").value && document.querySelector("#lng").value) {
	obtenerPin(lat, lng, direccion);
}

function debounce(func, timeout = 500) {
	let timer;
	return (...args) => {
		clearTimeout(timer);
		timer = setTimeout(() => {
			func.apply(this, args);
		}, timeout);
	};
}

const processChange = debounce((e) => buscarDireccion(e));

document.addEventListener("DOMContentLoaded", () => {
	L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
		attribution:
			'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
	}).addTo(map);

	// buscar la direccion
	const buscador = document.querySelector("#formbuscador");
	buscador.addEventListener("input", processChange);
});

function buscarDireccion(e) {
	if (e.target.value.length > 8) {
		// utilizar el provider y el GeoCoding
		const provider = new OpenStreetMapProvider();
		provider.search({ query: e.target.value }).then((result) => {
			markers.clearLayers();

			if (result.length > 0) {
				const latlng = result[0].bounds[0];

				// mostrar el mapa
				map.setView(latlng, 17);

				fetch(
					`https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/reverseGeocode?f=pjson&langCode=EN&location=${latlng[1]},${latlng[0]}`
				)
					.then((res) => res.json())
					.then((myJson) => {
						llenarInputs(myJson);
					});

				obtenerPin(latlng[0], latlng[1], result[0].label);
			}
		});
	}
}

function llenarInputs(resultado) {
	document.querySelector("#direccion").value =
		resultado.address.Address || "";
	document.querySelector("#ciudad").value = resultado.address.City || "";
	document.querySelector("#estado").value = resultado.address.Region || "";
	document.querySelector("#pais").value = resultado.address.CountryCode || "";
	document.querySelector("#lat").value = resultado.location.y || "";
	document.querySelector("#lng").value = resultado.location.x || "";
}
