import { validarTexto } from "../js/modules/validaciones.js";


const input = document.getElementById("nombreInput");
const btnRegistrar = document.getElementById("btnRegistrar");
const btnBorrarTodo = document.getElementById("btnBorrarTodo");
const resultado = document.getElementById("resultado");
const listaUsuarios = document.getElementById("listaUsuarios");

let usuarios = JSON.parse(localStorage.getItem("usuarios")) || [];


mostrarUsuarios();

btnRegistrar.addEventListener("click", () => {
  const nombre = input.value.trim();

  if (!validarTexto(nombre)) {
    resultado.textContent = "Por favor, ingresa un nombre válido.";
    resultado.style.color = "red";
    return;
  }


  const usuario = {
    nombre: nombre,
    fecha: new Date().toLocaleString(),
  };

  usuarios.push(usuario);
  guardarUsuarios();

  resultado.textContent = `Usuario "${nombre}" registrado correctamente`;
  resultado.style.color = "green";
  input.value = "";

  mostrarUsuarios();
});

btnBorrarTodo.addEventListener("click", () => {
  if (confirm("¿Estás seguro de borrar todos los usuarios?")) {
    usuarios = [];
    guardarUsuarios();
    mostrarUsuarios();
    resultado.textContent = "Todos los registros fueron eliminados";
    resultado.style.color = "#555";
  }
});

function guardarUsuarios() {
  localStorage.setItem("usuarios", JSON.stringify(usuarios));
}

function mostrarUsuarios() {
  listaUsuarios.innerHTML = "";

  usuarios.forEach((usuario, index) => {
    const li = document.createElement("li");

    const texto = document.createElement("span");
    texto.textContent = `${usuario.nombre} (Registrado: ${usuario.fecha})`;

    const btnEliminar = document.createElement("button");
    btnEliminar.textContent = "Eliminar";
    btnEliminar.classList.add("eliminar");
    btnEliminar.addEventListener("click", () => eliminarUsuario(index));

    li.appendChild(texto);
    li.appendChild(btnEliminar);
    listaUsuarios.appendChild(li);
  });
}

function eliminarUsuario(indice) {
  const nombre = usuarios[indice].nombre;
  if (confirm(`¿Eliminar a "${nombre}"?`)) {
    usuarios.splice(indice, 1);
    guardarUsuarios();
    mostrarUsuarios();
    resultado.textContent = `Usuario "${nombre}" eliminado.`;
    resultado.style.color = "#e74c3c";
  }
}