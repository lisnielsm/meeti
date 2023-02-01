const nodemailer = require("nodemailer");
const fs = require("fs");
const util = require("util");
const ejs = require("ejs");
require('dotenv').config();

const transport = nodemailer.createTransport({
	host: process.env.EMAIL_HOST,
	port: process.env.EMAIL_PORT,
	auth: {
		user: process.env.EMAIL_USER,
		pass: process.env.EMAIL_PASS,
	},
});

exports.enviarEmail = async (opciones) => {
	// leer el archivo para el mail
	const archivo = __dirname + `/../views/emails/${opciones.archivo}.ejs`;

	// compilarlo
	const compilado = ejs.compile(fs.readFileSync(archivo, "utf-8"));

	// crear el html
	const html = compilado({
		url: opciones.url,
		subject: opciones.subject,
	});


	// configurar las opciones del email
	const opcionesEmail = {
		from: "Meeti <noreply@meeti.com>",
		to: opciones.usuario.email,
		subject: opciones.subject,
		html,
	};

	// enviar el email
	const sendEmail = util.promisify(transport.sendMail, transport);
	return sendEmail.call(transport, opcionesEmail);
};
