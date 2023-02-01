const multer = require("multer");
const shortid = require("shortid");
const fs = require('fs');
const moment = require("moment");

const Categorias = require("../models/Categorias");
const Grupos = require("../models/Grupos");
const Meetis = require("../models/Meetis");

const configuracionMulter = {
	limits: { fileSize: 1000000 }, // 1Mb
	storage: (fileStorage = multer.diskStorage({
		destination: (req, file, next) => {
			next(null, __dirname + "/../public/uploads/grupos");
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

exports.formNuevoGrupo = async (req, res) => {
	const categorias = await Categorias.findAll();

	res.render("nuevo-grupo", {
		nombrePagina: "Crea un nuevo grupo",
		categorias,
	});
};

// Almacena los grupos en la BD
exports.crearGrupo = async (req, res) => {
	const grupo = req.body;

	// almacena el usuario autenticado como el creador del grupo
	grupo.usuarioId = req.user.id;

	// leer la imagen
	if (req.file) {
		grupo.imagen = req.file.filename;
	}

	// Almacenar en la base de datos
	try {
		await Grupos.create(grupo);
		req.flash("exito", "Se ha creado el grupo correctamente");
		return res.redirect("/administracion");
	} catch (error) {
		// Extraer el mensaje de los errores
		const erroresSequelize = error.errors.map((err) => err.message);
		req.flash("error", erroresSequelize);
		return res.redirect("/nuevo-grupo");
	}
};

exports.formEditarGrupo = async (req, res, next) => {
	// Promise con destructuring
	const [grupo, categorias] = await Promise.all([
		Grupos.findByPk(req.params.grupoId),
		Categorias.findAll(),
	]);

	res.render("editar-grupo", {
		nombrePagina: `Editar Grupo: ${grupo.nombre}`,
		grupo,
		categorias,
	});
};

exports.editarGrupo = async (req, res, next) => {
	const grupo = await Grupos.findOne({
		where: { id: req.params.grupoId, usuarioId: req.user.id },
	});

	// si no existe el grupo
	if (!grupo) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	// leer los valores
	const { nombre, descripcion, categoriaId, url } = req.body;

	// asignar los valores
	grupo.nombre = nombre;
	grupo.descripcion = descripcion;
	grupo.categoriaId = categoriaId;
	grupo.url = url;

	// guardar en la BD
	await grupo.save();
	req.flash("exito", "Cambios guardados correctamente");
	return res.redirect("/administracion");
};

exports.formEditarImagen = async (req, res, next) => {
	const grupo = await Grupos.findOne({
		where: { id: req.params.grupoId, usuarioId: req.user.id },
	});

	res.render("imagen-grupo", {
		nombrePagina: `Editar Imagen Grupo: ${grupo.nombre}`,
		grupo,
	});
};

// Modifica la imagen en la BD y elimina la anterior
exports.editarImagen = async (req, res, next) => {
	const grupo = await Grupos.findOne({
		where: { id: req.params.grupoId, usuarioId: req.user.id },
	});

	// si no existe el grupo
	if (!grupo) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	// si hay una imagen anterior y una nueva, significa que vamos a borrar la anterior
	if (req.file && grupo.imagen) {
		const imagenAnteriorPath =
			__dirname + `/../public/uploads/grupos/${grupo.imagen}`;
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
		grupo.imagen = req.file.filename;
	}

	// guardar en la BD
	await grupo.save();
	req.flash("exito", "Cambios guardados correctamente");
	return res.redirect("/administracion");
};

// muestra un formulario para eliminar un grupo
exports.formEliminarGrupo = async (req, res, next) => {
	const grupo = await Grupos.findOne({
		where: { id: req.params.grupoId, usuarioId: req.user.id },
	});

	// si no existe el grupo
	if (!grupo) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	res.render("eliminar-grupo", {
		nombrePagina: `Eliminar Grupo: ${grupo.nombre}`,
	});
};

// Elimina el grupo e imagen
exports.eliminarGrupo = async (req, res, next) => {
	const grupo = await Grupos.findOne({
		where: { id: req.params.grupoId, usuarioId: req.user.id },
	});

	// si no existe el grupo
	if (!grupo) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	// eliminar la imagen del servidor
	if (grupo.imagen) {
		const imagenAnteriorPath =
			__dirname + `/../public/uploads/grupos/${grupo.imagen}`;
		// eliminar el archivo con el filesystem
		fs.unlink(imagenAnteriorPath, (error) => {
			if (error) {
				console.log(error);
			}
			return;
		});
	}

	// eliminar el grupo de la BD
	await Grupos.destroy({
		where: { id: req.params.grupoId },
	});

	// redireccionar
	req.flash("exito", "Grupo eliminado correctamente");
	return res.redirect("/administracion");
};

exports.mostrarGrupo = async (req, res, next) => {
	const [grupo, meetis] = await Promise.all([
		Grupos.findByPk(req.params.id),
		Meetis.findAll({
			where: { grupoId: req.params.id },
			order: [["fecha", "ASC"]],
		}),
	]);

	if (!grupo) {
		res.redirect("/");
		return next();
	}

	// mostrar la vista
	res.render("mostrar-grupo", {
		nombrePagina: `Información Grupo: ${grupo.nombre}`,
		grupo,
		meetis,
		moment		
	})
}
