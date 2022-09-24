import express from 'express'
import nodemailer from 'nodemailer'
import {google} from 'googleapis'
import dotenv from 'dotenv'
import { doesNotMatch } from 'assert'


const { Router } = express


//--------------------------------------------

const app = express()

// permisos de administrador

const esAdmin = true

function crearErrorNoEsAdmin(ruta, metodo) {
    const error = {
        error: -1,
    }
    if (ruta && metodo) {
        error.descripcion = `ruta '${ruta}' metodo '${metodo}' no autorizado`
    } else {
        error.descripcion = 'no autorizado'
    }
    return error
}

function soloAdmins(req, res, next) {
    if (!esAdmin) {
        res.json(crearErrorNoEsAdmin())
    } else {
        next()
    }
}

//--------------------------------------------
// Token mail

const OAuth2 = google.auth.OAuth2;
dotenv.config()

const createTransporter = async () => {
    const oauth2Client = new OAuth2(
      process.env.CLIENT_ID,
      process.env.CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
  
    oauth2Client.setCredentials({
      refresh_token: process.env.REFRESH_TOKEN
    });
  
    const accessToken = await new Promise((resolve, reject) => {
      oauth2Client.getAccessToken((err, token) => {
        if (err) {
          reject("Failed to create access token :(");
        }
        resolve(token);
      });
    });
  
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        type: "OAuth2",
        user: process.env.EMAIL,
        accessToken,
        clientId: process.env.CLIENT_ID,
        clientSecret: process.env.CLIENT_SECRET,
        refreshToken: process.env.REFRESH_TOKEN
      }
    });
  
    return transporter;
  };


//--------------------------------------------
// Mail Function 

const sendEmail = async (emailOptions) => {
    let emailTransporter = await createTransporter();
    await emailTransporter.sendMail(emailOptions);
  };


//--------------------------------------------
// configuro router de productos

const mail = new Router()

mail.get('/', async (req, res) => {
    res.send('Nada que mostrar :(')
})

mail.post('/', async (req, res) => {
    try{
        sendEmail({
            subject: `${req.body.servicio}`,
            html: ` <b> Nombre:</b> ${req.body.nombre} <br> 
            <b>Mail:</b> ${req.body.email}</b><br>
            <b>Telefono:</b> ${req.body.telefono}</b><br> 
            <b>Informacion adicional: </b>${req.body.notas}  `,
            to: "bswalter8@gmail.com",
            from: process.env.EMAIL
        });  
        res.send('Mail enviado')
    } catch(error){
        res.send(error);
    }
})


//--------------------------------------------
// configuro el servidor

app.use(express.json())
app.use(express.urlencoded({ extended: true }))


app.use('/api/mail-const', mail)


export default app