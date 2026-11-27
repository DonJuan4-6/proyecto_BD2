require("dotenv").config();

const mysql = require("mysql2");

 // Configuracion de la conexion a la Base de Datos
    const host = process.env.DB_HOST || "localhost";
    const port = Number(process.env.DB_PORT) || 3306;
    const user =  process.env.DB_USER || "root";
    const password =  process.env.DB_PASSWORD || "";
    const database =  process.env.DB_NAME || "tienda";

    // Opciones de configuracion
    const configuracion = {
        host,
        port,
        user,
        password,
        database
    }

// Si el host es remoto (TiBD Cloud), habilitar el SSL automaticamente
if (host !== "localhost" && host !== "127.0.0.1"){
    configuracion.ssl = {
        minVersion: "TLSv1.2",
        rejectUnauthorized: true,
    };
}


// Crear un pool de conexiones (recomendado para producción:
// reconecta solo si TiDB Cloud cierra conexiones inactivas)
const conexion = mysql.createPool({
    ...configuracion,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 10000,
});


// Comprobamos si la conexion fue exitosa
conexion.query("SELECT 1", (error) => {
    if (error){
        console.error(
            `Error al conectar con la base de datos (${host}:${port}):`,
            error.code,
            error.message
        );
        return;
    }
    console.log(`Conexión exitosa con la base de datos (${host}:${port})`);
});

// Exportar la conexion para reuitilizarla en las rutas del servidor
module.exports = conexion;