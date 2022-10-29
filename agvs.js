const mqtt = require('mqtt');
const client = mqtt.connect('mqtt://localhost:1883');

//模擬所有agv 將所有資訊存此 variable -> agv status: (stop, move(包含speed) and arrived), speed, fullRoute, currentStep
let agvs = {};

const moving = (key) => {
  //如果已經沒assignment 則publish結束
  if (agvs[key].length === 0 || agvs[key][0]['status'] === 'arrived') return;

  const currentStep = agvs[key][0]['currentStep'];
  const routeLength = agvs[key][0]['fullRoute'].length;
  const status = agvs[key][0]['status'];

  //模擬車子move且發送訊號
  setTimeout(() => {
    // 傳送當前INFO...   all
    client.publish(`${key}:route`, JSON.stringify(agvs[key][0]));
    console.log(
      agvs[key][0]['fullRoute'][agvs[key][0]['currentStep']],
      agvs[key][0]['status']
    );

    //when agv not arrived end of route length-1
    if (!(currentStep === routeLength - 1) && status === 'move')
      agvs[key][0]['currentStep'] += 1;

    //當AGV到終點
    if (currentStep === routeLength - 1) {
      console.log(`Task -> ${agvs[key][0]['startToEnd']} is complete`);
      agvs[key][0]['status'] = 'arrived';
      client.publish(`${key}:route`, JSON.stringify(agvs[key][0]));

      console.log('處理中................................');

      setTimeout(() => {
        console.log('處理完成..............................');
        client.publish(`${key}:complete`, JSON.stringify(agvs[key][0]));

        //把目前這個移掉 如果還有assinmnet呼叫move繼續下一個
        agvs[key].shift();
        if (agvs[key]) moving(key);
        else return;
      }, 3000);
    }

    //when agv status is stop
    if (status === 'stop') console.log(key, 'is now stop');
    // agvs[key][0]['currentStep'] -= 1;

    //next step
    moving(key);
  }, agvs[key][0]['speed']);
};

const toFullRoute = (route) => {
  const fullRoute = [];
  let currentX, currentY;

  for (let i = 0; i < route.length - 1; i++) {
    currentX = parseInt(route[i].split(',')[0]);
    currentY = parseInt(route[i].split(',')[1]);

    nextX = parseInt(route[i + 1].split(',')[0]);
    nextY = parseInt(route[i + 1].split(',')[1]);

    const diffX = nextX - currentX;
    const diffY = nextY - currentY;
    const num = Math.abs(diffX) + Math.abs(diffY);

    for (let j = num; j > 0; j--) {
      let x = currentX;
      let y = currentY;
      let diff = j;
      if (diffX < 0 || diffY < 0) diff = -j;
      if (currentX === nextX) y = currentY + diffY - diff;
      else x = currentX + diffX - diff;
      fullRoute.push([x, y]);
    }
  }
  currentX = parseInt(route[route.length - 1].split(',')[0]);
  currentY = parseInt(route[route.length - 1].split(',')[1]);
  fullRoute.push([currentX, currentY]);
  return fullRoute;
};

client.on('connect', function () {
  client.subscribe('allAgvs');
});

client.on('message', function (topic, message) {
  if (topic === 'allAgvs') {
    const agvs = JSON.parse(message);
    for (let i = 0; i < agvs.length; i++) {
      client.subscribe(`agv:${agvs[i]._id}:assignment`);
      client.subscribe(`agv:${agvs[i]._id}:control`);
    }

    console.log(`Subscribe agv:ID:assignment, agv:ID:control`);
  }
});

client.on('message', function (topic, message) {
  if (topic.includes('control')) {
    message = message.toString();
    const agvKey = `agv:${topic.split(':')[1]}`;

    if (message === 'stop') agvs[agvKey][0]['status'] = 'stop';
    if (message === 'move') {
      console.log('stop to move');
      agvs[agvKey][0]['status'] = 'move';
      // moving(agvKey);
    }
    if (message.includes('speed'))
      agvs[agvKey]['speed'] = parseInt(message.split(':')[1]);
  }

  if (topic.includes('assignment')) {
    message = JSON.parse(message); //[{},{}] or [{}]

    const agvKey = 'agv:' + topic.split(':')[1];

    //將 assignments store in agvs object variable [using {agv_id} 當成key]
    const assignmentArr = [];
    for (let i = 0; i < message.length; i++) {
      const fullRoute = toFullRoute(message[i]['route']);
      const task = message[i]['task'];
      const routeStart = message[i]['routeStart'];
      const routeEnd = message[i]['routeEnd'];

      const agvObj = {};
      agvObj['task'] = task;
      agvObj['status'] = 'move';
      agvObj['speed'] = 100;
      agvObj['startToEnd'] = routeStart + 'To' + routeEnd;
      agvObj['fullRoute'] = fullRoute;
      agvObj['currentStep'] = 0;

      assignmentArr.push(agvObj);
    }
    agvs[agvKey] = assignmentArr;

    console.log(topic, 'is Recieved !');
    moving(agvKey);
  }
});
