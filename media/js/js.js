/// листалка
var innode;
var len;
function getIndex(node) {
    var childs = node.parentNode.children;
  for (i = 0; i < childs.length; i++) {
      len = childs.length;
    if (node == childs[i]) break;
  }
  return  innode=i;
}
function createRequestObject() {
        try { return new XMLHttpRequest() }
        catch(e) {
            try { return new ActiveXObject('Msxml2.XMLHTTP') }
            catch(e) {
                try { return new ActiveXObject('Microsoft.XMLHTTP') }
                catch(e) { return null; }
            }
        }
    }
function LIKENODE(link){  // лайк
var cont = document.getElementById('like_count');
var linkfull = '/add_like/?post_id='+link;
    var http = createRequestObject();
    if( http )   {
            http.open('get', linkfull);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}

function MY(e) {  // лайк на страницах
    document.body.onclick = function(e) {
        t=e.target||e.srcElement;
    };
}
function LIKE(link){
MY();
if (isNaN(link) == false) {
    var linkfull = '/add_like/?post_id=' + link;
    var http = createRequestObject();
    if (http) {
        http.open('get', linkfull);
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                document.getElementById(link).innerHTML = http.responseText;
                document.getElementById(link).style.display = 'block';
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
} else {
    link.innerHTML = "регистрируйся";
  }
}

function ool(id){
    console.log(document.cookie);
    var strCookies = document.cookie;
    var cookiearray = strCookies.split(';');
    for(var i=0; i<cookiearray.length; i++){
      var name = cookiearray[i].split('=')[0];
      var value = cookiearray[i].split('=')[1];
        console.log(value);
}
    console.log(id);
//    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value; // токен
    var link ='/getapi/'+id;
    var client = new XMLHttpRequest();
    client.open("DELETE", link, true);
    client.setRequestHeader('X-CSRFToken', value);
    client.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    client.send(null);
}
var gem;
var rpv;

/// пользователи
function user(){
    var contv = document.getElementById('block-post');
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/users');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    history.pushState({"view": "USS"}, null, null);
//                    cont.style.opacity = 1;
                    cont.style.display = 'block'
                    document.body.style.overflow = 'auto';
                    contv.style.display = 'none';
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
/// выйти
function quit(){
    var cont = document.querySelector('body'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/logout');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
/// войти
function exit(){
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/login');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    document.getElementById('exitv').style.display = 'none';
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
/// регистрация форма заполнения
function addREG(){
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/register');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
/// редактировать профиль
function editPROFF (){
        document.body.style.overflow = 'hidden';
        var cont = document.getElementById('block-post'); // ищем элемент с id
        cont.style.overflow = 'auto';
        var http = createRequestObject();
            if( http )   {
                http.open('get', '/profile');
                http.onreadystatechange = function () {
                if(http.readyState == 4) {
                cont.innerHTML = http.responseText;
                cont.style.display = 'block';
//                var textElem = document.createElement('div');
//                textElem.id = 'close';
//                cont.insertBefore(textElem, cont.firstChild);
                var textElem = document.getElementById('topbt');
                textElem.onclick = function(){
                          document.body.style.overflow = 'auto';
                          cont.style.display = 'none';
                      };
//                console.log(http.responseText);
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }

}
/// пользователя
function userPROFILE(link){
    var bl = document.getElementById('block-post');
//    var cont = document.body;
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/users/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    history.pushState({"view": "USP", 'lk': link }, null, null);
                    bl.style.display = 'none';
                    cont.style.opacity = 1;
                    cont.style.display = 'block';
                    document.body.style.overflow = 'auto';
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
function profilePOST(link){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value; // токен
    console.log(crsv);
        var linkfull = '/profile/?username='+link;
        var http = new XMLHttpRequest();
        if (http) {
            event = { my_image: dataURL_v1 };
            data = JSON.stringify(event);
            //alert( data );
            http.open('post', linkfull, true);
            http.setRequestHeader('X-CSRFToken', crsv);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    alert('Все загружено!!!')
                }
            };
            http.send(data);
        } else {
            document.location = link;
        }
}
function privatMES(){
       var contv = document.getElementById('block-post');
       var cont = document.getElementById('main-wrapper');
       var http = createRequestObject();
       if( http )   {
            var linkfull = '/messages';
            http.open('get', linkfull);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    history.pushState({'view':'MES'}, null, null);
//                    cont.style.opacity = 1;
                    cont.style.display = 'block'
                    contv.style.display = 'none';
//                    document.body.style.overflow = 'auto';
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
function createMES(){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value; // токен
    console.log(crsv);
    var cont = document.getElementById('message').value;
    var id_text = document.getElementById('recipient_name').value;
    if (cont) {
        var linkfull = 'messages/send_message/';
        var http = new XMLHttpRequest();
        if (http) {
            var event = { message:cont,
                         recipient_name:id_text };

            var data = JSON.stringify(event);
            http.open('post', linkfull, true);
            http.setRequestHeader('X-CSRFToken', crsv);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                }
            };
            http.send(data);
        }
    } else {alert('Не нажимай лишний раз кнопку, если не заполнил поле')}
}
function getNumEnding(iNumber, aEndings) {
    var sEnding, i;
    iNumber = iNumber % 100;
    if (iNumber>=11 && iNumber<=19) {
        sEnding=aEndings[2];
    }
    else {
        i = iNumber % 10;
        switch (i)
        {
            case (1): sEnding = aEndings[0]; break;
            case (2):
            case (3):
            case (4): sEnding = aEndings[1]; break;
            default: sEnding = aEndings[2];
        }
    }
    return sEnding;
}
//  личные сообщения!
function activate_chat(thread_id, user_name, number_of_messages) {

    var received = document.getElementById('received').innerText;
    var sent = document.getElementById('sent').innerText;
    var ws;
    function start_chat_ws() {
        var tev = document.getElementById('conver');
        ws = new WebSocket("ws://178.158.131.41:8998/" + thread_id + "/");
        ws.onmessage = function(event) {
            var message_data = JSON.parse(event.data);
            var date = new Date(message_data.timestamp*1000);
//<a onclick="myPROFILE(' +"'"+message_data.sender+"'"+')">' + message_data.sender + '</a>
            tev.innerHTML += '<div class="message"><p class="author ' + ((message_data.sender == user_name) ? 'we' : 'partner') + '"><img src="/media/'+ message_data.sender +'_tm.png" class="usPr" onclick="myPROFILE('+ "'" + message_data.sender + "'" +')"></p><p class="txtmessage '+((message_data.sender == user_name) ? 'we' : 'partner') + '">' + message_data.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />') + '<span class="datetime" style="font-size: 15px;color: #afafaf;">' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</span></p></div>';

            number_of_messages++;
            if (message_data.sender == user_name) {
                sent++;
            } else {
                received++;
            }
            var tev1 = document.getElementById('messages');
            if (tev1){
            tev1.innerHTML = '<span id="total">' + number_of_messages + '</span> ' + getNumEnding(number_of_messages, ["сообщение", "сообщения", "сообщений"]) + ' (<span id="received">' + received + '</span> получено, <span id="sent">' + sent + '</span> отправлено)';
            }
        };
        ws.onclose = function(){
            // Try to reconnect in 5 seconds
            setTimeout(function() {start_chat_ws()}, 5000);
        };
    }

    if ("WebSocket" in window) {
        start_chat_ws();
    } else {
        var formMS = document.getElementById('message_form');
        formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';

        return false;
    }

    function send_message() {
        var textarea = document.getElementById('message_textarea');
        if (textarea.value == "") {
            return false;
        }
        if (ws.readyState != WebSocket.OPEN) {
            return false;
        }
        ws.send(textarea.value);
        textarea.value = "";
    }

//    var onMES = document.getElementById('message_textarea');
    var onMESv1 = document.getElementById('btn');
//    onMES.onclick = function (){
//        send_message();
//    };
    onMESv1.onclick = function (){
        send_message();

    };

}
////
function mesID(thread_id, user_name, number_of_messages){
    var cont = document.getElementById('main-wrapper');
       var http = createRequestObject();
       if( http )   {
            var linkfull = 'messages/chat/' + thread_id;
            http.open('get', linkfull);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    activate_chat(thread_id, user_name, number_of_messages);
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
function filterBEST(){
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/best');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }

}
var userName;
function useimg(use){
    var http = createRequestObject();
    if( http )   {
    http.open('get', '/userid/'+use);
    http.onreadystatechange = function () {
            if(http.readyState == 4) {
            var g = JSON.parse(http.responseText);
            userName = g.username;
            }
    };
    http.send(null);
   }
}
function jsons(link, atr){
        var linkfull;
        var wd, hd, us,cont;
        console.log(atr);
        if (atr == 'user'){
            cont = document.getElementById('DODO');
            wd = 300;
            hd = 230;
            us = document.querySelector('h3').innerText;
            linkfull = '/my/'+us+'/?page=' + link;
        }
        else if (atr == 'viewuser'){
            cont = document.getElementById('DODO');
            wd = "auto";
            hd = "auto";
            us = document.querySelector('h3').innerText;
            linkfull = '/my/'+us+'/?page=' + link;
        }
        else if (atr == 'users'){
            cont = document.getElementById('DODO');
            wd = 300;
            hd = 230;
            linkfull = 'users/?page=' + link;
        }
        else if (atr=='con'){
            cont = document.getElementById('DOD');
            wd = 220;
            hd = 150;
            try{
            var con = cont.getAttribute('icon');}catch (err){return false}
            linkfull = '/'+con+'/?page=' + link;

        }
        else if (atr == 'wall'){
            var contv = document.getElementById('conversation');
            cont = document.getElementById('DODO');
            wd = "auto";
            hd = "auto";
            linkfull = '/?page=' + link;
        }
        else {
            cont = document.getElementById('DODO');
            linkfull = '/json/?page=' + link;
            wd = 300;
            hd = 230;
        }
        var html = '';
        var http = new XMLHttpRequest();
        if (http) {
            http.open('get', linkfull, true);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
            if (http.readyState == 4) {
                        if (atr == 'users'){
                               var f = JSON.parse(http.responseText);
                               var g = JSON.parse(f.data);
                               document.getElementById('IOP').innerText = f.op1;
                               for (var R in g) {
                                   html += "<div class='views-row' onclick='userPROFILE("+ g[R].pk +")'><img src='/media/"+g[R].fields.username +".png' width='180' height='180'><div class='user-name'><a atribut='"+g[R].pk+"' style='padding: 0px;border-radius: 7px;font-size: 20px;color: #507299;'>"+g[R].fields.username +"</a></div></div>"
                               }
                        cont.innerHTML += html;
                        isLoading = false;
//                        console.log(g);
                           } else {
                        var f = JSON.parse(http.responseText);
                        if (atr == 'con') {
                            try {
                                document.getElementById('IOPv').innerText = f.op1;
                            } catch (err) {
                            }
                        }
                        else if (atr == 'user') {
                            document.getElementById('IOP').innerText = f.op1;
                        }
                        else {
                            document.getElementById('IOP').innerText = f.op1;
                        }
                        var us = f.us;
                        var g = JSON.parse(f.data);
                        for (var R in g) {
                            var lkbt;
                            if (us != "") {
                                lkbt = "LIKE(" + g[R].pk + ")";
                            }
                            else {
                                lkbt = "LIKE(this)";
                            }
                            var onc = "showContent(" + g[R].pk + ")";
                            var lkout = "LIKEDONE(" + g[R].pk + ")";
                            var lkovr = "LIKEOVER(" + g[R].pk + ")";
//                            var img = '/media/' + g[R].fields.image + '_tm.png';
                            var img = '/media/' + g[R].fields.image + '.png';
                        if (atr == 'wall' || atr=='viewuser') {
                                var use = g[R].fields.user_post;
                                var imgh ='"'+g[R].fields.image+'"';
                                var imgv1 = '/media/' + g[R].fields.image + '.png';
                                var date = new Date(g[R].fields.date_post);
                                if (parseInt(date.getMinutes()) < 10) {
                                    minutes = "0" + date.getMinutes();
                                } else minutes = date.getMinutes();
//                                var month = new Array();
//                                month[0] = "янв";
//                                month[1] = "фев";
//                                month[2] = "март";
//                                month[3] = "апр";
//                                month[4] = "май";
//                                month[5] = "июнь";
//                                month[6] = "июль";
//                                month[7] = "авг";
//                                month[8] = "сен";
//                                month[9] = "окт";
//                                month[10] = "нояб";
//                                month[11] = "дек";
//                                var n = month[date.getMonth()];
//onclick='rpPost("+g[R].pk +","+'sadko'+")'
//                                html += "<div class='message' onmouseover='getIndex(this);'><div class='views-title' style='width: 100%;float: left;'><div class='user-cord' ><img src='/media/images/oneProf.png' class='imgUs' height='400' width='auto' onclick='userPROFILE(" + use + ")'><a onclick='showContent(" + g[R].pk + ")' class='postview'>" + g[R].fields.title + "→</a></div><span class='datetime'>" + date.getDate() + " " + n + " " + date.getFullYear() + " в " + date.getHours() + ':' + minutes + "</span></div><div class='field-image' atribut=" + g[R].pk + "><img src='" + imgv1 + "'width='" + wd + "' height='" + hd + "' onclick='showContent(" + g[R].pk + ")' class='wallpost'></div></div>";
                                html += "<div class='message' onmouseover='getIndex(this);'><div class='views-title' style='width: 100%;float: left;'><div class='user-cord' ><img src='/media/images/oneProf.png' class='imgUs' height='400' width='auto' onclick='userPROFILE(" + use + ")'><a onclick='showContent(" + g[R].pk + ")' class='postview'>" + g[R].fields.title + "→</a></div><span class='datetime'>" + date.getHours() + ':' + minutes + "</span></div><div class='field-image' atribut=" + g[R].pk + "><img src='" + imgv1 + "'width='" + wd + "' height='" + hd + "' onclick='showImg("+ imgh +")' imgb='"+ g[R].fields.image +"' class='wallpost'></div><div class='body'><div class='text' style='padding:5px;'>"+g[R].fields.body +"</div><div style='width: 100%;'><img src='/media/images/mesvF.png' onclick='comView("+g[R].pk +")'><img src='/media/images/frv1.png' onclick='LIKE("+g[R].pk +")' onmouseover='LIKEOVER("+g[R].pk +")' onmouseout='LIKEDONE("+g[R].pk +")'><img src='/media/images/rpvF.png' onclick='rpPost(" + '"' +g[R].pk + '"' +","+ '"' +us +'"'+")'><div class='box-com' style='display:none;margin: 0 auto;margin-top: 15px;' id='"+ g[R].pk +"'></div></div></div></div>";
//                                var ss = '<div class="body"><div class="text" style="padding:5px;"></div><div style="width: 100%"><img src="/media/images/mesvF.png" onclick="comView('+37+')"><img src="/media/images/frv1.png" onclick="LIKE('+37+ ')" onmouseover="LIKEOVER('+37+')" onmouseout="LIKEDONE('+37+')"><img src="/media/images/rpvF.png" onclick="rpPost('+37+','+sadko+')"><div class="box-com" style="display:none;margin: 0 auto;margin-top: 15px;" id="37"></div></div></div>';
                        }
                            else {
//                            html += "<li class='views-row' onmouseover='getIndex(this);'><div class='field-image' atribut=" + g[R].pk + "><img src='" + img + "'width='" + wd + "' height='" + hd + "' onclick='showContent(" + g[R].pk + ")'></div><div id='" + g[R].pk + "'data-tooltip='" + g[R].pk + "'><button onclick='" + lkbt + "' onmouseout='" + lkout + "' onmouseover='" + lkovr + "'>нравится | " + g[R].fields.likes.length + "</buttom></div><div id='" + g[R].pk + "' style='position: relative; opacity: 1;pointer-events: auto; display: none;'></li>";
                                html += "<li class='views-row' onmouseover='getIndex(this);'><div class='field-image' atribut=" + g[R].pk + "><img style='background: url("+ img +");width:300px;height:230px;background-size: cover;'  onclick='showContent(" + g[R].pk + ")'></div><div id='" + g[R].pk + "'data-tooltip='" + g[R].pk + "'></div><div id='" + g[R].pk + "' style='position: relative; opacity: 1;pointer-events: auto; display: none;'></li>";
                            }
                        }
                        if (atr == 'wall') {
                            contv.innerHTML += html;
                        }
                        else {
                            cont.innerHTML += html;
                        }
                        isLoading = false;
                    }
                }
            };
            http.send();
        } else {
            document.location = link;
        }
}
function userViewPost(link){
    var contv = document.getElementById('DODO');
    contv.setAttribute('atr','viewuser');
        var html = '';
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/my/'+link+'/?page=1&usps');
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    var f = JSON.parse(http.responseText);
                    var g = JSON.parse(f.data);
                    for (var R in g) {
                            var use = g[R].fields.user_post;
                            var imgv1 = '/media/' + g[R].fields.image + '.png';
                            var date = new Date(g[R].fields.date_post);
                            if (parseInt(date.getMinutes()) < 10) {
                                minutes = "0" + date.getMinutes();
                            } else minutes = date.getMinutes();
                            var month = new Array();
                            month[0] = "янв";
                            month[1] = "фев";
                            month[2] = "март";
                            month[3] = "апр";
                            month[4] = "май";
                            month[5] = "июнь";
                            month[6] = "июль";
                            month[7] = "авг";
                            month[8] = "сен";
                            month[9] = "окт";
                            month[10] = "нояб";
                            month[11] = "дек";
                            var n = month[date.getMonth()];
                            var wd = "auto";
                            var hd = "auto";
                            html += "<div class='message' onmouseover='getIndex(this);'><div class='views-title' style='width: 100%;float: left;'><div class='user-cord' ><img src='/media/images/oneProf.png' class='imgUs' height='400' width='auto' onclick='userPROFILE(" + use + ")'><a onclick='showContent(" + g[R].pk + ")' class='postview'>" + g[R].fields.title + "→</a></div><span class='datetime'>" + date.getDate() + " " + n + " " + date.getFullYear() + " в " + date.getHours() + ':' + minutes + "</span></div><div class='field-image'><img src='" + imgv1 + "'width='" + wd + "' height='" + hd + "' onclick='showContent(" + g[R].pk + ")' atribut=" + g[R].pk + " class='wallpost'></div></div>";
                            contv.innerHTML = html;
                        }
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
//
var isLoading = false;
function getNewData(scrollable){
    try {
        r = document.getElementById('IOP').innerText;
        if (r != "undefined"){
  setTimeout(jsons(r, scrollable), 1200);
        }
    } catch (err) {}
}
function scroll(){
    //console.log(window.scrollY++);
  if (window.scrollY++ || window.scrollY--){
      try{document.getElementById('comps').style.opacity = "0.9";}catch (err){}
      } else {document.getElementById('comps').style.opacity = "1";}
  if(isLoading) return false;
  var scrollable = document.getElementById("main-wrapper");
  var contentHeight = scrollable.offsetHeight;
  var yOffset = window.pageYOffset;
  var y = yOffset + window.innerHeight;
  if(y >= contentHeight){
    isLoading = true;
      console.log('111');
    var fg = document.getElementById('topbt');
    fg.onclick = function(){
    window.scrollTo(0, 0);
     fg.style.transform = 'rotate(180deg)';
        };
      try{
    getNewData(document.getElementById("DODO").getAttribute('atr'));} catch (err){}
  }
}
window.onscroll = scroll;

////
var r;
function NewData(scrollable, r){
//Эмуляция AJAX запроса...
console.log(r);
if (r != "undefined"){
   setTimeout(jsons(r, scrollable), 1200);}
}
function handler(e) {
	// remove this handler
    var cont = document.getElementById('block-post');
                    cont.style.display = 'none';
                    document.body.style.overflow = 'auto';
    var textElem = document.getElementById('topbt');
    textElem.style.transform = 'rotate(0deg)';
	e.target.removeEventListener(e.type, arguments.callee);
//
//	alert("You'll only see this once!");
}
function showImg(link){
    document.body.style.overflow = 'hidden';
    var cont = document.getElementById('block-post');
    cont.style.display = 'block';
    var img = document.createElement('img');
    img.id = 'conimg';
    img.src = '/media/'+link+'.png';
    img.style.maxHeight = document.body.offsetHeight;
    img.style.maxWidth = document.body.offsetWidth;
    img.style.minWidth = document.body.offsetHeight/1.7;
    cont.innerHTML = '';
    cont.appendChild(img);
    var startPoint={};
    var nowPoint;
    var ldelay;

//    img.onclick = function(){
//        if (event.x>400){
//                    if (len>innode){
//                              innode++;
//                              var h = document.getElementsByClassName('field-image')[innode];
//                              try{var m = h.children[0].getAttribute('imgb');
//                              showImg(m);}catch (err){}
//                              }
//        }else{
//                 if (innode != 0){
//                              innode--;
//                              var h = document.getElementsByClassName('field-image')[innode];
//                              try{var m = h.children[0].getAttribute('imgb');
//                              showImg(m);}catch (err){}
//                              }
//        }
//
//    };


     cont.addEventListener("click", handler);
//    cont.addEventListener("click", function(event) {
//                    cont.style.display = 'none';
//                    document.body.style.overflow = 'auto';
//        console.log('ok');
//    }, false);


//    cont.removeEventListener( "click", function(event) {console.log('remove')});

//    cont.onclick = function(){
//                    cont.style.display = 'none';
//                    document.body.style.overflow = 'auto';
//    };

//    cont.addEventListener('touchstart', function(event) {
//                    document.body.style.overflow = 'auto';
//                    cont.style.display = 'none';
//    }, false);
//->
    img.addEventListener('touchstart', function(event) {
            event.preventDefault();
            event.stopPropagation();
            startPoint.x=event.changedTouches[0].pageX;
            startPoint.y=event.changedTouches[0].pageY;
            ldelay=new Date();
            if (startPoint.x>400){
                    if (len>innode){
                              innode++;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}
                              }
            }else{
                 if (innode != 0){
                              innode--;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}
                              }
            }
    }, false);
    /*Ловим движение пальцем*/
    img.addEventListener('touchmove', function(event) {
            event.preventDefault();
            event.stopPropagation();
            var otk={};
            nowPoint=event.changedTouches[0];
            otk.x=nowPoint.pageX-startPoint.x;
            img.style.left = event.pageX;
            /*Обработайте данные*/
            /*Для примера*/
            if(Math.abs(otk.x)>200){
                if(otk.x<0){
                    if (len>innode){
                              innode++;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}
                              }

                    /*СВАЙП ВЛЕВО(ПРЕД.СТРАНИЦА)*/
                }
                if(otk.x>0){
                    if (innode != 0){
                              innode--;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}

                              }

                /*СВАЙП ВПРАВО(СЛЕД.СТРАНИЦА)*/

                }startPoint={x:nowPoint.pageX,y:nowPoint.pageY}}
    }, false);
            /*Ловим отпускание пальца*/
    img.addEventListener('touchend', function(event) {
            var pdelay=new Date();
            nowPoint=event.changedTouches[0];
            var xAbs = Math.abs(startPoint.x - nowPoint.pageX);
            var yAbs = Math.abs(startPoint.y - nowPoint.pageY);
            if ((xAbs > 20 || yAbs > 20) && (pdelay.getTime()-ldelay.getTime())<200) {
                if (xAbs > yAbs) {
                    if (nowPoint.pageX < startPoint.x){

                    if (len>innode){
                              innode++;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}
                              }


                    /*СВАЙП ВЛЕВО*/} else {
                    if (innode != 0){
                              innode--;
                              var h = document.getElementsByClassName('field-image')[innode];
                              try{var m = h.children[0].getAttribute('imgb');
                              showImg(m);}catch (err){}

                              }

                        /*СВАЙП ВПРАВО*/}
                }
            else {
            if (nowPoint.pageY < startPoint.y){/*СВАЙП ВВЕРХ*/}
            else{/*СВАЙП ВНИЗ*/}
                 }
            }
}, false);
}
function showContent(link) {
    try{
        document.body.removeChild(document.getElementById('block-post'));
    }catch (err){}
        isLoading = false;
        document.body.style.overflow = 'hidden';
//        var cont = document.getElementById('block-post'); // ищем элемент с id
        var cont = document.createElement('div');
        cont.id = 'block-post';
        cont.style.display = 'block';
        cont.style.background = 'rgba(0,0,0,.75)';
        cont.style.overflow = 'auto';
        cont.setAttribute('atr', 'con');
        document.body.appendChild(cont, document.body.lastChild);
        var http = createRequestObject();
        if(link != null){
        if( http )   {
            http.open('get', '/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;

//                    cont.style.display = 'block';
//                    activate_com(link);
         try {
                    var vp = document.getElementById('video-placeholder');
                    youd = vp.getAttribute('idv');
                    youps(youd);
                    console.log(cont.getAttribute('atr'));
                    cont.onscroll = function () {
                        try {
                      r = document.getElementById('IOPv').innerText;} catch (err){}
                      if(isLoading) return false;
                      var endPos = cont.scrollHeight - cont.clientHeight - cont.scrollTop;
                      if (r != undefined ){
                       if(endPos === 0){
                        isLoading = true;
                        NewData(cont.getAttribute('atr'), r);
                         }
                      }
                };
         } catch (err){}
                      var pageop = document.getElementById('main-wrapper');
//                      pageop.style.display = 'none';
//                      pageop.style.opacity = 0.2;

//                      var textElem = document.createElement('div');
//                      textElem.id = 'close';
//
//                      cont.insertBefore(textElem, cont.firstChild);

//                      cont.onclick = function(){
//                          document.body.style.overflow = 'auto';
//                          cont.style.display = 'none';
//                          pageop.style.opacity = 1;
//                          isLoading = false;
//                      };
                    var textElem = document.getElementById('topbt');
                    textElem.style.transform = 'rotate(90deg)';
//                      textElem.onclick = function(){
//                          pageop.style.display = 'block';
//                          document.body.style.overflow = 'auto';
//                          cont.style.display = 'none';
//                          pageop.style.opacity = 1;
//                          textElem.style.transform = 'rotate(0deg)';
//                          isLoading = false;
//                      };
                    textElem.addEventListener("click", handler);
                      // листать
                      var textElemv1 = document.createElement('a');
                      textElemv1.id = 'next';
                      var textElemv2 = document.createElement('a');
                      textElemv2.className = 'back';
                      var navlis = document.createElement('div');
                      navlis.className = 'navlis';
                      navlis.appendChild(textElemv1, navlis.firstChild);
                      navlis.appendChild(textElemv2, navlis.lastChild);
                      cont.insertBefore(navlis, cont.firstChild);
                      textElemv2.onclick = function LISTING(){
                          console.log(innode);
                          if (len>innode){
                              innode++;
                              var h = document.getElementsByClassName('field-image')[innode];
//                              var m = h.children[0];
//                              var g = m.getAttribute('atribut');
                              try{var g = h.getAttribute('atribut');}catch (err){}

                              } else {
                              textElemv2.style.display = 'none';
                              textElemv1.style.display = 'block';
                          }
                          showContent(g);
                    };
                      textElemv1.onclick = function LISTING(){
                          if (innode != 0){
                              innode--;
                              var h = document.getElementsByClassName('field-image')[innode];
//                              var m = h.children[0];
//                              var g = m.getAttribute('atribut');
                              try{var g = h.getAttribute('atribut');}catch (err){}
                              } else {
                                   textElemv1.style.display = 'none';
                                   textElemv2.style.display = 'block';
                          }
                          showContent(g);
                    };
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
    }
}
// лайки при наведении
function LIKEOVER(link) {
    var html= '';
    try{document.getElementById('tooltip').remove();}catch(err) {}

    var tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip';
    var over = document.getElementById(link);
//    over.style.display = 'block';
    var http = createRequestObject();
    var linkfull = '/likeover/?post_id=' + link;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var f = JSON.parse(http.responseText);
                for (var r in f) {
                    html += " <a>" + f[r].fields.username + "</a> ";
                }
                tooltipElem.innerHTML = html;
                over.appendChild(tooltipElem);
                var coords = over.getBoundingClientRect();
                var left = coords.left + (over.offsetWidth - tooltipElem.offsetWidth) / 2;
                if (left < 0) left = 0;
                var top = coords.top - tooltipElem.offsetHeight - 5;
                if (top < 0) {top = coords.top + over.offsetHeight + 5;}
                tooltipElem.style.left = left + 'px';
                tooltipElem.style.top = top + 'px';

            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}
function LIKEDONE(link){
    try{document.getElementById('tooltip').remove();}catch(err) {}
}

var canvas;
var file;
var context;
var dataURL_v1;
var reader = new FileReader();

var im;
function OnOn() {
    canvas = document.getElementById('canvas');
    context = canvas.getContext('2d');
    var input = document.getElementById('id_image');
    file = input.files;
    reader.readAsDataURL(file[0]);
    reader.onload = function (e) {
                im = new Image();
                im.onload = function (e) {
                    canvas.width = im.width;
                    canvas.height = im.height;
                    context.drawImage(im, 0, 0, im.width, im.height);
                    dataURL_v1 = canvas.toDataURL("image/png");
                };
                im.src = reader.result;
};

}

// комментарии
function activate_com(post_id) {
    var ws;
    function start_com_ws() {
        var tev = document.getElementById('field-comment_'+post_id);
//        var tev = document.getElementsByClassName('box-com');
        ws = new WebSocket("ws://192.168.1.50:8889/" + post_id + "/");
        ws.onmessage = function(event) {
            var fc = document.createElement('div');
            fc.className = 'f-c';
            var message_data = JSON.parse(event.data);
//            console.log(message_data);
//            var date = new Date(message_data.timestamp*1000);
            fc.innerHTML = '<a>' + message_data.user_post + '</a> ' +'<img src="'+ message_data.img +'">'+message_data.title;
            tev.insertBefore(fc, tev.lastChild);
        };
        ws.onclose = function(){
            // Try to reconnect in 5 seconds
            setTimeout(function() {start_com_ws()}, 5000);
        };
    }

    if ("WebSocket" in window) {
        start_com_ws();
    } else {
        var formMS = document.getElementById('message_form');
        formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';

        return false;
    }

    function send_com(cip) {
//        var textarea = document.getElementById('comment_text_' + cip);
//        console.log(textarea.value);
//        if (textarea.value == "") {
//            return false;
//        }
//        if (ws.readyState != WebSocket.OPEN) {
//            return false;
//        }
//        ws.send(textarea.value);
//        textarea.value = "";
        var comment_text = document.getElementById('comment_text_' + cip);
        if (comment_text.value == "") {
            return false;
        }
        if (ws.readyState != WebSocket.OPEN) {
            return false;
        }
        var tx = comment_text.value;
        var event = { comment_text : tx,
                      comment_image: dataURL_v1 };
        var data = JSON.stringify(event);
        console.log(data);
        ws.send(data);
        comment_text.value = "";
    }

//    var onMES = document.getElementById('message_textarea');

    var onMESv1 = document.getElementById('add_'+ post_id);
//    onMES.onclick = function (){
//        send_com();
//    };
    onMESv1.onclick = function (){
        console.log('ADD WORK');
        send_com(post_id);

    };
}
var textcontext, textcanvas ,textinput;
function OnOnreg() {
    var ik = document.getElementById('oimg');
    var input = document.getElementById('id_image_user');
    file = input.files;
    reader.readAsDataURL(file[0]);
    reader.onload = function (e) {
        ik.src = reader.result;
        document.getElementById('regb').style.display = 'block';
};

}
var comv = false;
function comView(link){
// ищем элемент с id
//        if(comv) return false;
        var conr = document.getElementById(link);
        if(comv == false){
        var http = createRequestObject();
        if( http )   {
            http.open('get', 'viewcom/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    var apcom = document.createElement('div');
//                    apcom.id = 'apcom_'+link;
                    comv = true;
//                    apcom.innerHTML = http.responseText;
//                    conr.appendChild(apcom);
                    conr.innerHTML = http.responseText;
                    conr.style.display = 'block';
//                    console.log(http.responseText);
                    activate_com(link);

                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
            } else {
            conr.style.display = 'none';
            comv = false;
        }
}
var activmen=false;
function openMenu(){
    if(activmen == false){
    document.getElementById('butMen').style.display = 'block';
       activmen = true;
    }
    else if(activmen ==true){document.getElementById('butMen').style.display = 'none';
       activmen = false;
    }
}
function rpPost(link, us) {
//    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    var http = createRequestObject();
        var linkfull = '/rppos/'+ link +'?username=' + us;
        if (http) {
        http.open('get', linkfull);
//        http.setRequestHeader('X-CSRFToken', crsv);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                document.getElementById(link).innerHTML = http.responseText;
                document.getElementById(link).style.display = 'block';
               console.log(http.responseText)
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }

}
/// добвать пост
function addPost(){
    try{
//      html ='<form class="message_form" style="display: block;" id="formsend"><input id="id_title" placeholder="НАЗВАНИЕ" maxlength="100"><div class="field-image" style="width: auto;border: none;margin: 0 auto;"><input onclick="OnOnvideo(this)" name="video" id="video_file" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"/><label for="video_file" class="video_file">добавить видео</label><video controls="" autoplay="" id="id_video" style="display:none;margin:0 auto;"><source id="source_video" /></video><br/><input type="file" id="image_file" onchange="OnOnW()" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"><label for="image_file" class="image_file">загрузка картинки</label><div id="cn"><canvas id="canvas" width="0" height="0"></canvas></div></div><div class="field-text"><textarea id="id_body" maxlength="400" placeholder="Введите Ваше сообщение..." onfocus="geturlimg()"></textarea></div><div class="send"><button id="btn" type="button" onclick="send_wall()">ОТПРАВИТЬ</button></div></form>';
//      html ='<form class="message_form" style="display: block;" id="formsend"><input id="id_title" placeholder="НАЗВАНИЕ" maxlength="100"><div class="field-image" style="width: auto;border: none;margin: 0 auto;"><input onclick="OnOnvideo(this)" name="video" id="video_file" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"/><label for="video_file" class="video_file">добавить видео</label><video controls="" autoplay="" id="id_video" style="display:none;margin:0 auto;"><source id="source_video" /></video><br/><input type="file" id="image_file" onchange="OnOnW()" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"><label for="image_file" class="image_file">загрузка картинки</label><div id="cn"><canvas id="canvas" width="0" height="0"></canvas></div></div><div class="field-text"><textarea id="id_body" maxlength="400" placeholder="Введите Ваше сообщение..." onfocus="geturlimg()"></textarea></div><div class="send"><img src="/media/images/cloud.png" width="50" height="50" onclick="send_wall()"></div></form>';
      html ='<form class="message_form" style="display: block;" id="formsend"><input id="id_title" placeholder="НАЗВАНИЕ" maxlength="100"><div class="field-image" style="width: auto;border: none;margin: 0 auto;"><input onclick="OnOnvideo(this)" name="video" id="video_file" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"/><label for="video_file" class="video_file" style="display: block;width: 90px;height: 55px;background:url(media/images/logo-dark.png);background-repeat: no-repeat;background-size: contain;"></label><video controls="" autoplay="" id="id_video" style="display:none;margin:0 auto;"><source id="source_video" /></video><br/><input type="file" id="image_file" onchange="OnOnW()" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"><label for="image_file" class="image_file">загрузка картинки</label><div id="cn"><canvas id="canvas" width="0" height="0"></canvas></div></div><div class="field-text"><textarea id="id_body" maxlength="400" placeholder="Введите Ваше сообщение..." onfocus="geturlimg()"></textarea></div><div class="send"><img src="/media/images/cloud.png" width="50" height="50" onclick="send_wall()"></div></form>';
      document.body.style.overflow = 'hidden';
      var contv = document.getElementById('main-wrapper');
      var cont = document.getElementById('block-post');
      cont.style.display = 'block';
      cont.innerHTML = html;
                      //var textElem = document.createElement('div');
                      //textElem.id = 'close';
                     // cont.insertBefore(textElem, cont.firstChild);
                      //textElem.onclick = function(){
                        //  document.body.style.overflow = 'auto';
                       //   contv.style.opacity = 1;
                       //   cont.style.display = 'none';
                      //};
                    var textElem = document.getElementById('topbt');
                    textElem.style.transform = 'rotate(90deg)';
                    textElem.onclick = function(){
                          document.body.style.overflow = 'auto';
                          cont.style.display = 'none';
                          textElem.style.transform = 'rotate(0deg)';
                          isLoading = false;
                      };

    }catch (err){}
}
//
var youd;
var d;
function you(){
 try{
   d =  document.getElementById('NameBox').value;
 }catch (err){};
   youd = d.split('=')[1];
    if(youd!=0){
//        console.log(youd);
     onYouTubeIframeAPIReady(document.body.offsetWidth/2);
        }else{}
}
function youps(e){
//    var vp = document.getElementById('video-placeholder');
//    youd = vp.getAttribute('idv');
//    console.log(e);
    youd = e;
    var node = document.getElementById('node');
    onYouTubeIframeAPIReady(node.offsetWidth);
}
var player;
function onYouTubeIframeAPIReady(g) {
    player = new YT.Player('video-placeholder', {
        width: g,
        height: 500,
        videoId: youd,
        playerVars: {
            color: 'white',
            iv_load_policy : 3,
            modestbranding : 1,
//            autoplay: 0,
            showinfo: 0
        },
        events: {
            onReady: you
        }
    });
}
//function initialize(){
//    console.log('ok')
//}
function playpause(e){
        console.log(e);
 var video  = document.getElementById('video');
 video.src = "/media/video/"+e;
 video.play();
 }
function addfollow(link, us){
        var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;

        var http = createRequestObject();
        var linkfull = '/users/'+ link +'/?username=' + us;
        if (http) {
        http.open('post', linkfull);
        http.setRequestHeader('X-CSRFToken', crsv);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               console.log(http.responseText)
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}
///
function FileSlicer(file) {

    // randomly picked 1MB slices,
    // I don't think this size is important for this experiment
//    this.sliceSize = 1024*1024;
//    this.sliceSize = 2048*2048;
    this.sliceSize = 1024*1024;
    this.slices = Math.ceil(file.size / this.sliceSize);

    this.currentSlice = 0;

    this.getNextSlice = function() {
        var start = this.currentSlice * this.sliceSize;
        var end = Math.min((this.currentSlice+1) * this.sliceSize, file.size);
        ++this.currentSlice;

        return file.slice(start, end);
    }
}
//var fs;


//
//			function Ready(){
//                console.log('ok');
//				if(window.File && window.FileReader){ //These are the necessary HTML5 objects the we are going to use
//					document.getElementById('UploadButton').addEventListener('click', StartUpload);
//					document.getElementById('FileBox').addEventListener('change', FileChosen);
//				}
//				else
//				{
//					document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
//				}
//			}
//			var SelectedFile;
//			function FileChosen(evnt) {
//                console.log('ok');
//                var video = document.getElementById("id_video");
//		        SelectedFile = evnt.target.files[0];
//                        video.style.display = 'block';
//        video.style.maxWidth = '600px';
//                var url = URL.createObjectURL(SelectedFile);
//                video.src = url;
//                video.play();
//				document.getElementById('NameBox').value = SelectedFile.name;
//		    }
//
//			var socket = io.connect('http://formatica.wtf:8877');
//			var FReader;
//			var Name;
//			function StartUpload(){
//				if(document.getElementById('FileBox').value != "")
//				{
//					FReader = new FileReader();
//					Name = document.getElementById('NameBox').value;
//					var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
//					Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">50%</span>';
//					Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + Math.round(SelectedFile.size / 1048576) + "MB</span>";
//					document.getElementById('UploadArea').innerHTML = Content;
//					FReader.onload = function(evnt){
//						socket.emit('Upload', { 'Name' : Name, Data : evnt.target.result });
//					};
//					socket.emit('Start', { 'Name' : Name, 'Size' : SelectedFile.size });
//				}
//				else
//				{
//					alert("Нужно выбрать файл");
//				}
//			}
//
//			socket.on('MoreData', function (data){
//				UpdateBar(data['Percent']);
//				var Place = data['Place'] * 524288; //The Next Blocks Starting Position
//				var NewFile; //The Variable that will hold the new Block of Data
//				if(SelectedFile.webkitSlice)
//					NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
//				else
//					NewFile = SelectedFile.slice(Place, Place + Math.min(524288, (SelectedFile.size-Place)));
//				FReader.readAsBinaryString(NewFile);
//			});
//			function UpdateBar(percent){
//				document.getElementById('ProgressBar').style.width = percent + '%';
//				document.getElementById('percent').innerHTML = (Math.round(percent*100)/100) + '%';
//				var MBDone = Math.round(((percent/100.0) * SelectedFile.size) / 1048576);
//				document.getElementById('MB').innerHTML = MBDone;
//			}
//
//			var Path = "http://formatica.wtf/";
//
//			socket.on('Done', function (data){
//				var Content = "Файл загрузился !!!";
//				Content += "<video id='Thumb' src='" + Path + data['Image'] + "' alt='" + Name + "'><br>";
//				Content += "<button	type='button' name='Upload' value='' id='Restart' class='Button'>Новая загрузка</button>";
//				document.getElementById('UploadArea').innerHTML = Content;
//				document.getElementById('Restart').addEventListener('click', Refresh);
//				document.getElementById('UploadBox').style.width = '270px';
//				document.getElementById('UploadBox').style.height = '270px';
//				document.getElementById('UploadBox').style.textAlign = 'center';
//				document.getElementById('Restart').style.left = '20px';
//			});
//			function Refresh(){
//				location.reload(true);
//			}

function OnOnvideo(input) {
    setInterval(you, 2000);
    var cont = document.getElementById('cn');
//    cont.innerHTML += '<div id="UploadBox"><h2>Загрузчик</h2><span id="UploadArea"><label for="FileBox">Выберите файл: </label><input type="file" id="FileBox" ><br><label for="NameBox">Имя: </label><br><button	type="button" id="UploadButton" class="Button">Загрузить</button></span></div>';
    cont.innerHTML += '<input type="text" id="NameBox"><div id="video-placeholder" onclick="onYouTubeIframeAPIReady()"></div>';
//    Ready();
//        var video = document.getElementById("id_video");
//        video.style.display = 'block';
//        video.style.maxWidth = '600px';
//        //THE METHOD THAT SHOULD SET THE VIDEO SOURCE
//    if (!(input.files && input.files[0])) {
//    } else {
//        var file = input.files[0];
////        console.log(file);
//        fs = new FileSlicer(file);
//        console.log(fs);
//        ///
//        var url = URL.createObjectURL(file);
//        video.src = url;
//        video.play();
//    }

}
function send_wall() {
        var title = document.getElementById('id_title');
        var body = document.getElementById('id_body');
////        var audio = document.getElementById('id_audio');
        if (title.value == "") {
            return false;
        }
        if (ws.readyState != WebSocket.OPEN) {
            return false;
        }
        var bx = body.value;
        var tx = title.value;
        var event = { title : tx,
                      body: bx,
                      image: dataURL_wall,
                      video : youd
//                      video : Name
//                      audio: audio
        };
        var data = JSON.stringify(event);
        console.log(data);
        ws.send(data);
        alert('ЗАГУЗИЛИ');
//        title.value = "";
//        body.value = "";

//       ws.send(fs.getNextSlice());
//    ws.onmessage = function(ms){
//        if(ms.data=="ok"){
//           fs.slices--;
//            console.log(fs.slices);
//           if(fs.slices>0) ws.send(fs.getNextSlice());
//        }else{
//           // handle the error code here.
//
//        }
//    };

}
//style="width: 90px;height: 105px;float: left;margin: 2px 5px;padding: 2px;background: #ffffff;border-radius: 4px;"
function foll(link){
        document.body.style.overflow = 'hidden';
        var pageop = document.getElementById('main-wrapper');
        var cont = document.getElementById('block-post');
        var http = createRequestObject();
        var linkfull = '/follow/'+ link;
        if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               cont.innerHTML = http.responseText;
               cont.style.display = 'block';

                pageop.style.opacity = 0.2;
//                      var textElem = document.createElement('div');
//                      textElem.id = 'close';
//                      cont.insertBefore(textElem, cont.firstChild);
                      var textElem = document.getElementById('topbt');
                      textElem.style.transform = 'rotate(90deg)';
                      textElem.onclick = function(){
                          document.body.style.overflow = 'auto';
                          cont.style.display = 'none';
                          pageop.style.opacity = 1;
                          textElem.style.transform = 'rotate(0deg)';
                      };

            }
        };
        http.send(null);
    } else {
        document.location = link;
    }

}
function folls(link){
        document.body.style.overflow = 'hidden';
        var pageop = document.getElementById('main-wrapper');
        var cont = document.getElementById('block-post');
        var http = createRequestObject();
        var linkfull = '/follows/'+ link;
        if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               cont.innerHTML = http.responseText;
               cont.style.display = 'block';
//               cont.style.overflow = 'auto';
                pageop.style.opacity = 0.2;
//                      var textElem = document.createElement('div');
//                      textElem.id = 'close';
//                      cont.insertBefore(textElem, cont.firstChild);
                      var textElem = document.getElementById('topbt');
                      textElem.style.transform = 'rotate(90deg)';
                      textElem.onclick = function(){
                          document.body.style.overflow = 'auto';
                          cont.style.display = 'none';
                          pageop.style.opacity = 1;
                          textElem.style.transform = 'rotate(0deg)';
                      };

            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}
function getlkpost(link){
        document.body.style.overflow = 'hidden';
        var pageop = document.getElementById('main-wrapper');
        var cont = document.getElementById('block-post');
        var http = createRequestObject();
        var linkfull = '/getlkpost/'+ link;
        if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               cont.innerHTML = http.responseText;
               cont.style.display = 'block';

                pageop.style.opacity = 0.2;
//                      var textElem = document.createElement('div');
//                      textElem.id = 'close';
//                      cont.insertBefore(textElem, cont.firstChild);
                      var textElem = document.getElementById('topbt');
                      textElem.style.transform = 'rotate(90deg)';
                      textElem.onclick = function(){
                          document.body.style.overflow = 'auto';
                          cont.style.display = 'none';
                          pageop.style.opacity = 1;
                          textElem.style.transform = 'rotate(0deg)';
                      };

            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}
/// мой профиль
function myPROFILE(link){
    var contv = document.getElementById('block-post');
    var cont = document.getElementById('main-wrapper'); // ищем элемент с id
        var http = createRequestObject();
        if( http )   {
            http.open('get', '/my/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    cont.innerHTML = http.responseText;
                    //
//                    window.location.hash = ;
                    history.pushState({"view": "USCON", 'lk': link }, null, null);
                    //
//                    cont.style.opacity = 1;
                    cont.style.display = 'block';
                    contv.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    isLoading = false;
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
}
window.addEventListener("popstate", function(e) {
	var state = e.state;
	if (state.view == "USCON") {
             console.log(state);
        myPROFILE(state.lk);
	} else if (state.view == "USS"){
        user()
    }else if (state.view == "USP") {
        userPROFILE(state.lk);
    }else if (state.view == "MES") {
        privatMES()
    }
});
function geturlimg(){setTimeout(draw, 5000)}
function draw() {
        var textarea = document.getElementById('id_body');
        try{
        var url = textarea.value;
        console.log(url);
        start_imgurl(url);} catch (err){}
    }
function start_imgurl(url){
        var img = document.createElement("img");
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = function() {
                canvas = document.getElementById('canvas');
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                dataURL_wall = canvas.toDataURL("image/png");
        }
}
var pageYLabel = 0;

function updown() {
  var pageY = window.pageYOffset || document.documentElement.scrollTop;
console.log(pageY);
//  switch (this.className) {
//    case 'up':
//      pageYLabel = pageY;
//      window.scrollTo(0, 0);
//      this.className = 'down';
//      break;
//
//    case 'down':
      window.scrollTo(0, 0);
//      this.className = 'up';
//  }
};
