const Sequelize = require("sequelize");
const db = require("../config/db");
const Usuarios = require("./Usuarios");
const Meetis = require("./Meetis");

const Comentarios = db.define(
	"comentarios",
	{
		id: {
			type: Sequelize.INTEGER,
			primaryKey: true,
			autoIncrement: true,
		},
		mensaje: {
			type: Sequelize.TEXT,
			allowNull: false,
			validate: {
				notEmpty: {
					msg: "Agrega un comentario",
				},
			},
		},
	},
	{
		timestamps: false,
	}
);

Comentarios.belongsTo(Usuarios);
Comentarios.belongsTo(Meetis);

module.exports = Comentarios;
