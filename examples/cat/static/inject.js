alert(WSADDR);

var worker = new Worker('/wsworker.js');

worker.postMessage(WSADDR);

function entry() {
  setTimeout('entry()',1000);
  var msg = prompt("Msg ?", "None");
  worker.postMessage(JSON.stringify({msg:msg}));
}

setTimeout('entry()',1000);
