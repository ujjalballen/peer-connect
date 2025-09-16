import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

let socket = null;
let device = null;
let localStream = null;
let producerTransport = null;
let producer = null;


export const initConnect = () => {
  socket = io('http://localhost:5000');

  console.log(socket)

  connectButton.innerHTML = 'Connecting....'
  connectButton.disabled = true;

  addSocketListener()
};


const deviceSetup = async () => {
  try {

    device = await mediasoupClient.Device.factory()

    // console.log('device: ', device)

    const routerRtpCapabilities = await socket.emitWithAck('rtpCap');
    // console.log(routerRtpCapabilities)

    await device.load({ routerRtpCapabilities })


    deviceButton.disabled = true;
    createProdButton.disabled = false;

  } catch (error) {
    if (error.name === 'UnsupportedError') {
      console.warn('browser not supported');
    } else {
      console.error("Error creating Device:", err);
    }
  }
};


const createProducer = async () => {
  try {

    localStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });

    console.log(localStream)

    localVideo.srcObject = localStream

  } catch (error) {
    console.log(error)
  }

  const data = await socket.emitWithAck('create-producer-transport')
  console.log(data)

  const { id, iceParameters, iceCandidates, dtlsParameters } = data;

  const transport = device.createSendTransport({
    id,
    iceParameters,
    iceCandidates,
    dtlsParameters
  });

  producerTransport = transport;


  // the transport connect event will not run until,
  // call transport.produce();
  producerTransport.on('connect', async ({ dtlsParameters }, callback, errback) => {
    // console.log('coonect producer transport fired: ', dtlsParameters);

    try {
      const resp = await socket.emitWithAck('connect-producer', { dtlsParameters });

      console.log(resp)

      if (resp === 'success') {
        callback()
      } else if (resp === 'error') {
        errback();
      }

    } catch (error) {
      console.error("Transport connect error (client):", error);
      errback()
    }
  });


  // after completed the producer transport connect event, then this even will fired
  producerTransport.on('produce', async (parameters, callback, errback) => {
    console.log("Transport produce event has fired!");

    try {
      const { kind, rtpParameters } = parameters;

      const resp = await socket.emitWithAck('start-producing', { kind, rtpParameters })
      console.log(resp)

      if (resp === 'error') {
        errback();
      } else {
        callback({ id: resp })
      }


      publishButton.disabled = true;
      createConsButton.disabled = false;

    } catch (error) {
      errback()
    }

  })


  createProdButton.disabled = true;
  publishButton.disabled = false


};


const publish = async () => {
  console.log('hello there')

  const videoTrack = localStream.getVideoTracks()[0];
  console.log(videoTrack)

  producer = await producerTransport.produce({
    track: videoTrack,
    encodings:
      [
        { maxBitrate: 100000 },
        { maxBitrate: 300000 },
        { maxBitrate: 900000 }
      ],
    codecOptions:
    {
      videoGoogleStartBitrate: 1000
    }

  })
};



// consumer stuff;

const createConsumer = () => {
  console.log('consumer start from here')
}





const addSocketListener = () => {
  socket.on("connect", () => {
    console.log('socket.io is connected')

    connectButton.innerHTML = 'Connected';
    deviceButton.disabled = false
  });
}





// UI buttons
const connectButton = document.getElementById('connect')
const deviceButton = document.getElementById('device')
const createProdButton = document.getElementById('create-producer')
const publishButton = document.getElementById('publish')
const createConsButton = document.getElementById('create-consumer')
const consumeButton = document.getElementById('subscribe')
const disconnectButton = document.getElementById('disconnect')

// other elements
const localVideo = document.getElementById('local-video')
const remoteVideo = document.getElementById('remote-video')

// button listeners
connectButton.addEventListener('click', initConnect)
deviceButton.addEventListener('click', deviceSetup)
createProdButton.addEventListener('click', createProducer)
publishButton.addEventListener('click', publish)
createConsButton.addEventListener('click', createConsumer)
consumeButton.addEventListener('click', consume)
disconnectButton.addEventListener('click', disconnect)

