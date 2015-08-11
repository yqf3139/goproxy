///////////////////////////////////////////////////////////
// WAR_CONFIG_MODE : "record" or "replay"
///////////////////////////////////////////////////////////
// WAR_CONFIG_MODE = "record";
// WAR_CONFIG_MODE = "replay";

///////////////////////////////////////////////////////////
// WAR_DATA : data cell
///////////////////////////////////////////////////////////
// WAR_DATA = "";

///////////////////////////////////////////////////////////
// WAR_FORCE_TIME_DRIVEN : defined or undefined
///////////////////////////////////////////////////////////
// WAR_FORCE_TIME_DRIVEN = true;

///////////////////////////////////////////////////////////
// WAR_RECORD_START_KEY : a-z
// WAR_RECORD_STOP_KEY : a-z
///////////////////////////////////////////////////////////
// WAR_RECORD_START_KEY = "q";
// WAR_RECORD_STOP_KEY = "w";

///////////////////////////////////////////////////////////
// WAR_NO_TOUCH: defined or undefined
///////////////////////////////////////////////////////////
// WAR_NO_TOUCH = true;

var WAR = {};

WAR.config = {
    mode : "", // record replay
};

WAR.data = {
    // public
    record_start_time : 0,
    trace : {
        "event":[],
        "date_now":[],
        "date_getTime":[],
        "date_valueOf":[],
        "math_random":[],
    },
    callback_fun2id : {},
    // private
    trace_index : {
        "event":0,
        "date_now":0,
        "date_getTime":0,
        "date_valueOf":0,
        "math_random":0,
    },
    // function
    PushTraceValue : function (type, value) {
        WAR.data.trace[type].push(value);
    },
    PeekTraceValue : function (type) {
        ret = WAR.data.trace[type][WAR.data.trace_index[type]];
        if (type=="event" && ret==undefined) {
            WAR.common.End();
        }
        return ret;
    },
    MoveTraceNext : function (type) {
        WAR.data.trace_index[type]++;
    },
    Process : function () {
        for (var i=0;i<WAR.data.trace["event"].length;i++) {
            var item = WAR.data.trace["event"][i];
            if(item["in_raf"])
              console.log(item["in_raf"]);
        }

        if (typeof WAR_FORCE_TIME_DRIVEN != "undefined") {
            var trace = {
                "event":[],
                "date_now":[],
                "date_getTime":[],
                "date_valueOf":[],
                "math_random":[],
            };
            for (var i=0;i<WAR.data.trace["event"].length;i++) {
                var item = WAR.data.trace["event"][i];
                var type = item["type"];
                if (type!="requestAnimationFrame" && type!="setTimeout" && type!="setInterval") {
                    item["in_raf"] = false;
                    trace["event"].push(item);
                }
            }
            WAR.data.trace = trace;
        }
    },
    SaveRecord : function () {
        WAR.data.Process();
        var data = {};
        data["record_start_time"] = WAR.data.record_start_time;
        data["trace"] = WAR.data.trace;
        data["callback_fun2id"] = WAR.common.callback_fun2id;
        //localStorage["WAR.data"] = escape(JSON.stringify(data));

        //yqf
        WATunnel.jsonp('push_cb', function (argument) {
          alert("push record success")
        },{action:'push', trace: escape(JSON.stringify(data))});
    },
    LoadRecord : function (callback) {
        //yqf
        WATunnel.jsonp('list_cb', function (msgs) {

          var l = msgs.recordList;
          var menu = "";

          if(l.length == 0){
            alert('the server have no records');
            WAR.record.Init();
            return;
          }

          for (var i = 0; i < l.length; i++) {
            menu += "# "+i+" @ "+ (new Date(parseInt(l[i])*1000)).toLocaleString() +"\n";
          }

          var record_idx = prompt(menu+'enter record ID to reply: ', 0);
          WATunnel.jsonp('pull_cb', function (msgs) {
            var data = JSON.parse(unescape(msgs.trace));
            WAR.data.record_start_time = data["record_start_time"];
            WAR.data.trace = data["trace"];
            WAR.data.callback_fun2id = data["callback_fun2id"];
            callback();

          }, {action:'pull', recordId:l[record_idx]});
        }, {action:'list'});

    },
};

