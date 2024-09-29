# Simple Peer 2 Peer WebRTC for React and React Native

This package provides a WebRTC wrapper implementation for both **React**(tested w/ **Next**) and **React Native** applications,
enabling peer-to-peer (P2P) data communication. It abstracts the WebRTC integration into React-based projects,
both cjs and mjs available.

## Features

- Cross-platform support (React and React Native)
- Simplified WebRTC setup process
- Hooks for React and React Native
- Single data channel support (for now)
- TypeScript support

## Installation

```bash
npm install simple-p2p-webrtc 
# or
yarn add simple-p2p-webrtc
```

## Usage

There are both hook and class implementations for React and React Native apps,
same interface with dependency injection under the hood.

To make the connection process smoother you can use a signaling server.

### Example React-Native Usage

For simplicity below example acts as a counterpart to the following application in Next.js.
It initiates the p2p connection. The offer is then provided to the next app.

```js
import { useEffect, useRef, useState } from 'react';
import { Button, Keyboard, StyleSheet, Text, TextInput, View } from 'react-native';
import { usePeer } from 'simple-p2p-webrtc/react-native';

const UPDATE_INTERVAL = 300; // optional
const RTC_CONF = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // you have to provide stun servers
const CHAN = "data"; // channel descriptor to be used

export default function App() {
    // creating peer
    const peer = usePeer(RTC_CONF, undefined, UPDATE_INTERVAL); // second argument is the msg callback
                                                                // update interval is optional
    const { dataChannelState, connectionState } = peer; // destructure

    const [answer, setAnswer] = useState('');
    const [offer, setOffer] = useState('');
    const [ice, setIce] = useState<RTCIceCandidate[]>([]);

    useEffect(() => {
        if (dataChannelState === "open") {
            try {
                peer.send(JSON.stringify("PING"));
            } catch (e) {
                console.log('Connection severed'); // you dont have to log errors but can handle them
            }
        }
    }, [sensorData, dataChannelState]);

    const handleCreateOffer = async () => {
        try {
            peer.createDataChannel(CHAN);
            const offer = await peer.createOffer();
            setOffer(offer);
        } catch (e) {
            console.error("Error creating offer", e);
        }
    };

    const handleSetIceCandidates = async () => {
        try {
            for (const iceCand of ice) {
                await peer.addRemoteIceCandidate(iceCand);
            }
        } catch (e) {
            console.error("Error setting ICE candidates", e);
        }
    };

    const handleSetRemoteDescription = async () => {
        try {
            await peer.setRemoteDescription(answer);
        } catch (e) {
            console.error("Error setting remote description", e);
        }
    };

    return (
        <View style={styles.container}>
            <Text> Connect</Text>
            <Text>Connection state: {connectionState}</Text>
            <Text>Data channel state: {dataChannelState}</Text>
            {["closed", "create"].includes(dataChannelState) ?
                <>
                    <Button title="Create Offer" onPress={handleCreateOffer} />
                    {offer && <TextInput
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        value={offer}
                        multiline
                        style={styles.input}
                    />}

                    <TextInput
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        value={answer}
                        onChangeText={setAnswer}
                        placeholder="Paste Answer"
                        style={styles.input}
                    />
                    <Button title="Set Remote Description" onPress={handleSetRemoteDescription} />

                    <TextInput
                        returnKeyType="done"
                        onSubmitEditing={() => Keyboard.dismiss()}
                        value={JSON.stringify(ice)}
                        onChangeText={(s) => setIce(JSON.parse(s))}
                        placeholder="Paste Ice Candidates"
                        style={styles.input}
                    />
                    <Button title="Set Ice Candidates" onPress={handleSetIceCandidates} />
                </> :
                <Text>Data is being sent to the web client!</Text>}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: 100,
        backgroundColor: '#fff',
        alignItems: 'center',
    },
    input: {
        height: 40,
        borderColor: 'gray',
        borderWidth: 1,
        marginVertical: 10,
        width: '80%',
        padding: 10,
    },
});
```

### Example React/ Next Usage

The Next.js app receives an offer and generates an answer along with providing ice 
candidates for connection. Both the answer and the ice candidates need to be 
fed back to the react native app, typically this is done through a signaling server.

```js
"use client" // we need to be a client component/ page

import { useEffect, useRef, useState } from "react";
import { usePeer } from "simple-p2p-webrtc";

const RTC_CONF = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }; // stun servers
const UPDATE_INTERVAL = 300; // optional

export default function Home() {
    const [data, setData] = useState<string>('');
    const [offer, setOffer] = useState<string>('');
    const [answer, setAnswer] = useState<string>('');
    const peer = usePeer(RTC_CONF, (msg) => {
        setData(msg); // message callback
    }, UPDATE_INTERVAL);
    const { connectionState, dataChannelState, iceCandidates } = peer;

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gray-100 p-4 text-black">
            <p className="mb-4">Connection status: {connectionState}</p>
            <p className="mb-4">Data chan status: {dataChannelState}</p>

            {(dataChannelState == 'closed') ? // automatically set to closed when initialized with msgCallback because we are looking for a dataChannel
                <>
                    <form onSubmit={async (e) => {
                        e.preventDefault();
                        try {
                            setAnswer((await peer.createAnswer(offer))); // an answer to the offer is created and shown
                        } catch (e) {
                            console.error(e);
                        }
                    }} className="mb-4 flex flex-col">
                        <textarea
                            value={offer}
                            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setOffer(e.target.value)}
                            placeholder="Paste the offer from the React Native app here"
                            className="w-64 h-32 p-2 border rounded"
                        />
                        <button type="submit" className="mt-2 px-4 py-2 bg-blue-500 text-white rounded">
                            Connect
                        </button>
                    </form>
                    {(answer && peer) && (
                        <div className="mb-4">
                            <h2 className="text-lg font-semibold">Answer & Ice Candidates:</h2>
                            <textarea
                                value={answer}
                                readOnly
                                className="w-64 h-32 p-2 border rounded"
                            />
                            <textarea
                                value={JSON.stringify(iceCandidates)}
                                readOnly
                                className="w-64 h-32 p-2 border rounded"
                            />
                        </div>
                    )}
                </> :
                <>
                    <p>Receiving data</p>
                </>
            }
        </div>
    );
};
```

## Other
License is MIT.
Feel free to contribute.
