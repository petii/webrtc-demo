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
  else if (data.desc.type == 'message') {
    e.innerHTML += ': ' + data.desc.text;
  }
});
socket.addEventListener('open', function (event) {
  socket.send(JSON.stringify({ desc: {type: "message", text: "hello, world"}}));
});

var connection = new RTCPeerConnection();
connection.onnegotiationneeded = async () => {
  var offer = await connection.createOffer()
  console.log(JSON.stringify(offer));
  await connection.setLocalDescription(offer);
  socket.send(JSON.stringify({ desc: connection.localDescription }));
};
connection.ontrack = (event) => {
  console.log(event);
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