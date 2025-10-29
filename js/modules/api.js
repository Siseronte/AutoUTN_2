export async function obtenerUsuarios() {
  const resp = await fetch("../mock/usuarios.json");
  const data = await resp.json();
  return data;
}
