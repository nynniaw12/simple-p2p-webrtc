import { useCallback, useEffect, useRef, useState } from "react";

export type WebRTCFactory = {
    RTCPeerConnection: typeof RTCPeerConnection
    RTCSessionDescription: typeof RTCSessionDescription
}

export type MessageCallback<T> = (msg: MessageEvent<T>) => void;
export default class PeerF<T> {
    private webRTCFactory: WebRTCFactory;
    private peerCon: RTCPeerConnection;
    private conState: RTCPeerConnectionState;

    private dataChan: RTCDataChannel | null;
    private dataChanConState: "create" | "open" | "closed";

    private iceCands: RTCIceCandidate[];

    constructor(configuration: RTCConfiguration, webRTCFactory: WebRTCFactory, messageCallback?: MessageCallback<T>) {
        this.conState = "new";
        this.dataChanConState = "create";
        this.iceCands = [];
        this.dataChan = null;
        this.webRTCFactory = webRTCFactory;

        this.peerCon = new this.webRTCFactory.RTCPeerConnection(configuration);
        this.peerCon.onconnectionstatechange = () => {
            this.conState = this.peerCon.connectionState || "new";
        }
        this.peerCon.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
            if (event.candidate) {
                this.iceCands = [...this.iceCands, event.candidate!];
            }
        }

        if (messageCallback) {
            this.dataChanConState = "closed";
            this.peerCon.ondatachannel = (event) => {
                this.dataChan = event.channel;
                this.dataChan.onmessage = messageCallback;
                this.dataChan.onopen = () => {
                    this.dataChanConState = "open";
                };
                this.dataChan.onclose = () => {
                    this.dataChanConState = "closed";
                };
            };
        }
    }
    // Accessors
    get connectionState() {
        return this.conState;
    }
    get dataChannelState() {
        return this.dataChanConState;
    }
    get iceCandidates() {
        return [...this.iceCands];
    }

    createDataChannel(dataChannelDesc: string) {
        this.dataChanConState = "closed";
        this.dataChan = this.peerCon.createDataChannel(dataChannelDesc);
        this.dataChan.onopen = () => {
            this.dataChanConState = "open";
        };
        this.dataChan.onclose = () => {
            this.dataChanConState = "closed";
        };
    }

    async createOffer() {
        if (this.peerCon) {
            const offer = await this.peerCon.createOffer();
            await this.peerCon.setLocalDescription(offer);
            return JSON.stringify(offer);
        } else {
            throw new Error('Peer connection does not exist!');
        }
    }
    async setRemoteDescription(answer: string) {
        if (this.peerCon && answer != "") {
            const answerObj = JSON.parse(answer);
            await this.peerCon.setRemoteDescription(new this.webRTCFactory.RTCSessionDescription(answerObj));
        } else {
            throw new Error('Answer not provided or peer connection does not exist!');
        }
    }

    send(data: T) {
        if (this.dataChan && this.dataChanConState === "open") {
            this.dataChan.send(JSON.stringify(data));
        } else {
            throw new Error('Data channel is not open. Cannot send data.');
        }
    }

    async createAnswer(offer: string) {
        const offerObj = JSON.parse(offer);
        await this.peerCon.setRemoteDescription(new RTCSessionDescription(offerObj));

        const answer = await this.peerCon.createAnswer();
        await this.peerCon.setLocalDescription(answer);
        return JSON.stringify(answer);
    }

    async addRemoteIceCandidate(candidate: RTCIceCandidate) {
        if (this.peerCon) {
            return this.peerCon.addIceCandidate(candidate);
        } else {
            throw new Error('Peer connection does not exist!');
        }
    }

    close() {
        if (this.dataChan) {
            this.dataChan.close();
        }
        this.peerCon.close();
        this.conState = "closed";
        this.dataChanConState = "closed";
    }
}

// Wrapper around Peer
export function usePeerF<T>(
    RTC_CONF: RTCConfiguration,
    getWebRTCFactory: () => WebRTCFactory | undefined,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    const peer = useRef<PeerF<T> | null>(null);
    const { connectionState, dataChannelState, iceCandidates } = useStateIntervalPeer(peer, intervalMs);

    useEffect(() => {
        if (!peer.current) {
            const factory = getWebRTCFactory();
            if (!factory) {
                throw new Error('WebRTCFactory is unavailable. This hook must be used in a client component.');
            }
            peer.current = new PeerF(RTC_CONF, factory, msgCallback);
        }
        return () => {
            if (peer.current) {
                peer.current.close();
                peer.current = null;
            }
        };
    }, []);

    const createDataChannel = useCallback((dataChannelDesc: string) => {
        peer.current?.createDataChannel(dataChannelDesc);
    }, []);

    const createOffer = useCallback(async () => {
        if (!peer.current) {
            throw new Error('Peer not initialized');
        } else {
            return await peer.current.createOffer();
        }
    }, []);

    const setRemoteDescription = useCallback(async (answer: string) => {
        await peer.current?.setRemoteDescription(answer);
    }, []);

    const send = useCallback((data: T) => {
        peer.current?.send(data);
    }, []);

    const createAnswer = useCallback(async (offer: string) => {
        if (!peer.current) {
            throw new Error('Peer not initialized');
        } else {
            return await peer.current.createAnswer(offer);
        }
    }, []);

    const addRemoteIceCandidate = useCallback(async (candidate: RTCIceCandidate) => {
        await peer.current?.addRemoteIceCandidate(candidate);
    }, []);

    return {
        connectionState,
        dataChannelState,
        iceCandidates,
        createDataChannel,
        createOffer,
        setRemoteDescription,
        send,
        createAnswer,
        addRemoteIceCandidate,
    };
}

// Converts useRef to useState, but updates in intervals
function useStateIntervalPeer<T>(ref: React.MutableRefObject<PeerF<T> | null>, intervalMs: number) {
    const [connectionState, setConState] = useState<RTCPeerConnectionState>("new");
    const [dataChannelState, setDataChanState] = useState<"open" | "closed" | "create">("create");
    const [iceCandidates, setIceCands] = useState<RTCIceCandidate[]>([]);

    useEffect(() => {
        const interval = setInterval(() => {
            if (ref.current) {
                setConState(ref.current.connectionState);
                setDataChanState(ref.current.dataChannelState);
                setIceCands(ref.current.iceCandidates);
            }
        }, intervalMs);

        return () => clearInterval(interval);
    }, [ref, intervalMs]);

    return { connectionState, dataChannelState, iceCandidates };
}
