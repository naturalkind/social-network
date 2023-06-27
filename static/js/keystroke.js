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

Array.prototype.max = function() {
  return Math.max.apply(null, this);
};

Array.prototype.min = function() {
  return Math.min.apply(null, this);
};


function android_keyup(e, keyTimes) {
    let strrr = "";
    let time_up = new Date().getTime()/1000.0;
    if (tKey[prev_idx] && typeof e.target.value[prev_idx] != "undefined") {
        arr_keystroke[prev_idx]["time_keyup"] = time_up;
    }
    for (var i = 0; i<e.target.value.length; i++) {
        let T = arr_keystroke[i];
        if (typeof T != "undefined") {
            let G = {"key_name":e.target.value[i],
             "time_keydown":T["time_keydown"],
             "time_keyup":T["time_keyup"],
             "time_press":T["time_keyup"]-T["time_keydown"]
            }
            arr_keystroke.splice(i, 1, G); 
            strrr += e.target.value[i];
        } 
    }  
    for (var i = 0; i<arr_keystroke.length; i++) {
        if (typeof arr_keystroke[i]["time_press"] == "undefined") {
            arr_keystroke.splice(i, 1);
            arr_keystroke.splice(prev_idx, 1);
            arr_keystroke.splice(idx_arr_keystroke, 1);
        }
    }   
    const diff = patienceDiff(e.target.value, strrr)
    let toUpdate = []
    diff.lines.forEach((line) => {
        if (line.aIndex < 0 || line.bIndex < 0) {
            toUpdate.push(line.aIndex + line.bIndex + 1)
        }
    });
    console.log(diff.lines, toUpdate)    
    let toFin = [];
    if (toUpdate.length != 0) {
        let temp_data = arr_keystroke[prev_idx];  
        for (var i=0; i<diff.lines.length; i++) {
            if (diff.lines[i].bIndex == -1) {
                toFin.push({"key_name":diff.lines[i].line,
                            "time_keydown":temp_data["time_keydown"],
                            "time_keyup":temp_data["time_keyup"],
                            "time_press":temp_data["time_keyup"]-temp_data["time_keydown"]
                            })
            }
        }
//    arr_keystroke.splice(prev_idx, 1)
        arr_keystroke.splice.apply(arr_keystroke, [toUpdate.min(), toUpdate.max()].concat(toFin));         
    } else {
        for (var i=0; i<diff.lines.length; i++) {
            let temp_data = arr_keystroke[i];
            toFin.push({"key_name":diff.lines[i].line,
                        "time_keydown":temp_data["time_keydown"],
                        "time_keyup":temp_data["time_keyup"],
                        "time_press":temp_data["time_keyup"]-temp_data["time_keydown"]
                        })
        }
        arr_keystroke = toFin;
    }
      
    console.log(`символы в строке: ${e.target.value.length}, размер массива: ${arr_keystroke.length}, позиции каретки: ${idx_arr_keystroke}, предыдущий индекс: ${prev_idx}, слово из массива: "${strrr}", слово из строки: "${e.target.value}"`, arr_keystroke) 
}




//| При | ве | т "пробел" в | се | м
`
Переход между словами с автодополенением
IV ---> символы в строке: 5, размер массива: 11, позиции каретки: 0, предыдущий индекс: 3
IV ---> символы в строке: 11, размер массива: 11, позиции каретки: 6, предыдущий индекс: 0
II ---> символы в строке: 11, размер массива: 11, позиции каретки: 6, предыдущий индекс: 6


Переход между словами с автодополенением в начале строки
II ---> символы в строке: 5, размер массива: 11, позиции каретки: 0, предыдущий индекс: 0
IV ---> символы в строке: 11, размер массива: 11, позиции каретки: 6, предыдущий индекс: 0
II ---> символы в строке: 11, размер массива: 11, позиции каретки: 6, предыдущий индекс: 6


III ---> символы в строке: 7, размер массива: 10, позиции каретки: 7, предыдущий индекс: 8
I ---> cимволы в строке: 11, размер массива: 11, позиции каретки: 11, предыдущий индекс: 7
II ---> символы в строке: 11, размер массива: 11, позиции каретки: 11, предыдущий индекс: 11

######## Увеличение длины слова

IV --->
IV --->
II --->


IV --->
I --->
II --->


II --->
IV --->
II --->


III --->
IV --->
II --->

`
//function getOS() {
//    var userAgent = window.navigator.userAgent,
//    platform = window.navigator?.userAgentData?.platform || window.navigator.platform,
//    macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
//    windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
//    iosPlatforms = ['iPhone', 'iPad', 'iPod'],
//    os = null;

//    if (macosPlatforms.indexOf(platform) !== -1) {
//        os = 'Mac OS';
//    } else if (iosPlatforms.indexOf(platform) !== -1) {
//        os = 'iOS';
//    } else if (windowsPlatforms.indexOf(platform) !== -1) {
//        os = 'Windows';
//    } else if (/Android/.test(userAgent)) {
//        os = 'Android';
//    } else if (/Linux/.test(platform)) {
//        os = 'Linux';
//    }

//    return os;
//}


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






