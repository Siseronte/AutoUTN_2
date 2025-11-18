// routes/reservationsRoutes.js
import express from 'express';
const router = express.Router();

// Datos simulados de ejemplo
let reservas = [
  { id: 1, usuario: 'juanperez@example.com', lugar: 'A1', fecha: '2025-11-01' },
  { id: 2, usuario: 'juanperez@example.com', lugar: 'B3', fecha: '2025-11-03' }
];

let espaciosDisponibles = [
  { id: 'A1', disponible: false },
  { id: 'A2', disponible: true },
  { id: 'B3', disponible: false },
  { id: 'C1', disponible: true }
];

// 🔹 GET /api/parking-spots (espacios disponibles)
router.get('/parking-spots', (req, res) => {
  res.json(espaciosDisponibles);
});

// 🔹 POST /api/reservations (crear nueva reserva)
router.post('/reservations', (req, res) => {
  const { lugar, fecha } = req.body;
  const email = req.user.email;

  if (!lugar || !fecha) {
    return res.status(400).json({ error: 'Lugar y fecha son obligatorios' });
  }

  const nuevaReserva = {
    id: reservas.length + 1,
    usuario: email,
    lugar,
    fecha
  };

  reservas.push(nuevaReserva);
  res.status(201).json({ mensaje: 'Reserva creada con éxito', reserva: nuevaReserva });
});

// 🔹 GET /api/reservations (ver reservas del usuario)
router.get('/reservations', (req, res) => {
  const email = req.user.email;
  const reservasUsuario = reservas.filter(r => r.usuario === email);
  res.json(reservasUsuario);
});

// 🔹 DELETE /api/reservations/:id (cancelar reserva)
router.delete('/reservations/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const email = req.user.email;

  const reserva = reservas.find(r => r.id === id && r.usuario === email);
  if (!reserva) return res.status(404).json({ error: 'Reserva no encontrada o no pertenece al usuario' });

  reservas = reservas.filter(r => r.id !== id);
  res.json({ mensaje: `Reserva ${id} cancelada correctamente.` });
});

export default router;
