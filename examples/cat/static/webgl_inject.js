var ccanvas = null;
var mythen = 0.0;

var w2n_endframe = 600; //the number of the recorded frames
var w2n_skipsearch = true; // whether skip merging the global variables with same value

var W2N = {
  endframe : w2n_endframe,
  skipsearch : w2n_skipsearch,
  endflag : false,//true means tool stops recording.
  frame_count : 0,//current frame number
  widthdef : "",//the width of the canvas
	heightdef : "",//the height of the canvas
  g_fpsTimer : new mytdl.fps.FPSTimer()
}

var ignoreFuncs = {
  "getShaderInfoLog": true,
  "getProgramInfoLog": true,
  "getActiveAttrib": true,
  "getActiveUniform": true,
  "getUniform": true,
  "getExtension": true,
  "getVertexAttrib": true,
  "getVertexAttribOffset": true,
  "getAttachedShaders": true,
  "getShaderSource": true,
  "getShaderPrecisionFormat": true,
  "getError": true,
  "ignoreErrors": true,
  "isBuffer": true,
  "isEnabled": true,
  "isFramebuffer": true,
  "isProgram": true,
  "isRenderbuffer": true,
  "isShader": true,
  "isTexture": true
}

document.addEventListener('DOMContentLoaded', function (argument) {
  mytdl.initFpsDisplay();
  setTimeout('entry()',2000);
})

function entry() {
  ccanvas = document.querySelector('canvas');
  console.log(!ccanvas, !WATunnel, !WATunnel.isOpened);
  if (!ccanvas || !WATunnel || !WATunnel.isOpened) {
    setTimeout('entry()',2000);
    WATunnel.open();
    return;
  }

  WATunnel.autoFlush = false;

  ccanvas = document.querySelector('canvas');
  var ggl = ccanvas.getContext('webgl');
  for(item in ggl){
    if(typeof(ggl[item]) == 'function' && !(item in ignoreFuncs))
      inject(ggl, item);
  }
}

function inject(object, func){
  var ori = object[func];
  object[func] = function () {
    WATunnel.deliver({f:func, a:arguments});
    return ori.apply(object, arguments);
  }
}

_requestAnimationFrame_ = window.requestAnimationFrame;
window.requestAnimationFrame = function (callback) {
  var now = (new Date()).getTime() * 0.001;
  var elapsedTime;
  if(mythen == 0.0) {
    elapsedTime = 0.0;
  } else {
    elapsedTime = now - mythen;
  }
  mythen = now;

  W2N.g_fpsTimer.update(elapsedTime);
  if(mytdl.fps.inner){
    mytdl.fps.inner.textContent = W2N.g_fpsTimer.averageFPS;
  }

  if(!WATunnel.isOpened){
    return _requestAnimationFrame_.apply(window, arguments);
  }
  if (W2N.endflag == false) {
    W2N.frame_count++;
    if (W2N.frame_count > W2N.endframe) {
			W2N.endflag = true;
		}

    arguments[0] = (function (cb) {
      return function () {
        WATunnel.deliver({f:'start', a:(new Date()).valueOf()});
        cb();
        WATunnel.deliver({f:'end', a:(new Date()).valueOf()});
        setTimeout('WATunnel.flush();',1);
        //WATunnel.flush();
      }
    })(callback);
  	return _requestAnimationFrame_.apply(window, arguments);
  }else {
    console.log("W2N:RAF STOP");
    WATunnel.flush();
    WATunnel.deliver({f:'traceend'});
    WATunnel.flush();
    WATunnel.close();
  }
};
