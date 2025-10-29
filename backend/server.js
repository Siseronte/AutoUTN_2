import express from 'express';
import jwt from 'jsonwebtoken';
import { verifyToken } from './authMiddleware.js';


const app = express();
const port = 3000;

const SECRET_KEY = 'mi_clave_secreta_123';

app.use(express.json());

app.post('/api/register', (req, res) => {
  const { nombre, email, password } = req.body;
  res.json({
    mensaje: `Usuario ${nombre} registrado correctamente.`,
    datos: { email }
  });
});

app.post('/api/login', (req, res) => {
  const { email, password } = req.body;

  if (email === 'juanperez@example.com' && password === '12345') {
    const token = jwt.sign({ email }, SECRET_KEY, { expiresIn: '1h' });

    res.json({
      mensaje: 'Inicio de sesión exitoso',
      token
    });
  } else {
    res.status(401).json({ mensaje: 'Credenciales inválidas' });
  }
});

app.listen(port, () => {
  console.log(`Servidor escuchando en http://localhost:${port}`);
});

app.get('/api/reservations', verifyToken, (req, res) => {
  res.json({
    mensaje: `Bienvenido ${req.user.email}, puedes ver tus reservas.`,
    reservas: [
      { id: 1, lugar: 'Estacionamiento 1', fecha: '2025-10-28' },
      { id: 2, lugar: 'Estacionamiento 2', fecha: '2025-10-30' },
    ],
  });
});
