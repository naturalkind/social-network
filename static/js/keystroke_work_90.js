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


document.addEventListener('click', function (e) {
    if (e.target.id=="id_body") {
//        console.log(e.target.id);
        //timer.start();
        //e.target.onblur = blurHandler;
        e.target.onkeydown = e.target.onkeyup = e.target.onkeypress = e.target.onclick = handle;
        
    }
});

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
//        TypingDNA.history.addDiagram(arrD);x
//      }
//    }



var prev_idx = 0;
var prev_char = "";
function handle(e) {
    
    idx_arr_keystroke = getCaret(e.target);
    //idx_arr_keystroke = getCaretCharOffset(e.target)+idx_line;
    var charCode = e.which || e.keyCode;
    var temp_promis_value;
    if (charCode == 229) {
//        console.log("0", String.fromCharCode(e.target.value.charAt(e.target.selectionStart - 1).charCodeAt()));
//        console.log("1", e.target.value.charAt(e.target.selectionStart - 1).charCodeAt());
//        console.log("2", e.target.value.substr((e.target.selectionStart - 1) || 0, 1));
            var keyTimes = {};
            let K;
            if (e.type == "keydown") {
                prev_idx = idx_arr_keystroke;
                keyTimes["key_name"] = idx_arr_keystroke;
                keyTimes["time_keydown"] = new Date().getTime()/1000.0;
                keyTimes["time_keyup"] = new Date().getTime()/1000.0;
                arr_keystroke.splice(idx_arr_keystroke, 0, keyTimes);
                if (!tKey[idx_arr_keystroke]) {
                    tKey[idx_arr_keystroke] = [idx_arr_keystroke];
                } else {
                    tKey[idx_arr_keystroke].push(idx_arr_keystroke);
                }                
                
                  
            } if (e.type == "keyup") { 
//                console.log(prev_char, e.target.value, idx_arr_keystroke)
                if (prev_char.length+1 == e.target.value.length) {
                    if (arr_keystroke.length>0) {
                        //console.log("KEYUP", tKey[prev_idx]);
                        let time_up = new Date().getTime()/1000.0;
                        if (tKey[prev_idx]) {
                            for (var i = 0; i < tKey[prev_idx].length; i++) {
                                
                                let rev_idx = (tKey[prev_idx].length-1)-i;
                                console.log(prev_idx, idx_arr_keystroke, arr_keystroke)
                                arr_keystroke[tKey[prev_idx][i]]["key_name"] = e.target.value.substr((e.target.selectionStart - 1) || 0, 1)
                                arr_keystroke[tKey[prev_idx][i]]["time_keyup"] = time_up;
                                arr_keystroke[tKey[prev_idx][i]]["time_press"] = time_up - arr_keystroke[tKey[prev_idx][rev_idx]]["time_keydown"];
                                
                            }
                            delete tKey[prev_idx];
                        }
                        
//                        
                    }     
                    //prev_char++;
                    prev_char = e.target.value;
                } else if (prev_char.length+1 > e.target.value.length) { 
                    //prev_char--; 
                    console.log("---------@", prev_char, e.target.value, prev_idx, idx_arr_keystroke)
                    if (arr_keystroke.length!=0) {
                        //idx_arr_keystroke--;
                        arr_keystroke.splice(prev_idx, 1);
                        arr_keystroke.splice(idx_arr_keystroke, 1);
                        

                    }
                    prev_char = e.target.value;
                    console.log("DEL", arr_keystroke); 
                }
      
            }       
        
    
    } else {
        if (list_exept.indexOf(e.key) == -1) {
            if (e.type == "keydown") {
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
                //console.log("KEYDOWN", e.key, arr.length, text_input.innerText.length, idx_arr);
//                document.getElementById("log").innerHTML = e.target.value
    //            console.log("KEYDOWN", e.target.value, e);
            }
            if (e.type == "keyup") {
                if (arr_keystroke.length>0) {
    //                console.log("KEYUP", charS);
                    let time_up = new Date().getTime()/1000.0;
                    if (tKey[e.key]) {
                        for (var i = 0; i < tKey[e.key].length; i++) {
                            let rev_idx = (tKey[e.key].length-1)-i;
                            arr_keystroke[tKey[e.key][i]]["time_keyup"] = time_up;
                            arr_keystroke[tKey[e.key][i]]["time_press"] = time_up - arr_keystroke[tKey[e.key][rev_idx]]["time_keydown"];
                        }
                        delete tKey[e.key];
                    }
                }
            }
        } else {
            if (e.type == "keydown") {
                arr_bad_keystroke.push([e.key, idx_arr_keystroke]);
            }
        }    
        //console.log(arr_keystroke); 
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





