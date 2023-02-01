const Sequelize = require("sequelize");
require("dotenv").config();

const db = new Sequelize("meeti", process.env.USER_DB, process.env.PASSWORD_DB, {
	host: "127.0.0.1",
	dialect: "postgres",
	port: "5432",
	pool: {
		max: 5,
		min: 0,
		adquire: 30000,
		idle: 10000,
	},
	logging: false,
});

module.exports = db;
