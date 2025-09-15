const mediasoupConfig = {
    workerSettings: {
        rtcMinPort: 10000,
        rtcMaxPort: 59999,
        logLevel: "warn",
        logTags: [
            'info',
            'ice',
            'dtls',
            'rtp',
            'strp',
            'rtcp'
        ]
    },

    routerMediaCodecs: [
        {
            kind: "audio",
            mimeType: "audio/opus",
            clockRate: 48000,
            channels: 2
        },
        {
            kind: "video",
            mimeType: "video/H264",
            clockRate: 90000,
            parameters:
            {
                "packetization-mode": 1,
                "profile-level-id": "42e01f",
                "level-asymmetry-allowed": 1
            }
        },
        {
            kind: "video",
            mimeType: "video/VP8",
            clockRate: 90000,
            parameters: {}
        }
    ]

}

export default mediasoupConfig;