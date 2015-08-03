console.log(WSADDR);

if(typeof(Worker) === "undefined") {
  alert('Worker not support')
}

var worker = new Worker('/wsworker.js');

worker.onmessage = function(event){
    switch (event.data.action) {
      case 'open':
        WATunnel.isOpened = true;
        break;
      case 'close':
        WATunnel.isOpened = false;
        break;
      default:
    }
};

var WATunnel = {
  isOpened: false,
  cache: [],
  autoFlush: true,
  counter: 0,
  sec: 0,
  open: function (argument) {
    if(!worker) alert('worker is not loaded');
    if(!this.isOpened)
      worker.postMessage({action:'open',WSADDR:WSADDR});
  },
  ready: function (argument) {
    if(this.isOpened)
      worker.postMessage({action:'ready'});
  },
  flush: function() {
    if(!this.isOpened){
      // cache the msg && try to restore ws conn
      alert('WATunnel is not opened');
      return;
    }

    if(this.cache.length > 0){
      worker.postMessage({action:'deliver',msgs:JSON.stringify(this.cache)});
      this.cache = []
    }
  },
  deliver: function (msg) {
    this.cache.push(msg)

    // this.counter++;
    // var tmp = new Date().getUTCSeconds();
    // if(tmp != this.sec){
    //   console.log(this.counter);
    //   this.sec = tmp;
    //   this.counter = 0;
    // }

    // TODO cache and real send later for opt
    if(this.autoFlush && this.cache.length == 5000){
      this.flush();
    }
  },
  close: function (argument) {
    if(this.isOpened)
      worker.postMessage({action:'close'});
  }
}
