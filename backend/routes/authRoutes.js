import express from 'express';

const router = express.Router();

router.post('/register', (req, res) => {
  const { nombre, email, password } = req.body;
  res.json({
    mensaje: `Usuario ${nombre} registrado correctamente.`,
    datos: { email }
  });
});

export default router;
