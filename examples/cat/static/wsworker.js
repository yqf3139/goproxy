var socket;

onmessage = function(event) {
    if(socket){
      //console.log('send '+event.data);
      socket.send(event.data);
    }
    else {
      console.log('conn to '+event.data);
      socket = new WebSocket(event.data);
      socket.onopen = function(event) {
        console.log('Client onopen',event);
      }
      socket.onmessage = function(event) {
        console.log('Client received a message',event);
      };
      socket.onclose = function(event) {
        console.log('Client notified socket has closed',event);
      };
    }
};
