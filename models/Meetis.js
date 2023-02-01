const Sequelize = require("sequelize");
const db = require("../config/db");
const { v4 } = require("uuid");
const slug = require("slug");
const shortid = require("shortid");

const Usuarios = require("./Usuarios");
const Grupos = require("./Grupos");

const Meetis = db.define("meetis", {
    id: {
        type: Sequelize.UUID,
        primaryKey: true,
        allowNull: false,
        defaultValue: v4(),
    },
    titulo: {
        type: Sequelize.STRING(100),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega un Titulo",
            },
        },
    },
    slug: Sequelize.STRING,
    invitado: Sequelize.STRING(100),
    cupo: {
        type: Sequelize.INTEGER,
        defaultValue: 0,
    },
    descripcion: {
        type: Sequelize.TEXT,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una Descripción",
            },
        },
    },
    fecha: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una Fecha para el Meeti",
            },
        },
    },
    hora: {
        type: Sequelize.TIME,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una Hora para el Meeti",
            },
        },
    },
    direccion: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una dirección",
            },
        },
    },
    ciudad: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una Ciudad",
            },
        },
    },
    estado: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega una estado",
            },
        },
    },
    pais: {
        type: Sequelize.STRING,
        allowNull: false,
        validate: {
            notEmpty: {
                msg: "Agrega un país",
            },
        },
    },
    ubicacion: Sequelize.GEOMETRY("POINT"),
    interesados: {
        type: Sequelize.ARRAY(Sequelize.INTEGER),
        defaultValue: [],
    },
}, {
    hooks: {
        beforeCreate(meeti) {
            const url = slug(meeti.titulo).toLowerCase();
            meeti.slug = `${url}-${shortid.generate()}`;
        }
    }
});

Meetis.belongsTo(Usuarios);
Meetis.belongsTo(Grupos);


module.exports = Meetis;