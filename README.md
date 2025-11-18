# Proyecto PFI

## Requisitos previos

- [Node.js](https://nodejs.org/) versión 18 o superior
- [XAMPP](https://www.apachefriends.org/)

## Pasos para usar el proyecto

1. Descomprimir el zip en la carpeta `htdocs` de la carpeta raíz del panel de control del XAMPP

2. Ejecutar esto con el cmd en la carpeta `backend` del proyecto:
   ```bash
   rmdir /s /q node_modules
   del package-lock.json
   ```

3. Ejecutar esto en esa misma carpeta:
   ```bash
   npm install
   ```

4. Tener un archivo `.env` que cumpla las condiciones necesarias que se especifican en el archivo ejemplo

5. Estar ejecutando Apache y MySQL desde el panel de control del XAMPP

6. Ejecutar `node server.js` con el cmd desde la carpeta `backend` del proyecto