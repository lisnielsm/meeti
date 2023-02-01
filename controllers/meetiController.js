const { body } = require("express-validator");
const moment = require("moment");
const { Sequelize } = require("sequelize");
const Op = Sequelize.Op;
const Grupos = require("../models/Grupos");
const Meetis = require("../models/Meetis");
const Usuarios = require("../models/Usuarios");
const Categorias = require("../models/Categorias");
const Comentarios = require("../models/Comentarios");

// Crea el formulario para nuevos Meeti
exports.formNuevoMeeti = async (req, res, next) => {
	const grupos = await Grupos.findAll({ where: { usuarioId: req.user.id } });

	res.render("nuevo-meeti", {
		nombrePagina: "Crear Nuevo Meeti",
		grupos,
	});
};

// Inserta nuevos Meeti en la BD
exports.crearMeeti = async (req, res, next) => {
	// obtener los datos
	const meeti = req.body;

	// asignar el usuario
	meeti.usuarioId = req.user.id;

	// almacena la ubicacion de un point
	const point = {
		type: "Point",
		coordinates: [parseFloat(req.body.lat), parseFloat(req.body.lng)],
	};
	meeti.ubicacion = point;

	// cupo opcional
	if (req.body.cupo === "") {
		meeti.cupo = 0;
	}

	// almacenar en la BD
	try {
		await Meetis.create(meeti);
		req.flash("exito", "Se ha creado el Meeti correctamente");
		return res.redirect("/administracion");
	} catch (error) {
		// extraer el mensaje de los errores
		const erroresSequelize = error.errors.map((err) => err.message);

		req.flash("error", erroresSequelize);
		return res.redirect("/nuevo-meeti");
	}
};

// sanitiza los meeti
exports.sanitizarMeeti = (req, res, next) => {
	body("titulo").escape();
	body("invitado").escape();
	body("cupo").escape();
	body("fecha").escape();
	body("hora").escape();
	body("direccion").escape();
	body("ciudad").escape();
	body("estado").escape();
	body("pais").escape();
	body("lat").escape();
	body("lng").escape();
	body("grupoId").escape();

	next();
};

// Muestra el formulario para editar un meeti
exports.formEditarMeeti = async (req, res, next) => {
	// Promise con destructuring
	const [grupos, meeti] = await Promise.all([
		Grupos.findAll({ where: { usuarioId: req.user.id } }),
		Meetis.findOne({
			where: { id: req.params.id, usuarioId: req.user.id },
		}),
	]);

	if (!grupos || !meeti) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	res.render("editar-meeti", {
		nombrePagina: `Editar Meeti: ${meeti.titulo}`,
		grupos,
		meeti,
	});
};

// Almacena los cambios en el meeti (BD)
exports.editarMeeti = async (req, res, next) => {
	const meeti = await Meetis.findOne({
		where: { id: req.params.id, usuarioId: req.user.id },
	});

	if (!meeti) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	// asignar los valores
	const {
		grupoId,
		titulo,
		invitado,
		cupo,
		fecha,
		hora,
		descripcion,
		direccion,
		ciudad,
		estado,
		pais,
		lat,
		lng,
	} = req.body;

	// asignar los valores
	meeti.grupoId = grupoId;
	meeti.titulo = titulo;
	meeti.invitado = invitado;
	meeti.cupo = cupo;
	meeti.fecha = fecha;
	meeti.hora = hora;
	meeti.direccion = direccion;
	meeti.descripcion = descripcion;
	meeti.ciudad = ciudad;
	meeti.estado = estado;
	meeti.pais = pais;

	// asignar point(ubicacion)
	const point = {
		type: "Point",
		coordinates: [parseFloat(lat), parseFloat(lng)],
	};
	meeti.ubicacion = point;

	// almacenar en la BD
	await meeti.save();
	req.flash("exito", "Cambios Guardados Correctamente");
	return res.redirect("/administracion");
};

// muestra un formulario para eliminar un meeti
exports.formEliminarMeeti = async (req, res, next) => {
	const meeti = await Meetis.findOne({
		where: { id: req.params.meetiId, usuarioId: req.user.id },
	});

	// si no existe el meeti
	if (!meeti) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	res.render("eliminar-meeti", {
		nombrePagina: `Eliminar Meeti: ${meeti.titulo}`,
	});
};

