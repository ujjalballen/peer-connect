const createWebRtcTransportBothkinds = async (router) => {
    const transport = await router.createWebRtcTransport({
        enableUdp: true,
        enableTcp: true, // used used UDP, unless we can't;
        preferUdp: true,
        listenInfos: [
            {
                protocol: "udp",
                ip: "127.0.0.1", // we can used 127.0.0.1 AND 192.168.0.111 for local test; 0.0.0.0 for global
                // announcedAddress: "203.0.113.45" // your server’s public IP or domain

            },
            {
                protocol: "tcp",
                ip: "127.0.0.1", // we can used 127.0.0.1 AND 192.168.0.111 for local test
                // announcedAddress: "203.0.113.45" // your server’s public IP or domain

            }
        ]
    })


    const params = {
        id: transport?.id,
        iceParameters: transport?.iceParameters,
        iceCandidates: transport?.iceCandidates,
        dtlsParameters: transport?.dtlsParameters,
    }


    return {transport, params};


};


export default createWebRtcTransportBothkinds;