WAR.hook = {
    requestAnimationFrame : window.requestAnimationFrame.bind(window),
    setTimeout : window.setTimeout.bind(window),
    setInterval : window.setInterval.bind(window),
    clearInterval : window.clearInterval.bind(window),
    date_now : Date.now,
    date_getTime : Date.prototype.getTime,
    date_valueOf : Date.prototype.valueOf,
    math_random : Math.random,
};

WAR.handler = {
    node_children_number : {},
    KeyDownHandler : function () {},
    KeyUpHandler : function () {},
    MouseDownHandler : function () {},
    MouseMoveHandler : function () {},
    MouseUpHandler : function () {},
    MouseClickHandler : function () {},
    MouseWheelHandler : function () {},
    RegisterKeyHandler : function () {
        window.addEventListener('keydown', function (e) {
            e = e || window.event;
            if (e.keyCode) {
                WAR.handler.KeyDownHandler(e);
            }
        }, false);
        window.addEventListener('keyup', function (e) {
            e = e || window.event;
            if (e.keyCode) {
                WAR.handler.KeyUpHandler(e);
            }
        }, false);
    },
    RegisterMouseHandlerInternal : function (target) {
        if (!target) return;
        if (target.id == "") {
            var parent = target.parentNode.id;
            if (WAR.handler.node_children_number[parent] == undefined) {
                WAR.handler.node_children_number[parent] = 0;
            }
            target.id = parent+'_'+WAR.handler.node_children_number[parent];
            WAR.handler.node_children_number[parent]++;
        }
        target.addEventListener('mousedown', function (e) {
            WAR.handler.MouseDownHandler(e);
        }, false);
        target.addEventListener('mousemove', function (e) {
            WAR.handler.MouseMoveHandler(e);
        }, false);
        target.addEventListener('mouseup', function (e) {
            WAR.handler.MouseUpHandler(e);
        }, false);
        target.addEventListener('click', function (e) {
            WAR.handler.MouseClickHandler(e);
        }, false);
    },
    RegisterMouseHandlerTraversal : function (parent) {
        WAR.handler.RegisterMouseHandlerInternal(parent);
        for (var i=0; i<parent.children.length; i++) {
            WAR.handler.RegisterMouseHandlerTraversal(parent.children[i]);
        }
    },
    RegisterMouseHandler : function () {
        window.addEventListener('load', function () {
            var node = document.getElementsByTagName("BODY")[0];
            if (node.id == "") {
                node.id = "WAR_assign_body";
            }
            WAR.handler.RegisterMouseHandlerTraversal(node);
            document.addEventListener("DOMNodeInserted", function (e) {
                WAR.handler.RegisterMouseHandlerInternal(e.target);
            }, false);
        }, false);
    },
    RegisterMouseWheelHandler : function () {
        window.addEventListener('mousewheel', function (e) {
            WAR.handler.MouseWheelHandler(e);
        }, false);
    },
};