// Elimina el meeti
exports.eliminarMeeti = async (req, res, next) => {
	const meeti = await Meetis.findOne({
		where: { id: req.params.meetiId, usuarioId: req.user.id },
	});

	// si no existe el meeti
	if (!meeti) {
		req.flash("error", "Operación no válida");
		res.redirect("/administracion");
		return next();
	}

	// eliminar el meeti de la BD
	await Meetis.destroy({
		where: { id: req.params.meetiId },
	});

	// redireccionar
	req.flash("exito", "Meeti eliminado correctamente");
	return res.redirect("/administracion");
};

exports.mostrarMeeti = async (req, res, next) => {
	const meeti = await Meetis.findOne({
		where: { slug: req.params.slug },
		include: [
			{
				model: Grupos,
			},
			{
				model: Usuarios,
				attributes: ["id", "nombre", "imagen"],
			},
		],
	});

	if (!meeti) {
		req.flash("error", "No existe ese Meeti");
		return res.redirect("/");
	}

	// consultar por meetis cercanos
	const ubicacion = Sequelize.literal(
		`ST_GeomFromText('POINT(${meeti.ubicacion.coordinates[0]} ${meeti.ubicacion.coordinates[1]})')`
	);

	// ST_Distance_Sphere => retorna una linea en metros
	const distancia = Sequelize.fn(
		"st_distancesphere",
		Sequelize.col("ubicacion"),
		ubicacion
	);

	// encontrar meeti's cercanos
	const cercanos = await Meetis.findAll({
		order: distancia,
		where: Sequelize.where(distancia, { [Op.lte]: 2000 }),
		limit: 3,
		offset: 1,
		include: [
			{
				model: Grupos,
			},
			{
				model: Usuarios,
				attributes: ["id", "nombre", "imagen"],
			},
		],
	});

	const comentarios = await Comentarios.findAll({
		where: { meetiId: meeti.id },
		include: [
			{
				model: Usuarios,
				attributes: ["id", "nombre", "imagen"],
			},
		],
	});

	res.render("mostrar-meeti", {
		nombrePagina: meeti.titulo,
		meeti,
		comentarios,
		cercanos,
		moment,
	});
};

// confirma o cancela si el usuario asistira a un meeti
exports.confirmarAsistencia = async (req, res, next) => {
	const { accion } = req.body;

	if (accion === "confirmar") {
		// agregar el usuario
		const meeti = await Meetis.update(
			{
				interesados: Sequelize.fn(
					"array_append",
					Sequelize.col("interesados"),
					req.user.id
				),
			},
			{
				where: {
					slug: req.params.slug,
				},
				returning: true,
				plain: true,
			}
		);

		res.send({
			label: "Has confirmado tu asistencia",
			value: meeti[1].interesados.length,
		});
	} else {
		// cancelar la asistencia del usuario
		const meeti = await Meetis.update(
			{
				interesados: Sequelize.fn(
					"array_remove",
					Sequelize.col("interesados"),
					req.user.id
				),
			},
			{
				where: {
					slug: req.params.slug,
				},
				returning: true,
				plain: true,
			}
		);

		res.send({
			label: "Has cancelado tu asistencia",
			value: meeti[1].interesados.length,
		});
	}
};

// muestra el listado de asistentes
exports.mostrarAsistentes = async (req, res, next) => {
	const meeti = await Meetis.findOne({
		where: {
			slug: req.params.slug,
		},
		attributes: ["interesados"],
	});

	if (!meeti) {
		req.flash("error", "Operación no válida");
		return res.redirect("/");
	}

	// extraer interesados
	const { interesados } = meeti;

	// consultar a la BD y obtener los usuarios
	const asistentes = await Usuarios.findAll({
		attributes: ["nombre", "imagen"],
		where: { id: interesados },
	});

	res.render("asistentes-meeti", {
		nombrePagina: `Listado Asistentes Meeti`,
		asistentes,
	});
};

// muestra los meetis agrupados por categoria
exports.mostrarCategoria = async (req, res, next) => {
	const categoria = await Categorias.findOne({
		attributes: ["id", "nombre"],
		where: { slug: req.params.categoria },
	});

	const meetis = await Meetis.findAll({
		order: [
			["fecha", "ASC"],
			["hora", "ASC"],
		],
		include: [
			{
				model: Grupos,
				where: { categoriaId: categoria.id },
			},
			{
				model: Usuarios,
			},
		],
	});

	res.render("categoria", {
		nombrePagina: `Categoria: ${categoria.nombre}`,
		meetis,
		moment,
	});
};
