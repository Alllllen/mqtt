const aedes = require('aedes')();
const server = require('net').createServer(aedes.handle);
const port = 1883;

const agvs = {};

server.listen(port, function () {
  console.log('Aedes Broker started and listening on port ', port);
});

aedes.on('publish', function (packet, client) {
  if (client) {
    const topic = packet.topic;

    if (topic.includes('route')) {
      let message = packet.payload.toString();
      message = JSON.parse(message);

      const currentStep = message['currentStep'];
      const agv = 'agv:' + topic.split(':')[1];
      const status = message['status'];
      const fullRoute = message['fullRoute'];

      let agvObj = {};
      let next = [
        fullRoute[currentStep],
        fullRoute[currentStep + 1],
        fullRoute[currentStep + 2],
      ];

      agvObj['status'] = status;
      agvObj['nextSteps'] = next;
      agvs[agv] = agvObj;
      // console.log(agvs);

      let stopToMove = true;
      for (let key in agvs) {
        const nextSteps = agvs[key]['nextSteps'];

        for (let i = 0; i < nextSteps.length; i++) {
          const thisStep = JSON.stringify(fullRoute[currentStep + 2]);
          const otherNextStep = JSON.stringify(nextSteps[i]);
          const otherStatus = agvs[key]['status'];

          if (key === agv) continue;
          if (!fullRoute[currentStep + 2]) continue;
          if (thisStep !== otherNextStep) continue;

          //檢查的車子為停下狀態時 只要看他原地的就好 不然可能會造成deadLock
          if (
            (i === 0 || fullRoute[currentStep + 1] === otherNextStep) &&
            otherStatus === 'stop'
          ) {
            console.log('碰到停止的車stop agv -> ', agv);

            aedes.publish({
              topic: `${agv}:control`,
              payload: 'stop',
            });
          }

          //檢查的車子為移動狀態時
          if (otherStatus === 'move') {
            console.log('碰到移動的車stop agv -> ', agv);

            aedes.publish({
              topic: `${agv}:control`,
              payload: 'stop',
            });
          }

          //if自己是停下來的狀態，檢查是否可以變為移動狀態
          if (status === 'stop') stopToMove = false;
        }
      }

      if (stopToMove && status === 'stop') {
        console.log('move agv');

        aedes.publish({
          topic: `${agv}:control`,
          payload: 'move',
        });
      }
    }
  }
});
