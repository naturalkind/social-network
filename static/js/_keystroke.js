// Теория - это когда все известно, но ничего не работает   
var arr_keystroke = [];
var arr_bad_keystroke = [];
var idx_arr_keystroke = 0;
var all_time_sec = 0;
var tKey = {}
var idx_line = 0;
 
var list_exept = ["CapsLock", "Alt", "Control", "Shift", "Insert"] //"Backspace", "ArrowLeft", "ArrowRight",

var blurHandler = function() {
    all_time_sec += Math.round(timer.getTime() / 1000);
    timer.stop();
    timer.reset();
}

//document.addEventListener('touchstart', () => { console.log('touchstart') }); // el.ontouchstart = () => { console.log('start') };
//el.addEventListener('touchend', () => { console.log('end') }); // el.ontouchstart = () => { console.log('start') };
//el.addEventListener('touchmove', () => { console.log('move') }); // el.ontouchstart = () => { console.log('start') };
//el.addEventListener('touchcancel', () => { console.log('cancel') }); // el.ontouchstart = () => { console.log('start') };


document.addEventListener('click', function (e) {
    if (e.target.id=="id_body") {
        //console.log(e.target.id);
        //timer.start();
        //e.target.onblur = blurHandler;
        e.target.onkeydown = e.target.onkeyup = e.target.onkeypress = e.target.onclick = handle;
        
    }
});
var charS;
document.addEventListener('compositionupdate', function (e) {
    charS = e.data.substr((e.target.selectionStart - 1) || 0, 1);
    //console.log("EVENT'S UPDATE", e, char)
});

//document.addEventListener('compositionstart', function (e) {
//    console.log("EVENT'S START", e)
//});

//document.addEventListener('compositionend', function (e) {
//    console.log("EVENT'S END", e)
//});

// таймер https://stackoverflow.com/questions/29971898/how-to-create-an-accurate-timer-in-javascript
class Timer {
    constructor () {
        this.isRunning = false;
        this.startTime = 0;
        this.overallTime = 0;
    }

    _getTimeElapsedSinceLastStart () {
        if (!this.startTime) {
            return 0;
        }
        return Date.now() - this.startTime;
    }

    start () {
        if (this.isRunning) {
            return console.error('Timer is already running');
        }
        this.isRunning = true;
        this.startTime = Date.now();
    }

    stop () {
        if (!this.isRunning) {
            return console.error('Timer is already stopped');
        }
        this.isRunning = false;
        this.overallTime = this.overallTime + this._getTimeElapsedSinceLastStart();
    }

    reset () {
        this.overallTime = 0;
        if (this.isRunning) {
            this.startTime = Date.now();
            return;
        }
        this.startTime = 0;
    }
    
    getTime () {
        if (!this.startTime) {
            return 0;
        }
        if (this.isRunning) {
            return this.overallTime + this._getTimeElapsedSinceLastStart();
        }
        return this.overallTime;
    }
}

const timer = new Timer();

// https://stackoverflow.com/questions/263743/how-to-get-the-caret-column-not-pixels-position-in-a-textarea-in-characters
function getCaret(node) {
  if (node.selectionStart) {
    return node.selectionStart;
  } else if (!document.selection) {
    return 0;
  }

  var c = "\001",
      sel = document.selection.createRange(),
      dul = sel.duplicate(),
      len = 0;

  dul.moveToElementText(node);
  sel.text = c;
  len = dul.text.indexOf(c);
  sel.moveStart('character',-1);
  sel.text = "";
  return len;
}


//// only for Android devices
//TypingDNA.AndroidKeyDown = function(e) {
//  if (!TypingDNA.recording && !TypingDNA.diagramRecording) {
//    return;
//  }
//  if (!TypingDNA.isTarget(e.target.id)) {
//    return;
//  }
//  TypingDNA.lastPressTime = (new Date).getTime();
//  if (TypingDNA.ACInputLengths.inputs.indexOf(e.target) === -1) {
//    TypingDNA.ACInputLengths.inputs.push(e.target);
//    TypingDNA.ACInputLengths.lastLength.push(0);
//  }
//}



//TypingDNA.AndroidKeyUp = function(e) {
//      if (!TypingDNA.recording && !TypingDNA.diagramRecording) {
//        return;
//      }
//      var t0 = TypingDNA.ut1;
//      TypingDNA.ut1 = (new Date).getTime();
//      if (!TypingDNA.isTarget(e.target.id)) {
//        return;
//      }
//      var seekTime = TypingDNA.ut1 - t0;
//      var kpGet = TypingDNA.kpGetAll();
//      var pressTime = (kpGet[0] !== 0) ? Math.round(TypingDNA.ut1 - kpGet[0]) : 0;
//      if (isNaN(pressTime)) {
//        pressTime = 0;
//      }
//      var keyCode = e.keyCode;
//      var targetIndex = TypingDNA.ACInputLengths.inputs.indexOf(e.target);
//      if (targetIndex === -1) {
//        TypingDNA.ACInputLengths.inputs.push(e.target);
//        TypingDNA.ACInputLengths.lastLength.push(0);
//        targetIndex = TypingDNA.ACInputLengths.inputs.indexOf(e.target);
//      }
//      var charCode = 0;
//      if (e.target.value.length >= TypingDNA.ACInputLengths.lastLength[targetIndex]) {
//        var char = e.target.value.substr((e.target.selectionStart - 1) || 0, 1);
//        keyCode = char.toUpperCase().charCodeAt(0);
//        charCode = char.charCodeAt(0);
//      }
//      TypingDNA.ACInputLengths.lastLength[targetIndex] = e.target.value.length;
//      var arr = [keyCode, seekTime, pressTime, TypingDNA.prevKeyCode, TypingDNA.ut1, e.target.id,];
//      TypingDNA.history.add(arr);
//      TypingDNA.prevKeyCode = keyCode;
//      if (TypingDNA.diagramRecording === true) {
//        var arrD = [keyCode, seekTime, pressTime, charCode, TypingDNA.ut1, e.target.id, kpGet[1].join(','), kpGet[2].join(','), kpGet[3].join(','), kpGet[4].join(',')];
//        TypingDNA.history.addDiagram(arrD);
//      }
//    }


