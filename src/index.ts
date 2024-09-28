import PeerF, { MessageCallback, usePeerF } from "./common/peer";

const defaultWebRTCFactory = {
    RTCPeerConnection: window.RTCPeerConnection,
    RTCSessionDescription: window.RTCSessionDescription
}


export class Peer<T> extends PeerF<T> {
    constructor(configuration: RTCConfiguration, messageCallback?: MessageCallback<T>) {
        super(configuration, defaultWebRTCFactory, messageCallback);
    }
}

export function usePeer<T>(
    RTC_CONF: RTCConfiguration,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    return usePeerF<T>(RTC_CONF, defaultWebRTCFactory, msgCallback, intervalMs);
}

export type { MessageCallback };
