//se importan las libtrerias
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import { request, response } from "express";
import os from "os";

//se cream los...
const app= express();
const PORT=3000;
const sesion={};// Almacenará las sesiones activas
const sessionId = uuidv4();// Genera un ID único para la sesión
const now = new Date();// Obtiene la fecha y hora actual
const xicoTime = new Date(now.getTime() - 6 * 60 * 60 * 1000); // Restamos 6 horas


//MIDLEWARES
app.use(express.json());//midleware para manejar datos json
app.use(express.urlencoded({extended:true}));//Midleware para manejar datos codificados en URL

//ENDPOINT
//crear endpoint para dar la bienbenida
app.get('/',(request,response)=>{
    return response.status(200).json({message: "Bienvenido al API de sesion de Controles de Sesiones",
author: "Dulce Yadira Salvador Antonio"})
})

//configurar la sesion
app.use(
    session({
        secret:'P4-DYSA#Bee-SesionesHTTP',
        resave:false,
        saveUninitialized:true,
        cookie:{ maxAge: 24*60*1000}
    })
 );

//funcion de utilidad que nos permite accerder a la informacion 
const getClientIp = (response) =>{
    return(
        request.header["x-forwarded-for"] ||
        request.connection.remoteAddress ||
        request.socket.remoteAddress ||
        request.connection.socket?.remoteAddress
    )
}

//login endpoint
// Endpoint para manejar el login
app.post("/login", (request, response) => {
    const { email, nickname, macAdress } = request.body;// Extrae las variables necesarias del cuerpo de la solicitud
    if (!email || !nickname || !macAdress) {// Verifica que los campos requeridos estén presentes
        return response.status(400).json({ message: "Missing required fields" });
    }
    // Formatea la fecha actual para mayor legibilidad
    const formattedDate = new Intl.DateTimeFormat("es-ES", {
        dateStyle: "full",
        timeStyle: "medium",
        timeZone: "UTC", // Puedes cambiar la zona horaria si es necesario
    }).format(xicoTime);

    // Guarda la información de la sesión en el objeto "sesion"
    sesion[sessionId] = {
        sessionId, // ID único de la sesión
        email, // Correo electrónico del usuario
        nickname, // Apodo del usuario
        macAdress, // Dirección MAC del usuario
        ip: getServerNetworkInfo, // IP del cliente que realiza la solicitud
        dateCreated: formattedDate, // Fecha de creación formateada
        lastAccessed: formattedDate, // Fecha del último acceso formateada
    };

    // Responde con un mensaje de éxito y el ID de la sesión
    response.status(200).json({
        message: "Se ha logueado de manera exitosa",
        sessionId,
    });

    //status
    app.get("/status", (request,response)=>{
        const sessionId = request.query.sessionId;
        if(!sessionId || !sesion[sessionId]){
            response.status(404).json({message:"No hay sesion activa"
            });
        }
        response.status(200).json({
            message:"Sesion activa",
            session:sesion[sessionId]
        })
    })

    //logout endpoint
    app.post ("/logout",(request,response)=>{
        const {sessionId}=request.body;
        if(!sessionId || !sesion[sessionId]){
            return response.status(404).json({
                message:"No se ha encontrado una sesion activa"
            });
        }
        delete sesion[sessionId];
        request.session.destroy((err)=>{
            if(err){
                return response.status(500).send('Error al cerrar la sesion');
            }
        })
        response.status(200).json({message:"Logout successeful"})
    })

    //actualizar la sesion

    app.put("/update",(request,response)=>{
        const {sessionId,email,nickname}= request.body;
        if(!sessionId || !sesion[sessionId]){
            return response.status(404).json({message:"no existe una sesion activa"});
        }
        if (email)sesion[sessionId].email=email
        if (nickname)sesion[sessionId].nickname=nickname;
        sesion[sessionId].lastAccess = formattedDate;
        response.status(200).json({
            message:"La sesion ha sido actualizada",
            session: sesion[sessionId]
        })
    })
    
})

//funcion de utilidad que nospermite acceder a la informacion de la interfaz de l red (la ip)

const getServerNetworkInfo =()=>{
    const interfaces = os.networkInterfaces();
    for(const name in interfaces){
        for (const iface of interfaces[name]){
            if(iface.family === 'IPv4' && !iface.internal){
                return{serverIp: iface.address,serverMac:iface.mac};
            }
        }
    }
}

app.listen(3000,()=>{
    console.log(`Servidor corriendo en el http://localhost:${PORT}`);
})
