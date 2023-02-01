const Comentarios = require("../models/Comentarios");
const Meetis = require("../models/Meetis");

exports.agregarComentario = async (req, res, next) => {
    // obtener el comentario
    const { comentario } = req.body;

    // almacenar en la BD
    await Comentarios.create({
        mensaje: comentario,
        usuarioId: req.user.id,
        meetiId: req.params.id,
    });

    res.redirect("back");
    next();
}

exports.eliminarComentario = async (req, res, next) => {
    // tomar el ID del comentario
    const { comentarioId } = req.body;

    // consultar el comentario
    const comentario = await Comentarios.findByPk(comentarioId);

    // verificar si no existe el comentario
    if (!comentario) {
        return res.status(404).send("Acción no válida");
    }

    // consultar el meeti del comentario
    const meeti = await Meetis.findByPk(comentario.meetiId);

    // verificar que quien lo borra es el creador
    if (comentario.usuarioId === req.user.id || meeti.usuarioId === req.user.id) {
        // eliminar el comentario
        await comentario.destroy();
        return res.status(200).send("Comentario eliminado correctamente");
    } else {
        return res.status(403).send("Acción no válida");
    }
}