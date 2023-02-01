const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const moment = require("moment");

const Meetis = require("../models/Meetis");
const Grupos = require("../models/Grupos");
const Usuarios = require("../models/Usuarios");

exports.resultadosBusqueda = async (req, res) => {
	// leer los datos de la url
	const { categoria, ciudad, titulo, pais } = req.query;

    // si la categoria esta vacia
    const query = categoria !== "" ? { categoriaId: { [Op.eq]: categoria } } : {};

	// filtrar los meetis por los terminos de la busqueda
	const meetis = await Meetis.findAll({
		where: {
			titulo: { [Op.iLike]: `%${titulo}%` },
			ciudad: { [Op.iLike]: `%${ciudad}%` },
			pais: { [Op.iLike]: `%${pais}%` },
		},
		include: [
			{
				model: Grupos,
				where: query,
			},
			{
				model: Usuarios,
				attributes: ["id", "nombre", "imagen"],
			},
		],
	});

	// pasar los resultados a la vista
	res.render("busqueda", {
		nombrePagina: `Resultados para la búsqueda: ${titulo}`,
		meetis,
		moment,
	});
};
