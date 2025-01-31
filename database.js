import mongoose from "mongoose";
import app from './app.js';  // Importar el archivo app.js donde están las rutas

//aqui va la conexion de la base de datos a mongoDB
import mongoose,{mongo} from "mongoose";
mongoose.connect('mongodb+srv://Dulce:dul230493@cluster0.ql2zu.mongodb.net/API-AWI140-230493?retryWrites=true&w=majority&appName=Cluster0')
.then((db)=>console.log('mongodb atlas conected'))
.catch((error)=>console.error(error));
export default mongoose;