WAR.dispatcher = {
    KeyDown : function (k) {
        var oEvent = document.createEvent('KeyboardEvent');
        Object.defineProperty(oEvent, 'keyCode', {
            get : function () {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get : function () {
                return this.keyCodeVal;
            }
        });
        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent("keydown", true, true, document.defaultView, false, false, false, false, k, k);
        } else {
            oEvent.initKeyEvent("keydown", true, true, document.defaultView, false, false, false, false, k, 0);
        }
        oEvent.keyCodeVal = k;
        if (oEvent.keyCode !== k) {
            alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
        }
        document.dispatchEvent(oEvent);
    },
    KeyUp : function (k) {
        var oEvent = document.createEvent('KeyboardEvent');
        Object.defineProperty(oEvent, 'keyCode', {
            get : function () {
                return this.keyCodeVal;
            }
        });
        Object.defineProperty(oEvent, 'which', {
            get : function () {
                return this.keyCodeVal;
            }
        });
        if (oEvent.initKeyboardEvent) {
            oEvent.initKeyboardEvent("keyup", true, true, document.defaultView, false, false, false, false, k, k);
        } else {
            oEvent.initKeyEvent("keyup", true, true, document.defaultView, false, false, false, false, k, 0);
        }
        oEvent.keyCodeVal = k;
        if (oEvent.keyCode !== k) {
            alert("keyCode mismatch " + oEvent.keyCode + "(" + oEvent.which + ")");
        }
        document.dispatchEvent(oEvent);
    },
    MouseDown : function (id, x, y) {
        var target = document.getElementById(id);
        var offset = WAR.common.GetOffset(id);
        x = parseInt(x) + offset.left;
        y = parseInt(y) + offset.top;
        var click = document.createEvent('MouseEvents');
        click.initMouseEvent('mousedown', true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        target.dispatchEvent(click);
    },
    MouseMove : function (id, x, y) {
        var target = document.getElementById(id);
        var offset = WAR.common.GetOffset(id);
        x = parseInt(x) + offset.left;
        y = parseInt(y) + offset.top;
        var click = document.createEvent('MouseEvents');
        click.initMouseEvent('mousemove', true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        target.dispatchEvent(click);
    },
    MouseUp : function (id, x, y) {
        var target = document.getElementById(id);
        var offset = WAR.common.GetOffset(id);
        x = parseInt(x) + offset.left;
        y = parseInt(y) + offset.top;
        var click = document.createEvent('MouseEvents');
        click.initMouseEvent('mouseup', true, true, window, 0, 0, 0, x, y, false, false, false, false, 0, null);
        target.dispatchEvent(click);
    },
    MouseClick : function (id) {
        var target = document.getElementById(id);
        var click = document.createEvent('MouseEvents');
        click.initMouseEvent('click', true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
        target.dispatchEvent(click);
    },
    MouseWheel : function (delta) {
        window.scrollBy(0, delta);
    },
    TouchStart : function (id, x, y) {
        var target = document.getElementById(id);
        var t = document.createTouch(window, target, 0, x, y);
        var tl = document.createTouchList(t);
        var evt = document.createEvent("TouchEvent");
        evt.initTouchEvent(tl, tl, tl, "touchstart", window, 0, 0, 0, 0, false, false, false, false);
        target.dispatchEvent(evt);
    },
    TouchMove : function (id, x, y) {
        var target = document.getElementById(id);
        var t = document.createTouch(window, target, 0, x, y);
        var tl = document.createTouchList(t);
        var evt = document.createEvent("TouchEvent");
        evt.initTouchEvent(tl, tl, tl, "touchmove", window, 0, 0, 0, 0, false, false, false, false);
        target.dispatchEvent(evt);
    },
    TouchEnd : function (id, x, y) {
        var target = document.getElementById(id);
        var t = document.createTouch(window, target, 0, x, y);
        var tl = document.createTouchList(t);
        var evt = document.createEvent("TouchEvent");
        evt.initTouchEvent(tl, tl, tl, "touchend", window, 0, 0, 0, 0, false, false, false, false);
        target.dispatchEvent(evt);
    },
    RegisterTouch : function () {
        if (typeof WAR_NO_TOUCH == "undefined" && "ontouchstart" in document) {
            WAR.dispatcher.MouseDown = WAR.dispatcher.TouchStart;
            WAR.dispatcher.MouseMove = WAR.dispatcher.TouchMove;
            WAR.dispatcher.MouseUp = WAR.dispatcher.TouchEnd;
        }
    },
};

WAR.common = {
    callback_fun2id : {},
    callback_id2fun : [],
    Error : function (msg) {
        console.log("ERROR : "+msg);
    },
    AssignFunctionId : function (callback) {
        var id;
        if (WAR.config.mode == "record"){
            id = WAR.common.callback_id2fun.length;
            WAR.common.callback_fun2id[callback] = id;
            WAR.common.callback_id2fun.push(callback);
        }
        if (WAR.config.mode == "replay"){
            id = WAR.data.callback_fun2id[callback];
            if (typeof id != undefined) {
                WAR.common.callback_fun2id[callback] = id;
                WAR.common.callback_id2fun[id] = callback;
            }
            else {
                WAR.common.Error("function not found in trace");
            }
        }
        return id;
    },
    GetFunctionId : function (callback) {
        var id = WAR.common.callback_fun2id[callback];
        if (id == undefined) {
            id = WAR.common.AssignFunctionId(callback);
        }
        return id;
    },
    GetFunction : function (id) {
        return WAR.common.callback_id2fun[id];
    },
    GetOffset : function(id) {
        var el = document.getElementById(id);
        var _x = 0;
        var _y = 0;
        while( el && !isNaN( el.offsetLeft ) && !isNaN( el.offsetTop ) ) {
            _x += el.offsetLeft;
            _y += el.offsetTop;
            el = el.offsetParent;
        }
        return { top: _y, left: _x };
    },
    End : function() {
        WAR.replay.replay_end_time = WAR.hook.date_now();
        //location.href = "result.html?time="+(WAR.replay.replay_end_time-WAR.replay.replay_begin_time);
    },
    ChooseMode : function () {
        if (typeof WAR_CONFIG_MODE != "undefined") {
            WAR.config.mode = WAR_CONFIG_MODE;
        }
        if (WAR.config.mode == "") {
            var r = confirm("record press ok, replay press cancel");
            if (r) {
                WAR.config.mode = "record";
            }
            else {
                WAR.config.mode = "replay";
            }
        }
    },
    Init : function () {
        WAR.common.ChooseMode();
        if (WAR.config.mode == "record") {
            WAR.record.Init();
        }
        if (WAR.config.mode == "replay") {
            WAR.data.LoadRecord(function () {
              WAR.replay.Init();
            });
        }
    },
};

WAR.record = {
    application_time_base : 0,
    record_enable : false,
    event_enable : false,
    event_time_base : 0,
    run_once_flag : false,
    in_raf_flag : false,
    start_key : 0,
    stop_key : 0,
    RecordStart : function () {
        if (WAR.record.run_once_flag) return;
        WAR.record.run_once_flag = true;
        WAR.record.record_enable = true;
        WAR.data.record_start_time = WAR.hook.date_now()-WAR.record.application_time_base;
        alert("record start");
    },
    RecordEnd : function () {
        WAR.record.record_enable = false;
        WAR.data.SaveRecord();
        alert("record end");
    },
    HookStartKey : function () {
        if (typeof WAR_RECORD_START_KEY != "undefined") {
            WAR.record.start_key = parseInt(WAR_RECORD_START_KEY);
        }
        if (WAR.record.start_key == 0) {
            var key = window.prompt("please select a start character (a-z)", "q");
            WAR.record.start_key = key.charCodeAt();
        };
        window.addEventListener("keypress", function (keyEvent) {
            var keyEvent = keyEvent ? keyEvent : window.event;
            var keyvalue = keyEvent.which ? keyEvent.which : keyEvent.keyCode;
            if (keyvalue == WAR.record.start_key) {
                WAR.record.RecordStart();
            }
        });
    },
    HookStopKey : function () {
        if (typeof WAR_RECORD_STOP_KEY != "undefined") {
            WAR.record.stop_key = parseInt(WAR_RECORD_STOP_KEY);
        }
        if (WAR.record.stop_key == 0) {
            var key = window.prompt("please select a stop character (a-z)", "w");
            WAR.record.stop_key = key.charCodeAt();
        };
        window.addEventListener("keypress", function (keyEvent) {
            var keyEvent = keyEvent ? keyEvent : window.event;
            var keyvalue = keyEvent.which ? keyEvent.which : keyEvent.keyCode;
            if (keyvalue == WAR.record.stop_key) {
                WAR.record.RecordEnd();
            }
        });
    },
    Init : function () {
        WAR.record.HookStartKey();
        WAR.record.HookStopKey();
        WAR.record.application_time_base = WAR.hook.date_now();
        window.requestAnimationFrame = function (callback) {
            updateFPS();
            WAR.record.in_raf_flag = true;
            return WAR.hook.requestAnimationFrame((function(callback){
                return function () {
                    var id = WAR.common.GetFunctionId(callback);
                    if (WAR.record.record_enable) {
                        //console.log("raf_cb "+id);
                        WAR.record.event_enable = true;
                        WAR.data.PushTraceValue("event", {
                            "type" : "requestAnimationFrame",
                            "id" : id,
                            "time" : WAR.hook.date_now(),
                        });
                    }
                    callback();
                    WAR.record.in_raf_flag = false;
                    //callback();
                }
            })(callback));
        };
        window.setTimeout = function (callback, timeout) {
            var id = WAR.common.GetFunctionId(callback);
            return WAR.hook.setTimeout((function(callback){
                return function () {
                    var id = WAR.common.GetFunctionId(callback);
                    if (WAR.record.record_enable) {
                        //console.log("setTimeout "+id);
                        WAR.record.event_enable = true;
                        WAR.data.PushTraceValue("event", {
                            "type" : "setTimeout",
                            "id" : id,
                            "in_raf" : WAR.record.in_raf_flag,
                            "time" : WAR.hook.date_now(),
                        });
                    }
                    callback();
                }
            })(callback), timeout);
        };
        window.setInterval = function (callback, timeout) {
            var id = WAR.common.GetFunctionId(callback);
            return WAR.hook.setInterval((function(callback){
                return function () {
                    var id = WAR.common.GetFunctionId(callback);
                    if (WAR.record.record_enable) {
                        //console.log("setInterval "+id);
                        WAR.record.event_enable = true;
                        WAR.data.PushTraceValue("event", {
                            "type" : "setInterval",
                            "id" : id,
                            "in_raf" : WAR.record.in_raf_flag,
                            "time" : WAR.hook.date_now(),
                        });
                    }
                    callback();
                }
            })(callback), timeout);
        };
        Date.now = function () {
            var ret = WAR.hook.date_now();
            if (WAR.record.event_enable) {
                var t = ret - WAR.record.event_time_base;
                //console.log("date_now "+t);
                WAR.data.PushTraceValue("date_now", t);
            }
            else {
                WAR.record.event_time_base = ret;
            }
            return ret;
        };
        performance.now = Date.now;
        Date.prototype.getTime = function () {
            var ret = WAR.hook.date_getTime.apply(this);
            if (WAR.record.event_enable) {
                var t = ret - WAR.record.event_time_base;
                //console.log("date_getTime "+t);
                WAR.data.PushTraceValue("date_getTime", t);
            }
            else {
                WAR.record.event_time_base = ret;
            }
            return ret;
        };
        Date.prototype.valueOf = function () {
            var ret = WAR.hook.date_valueOf.apply(this);
            if (WAR.record.event_enable) {
                var t = ret - WAR.record.event_time_base;
                //console.log("date_valueOf "+t);
                WAR.data.PushTraceValue("date_valueOf", t);
            }
            else {
                WAR.record.event_time_base = ret;
            }
            return ret;
        };
        Math.random = function () {
            var ret = WAR.hook.math_random();
            if (WAR.record.event_enable) {
                WAR.data.PushTraceValue("math_random", ret);
            }
            return ret;
        }
        WAR.handler.KeyDownHandler = function (e) {
            if (WAR.record.record_enable) {
                //console.log("keydown "+e.keyCode);
                WAR.record.event_enable = true;
                WAR.data.PushTraceValue("event", {
                    "type" : "keydown",
                    "code" : e.keyCode,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.KeyUpHandler = function (e) {
            if (WAR.record.record_enable) {
                //console.log("keyup "+e.keyCode);
                WAR.data.PushTraceValue("event", {
                    "type" : "keyup",
                    "code" : e.keyCode,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.RegisterKeyHandler();
        WAR.handler.MouseDownHandler = function (e) {
            if (WAR.record.record_enable && e.target==e.currentTarget) {
                var id = e.currentTarget.id;
                var offset = WAR.common.GetOffset(id);
                var x = e.clientX - offset.left;
                var y = e.clientY - offset.top;
                //console.log("mousedown "+id+" "+x+" "+x);
                WAR.record.event_enable = true;
                WAR.data.PushTraceValue("event", {
                    "type" : "mousedown",
                    "id" : id,
                    "x" : x,
                    "y" : y,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.MouseMoveHandler = function (e) {
            if (WAR.record.record_enable && e.target==e.currentTarget) {
                var id = e.currentTarget.id;
                var offset = WAR.common.GetOffset(id);
                var x = e.clientX - offset.left;
                var y = e.clientY - offset.top;
                //console.log("mousemove "+id+" "+x+" "+y);
                WAR.record.event_enable = true;
                WAR.data.PushTraceValue("event", {
                    "type" : "mousemove",
                    "id" : id,
                    "x" : x,
                    "y" : y,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.MouseUpHandler = function (e) {
            if (WAR.record.record_enable && e.target==e.currentTarget) {
                var id = e.currentTarget.id;
                var offset = WAR.common.GetOffset(id);
                var x = e.clientX - offset.left;
                var y = e.clientY - offset.top;
                //console.log("mouseup "+id+" "+x+" "+y);
                WAR.data.PushTraceValue("event", {
                    "type" : "mouseup",
                    "id" : id,
                    "x" : x,
                    "y" : y,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.MouseClickHandler = function (e) {
            if (WAR.record.record_enable && e.target==e.currentTarget) {
                //console.log("mouseclick "+e.currentTarget.id);
                WAR.data.PushTraceValue("event", {
                    "type" : "mouseclick",
                    "id" : e.currentTarget.id,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.RegisterMouseHandler();
        WAR.handler.MouseWheelHandler = function (e) {
            if (WAR.record.record_enable) {
                //console.log("mousewheel "+e.wheelDelta);
                WAR.record.event_enable = true;
                WAR.data.PushTraceValue("event", {
                    "type" : "mousewheel",
                    "delta" : e.wheelDelta,
                    "in_raf" : WAR.record.in_raf_flag,
                    "time" : WAR.hook.date_now(),
                });
            }
        };
        WAR.handler.RegisterMouseWheelHandler();
    },
};

WAR.replay = {
    replay_enable : false,
    event_enable : false,
    event_time_base : 0,
    replay_begin_time : 0,
    replay_end_time : 0,
    DispatchEvent : function () {
        var item = WAR.data.PeekTraceValue("event");
        while (item!=undefined && item["type"] != "requestAnimationFrame") {
            switch (item["type"]) {
                case "setTimeout":
                    WAR.common.GetFunction(item["id"])();
                    break;
                case "setInterval":
                    WAR.common.GetFunction(item["id"])();
                    break;
                case "keydown":
                    WAR.dispatcher.KeyDown(item["code"]);
                    break;
                case "keyup":
                    WAR.dispatcher.KeyUp(item["code"]);
                    break;
                case "mousedown":
                    WAR.dispatcher.MouseDown(item["id"], item["x"], item["y"]);
                    break;
                case "mousemove":
                    WAR.dispatcher.MouseMove(item["id"], item["x"], item["y"]);
                    break;
                case "mouseup":
                    WAR.dispatcher.MouseUp(item["id"], item["x"], item["y"]);
                    break;
                case "mouseclick":
                    WAR.dispatcher.MouseClick(item["id"]);
                    break;
                case "mousewheel":
                    WAR.dispatcher.MouseWheel(-1*parseInt(item["delta"]));
                    break;
            }
            WAR.replay.event_enable = true;
            if (item["in_raf"]) {
                WAR.data.MoveTraceNext("event");
                item = WAR.data.PeekTraceValue("event");
            }
            else {
                var t1 = item["time"];
                WAR.data.MoveTraceNext("event");
                item = WAR.data.PeekTraceValue("event");
                var t2 = item["time"];
                WAR.hook.setTimeout(WAR.replay.DispatchEvent, t2-t1);
                break;
            }
        }
    },
    Init : function () {
        window.requestAnimationFrame = function (callback) {
            updateFPS();
            return WAR.hook.requestAnimationFrame((function(callback){
                return function () {
                    var id = WAR.common.GetFunctionId(callback);
                    if (WAR.replay.replay_enable) {
                        var item = WAR.data.PeekTraceValue("event");
                        if (item && item["type"]=="requestAnimationFrame" && item["id"]==id) {
                            //console.log("raf_cb "+id);
                            WAR.replay.event_enable = true;
                            WAR.data.MoveTraceNext("event");
                        }
                    }
                    callback();
                    if (WAR.replay.replay_enable) {
                        WAR.replay.DispatchEvent();
                    }
                }
            })(callback));
        };
        window.setTimeout = function (callback, timeout) {
            var id = WAR.common.GetFunctionId(callback);
            if (WAR.replay.replay_enable) {
            }
            else {
                return WAR.hook.setTimeout(callback, timeout);
            }
        };
        window.setInterval = function (callback, timeout) {
            var id = WAR.common.GetFunctionId(callback);
            if (WAR.replay.replay_enable) {
                return 0;
            }
            else {
                return WAR.hook.setInterval(callback, timeout);
            }
        };
        window.clearInterval = function (id) {
            if (WAR.replay.replay_enable) {
                return;
            }
            else {
                return WAR.hook.clearInterval(id);
            }
        };
        if (typeof WAR_FORCE_TIME_DRIVEN != "undefined") {
            window.requestAnimationFrame = WAR.hook.requestAnimationFrame;
            window.setTimeout = WAR.hook.setTimeout;
            window.setInterval = WAR.hook.setInterval;
            window.clearInterval = WAR.hook.clearInterval;
        }
        Date.now = function () {
            var ret = WAR.hook.date_now();
            if (WAR.replay.event_enable) {
                var t = WAR.data.PeekTraceValue("date_now");
                if (typeof t != "undefined") {
                    WAR.data.MoveTraceNext("date_now");
                    //console.log("date_now "+t);
                    ret = t + WAR.replay.event_time_base;
                }
            }
            else {
                WAR.replay.event_time_base = ret;
            }
            return ret;
        };
        performance.now = Date.now;
        Date.prototype.getTime = function () {
            var ret = WAR.hook.date_getTime.apply(this);
            if (WAR.replay.event_enable) {
                var t = WAR.data.PeekTraceValue("date_getTime");
                if (typeof t != "undefined") {
                    WAR.data.MoveTraceNext("date_getTime");
                    //console.log("date_getTime "+t);
                    ret = t + WAR.replay.event_time_base;
                }
            }
            else {
                WAR.replay.event_time_base = ret;
            }
            return ret;
        };
        Date.prototype.valueOf = function () {
            var ret = WAR.hook.date_valueOf.apply(this);
            if (WAR.replay.event_enable) {
                var t = WAR.data.PeekTraceValue("date_valueOf");
                if (typeof t != "undefined") {
                    WAR.data.MoveTraceNext("date_valueOf");
                    //console.log("date_valueOf "+t);
                    ret = t + WAR.replay.event_time_base;
                }
            }
            else {
                WAR.replay.event_time_base = ret;
            }
            return ret;
        };
        Math.random = function () {
            var ret = WAR.hook.math_random();
            if (WAR.replay.event_enable) {
                var t = WAR.data.PeekTraceValue("math_random");
                if (typeof t != "undefined") {
                    WAR.data.MoveTraceNext("math_random");
                    ret = t;
                }
            }
            else {
            }
            return ret;
        };
        WAR.handler.KeyDownHandler = function (e) {
            //console.log("keydown "+e.keyCode);
        };
        WAR.handler.KeyUpHandler = function (e) {
            //console.log("keyup "+e.keyCode);
        };
        WAR.handler.RegisterKeyHandler();
        WAR.handler.MouseDownHandler = function (e) {
            if (WAR.record.replay_enable) {
                //console.log("mousedown "+e.currentTarget.id+" "+e.clientX+" "+e.clientY);
            }
        };
        WAR.handler.MouseMoveHandler = function (e) {
            if (WAR.record.replay_enable) {
                //console.log("mousemove "+e.currentTarget.id+" "+e.clientX+" "+e.clientY);
            }
        };
        WAR.handler.MouseUpHandler = function (e) {
            if (WAR.record.replay_enable) {
                //console.log("mouseup "+e.currentTarget.id+" "+e.clientX+" "+e.clientY);
            }
        };
        WAR.handler.MouseClickHandler = function (e) {
            if (WAR.record.replay_enable) {
                //console.log("mouseclick "+e.currentTarget.id);
            }
        };
        WAR.handler.RegisterMouseHandler();
        WAR.dispatcher.RegisterTouch();
        WAR.hook.setTimeout(function(){
            WAR.replay.replay_begin_time = WAR.hook.date_now();
            WAR.replay.replay_enable = true;
            WAR.replay.DispatchEvent();
        },WAR.data.record_start_time);
    },
};

WATunnel.autoFlush = false;
WATunnel.cacheSize = 1;

WATunnel.listen(function (msgs) {

});

document.addEventListener('DOMContentLoaded', function (argument) {
  mytdl.initFpsDisplay();
  WATunnel.open(function () {
    WAR.common.Init();
  }, 5);
})
