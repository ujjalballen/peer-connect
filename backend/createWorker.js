import os from 'os'
import * as mediasoup from "mediasoup";
import mediasoupConfig from './config/mediasoupConfig.js';

const totalThreads = os.cpus().length;



const createWorker = async () => {
    let workers = [];


    for (let i = 0; i < totalThreads; i++) {
        const worker = await mediasoup.createWorker({
            rtcMinPort: mediasoupConfig.workerSettings.rtcMinPort,
            rtcMaxPort: mediasoupConfig.workerSettings.rtcMaxPort,
            logLevel: mediasoupConfig.workerSettings.logLevel,
            logTags: mediasoupConfig.workerSettings.logTags
        });

        worker.on('died', () => {
            console.log('Worker has died');
            process.exit(1);
        });


        workers.push(worker);
    }


    return workers;
};

export default createWorker;