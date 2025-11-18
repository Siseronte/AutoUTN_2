# Proyecto PFI

## Requisitos previos

- [Node.js](https://nodejs.org/) versión 18 o superior
- [XAMPP](https://www.apachefriends.org/)

## Pasos para usar el proyecto

1. Descomprimir el zip en la carpeta `htdocs` de la carpeta raíz del panel de control del XAMPP

2. Ejecutar esto en la carpeta `backend` del proyecto:
   ```bash
   npm install
   ```

3. Ejecutar esto en esa misma carpeta:
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   ```

4. Ejecutar de vuelta:
   ```bash
   npm install
   ```

5. Tener un archivo `.env` en la carpeta Backend que cumpla las condiciones necesarias que se especifican en el archivo ejemplo (ubicado en esa misma carpeta)

6. Estar ejecutando Apache y MySQL desde el panel de control del XAMPP

7. Ejecutar desde la carpeta `backend` del proyecto:
   ```bash
   node server.js
   ```
