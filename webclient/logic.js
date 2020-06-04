var offers = {};

const socket = new WebSocket('ws://localhost:8765');
socket.addEventListener('message', async (event) => {
  console.log(event);
  var data = JSON.parse(event.data);
  console.log(data);
  var e = document.getElementById('rcv');
  var date = Date.now();
  e.innerHTML += '<br />' + Date.now() + ': ' + data.desc.type;
  if (data.desc.type == 'offer') {
    offers[date] = data.desc;
    console.log(offers);
    e.innerHTML += ' <input type="button" value="answer" onclick="answer(' + date + ')" />';
  }
  else if (data.desc.type == 'answer') {
    await connection.setRemoteDescription(data.desc);
  }
  else if (data.desc.type == 'ice') {
    console.log(data.desc.candidate);
  }
  else if (data.desc.type == 'message') {
    e.innerHTML += ': ' + data.desc.text;
  }
});
socket.addEventListener('open', function (event) {
  socket.send(JSON.stringify({ desc: { type: "message", text: "hello, world" } }));
});

var connection = new RTCPeerConnection();
connection.onnegotiationneeded = async (e) => {
  console.log('nego', e);
  var offer = await connection.createOffer()
  console.log(offer);
  await connection.setLocalDescription(offer);
  socket.send(JSON.stringify({ desc: connection.localDescription }));
};
connection.onicecandidate = e => {
  // https://developer.mozilla.org/en-US/docs/Web/API/RTCPeerConnection/icecandidate_event
  // The event handler should transmit the candidate to the remote peer over the signaling channel
  // so the remote peer can add it to its set of remote candidates.
  console.log('ice', e);
  if (e.candidate) {
    socket.send(JSON.stringify({ desc: { type: "ice", candidate: e.candidate } }));
  }
  else {
    /* there are no more candidates coming during this negotiation */
  }
};
connection.ontrack = (event) => {
  console.log(event);
  var stream = event.streams[0];
  console.log(stream);
  var audioTrack = stream.getAudioTracks()[0];
  console.log(audioTrack);
  var player = document.getElementById('incomingAudio');
  console.log(player);
  player.srcObject = stream;
};

function send(message) {
  socket.send(JSON.stringify({ desc: { type: "message", text: message } }));
}


async function call() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  stream.getTracks().forEach(track => {
    console.log(track);
    connection.addTrack(track, stream);
  });
}

async function answer(offerDate) {
  console.log('answer ' + offerDate);
  var remote = offers[offerDate];
  console.log(remote);
  await connection.setRemoteDescription(remote);
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  stream.getTracks().forEach(track => {
    console.log(track);
    connection.addTrack(track, stream);
  });
  await connection.setLocalDescription(await connection.createAnswer());
  socket.send(JSON.stringify({ desc: connection.localDescription }));
}