const multer = require("multer");
const shortid = require("shortid");
const fs = require('fs');
const { validationResult } = require("express-validator");

const Usuarios = require("../models/Usuarios");
const Grupos = require("../models/Grupos");
const enviarEmail = require("../handlers/email");

const configuracionMulter = {
	limits: { fileSize: 1000000 }, // 1Mb
	storage: (fileStorage = multer.diskStorage({
		destination: (req, file, next) => {
			next(null, __dirname + "/../public/uploads/perfiles/");
		},
		filename: (req, file, next) => {
			const extension = file.mimetype.split("/")[1];
			next(null, `${shortid.generate()}.${extension}`);
		},
	})),
	fileFilter(req, file, next) {
		if (file.mimetype === "image/jpeg" || file.mimetype === "image/png") {
			// El callback se ejecuta como true o false: true cuando la imagen se acepta
			next(null, true);
		} else {
			next(new Error("Formato no válido"), false);
		}
	},
};

const upload = multer(configuracionMulter).single("imagen");

exports.subirImagen = (req, res, next) => {
	upload(req, res, function (error) {
		if (error) {
			if (error instanceof multer.MulterError) {
				if (error.code === "LIMIT_FILE_SIZE") {
					req.flash("error", "El archivo es muy grande: Máximo 1Mb");
				} else {
					req.flash("error", error.message);
				}
			} else if (error.hasOwnProperty("message")) {
				req.flash("error", error.message);
			}
			return res.redirect("back");
		} else {
			return next();
		}
	});
};

exports.formCrearCuenta = (req, res) => {
	res.render("crear-cuenta", {
		nombrePagina: "Crea tu Cuenta",
	});
};

exports.crearNuevaCuenta = async (req, res) => {
	// leer los datos
	const errores = validationResult(req);

	const usuario = req.body;

	try {
		// crear el usuario
		await Usuarios.create(usuario);

		// crear una URL de confirmar
		const url = `http://${req.headers.host}/confirmar-cuenta/${usuario.email}`;

		// Enviar email de confirmación
		await enviarEmail.enviarEmail({
			usuario,
			url,
			subject: "Confirma tu cuenta Meeti",
			archivo: "confirmar-cuenta",
		});

		// Flash message y redireccionar
		req.flash("exito", "Hemos enviado un email, confirma tu cuenta");
		return res.redirect("/iniciar-sesion");
	} catch (error) {
		// extraer el message de los errores
		const erroresSequelize = error.errors.map((err) => err.message);

		// extraer el msg de los errores
		const errExp = errores.errors.map((err) => err.msg);

		// unirlos
		const listaErrores = [...erroresSequelize, ...errExp];

		if (listaErrores.length > 0) {
			req.flash("error", listaErrores);
		}
		return res.redirect("/crear-cuenta");
	}
};

// confirma la suscripcion del usuario
exports.confirmarCuenta = async (req, res, next) => {
	// verificar que el usuario existe
	const usuario = await Usuarios.findOne({
		where: {
			email: req.params.correo,
		},
	});

	// si no existe, redireccionar
	if (!usuario) {
		req.flash("error", "No existe esa cuenta");
		res.redirect("/crear-cuenta");
		return next();
	}

	// si existe, confirmar suscripcion y redireccionar
	usuario.activo = 1;
	await usuario.save();

	req.flash("exito", "La cuenta se ha confirmado, ya puedes iniciar sesión");
	return res.redirect("/iniciar-sesion");
};

exports.formIniciarSesion = (req, res) => {
	res.render("iniciar-sesion", {
		nombrePagina: "Iniciar Sesión",
	});
};

// Muestra el formulario para editar el perfil
exports.formEditarPerfil = async (req, res) => {
	const usuario = await Usuarios.findByPk(req.user.id);

	res.render("editar-perfil", {
		nombrePagina: "Edita tu Perfil",
		usuario,
	});
};

// cambios al perfil del usuario
exports.editarPerfil = async (req, res) => {
	const usuario = await Usuarios.findByPk(req.user.id);

	// leer los datos
	const { nombre, descripcion, email } = req.body;

	// asignar los valores
	usuario.nombre = nombre;
	usuario.descripcion = descripcion;
	usuario.email = email;

	// guardar en la base de datos
	await usuario.save();

	req.flash("exito", "Cambios Guardados Correctamente");
	return res.redirect("/administracion");
};

// Muestra el formulario para editar el password
exports.formCambiarPassword = (req, res) => {
	res.render("cambiar-password", {
		nombrePagina: "Cambiar Password",
	});
};

// revisa si el password anterior es correcto y lo modifica por el nuevo
exports.cambiarPassword = async (req, res, next) => {
	// consultar el usuario autenticado
	const usuario = await Usuarios.findByPk(req.user.id);

	// verificar si el password anterior es correcto
	const { anterior, nuevo } = req.body;

	if (!usuario.verificarPassword(anterior)) {
		req.flash("error", "El password anterior no es correcto");
		res.redirect("/administracion");
		return next();
	}

	// si el password es correcto, hashear el nuevo
	const hashPassword = usuario.hashPassword(nuevo);

	// asignar el password hasheado
	usuario.password = hashPassword;

	// guardar en la base de datos
	await usuario.save();

	// redireccionar
	req.logout(req.user, (err) => {
		if (err) return next(err);
		req.flash(
			"exito",
			"Password modificado correctamente, vuelve a iniciar sesión"
		);
		return res.redirect("/iniciar-sesion");
	});
};

// muestra el formulario para subir la imagen de perfil
exports.formSubirImagenPerfil = async (req, res) => {
	const usuario = await Usuarios.findByPk(req.user.id);

	res.render("imagen-perfil", {
		nombrePagina: "Sube tu Imagen de Perfil",
		usuario
	});
}

// guarda la imagen nueva, elimina la anterior (si aplica) y actualiza la base de datos
exports.guardarImagenPerfil = async (req, res) => {
	const usuario = await Usuarios.findByPk(req.user.id);

	// si hay una imagen anterior y una nueva, significa que vamos a borrar la anterior
	if (req.file && usuario.imagen) {
		const imagenAnteriorPath =
			__dirname + `/../public/uploads/perfiles/${usuario.imagen}`;
		// eliminar el archivo con el filesystem
		fs.unlink(imagenAnteriorPath, (error) => {
			if (error) {
				console.log(error);
			}
			return;
		});
	}

	// si hay una imagen nueva la guardamos
	if (req.file) {
		usuario.imagen = req.file.filename;
	}

	// guardar en la BD
	await usuario.save();
	req.flash("exito", "Cambios guardados correctamente");
	return res.redirect("/administracion");
}

exports.mostrarUsuario = async (req, res) => {
	const [usuario, grupos] = await Promise.all([
		Usuarios.findByPk(req.params.id),
		Grupos.findAll({
			where: {
				usuarioId: req.params.id,
			},
		}),
	])

	if (!usuario) {
		req.flash("error", "Usuario no encontrado");
		return res.redirect("/");
	}

	res.render("mostrar-usuario", {
		nombrePagina: `Perfil Usuario: ${usuario.nombre}`,
		usuario,
		grupos
	});
}
