import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import createWorker from "./createWorker.js";
import mediasoupConfig from "./config/mediasoupConfig.js";
import createWebRtcTransportBothkinds from "./createWebRtcTransportBothkinds.js";

const app = express();
const port = process.env.PROT || 5000; // 3000

app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:5173"],
    methods: ["GET", "POST", "PUT"],
    // credentials: true, // Allow cookies/auth
  })
);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // or array of origins
    methods: ["GET", "POST"], // Allowed HTTP methods
    // allowedHeaders: ["my-custom-header"], // Optional request headers
    // credentials: true                // Allow cookies/auth
  },
});

let workers = null;
let router = null;

// theProducer will be a global, and whoever produced last; not good at real world
let theProducer = null;

const initMediaSoup = async () => {
  workers = await createWorker();
  // console.log('workers: ', workers)

  router = await workers[0].createRouter({
    mediaCodecs: mediasoupConfig.routerMediaCodecs,
  });
};

initMediaSoup();

io.on("connection", (socket) => {
  console.log("socket id: ", socket.id);

  let thisClientProducerTransport = null;
  let thisClientProducer = null;

  let thisClientConsumerTransport = null;
  let thisClientConsumer = null;

  socket.on("rtpCap", (ack) => {
    ack(router.rtpCapabilities);
  });

  socket.on("create-producer-transport", async (ack) => {
    const { transport, params } = await createWebRtcTransportBothkinds(router);

    // console.log('params: ', params)
    thisClientProducerTransport = transport;

    ack(params); // what we send back to the client
  });

  socket.on("connect-producer", async (dtlsParameters, ack) => {
    // console.log('dtlsParameters: ', dtlsParameters)

    if (!thisClientProducerTransport) {
      ack("error");
      return;
    }

    try {
      await thisClientProducerTransport.connect(dtlsParameters);
      ack("success");
    } catch (error) {
      console.log(error);
      ack("error");
    }
  });

  socket.on("start-producing", async ({ kind, rtpParameters }, ack) => {
    if (!thisClientProducerTransport) {
      return ack("error");
    }

    try {
      thisClientProducer = await thisClientProducerTransport.produce({
        kind,
        rtpParameters,
      });

      theProducer = thisClientProducer;

      thisClientProducer.on("transportclose", () => {
        console.log("Producer closed because its transport closed");
      });

      ack(thisClientProducer.id);
    } catch (error) {
      ack("error");
    }
  });

  // consumer stuff......

  socket.on("create-consumer-transport", async (ack) => {
    const { transport, params } = await createWebRtcTransportBothkinds(router);

    thisClientConsumerTransport = transport;

    ack(params);
  });

  socket.on("connect-consumer-transport", async (dtlsParameters, ack) => {
    try {
      await thisClientConsumerTransport.connect(dtlsParameters);
      ack("success");
    } catch (error) {
      ack("error");
    }
  });

  socket.on("consume-media", async ({ rtpCapabilities }, ack) => {
    // console.log(rtpCapabilities)
    // we will set up our clientConsumer, and send back
    // the params the client needs to do the same
    // make sure there is a producer:) we can't consume without that one

    //if (!thisClientProducer)

    if (!theProducer) {
      ack("noProducer");
    } else if (
      !router.canConsume({
        producerId: theProducer?.id, // thisClientProducer?.id,
        rtpCapabilities,
      })
    ) {
      ack("canNotConsume");
    } else {
      // we can consume... there is a producer and client is able proceed!

      thisClientConsumer = await thisClientConsumerTransport.consume({
        producerId: theProducer?.id, // thisClientProducer?.id,
        rtpCapabilities,
        paused: true, // see docs, this is usuall the best way to start
      });

      thisClientConsumer.on("transportclose", () => {
        console.log("consumer closed because its transport closed");
      });

      const consumerParams = {
        producerId: theProducer.id, // thisClientProducer?.id,
        id: thisClientConsumer.id,
        kind: thisClientConsumer.kind,
        rtpParameters: thisClientConsumer.rtpParameters,
      };

      ack(consumerParams);
    }
  });

  socket.on("unpauseConsumer", async (ack) => {
    await thisClientConsumer.resume();
  });

  socket.on("close-all", (ack) => {
    // client has requested to close all;

    try {
      thisClientConsumerTransport?.close();
      thisClientProducerTransport?.close();
      console.log("it is closed");
      ack("closed");
    } catch (error) {
      // this is not gonna be a client issue
      ack("closeError");
    }
  });
});

httpServer.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
