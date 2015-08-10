var ccanvas = null;

var w2n_endframe = 600; //the number of the recorded frames
var w2n_skipsearch = true; // whether skip merging the global variables with same value

var W2N = {
  endframe : w2n_endframe,
  skipsearch : w2n_skipsearch,
  endflag : false,//true means tool stops recording.
  frame_count : 0,//current frame number
  widthdef : "",//the width of the canvas
	heightdef : ""//the height of the canvas
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


function inject(object, func){
  var ori = object[func];
  object[func] = function () {
    WATunnel.deliver({f:func, a:arguments});
    return ori.apply(object, arguments);
  }
}

_requestAnimationFrame_ = window.requestAnimationFrame;
window.requestAnimationFrame = function (callback) {
  updateFPS();
  if(!WATunnel.isOpened){
    //return _requestAnimationFrame_.apply(window, arguments);
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

var _getContext_ = HTMLCanvasElement.prototype.getContext;
HTMLCanvasElement.prototype.getContext = function () {
  var contextNames = ["moz-webgl", "webkit-3d", "experimental-webgl", "webgl", "3d"];
  var requestingWebGL = contextNames.indexOf(arguments[0]) != -1;
  var skip = 0;
	if (requestingWebGL) {
		var trueWebgl = _getContext_.apply(this, arguments);
    for(item in trueWebgl){
      if(typeof(trueWebgl[item]) == 'function' && !(item in ignoreFuncs))
        inject(trueWebgl, item);
    }
	} else {
		return _getContext_.apply(this, arguments);
	}
};


document.addEventListener('DOMContentLoaded', function (argument) {
  WATunnel.autoFlush = false;
  WATunnel.listen(function (msgs) {
    // body...
  });
  mytdl.initFpsDisplay();

  WATunnel.open(function () {

  }, 5);
})
