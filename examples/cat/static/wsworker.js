var socket;

var wsstate = false;

function WSOnOpen(event) {
  wsstate = true;
  postMessage({action:'open'});
  console.log('Client onopen',event);
}

function WSOnClose(event) {
  wsstate = false;
  postMessage({action:'close'});
  console.log('Client notified socket has closed',event);
}

function WSOnMessage(event) {
  postMessage({action:'echo', msgs: event.data});  
}

onmessage = function(event) {
  switch (event.data.action) {
    case 'deliver':
      socket.send(event.data.msgs);
      break;
    case 'open':
      if(wsstate)break;
      console.log('conn to '+event.data.WSADDR);
      socket = new WebSocket(event.data.WSADDR);
      socket.onopen = WSOnOpen;
      socket.onclose = WSOnClose;
      socket.onmessage = WSOnMessage;
      break;
    case 'close':
      if(!socket || !wsstate)break;
      socket.close();
      break;
    case 'ready':
      socket.send(JSON.stringify([{action:'ready'}]));
      break;
    default:
  }
}
