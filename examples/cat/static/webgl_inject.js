var ccanvas = null;
function entry() {
  ccanvas = document.querySelector('canvas');
  console.log(!ccanvas, !WATunnel, !WATunnel.isOpened);
  if (!ccanvas || !WATunnel || !WATunnel.isOpened) {
    setTimeout('entry()',1000);
    WATunnel.open();
    return;
  }

  WATunnel.autoFlush = false;

  ccanvas = document.querySelector('canvas');
  var ggl = ccanvas.getContext('webgl');
  for(item in ggl){
    if(typeof(ggl[item]) == 'function')
      inject(ggl, item);
  }
}

function inject(object, func){
  var ori = object[func];
  object[func] = function () {
    var d = (new Date()).valueOf();
    //console.log('gl.'+func);
    WATunnel.deliver({d:d, f:func, a:arguments});
    return ori.apply(object, arguments);
  }
}

_requestAnimationFrame_ = window.requestAnimationFrame;
window.requestAnimationFrame = function (callback) {
  var ret = _requestAnimationFrame_.apply(window, arguments);
  setTimeout('WATunnel.flush();',1);
	return ret;
};

entry();
