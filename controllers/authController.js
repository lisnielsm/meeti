const passport = require("passport");

exports.autenticarUsuario = passport.authenticate("local", {
	successRedirect: "/administracion",
	failureRedirect: "/iniciar-sesion",
	failureFlash: true,
	badrequestMessage: "Ambos campos son obligatorios",
});

// revisa si el usuario esta autenticado o no
exports.usuarioAutenticado = (req, res, next) => {
	// si el usuario esta autenticado, adelante
	if (req.isAuthenticated()) {
		return next();
	}
	// si no esta autenticado, redirigir al formulario
	return res.redirect("/iniciar-sesion");
};

// Cerrar sesion
exports.cerrarSesion = (req, res, next) => {
	req.logout(req.user, (err) => {
		if (err) return next(err);
		req.flash("correcto", "Cerraste sesion correctamente");
		return res.redirect("/iniciar-sesion");
	});
};
