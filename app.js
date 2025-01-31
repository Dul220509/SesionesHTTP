//se importan las libtrerias
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import { request, response } from "express";
import os from "os";

//inicializo la aplicacción
const app= express();
const PORT=3000;
const sesiones = {};//guarda todas las sesiones

//const sesion={};// Almacenará las sesiones activas
const sessionId = uuidv4();// Genera un ID único para la sesión
const now = new Date();// Obtiene la fecha y hora actual
const xicoTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Restamos 6 horas

//MIDLEWARES
app.use(express.json());//midleware para manejar datos json
app.use(express.urlencoded({extended:true}));//Midleware para manejar datos codificados en URL

//configurar la sesion
app.use(
    session({
        secret:'P4-DYSA#Bee-SesionesHTTP',
        resave:false,
        saveUninitialized:true,
        cookie:{ maxAge: 15 * 60 * 1000 }//tiempo de la expiracion de la sesion 15 minutos
    })
 );
//crear endpoint para dar la bienbenida
app.get('/',(request,response)=>{
    return response.status(200).json({
        message: "Bienvenido al API de Controles de Sesiones",
        author: "Dulce Yadira Salvador Antonio"})
});

//funcion de utilidad que nos permite accerder a la informacion 
const getClientIp = (request) =>{
    return(
        request.header["x-forwarded-for"] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket?.remoteAddress
    );
};

 // Función para obtener la IP del servidor
 const getServerIP = () => {
     const networkInterfaces = os.networkInterfaces();
     for (const iface of Object.values(networkInterfaces).flat()) {
         if (iface.family === "IPv4" && !iface.internal) {
             return iface.address;
         }
     }
     return "IP no disponible";
 };
 // Función para obtener la dirección MAC del servidor
const getServerMacAddress = () => {
    const networkInterfaces = os.networkInterfaces();
    for (const interfaceName in networkInterfaces) {
        const iface = networkInterfaces[interfaceName];
        for (const details of iface) {
            if (details.mac && details.mac !== "00:00:00:00:00:00") {
                return details.mac; // Devuelve la primera MAC válida
            }
        }
    }
    return "MAC no disponible";
};
// Función para eliminar sesiones inactivas
const limpiarSesionesInactivas = () => {
    const ahora = Date.now();
    for (const sessionId in sesiones) {
        const { lastAccessed } = sesiones[sessionId];
        if (ahora - lastAccessed > 15 * 60 * 1000) { // Si han pasado 15 min sin actividad
            delete sesiones[sessionId];
        }
    }
};
setInterval(limpiarSesionesInactivas, 60 * 1000); // Revisa cada minuto

//Endpoint para iniciar sesion
app.post("/login", (request, response) => {
    const { name,email, nickname, macAdress } = request.body;// Extrae las variables necesarias del cuerpo de la solicitud
    if (!name|| !email || !nickname || !macAdress) {// Verifica que los campos requeridos estén presentes
        return response.status(400).json({ message: "Missing required fields" });
    }

    // Formatea la fecha actual para mayor legibilidad
    const formattedDate = new Intl.DateTimeFormat("es-ES", {
        dateStyle: "full",
        timeStyle: "medium",
        timeZone: "UTC", // Puedes cambiar la zona horaria si es necesario
    }).format(xicoTime);

    const sessionId = uuidv4(); // Generar un nuevo ID de sesión
    // Guarda la información de la sesión en el objeto "sesion"
    sesiones[sessionId] = {
        sessionId, // ID único de la sesión
        name,
        email, // Correo electrónico del usuario
        nickname, // Apodo del usuario
        macAdress, // Dirección MAC del usuario
        ipClient: request.ip, // IP del cliente
        ipServer: getServerIP(), // IP del servidor
        macServer: getServerMacAddress(), // MAC del servidor // IP del cliente que realiza la solicitud
        dateCreated: formattedDate, // Guardamos el timestamp
        lastAccessed: formattedDate, // Fecha del último acceso formateada
    };

    // Responde con un mensaje de éxito y el ID de la sesión
    response.status(200).json({
        message: "Se ha logueado de manera exitosa",
        sessionId,
    });

    //status
    app.get("/status", (request, response) => {
        const  sessionId  = request.query.sessionId;
        if (!sessionId || !sesiones[sessionId]) {
            return response.status(404).json({ message: "No hay sesión activa" });
        }
    
        const sesion = sesiones[sessionId];
        const ahora = Date.now();
        const tiempoActivo = moment.duration(ahora - sesion.dateCreated).humanize();
        const tiempoInactividad = moment.duration(ahora - sesion.lastAccessed).humanize();
    
        response.status(200).json({
            message: "Sesión activa",
            session: {
                ...sesion,
                tiempoActivo,
                tiempoInactividad,
            }
        });
    });

    //logout endpoint
    app.post("/logout",(request,response)=>{
        const {sessionId}=request.body;
        if(!sessionId || !sesiones[sessionId]){
            return response.status(404).json({message:"No se ha encontrado una sesion activa"});
        }

        delete sesiones[sessionId];

        request.session.destroy((err)=>{
            if(err){
                return response.status(500).send('Error al cerrar la sesion');
            }
        })
        response.status(200).json({message:"Logout successeful"})
    })

    //endpoint actualizar la sesion
    app.put("/update",(request,response)=>{
        const {sessionId,email,nickname}= request.body;
        if (!sessionId || !sesiones[sessionId]){
            return response.status(404).json({message:"no existe una sesion activa"});
        }

        if (email)sesiones[sessionId].email=email
        if (nickname)sesiones[sessionId].nickname=nickname;
        sesiones[sessionId];

        response.status(200).json({
            message:"La sesion ha sido actualizada",
            session: sesiones[sessionId]
        });
    });
});

// Endpoint para obtener la lista de todas las sesiones activas
app.get("/sessions", (request, response) => {
    // Verifica si hay sesiones activas
    if (Object.keys(sesiones).length === 0) {
        return response.status(404).json({ message: "No hay sesiones activas" });
    }
    const ahora = Date.now();
    const sesionesFormateadas = Object.values(sesiones).map(sesion => ({
        ...sesiones,
        tiempoActivo: moment.duration(ahora - sesion.dateCreated).humanize(),
        tiempoInactividad: moment.duration(ahora - sesion.lastAccessed).humanize()
    }));
    
    response.status(200).json({
        message: "Lista de sesiones activas",
        sessions: sesionesFormateadas
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});