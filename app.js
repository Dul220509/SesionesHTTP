//se importan las libtrerias
import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import moment from "moment-timezone";
import { v4 as uuidv4 } from "uuid";
import { request, response } from "express";
import os from "os";

const app= express();
const PORT=3000;
const sesion={};

//midleware para manejar datos json
app.use(express.json());

//Midleware para manejar datos codificados en URL
app.use(express.urlencoded({extended:true}));


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
app.post("/login", (request,response)=>{
    const {email,nickname,macAdress} = request.body;
    if(!email||!nickname ||!macAdress){
        return response.status(400).json({message:"Missing required fields"});
    }

    const sessionId = uuidv4();
    const now = new Date();

    sesion[sessionId]={
        sessionId,
        email,
        nickname,
        macAdress,
        ip: getServerNetworkInfo,
        dateCreated: now,
        lastAccessed:now,
    }
    response.status(200).json({
        message:"Se ha logueado de manera exitosa",
        sessionId,
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
                return response.status(500).send('Error al cerrar laa sesion');
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
        sesion[sessionId].lastAccess = new Date()
        response.status(200).json({
            message:"La sesion ha sido actualizada",
            session: sesion[sessionId]
        })
    })
    //status
    app.get("/status", (request,response)=>{
        const sessionId = request.query.sessionId;
        if(!sessionId || !sesion[sessionId]){
            response.status(404).json({message:"No hay sesion actuva"
            });
        }
        response.status(200).json({
            message:"Sesion activa",
            session:sesion[sessionId]
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