function handle(e) {
    
//    document.getElementById("show_value").innerHTML = text_input.innerHTML;
//    document.getElementById("count_text").innerHTML = arr_keystroke.length;
//    document.getElementById("count_text_our").innerText = textOriginal.length;
    idx_arr_keystroke = getCaret(e.target);
    //idx_arr_keystroke = getCaretCharOffset(e.target)+idx_line;
    var charCode = e.which || e.keyCode;
    if (charCode == 229) {
        //var char = e.target.value.substr((e.target.selectionStart - 1) || 0, 1);
        //console.log("0", idx_arr_keystroke, String.fromCharCode(e.target.value.charAt(e.target.selectionStart - 1).charCodeAt()));
        
//        console.log("1", e.target.value.charAt(e.target.selectionStart - 1).charCodeAt());
//        console.log("2", e.target.value.substr((e.target.selectionStart - 1) || 0, 1));
    }
    //console.log(arr_keystroke, idx_arr_keystroke, charCode, e);
//    keyCode = char.toUpperCase().charCodeAt(0);
//    charCode = char.charCodeAt(0);
    //document.getElementById("log").innerHTML = `one -> ${charCode} xxx ${idx_arr_keystroke} ${char}`
    if (list_exept.indexOf(e.key) == -1) {
        if (e.type == "keydown") {
            console.log(charS);
            //document.getElementById("log").innerHTML = `keydown -> ${charCode} xxx ${idx_arr_keystroke} ${char} ${e.target.value.charAt(e.target.selectionStart - 1).charCodeAt()}`
            if (e.key=="Backspace") {
                if (arr_keystroke.length!=0 && idx_arr_keystroke!=0) {
                    idx_arr_keystroke--;
                    arr_keystroke.splice(idx_arr_keystroke, 1);

                }
            } else if (e.key == "ArrowRight") {   
            } else if (e.key == "ArrowLeft") {  
            } else if (e.key == "ArrowUp") {  
            } else if (e.key == "ArrowDown") {   
            } else {
                //-------------------------------->
                var keyTimes = {};
                //keyTimes["key_code"] = e.keyCode;
                let K;
                if (e.key =="Enter") { 
                    //K = "\n"; 
//                    var charCode = e.which || e.keyCode;
                    K = String.fromCharCode(charCode); //String.fromCodePoint
                    console.log(".....", K);
                } else { K = e.key };
                keyTimes["key_name"] = K;
                keyTimes["time_keydown"] = new Date().getTime()/1000.0;
                keyTimes["time_keyup"] = new Date().getTime()/1000.0;
                arr_keystroke.splice(idx_arr_keystroke, 0, keyTimes);
//                arr.push(keyTimes);
                if (!tKey[e.key]) {
                    tKey[e.key] = [idx_arr_keystroke];
                } else {
                    tKey[e.key].push(idx_arr_keystroke);
                }
            }
//            console.log("KEYDOWN", e.key, arr.length, text_input.innerText.length, idx_arr);
        }
        if (e.type == "keyup") {
            if (arr_keystroke.length>0) {
                console.log("....", charS);
                let time_up = new Date().getTime()/1000.0;
                if (tKey[e.key]) {
                    for (var i = 0; i < tKey[e.key].length; i++) {
                        let rev_idx = (tKey[e.key].length-1)-i;
                        arr_keystroke[tKey[e.key][i]]["time_keyup"] = time_up;
                        arr_keystroke[tKey[e.key][i]]["time_press"] = time_up - arr_keystroke[tKey[e.key][rev_idx]]["time_keydown"];
                    }
                    delete tKey[e.key];
                }
                //document.getElementById("log").innerHTML = `keyup -> ${charCode} - ${idx_arr_keystroke} - ${time_up}`
            }
        }
    } else {
        if (e.type == "keydown") {
            arr_bad_keystroke.push([e.key, idx_arr_keystroke]);
        }
    }
}

//var count_click = 0;
//document.addEventListener('touchstart', function(event) {
//    var input = event.target;
//    if (event.target.id=="id_body") {
//    //if (input.tagName === "INPUT" || input.tagName === "TEXTAREA") {
////         alert(event.key);  
//         count_click = count_click+1;
//         document.getElementById("log").innerHTML = event.key + " " + event.keyCode + " " + event.which + " " +count_click;
//    }
//});





