const moment = require("moment");
const Sequelize = require("sequelize");
const Op = Sequelize.Op;
const Grupos = require("../models/Grupos");
const Meetis = require("../models/Meetis");

exports.panelAdministracion = async (req, res) => {
	const [grupos, meetis, anteriores] = await Promise.all([
		Grupos.findAll({ where: { usuarioId: req.user.id } }),
		Meetis.findAll({
			where: {
				usuarioId: req.user.id,
				fecha: { [Op.gte]: moment(new Date()).format("YYYY-MM-DD") },
			},
			order: [["fecha", "ASC"]],
		}),
		Meetis.findAll({
			where: {
				usuarioId: req.user.id,
				fecha: { [Op.lt]: moment(new Date()).format("YYYY-MM-DD") },
			},
		}),
	]);

	res.render("administracion", {
		nombrePagina: "Panel de Administracion",
		grupos,
		meetis,
		anteriores,
		moment,
	});
};
