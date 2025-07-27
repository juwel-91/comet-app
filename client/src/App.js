import React, { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';
import Peer from 'simple-peer';

const socket = io("https://comet-app.onrender.com");

function App() {
  const [myID, setMyID] = useState('');
  const [otherID, setOtherID] = useState('');
  const [stream, setStream] = useState();
  const [receivingCall, setReceivingCall] = useState(false);
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [callStarted, setCallStarted] = useState(false);

  const myVideo = useRef();
  const userVideo = useRef();
  const connectionRef = useRef();

  useEffect(() => {
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((currentStream) => {
      setStream(currentStream);
      myVideo.current.srcObject = currentStream;
    });

    socket.on('connect', () => {
      setMyID(socket.id);
    });

    socket.on('receive-call', (data) => {
      setReceivingCall(true);
      setCallerSignal(data.signal);
      setOtherID(data.from);
    });

    socket.on('call-accepted', (signal) => {
      setCallAccepted(true);
      connectionRef.current.signal(signal);
    });
  }, []);

  const callUser = (id) => {
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('call-user', {
        userToCall: id,
        signal: data,
        from: myID,
      });
    });

    peer.on('stream', (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    connectionRef.current = peer;
    setCallStarted(true);
  };

  const acceptCall = () => {
    setCallAccepted(true);
    setCallStarted(true);

    const peer = new Peer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on('signal', (data) => {
      socket.emit('accept-call', { signal: data, to: otherID });
    });

    peer.on('stream', (remoteStream) => {
      userVideo.current.srcObject = remoteStream;
    });

    peer.signal(callerSignal);
    connectionRef.current = peer;
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>📹 Comet Video Call</h2>
      <div>
        <video ref={myVideo} autoPlay playsInline muted style={{ width: '300px' }} />
        <video ref={userVideo} autoPlay playsInline style={{ width: '300px' }} />
      </div>

      <div style={{ marginTop: 20 }}>
        <p><strong>My ID:</strong> {myID}</p>
        <input
          value={otherID}
          onChange={(e) => setOtherID(e.target.value)}
          placeholder="Enter ID to call"
        />
        <button onClick={() => callUser(otherID)}>Call</button>
      </div>

      {receivingCall && !callAccepted ? (
        <div style={{ marginTop: 20 }}>
          <p>📞 Incoming call from {otherID}</p>
          <button onClick={acceptCall}>Accept</button>
        </div>
      ) : null}
    </div>
  );
}

export default App;
