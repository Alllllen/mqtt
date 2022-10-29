// #publisher.js
var mqtt = require('mqtt');
var client = mqtt.connect('mqtt://localhost:1883');

client.on('connect', function () {
  // client.publish('agv:63511064f3376b004b7f6a25:control', 'stop');
  client.publish('agv:63511064f3376b004b7f6a25:control', 'move');
  console.log('Message Sent');
});
