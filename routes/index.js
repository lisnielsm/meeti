const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

const homeController = require("../controllers/homeController");
const usuariosController = require("../controllers/usuariosController");
const authController = require("../controllers/authController");
const adminController = require("../controllers/adminController");
const gruposController = require("../controllers/gruposController");
const meetiController = require("../controllers/meetiController");
const comentariosController = require("../controllers/comentariosController");
const busquedaController = require("../controllers/busquedaController");

/** AREA PUBLICA */

router.get("/", homeController.home);

// Muestra un Meeti
router.get("/meeti/:slug", meetiController.mostrarMeeti);

// Confirma la asistencia al meeti
router.post("/confirmar-asistencia/:slug", meetiController.confirmarAsistencia);

// Muestra los asistentes al meeti
router.get("/asistentes/:slug", meetiController.mostrarAsistentes);

// Agrega comentarios en el Meeti
router.post("/meeti/:id", comentariosController.agregarComentario);

// Elimina comentarios en el Meeti
router.post("/eliminar-comentario", comentariosController.eliminarComentario); 

// Muestra perfiles en el frontend
router.get("/usuarios/:id", usuariosController.mostrarUsuario);

// Muestra los grupos en el frontend
router.get('/grupos/:id', gruposController.mostrarGrupo);

// Muestra meetis por categoria
router.get('/categoria/:categoria', meetiController.mostrarCategoria);

// Añade la busqueda
router.get('/busqueda', busquedaController.resultadosBusqueda);

// Crear y confirmar cuentas
router.get("/crear-cuenta", usuariosController.formCrearCuenta);
router.post(
	"/crear-cuenta",
	[
		body("confirmar", "Confirmar password es obligatorio").notEmpty(),
		body("confirmar").custom((value, { req }) => {
			if (value !== req.body.password) {
				throw new Error("El password de confirmacion es diferente");
			}
			return true;
		}),
	],
	usuariosController.crearNuevaCuenta
);
router.get("/confirmar-cuenta/:correo", usuariosController.confirmarCuenta);

// Iniciar sesion
router.get("/iniciar-sesion", usuariosController.formIniciarSesion);
router.post("/iniciar-sesion", authController.autenticarUsuario);

// Cerrar sesion
router.get(
	"/cerrar-sesion",
	authController.usuarioAutenticado,
	authController.cerrarSesion
);

/** AREA PRIVADA */

// Panel de administracion
router.get(
	"/administracion",
	authController.usuarioAutenticado,
	adminController.panelAdministracion
);

// Nuevos Grupos
router.get(
	"/nuevo-grupo",
	authController.usuarioAutenticado,
	gruposController.formNuevoGrupo
);
router.post(
	"/nuevo-grupo",
	authController.usuarioAutenticado,
	[body("nombre").escape(), body("url").escape()],
	gruposController.subirImagen,
	gruposController.crearGrupo
);

// Editar grupos
router.get(
	"/editar-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.formEditarGrupo
);
router.post(
	"/editar-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.editarGrupo
);

// Editar la imagen del grupo
router.get(
	"/imagen-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.formEditarImagen
);
router.post(
	"/imagen-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.subirImagen,
	gruposController.editarImagen
);

// Eliminar grupo
router.get(
	"/eliminar-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.formEliminarGrupo
);
router.post(
	"/eliminar-grupo/:grupoId",
	authController.usuarioAutenticado,
	gruposController.eliminarGrupo
);

// Nuevos Meeti
router.get(
	"/nuevo-meeti",
	authController.usuarioAutenticado,
	meetiController.formNuevoMeeti
);
router.post(
	"/nuevo-meeti",
	authController.usuarioAutenticado,
	meetiController.sanitizarMeeti,
	meetiController.crearMeeti
);

// Editar Meeti
router.get(
	"/editar-meeti/:id",
	authController.usuarioAutenticado,
	meetiController.formEditarMeeti
);
router.post(
	"/editar-meeti/:id",
	authController.usuarioAutenticado,
	meetiController.editarMeeti
);

// Eliminar Meeti
router.get(
	"/eliminar-meeti/:meetiId",
	authController.usuarioAutenticado,
	meetiController.formEliminarMeeti
);
router.post(
	"/eliminar-meeti/:meetiId",
	authController.usuarioAutenticado,
	meetiController.eliminarMeeti
);

// Editar el perfil
router.get(
	"/editar-perfil",
	authController.usuarioAutenticado,
	usuariosController.formEditarPerfil
);
router.post(
	"/editar-perfil",
	authController.usuarioAutenticado,
	[body("nombre").escape(), body("email").escape()],
	usuariosController.editarPerfil
);

// modifica el password
router.get(
	"/cambiar-password",
	authController.usuarioAutenticado,
	usuariosController.formCambiarPassword
);
router.post(
	"/cambiar-password",
	authController.usuarioAutenticado,
	usuariosController.cambiarPassword
);

// imagenes de perfil
router.get(
	"/imagen-perfil",
	authController.usuarioAutenticado,
	usuariosController.formSubirImagenPerfil
);
router.post(
	"/imagen-perfil",
	authController.usuarioAutenticado,
	usuariosController.subirImagen,
	usuariosController.guardarImagenPerfil
);

module.exports = router;
