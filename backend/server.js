import express from 'express'
import cors from 'cors';
import { createServer } from "http";
import { Server } from "socket.io";


const app = express();
const port = process.env.PROT || 5000; // 3000

app.use(express.json());
app.use(cors({
    origin: ['http://localhost:5173'],
    methods: ['GET', 'POST', 'PUT'],
    // credentials: true, // Allow cookies/auth

}));



const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: "http://localhost:5173", // or array of origins
        methods: ["GET", "POST"],        // Allowed HTTP methods
        // allowedHeaders: ["my-custom-header"], // Optional request headers
        // credentials: true                // Allow cookies/auth
    }
});


io.on('connection', (Socket) => {
    console.log('socket id: ',Socket.id)
});



httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});





