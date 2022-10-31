const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

const doors = {};
const elevators = {};

let intervalId = null;
let count = 0;

//sent to status to sever continully
const sendStatus = (key) => {
  setTimeout(() => {
    // 傳送當前INFO...   all
    client.publish(`${key}:status`, JSON.stringify(doors[key]));
    // console.log('publish status', doors[key]);
    sendStatus(key);
  }, 100);
};

//before open door, close door while count to two
const addCount = (key) => {
  count++;
  if (count === 2) {
    count = 0;
    doors[key]['status'] = 'close';
    clearInterval(intervalId);
  }
};

client.on('connect', function () {
  client.subscribe('allDoors');
});

client.on('message', function (topic, message) {
  if (topic === 'allDoors') {
    message = JSON.parse(message);
    for (let i = 0; i < message.length; i++) {
      const door = {};
      client.subscribe(`door:${message[i]._id}:control`);
      door['status'] = message[i]['status'];
      door['name'] = message[i]['name'];
      doors[`door:${message[i]._id}`] = door;

      sendStatus(`door:${message[i]['_id']}`);
    }

    console.log(`Subscribe Door:ID:control and started sent status`);
  }
});

client.on('message', function (topic, message) {
  if (topic.includes('control')) {
    message = message.toString();
    const doorKey = `door:${topic.split(':')[1]}`;
    if (message === 'close') doors[doorKey]['status'] = 'close';

    if (message === 'open') {
      doors[doorKey]['status'] = 'open';
      count = 0;
      clearInterval(intervalId);
      intervalId = setInterval(addCount, 500, doorKey);
    }
  }
});
