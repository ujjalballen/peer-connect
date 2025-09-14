import { io } from "socket.io-client";
import * as mediasoupClient from "mediasoup-client";

let socket = null;

export const initConnect = () => {
  socket = io('http://localhost:5000');

  console.log(socket)

  connectButton.innerHTML = 'Connecting....'
  connectButton.disabled = true;

  addSocketListener()
};



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

