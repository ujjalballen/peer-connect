import express from 'express'
import cors from 'cors';
import { createServer } from "http";
import { Server } from "socket.io";
import createWorker from './createWorker.js';
import mediasoupConfig from './config/mediasoupConfig.js';
import createWebRtcTransportBothkinds from './createWebRtcTransportBothkinds.js';


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


let workers = null;
let router = null;

const initMediaSoup = async () => {
    workers = await createWorker();
    // console.log('workers: ', workers)

    router = await workers[0].createRouter({ mediaCodecs: mediasoupConfig.routerMediaCodecs })

}

initMediaSoup();



io.on('connection', (socket) => {
    console.log('socket id: ', socket.id)

    let thisClientProducerTransport = null;


    socket.on('rtpCap', (ack) => {
        ack(router.rtpCapabilities);
    });


    socket.on('create-producer-transport', async (ack) => {

        const { transport, params } = await createWebRtcTransportBothkinds(router);

        // console.log('params: ', params)
        thisClientProducerTransport = transport;

        ack(params) // what we send back to the client
    })
});



httpServer.listen(port, () => {
    console.log(`Server running on port ${port}`);
});





