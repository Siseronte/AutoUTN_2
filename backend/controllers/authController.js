const usuarios = [];

export const registrarUsuario = (req, res) => {
  const { nombre, email, password } = req.body;

  if (!nombre || !email || !password) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const usuarioExistente = usuarios.find(u => u.email === email);
  if (usuarioExistente) {
    return res.status(400).json({ error: "El usuario ya está registrado" });
  }

  const nuevoUsuario = { id: usuarios.length + 1, nombre, email, password };
  usuarios.push(nuevoUsuario);

  res.status(201).json({ mensaje: "Usuario registrado con éxito", usuario: nuevoUsuario });
};

export const iniciarSesion = (req, res) => {
  const { email, password } = req.body;

  const usuario = usuarios.find(u => u.email === email && u.password === password);
  if (!usuario) {
    return res.status(401).json({ error: "Credenciales incorrectas" });
  }

  res.json({ mensaje: "Inicio de sesión exitoso", usuario });
};
