"use client"

import PeerF, { MessageCallback, usePeerF } from "./common/peer";

const defaultWebRTCFactory = typeof window !== 'undefined' ? {
    RTCPeerConnection: window.RTCPeerConnection,
    RTCSessionDescription: window.RTCSessionDescription
} : undefined;

export class Peer<T> extends PeerF<T> {
    constructor(configuration: RTCConfiguration, messageCallback?: MessageCallback<T>) {
        if (defaultWebRTCFactory != undefined) {
            super(configuration, defaultWebRTCFactory, messageCallback);
        } else {
            throw new Error('WebRTCFactory is undefined!. Need a client component.')
        }
    }
}

export function usePeer<T>(
    RTC_CONF: RTCConfiguration,
    msgCallback?: MessageCallback<T>,
    intervalMs = 250,
) {
    if (defaultWebRTCFactory != undefined) {
        return usePeerF<T>(RTC_CONF, defaultWebRTCFactory, msgCallback, intervalMs);
    } else {
        throw new Error('WebRTCFactory is undefined!. Need a client component.')
    }
}

export type { MessageCallback };
