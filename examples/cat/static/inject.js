console.log(WSADDR);

if(typeof(Worker) === "undefined") {
  alert('Worker not support')
}

var worker = new Worker('/wsworker.js');

worker.onmessage = function(event){
    switch (event.data.action) {
      case 'open':
        WATunnel.isOpened = true;
        WATunnel.openCallback();
        break;
      case 'close':
        WATunnel.isOpened = false;
        WATunnel.closeCallback();
        break;
      case 'ready':
        WATunnel.isOpened = false;
        WATunnel.readyCallback();
        break;
      case 'echo':
        var msgs = JSON.parse(event.data.msgs)
        if(msgs.jsonp){
          var f = WATunnel.jsonpCallback[msgs.jsonp];
          if(f != undefined)f(msgs);
          console.log(msgs, f);
        }else {
          WATunnel.echoCallback(msgs);
        }
        break;
      default:
    }
};

var WATunnel = {
  cacheSize: 5000,
  isOpened: false,
  cache: [],
  autoFlush: true,
  counter: 0,
  sec: 0,
  openCallback: function () {},
  closeCallback: function () {},
  readyCallback: function () {},
  echoCallback: function () {},
  jsonpCallback: {},

  listen:function (callback) {
    this.echoCallback = callback;
  },
  open: function (callback, counter) {
    if(!worker) alert('worker is not loaded');

    if(callback) this.openCallback = callback;
    if(counter && counter > 0) this.counter = counter;
    else this.counter = 5;

    this.realopen();
  },
  realopen: function () {
    if(!this.isOpened){
      worker.postMessage({action:'open',WSADDR:WSADDR});
      this.counter--;
      setTimeout(1000,"WATunnel.realopen();");
    }else if (this.counter == -1) {
      alert("WATunnel cannot open, try times out.");
    }
  },
  ready: function (callback) {
    if(callback) this.readyCallback = callback;

    if(this.isOpened)
      worker.postMessage({action:'ready'});
  },
  flush: function() {
    if(!this.isOpened){
      // cache the msg && try to restore ws conn
      console.error('WATunnel is not opened');
      return;
    }

    if(this.cache.length > 0){
      worker.postMessage({action:'deliver',msgs: JSON.stringify(this.cache)});
      this.cache = []
    }
  },
  deliver: function (msg) {
    this.cache.push(msg)

    // TODO cache and real send later for opt
    if(this.autoFlush && this.cache.length == this.cacheSize){
      this.flush();
    }
  },
  jsonp: function (name, func, msg) {
    if(!this.isOpened){
      // cache the msg && try to restore ws conn
      console.error('WATunnel is not opened');
      return;
    }
    this.jsonpCallback[name] = func;
    msg['jsonp'] = name;
    worker.postMessage({action:'deliver',msgs: JSON.stringify([msg])});
  },
  close: function (callback) {
    if(callback) this.closeCallback = callback;
    this.flush();
    console.log("this.isOpened "+this.isOpened);
    if(this.isOpened)
      worker.postMessage({action:'close'});
  }
}
