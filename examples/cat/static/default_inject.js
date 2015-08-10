document.addEventListener('DOMContentLoaded', function (argument) {
  console.log("DOMContentLoaded");

  WATunnel.cacheSize = 2;
  WATunnel.listen(function (msgs) {
    console.log("echo from server: ", msgs);
  });

  WATunnel.open(function () {
    console.log("open from server: ");

    WATunnel.ready(function () {
      console.log("ready from server: ");
    });

    loop();
  }, 5);
})

function hifunc_cb(a) {
  alert(a.hi);
}

var loopCounter = 5;
function loop() {
  console.log("enter loop");

  loopCounter--;
  if (loopCounter > -1) {
    WATunnel.deliver({hi:loopCounter});
    WATunnel.jsonp('hifunc_cb', hifunc_cb, {hi:loopCounter});
    setTimeout('loop()',1000);
  }else {
    console.log("close loop");
    WATunnel.close(function () {
      console.log("close from server: ");
    })
  }
}
