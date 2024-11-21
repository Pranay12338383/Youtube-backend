import express from 'express'
import cookieParser from 'cookie-parser'
import cors from 'cors'


const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
    // and many more , you can see that from documentation
}))

app.use(express.json({limit: "17kb"}));
app.use(express.urlencoded({extended: true, limit: "17kb"}));
app.use(express.static("public"));
app.use(cookieParser());


// import routes
import userRoutes from './routes/user.routes.js'

// routes declaration
app.use("/api/v1/users" , userRoutes);

export { app }

