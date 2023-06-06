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



function static_handle(e, charCode) {
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
                var keyTimes = {};
                let K;
                if (e.key =="Enter") { 
                    K = String.fromCharCode(charCode); //String.fromCodePoint
                    console.log(".....", K);
                } else { K = e.key };
                keyTimes["key_name"] = K;
                keyTimes["time_keydown"] = new Date().getTime()/1000.0;
                keyTimes["time_keyup"] = new Date().getTime()/1000.0;
                arr_keystroke.splice(idx_arr_keystroke, 0, keyTimes);
                if (!tKey[e.key]) {
                    tKey[e.key] = [idx_arr_keystroke];
                } else {
                    tKey[e.key].push(idx_arr_keystroke);
                }
            }
        }
        if (e.type == "keyup") {
            if (arr_keystroke.length>0) {
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
}


function android_keydown(keyTimes) {
    if (SF) {
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
    }
}

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};


var SF = true;
function android_keyup(e, keyTimes) {
    if (prev_char.length+1 == e.target.value.length) {
            let time_up = new Date().getTime()/1000.0;
            if (tKey[prev_idx]) {
                arr_keystroke[prev_idx]["key_name"] = e.target.value.substr((e.target.selectionStart - 1) || 0, 1)
                arr_keystroke[prev_idx]["time_keyup"] = time_up;
                arr_keystroke[prev_idx]["time_press"] = time_up - arr_keystroke[prev_idx]["time_keydown"];
                delete tKey[prev_idx];
            }
//        } 
    } else if (prev_char.length+1 > e.target.value.length) { 
        if (prev_char.length-1 == e.target.value.length) {
            arr_keystroke.splice(prev_idx, 1);
            arr_keystroke.splice(idx_arr_keystroke, 1);
            console.log("DELET -----", prev_char, e.target.value, idx_arr_keystroke, prev_idx)
            SF = true
            //DELET
            //12 11 12 11 11
            //1keyTimes1 10 11 10 10
            
            // ELSE
            // 12 6 3 0 11
            // 12 6 0 0 11
            // 12 6 4 0 11
        } else if (prev_char.length > e.target.value.length) {
            SF = false;
            arr_keystroke.splice(prev_idx, 1);
        } else {
            if (prev_char.length > arr_keystroke.length) { // 17 17 17 16
                console.log("ONE.........")
                SF = true
                let arr_slice = arr_keystroke.slice(prev_idx-prev_idx, prev_idx);
                let strrr = "";
                for (var i = 0; i<prev_idx; i++) {
                    strrr += arr_slice[i]["key_name"]
                }
                // diff меторд разность строк
                const diff = patienceDiff(strrr, prev_char)
                let toUpdate = []
                diff.lines.forEach((line) => {
                    if (line.aIndex < 0 || line.bIndex < 0) {
                        toUpdate.push(line.aIndex + line.bIndex + 1)
                    }
                });
                let toFin = []
                let idx_char_prev = diff.lines[toUpdate.min()]["bIndex"];
                let temp_data = arr_keystroke[idx_char_prev-1]  
                console.log(temp_data)
                for (var i=0; i<diff.lines.length; i++) {
                    if (diff.lines[i].aIndex == -1) {
                        toFin.push({"key_name":diff.lines[i].line,
                                    "time_keydown":temp_data["time_keydown"],
                                    "time_keyup":temp_data["time_keydown"],
                                    "time_press":temp_data["time_keydown"]
                                    })
                    } 
                    
                }
                arr_keystroke.splice.apply(arr_keystroke, [toUpdate.min(), 0].concat(toFin));
            } else if (prev_char.length < arr_keystroke.length) { //16 16 16 17
                console.log("TWO.........")
                SF = true
                let arr_slice = arr_keystroke.slice(prev_idx-prev_idx, prev_idx);
                let strrr = "";
                for (var i = 0; i<prev_idx; i++) {
                    strrr += arr_slice[i]["key_name"]
                }
                const diff = patienceDiff(strrr, prev_char)
                let toUpdate = []
                diff.lines.forEach((line) => {
                    if (line.aIndex < 0 || line.bIndex < 0) {
                        toUpdate.push(line.aIndex + line.bIndex + 1)
                    }
                });
                arr_keystroke.splice(toUpdate.min(), toUpdate.max());                    
            } 
        }
    } else if (prev_char.length == prev_idx ){ //&& e.target.value.length == idx_arr_keystroke
//        console.log("ELSE", prev_char, e.target.value, idx_arr_keystroke, prev_idx)
//                    if (e.target.value.length == idx_arr_keystroke) {
        let time_up = new Date().getTime()/1000.0;
        arr_keystroke[prev_idx]["key_name"] = e.target.value[prev_idx]
        arr_keystroke[prev_idx]["time_keyup"] = time_up;
        arr_keystroke[prev_idx]["time_press"] = time_up - arr_keystroke[prev_idx]["time_keydown"];
        for (var i=prev_idx+1; i<idx_arr_keystroke; i++) {
            var keyTimes = {}
            keyTimes["key_name"] = e.target.value[i]
            keyTimes["time_keydown"] = arr_keystroke[prev_idx]["time_keydown"];
            keyTimes["time_keyup"] = arr_keystroke[prev_idx]["time_keyup"];
            keyTimes["time_press"] = arr_keystroke[prev_idx]["time_press"];
            arr_keystroke.splice(i, 0, keyTimes);
        }
        
    } else {
        
        if (e.target.value.length > idx_arr_keystroke > prev_idx) {
            SF = true
            arr_keystroke.splice(prev_idx, 1);
            // diff меторд разность строк
            const diff = patienceDiff(e.target.value, prev_char)
            let toUpdate = []
            diff.lines.forEach((line) => {
                if (line.aIndex < 0 || line.bIndex < 0) {
                    toUpdate.push(line.aIndex + line.bIndex + 1)
                }
            });
            let toFin = []
            let idx_char_prev = diff.lines[toUpdate.min()]["aIndex"];
            let temp_data = arr_keystroke[idx_char_prev]  
            console.log(diff.lines, toUpdate, e.target.value, temp_data);
            for (var i=0; i<diff.lines.length; i++) {
                if (diff.lines[i].bIndex == -1) {
                    toFin.push({"key_name":diff.lines[i].line,
                                "time_keydown":temp_data["time_keydown"],
                                "time_keyup":temp_data["time_keydown"],
                                "time_press":temp_data["time_keydown"]
                                })
                } 
                
            }
            console.log(toFin);
            arr_keystroke.splice.apply(arr_keystroke, [toUpdate.min(), 0].concat(toFin));            
        } 
//        else {
//            //10 12 6 4
//            //12 18 12 6
//            console.log("ERROR NEW", prev_char.length, e.target.value.length, idx_arr_keystroke, prev_idx)
//            
//        }
        
        // 7 12 12 12 без изменений
        // 7 12 12 11 больше
        // 7 11 11 12 меньше
        // 10 14 11 7 
        
        //test 2
        //0 6 6 6
        //0 8 8 6
        // 0 8 8 8 ???
        //3 9 6 0
        
        // test 3
        //7 12 12 12
        //7 11 11 12
        //9 13 11 7
        
    } 
    console.log("KEYUP'S", prev_char, e.target.value, idx_arr_keystroke, prev_idx, arr_keystroke.length, arr_keystroke, SF) 
    if (SF==false) {
        idx_arr_keystroke = arr_keystroke.length;
    } 
    prev_char = e.target.value;
    prev_idx = idx_arr_keystroke;
}



var prev_idx = 0;
var prev_char = "";
function handle(e) {
    idx_arr_keystroke = getCaret(e.target);
    var charCode = e.which || e.keyCode;
    if (charCode == 229) {
        var keyTimes = {};
        let K;
        if (e.type == "keydown") {
            android_keydown(keyTimes);
        } else if (e.type == "keyup") { 
            android_keyup(e, keyTimes);
        }            
    } else {
        static_handle(e, charCode);
    }
}






