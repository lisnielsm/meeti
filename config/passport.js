const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const Usuarios = require("../models/Usuarios");

passport.use(
	new LocalStrategy(
		// por default passport espera un usuario y password
		{
			usernameField: "email",
			passwordField: "password",
		},
		async (email, password, done) => {
			const usuario = await Usuarios.findOne({
				where: { email, activo: 1 },
			});
			if (!usuario)
				return done(null, false, {
					message: "Usuario o password incorrecto",
				});

			// El usuario existe, verificar password
			const verificarPassword = usuario.verificarPassword(password);
			if (!verificarPassword) {
				return done(null, false, {
					message: "Usuario o password incorrecto",
				});
			}

			// usuario existe y el password es correcto
			return done(null, usuario);
		}
	)
);

passport.serializeUser((usuario, done) => done(null, usuario));

passport.deserializeUser((usuario, done) => done(null, usuario));

module.exports = passport;
