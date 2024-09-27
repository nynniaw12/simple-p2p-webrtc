import PeerF, { MessageCallback, usePeerF } from "./common/peer";
import { RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";

const defaultWebRTCFactory = {
    RTCPeerConnection: RTCPeerConnection,
    RTCSessionDescription: RTCSessionDescription
}


export class Peer<T> extends PeerF<T> {
    constructor(configuration: RTCConfiguration, messageCallback?: MessageCallback<T>) {
        // @ts-ignore
        super(configuration, defaultWebRTCFactory, messageCallback);
    }
}

export function usePeer<T>(
    RTC_CONF: RTCConfiguration,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    // @ts-ignore
    return usePeerF<T>(RTC_CONF, defaultWebRTCFactory, msgCallback, intervalMs);
}
