const moment = require("moment");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

const Categorias = require("../models/Categorias");
const Grupos = require("../models/Grupos");
const Meetis = require("../models/Meetis");
const Usuarios = require("../models/Usuarios");

exports.home = async (req, res) => {
	const [categorias, meetis] = await Promise.all([
		Categorias.findAll(),
		Meetis.findAll({
			attributes: ["slug", "titulo", "fecha", "hora"],
			where: {
				fecha: { [Op.gte]: moment(new Date()).format("YYYY-MM-DD") },
			},
			limit: 3,
			order: [
				["fecha", "ASC"],
				["hora", "DESC"],
			],
			include: [
				{
					model: Grupos,
					attributes: ["imagen"],
				},
				{
					model: Usuarios,
					attributes: ["nombre", "imagen"],
				},
			],
		}),
	]);

	res.render("home", {
		nombrePagina: "Inicio",
		categorias,
		meetis,
        moment
	});
};
