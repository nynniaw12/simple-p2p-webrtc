"use client"

import PeerF, { MessageCallback, usePeerF, WebRTCFactory } from "./common/peer";

function getWebRTCFactory(): WebRTCFactory | undefined {
    if (typeof window !== 'undefined') {
        return {
            RTCPeerConnection: window.RTCPeerConnection,
            RTCSessionDescription: window.RTCSessionDescription
        };
    }
    return undefined;
}

export class Peer<T> extends PeerF<T> {
    constructor(configuration: RTCConfiguration, messageCallback?: MessageCallback<T>) {
        const factory = getWebRTCFactory();
        if (factory) {
            super(configuration, factory, messageCallback);
        } else {
            throw new Error('WebRTCFactory is unavailable. This class must be used on the client side.');
        }
    }
}

export function usePeer<T>(
    RTC_CONF: RTCConfiguration,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    const factory = getWebRTCFactory();
    if (factory) {
        return usePeerF<T>(RTC_CONF, factory, msgCallback, intervalMs);
    } else {
        throw new Error('WebRTCFactory is unavailable. This hook must be used in a client component.');
    }
}

export type { MessageCallback };
