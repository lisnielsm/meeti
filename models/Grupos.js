const Sequelize = require("sequelize");
const db = require("../config/db");
const { v4 } = require("uuid");
const Categorias = require("./Categorias");
const Usuarios = require("./Usuarios");

const Grupos = db.define("grupos", {
	id: {
		type: Sequelize.UUID,
		primaryKey: true,
		allowNull: false,
		defaultValue: v4(),
	},
	nombre: {
		type: Sequelize.STRING(100),
		allowNull: false,
		validate: {
			notEmpty: {
				msg: "El nombre del grupo no puede ir vacío",
			},
		},
	},
	descripcion: {
		type: Sequelize.TEXT,
		allowNull: false,
		validate: {
			notEmpty: {
				msg: "Coloca una descripción",
			},
		},
	},
	url: Sequelize.TEXT,
	imagen: Sequelize.TEXT,
});

Grupos.belongsTo(Categorias);
Grupos.belongsTo(Usuarios);

module.exports = Grupos;
