import PeerF, { MessageCallback, usePeerF, WebRTCFactory } from "./common/peer";
import { RTCPeerConnection, RTCSessionDescription } from "react-native-webrtc";

function getWebRTCFactory(): WebRTCFactory | undefined {
    if (typeof window !== 'undefined') {
        return {
            // @ts-ignore
            RTCPeerConnection: RTCPeerConnection,
            // @ts-ignore
            RTCSessionDescription: RTCSessionDescription
        };
    }
    return undefined;
}

export class Peer<T> extends PeerF<T> {
    constructor(configuration: RTCConfiguration, messageCallback?: MessageCallback<T>) {
        const factory = getWebRTCFactory();
        if (!factory) {
            throw new Error('WebRTCFactory is unavailable. This class must be used on the client side.');
        }
        super(configuration, factory, messageCallback);
    }
}

export function usePeer<T>(
    RTC_CONF: RTCConfiguration,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    return usePeerF<T>(RTC_CONF, getWebRTCFactory, msgCallback, intervalMs);
}

export type { MessageCallback };
