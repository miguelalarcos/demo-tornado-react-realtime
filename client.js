const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:8888/ws');

ws.on('open', function open() {
  let data = {msg: 'method', method: 'add', id: 1, params: {a: 1, b: 2}}
  data = JSON.stringify(data)
  ws.send(data);

  data = {msg: 'sub', name: 'cars_of_color', id: 2, params: {color: 'red'}}
  data = JSON.stringify(data)
  ws.send(data);
});

ws.on('message', function incoming(data) {
  console.log(data);
});