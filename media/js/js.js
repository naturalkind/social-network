var IP_ADDR = "178.158.131.41";
var PORT = "8888"

var innode;
var len;
var topbt;
var topbt_indicator;
var topbt_position;
var main_wrapper;
var _page = "home";
var yOffset;
var temp_position;
var isLoading = false;
var all_pages;

//window.onload = function(){
//    topbt = document.getElementById('topbt');
//    main_wrapper = document.getElementById("main-wrapper");
//}
//window.addEventListener('load', (event) => {
//    console.log(event)
//    topbt = document.getElementById('topbt');
//    main_wrapper = document.getElementById("main-wrapper");
//})
document.addEventListener('DOMContentLoaded', function() {
    console.log("load......")
    topbt = document.getElementById('topbt');
    main_wrapper = document.getElementById("main-wrapper");
}, false);


function scroll(){
//    console.log("WORK?", isLoading);
    if(isLoading) return false;
    var contentHeight = main_wrapper.offsetHeight;
    yOffset = window.pageYOffset;
    var y = yOffset + window.innerHeight;
    console.log('scroll', yOffset);
    if (_page == "chat") {
        if(y >= contentHeight){
            isLoading = false;
            topbt_position = y;
            topbt_indicator = "scroll_up";
        } else if (yOffset <= 0) {
            console.log("CHAT SCROLL", document.getElementById('IOP').innerText, yOffset);
            if (all_pages != document.getElementById('IOP').innerText) {
                ws_chat.send(JSON.stringify({"event":"loadmore", "message":document.getElementById('IOP').innerText}));
            }
        }     
    } else {
        if(y >= contentHeight){
            isLoading = true;
            topbt_position = y;
            topbt_indicator = "scroll_up";
            console.log('scroll topbt_position', topbt_position);
            try {
                getNewData(document.getElementById("DODO").getAttribute('atr'));
            } catch (err) {}
        }
    }

}
window.onscroll = scroll;

function event_topbt(e){
    var block_post = document.getElementById('block-post');
    if (topbt_indicator == "editPROFF") {
        document.body.style.overflow = 'auto';
        block_post.style.display = 'none';                     
        e.style.transform = 'rotate(0deg)';                            
    } else if (topbt_indicator == "scroll_up"){
        console.log("scroll_up...................................", topbt_position, yOffset, temp_position)
        e.style.transform = 'rotate(180deg)';
        topbt_indicator = "scroll_down";
        temp_position = yOffset;
        window.scrollTo(0, 0);
    } else if (topbt_indicator == "scroll_down") {
        console.log("scroll_down>>>>>>>>", topbt_position, yOffset, temp_position);
        e.style.transform = 'rotate(0deg)';
        window.scrollTo(0, temp_position);
        topbt_indicator = "scroll_up";
    } else if (topbt_indicator == "handler") {
        handler(e)
    } else if (topbt_indicator == "addPost") {
        document.body.style.overflow = 'auto';
        block_post.style.display = 'none';
        e.style.transform = 'rotate(0deg)';
        isLoading = false;                            
    } else if (topbt_indicator == "foll") {
        document.body.style.overflow = 'auto';
        block_post.style.display = 'none';
        main_wrapper.style.opacity = 1;
        e.style.transform = 'rotate(0deg)';
        topbt_indicator = "scroll";
    } else if (topbt_indicator = "") {
    
    }
};


function handler(e) {
    // remove this handler
    var block_post = document.getElementById('block-post');
    block_post.style.display = 'none';
    document.body.style.overflow = 'auto';
    topbt.style.transform = 'rotate(0deg)';
    main_wrapper.style.opacity = 1
    //e.target.removeEventListener(e.type, arguments.callee);
    var contentHeight = main_wrapper.offsetHeight;
    //var yOffset = window.pageYOffset;
    //topbt_position = yOffset + window.innerHeight;
    if (topbt_position > contentHeight) {
        topbt_indicator = "scroll_down";
    } else {
        topbt_indicator = "scroll_up";
    }
}


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
            console.log(e)
            try { return new ActiveXObject('Msxml2.XMLHTTP') }
            catch(e) {
                try { return new ActiveXObject('Microsoft.XMLHTTP') }
                catch(e) { return null; }
            }
        }
}

// лайк   
function LIKENODE(link){  
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

// лайк на страницах
function MY(e) {  
    document.body.onclick = function(e) {
        t=e.target||e.srcElement;
    };
}

// сделать лайк
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

// пользователи
function user(){
    var block_post = document.getElementById('block-post');
    var http = createRequestObject();
    if(http) {
        http.open('get', '/users');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                history.pushState({"view": "USS"}, null, null);
                //cont.style.opacity = 1;
                main_wrapper.style.display = 'block'
                document.body.style.overflow = 'auto';
                block_post.style.display = 'none';
                isLoading = false;
                _page = "user"
                document.getElementById('topbt').style.transform = 'rotate(0deg)';
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


// выйти
function quit(){
    var cont = document.querySelector('body'); // ищем элемент с id
    var http = createRequestObject();
    if (http) {
        http.open('get', '/logout');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                cont.innerHTML = http.responseText;
//                document.getElementById('enter').removeAttribute("onclick");
//                document.getElementById('enter').setAttribute("onclick", "enter()");
                isLoading = false;
                window.location.reload();
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


/// войти
function enter(){
    var http = createRequestObject();
    if (http) {
        http.open('get', '/login');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                
                console.log("enter...", main_wrapper)
                
                main_wrapper.innerHTML = http.responseText;
                console.log("enter...", http.responseText)
//                document.getElementById('enter').style.display = 'none';
//                isLoading = false;
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


/// регистрация форма заполнения
function addREG(){
    var http = createRequestObject();
    if (http) {
        http.open('get', '/register');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
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
        var block_post = document.getElementById('block-post'); // ищем элемент с id
        cont.style.overflow = 'auto';
        var http = createRequestObject();
            if( http )   {
                http.open('get', '/profile');
                http.onreadystatechange = function () {
                if(http.readyState == 4) {
                block_post.innerHTML = http.responseText;
                block_post.style.display = 'block';
//                var textElem = document.createElement('div');
//                textElem.id = 'close';
//                cont.insertBefore(textElem, cont.firstChild);
                topbt.style.transform = 'rotate(90deg)';
                topbt_indicator = "editPROFF"
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }

}


/// пользователя
function userPROFILE(link){
    var block_post = document.getElementById('block-post');
    var http = createRequestObject();
    if(http) {
        http.open('get', '/users/'+link);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                history.pushState({"view": "USP", 'lk': link }, null, null);
                block_post.style.display = 'none';
                main_wrapper.style.opacity = 1;
                main_wrapper.style.display = 'block';
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


///
function filterBEST(){
    var http = createRequestObject();
    if( http )   {
        http.open('get', '/best');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
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
    var wd, hd, us, cont;
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
        console.log("VIEW---------------")
        cont = document.getElementById('DODO');
        wd = 180;//300;
        hd = 160;//230;
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
                       html += "<div class='views-row' onclick='userPROFILE("+ g[R].pk +")'><img src='/media/data_image/"+g[R].fields.path_data+"/"+g[R].fields.image_user +"' width='180' height='180'><div class='user-name'><a atribut='"+g[R].pk+"' style='padding: 0px;border-radius: 7px;font-size: 20px;color: #507299;'>"+g[R].fields.username +"</a></div></div>"
                    }
                    cont.innerHTML += html;
                    isLoading = false;
                } else {
                    var f = JSON.parse(http.responseText);
                    if (atr == 'con') {
                        try {
                            document.getElementById('IOPv').innerText = f.op1;
                        } catch (err) {}
                    } else if (atr == 'user') {
                        document.getElementById('IOP').innerText = f.op1;
                    } else {
                        document.getElementById('IOP').innerText = f.op1;
                    }
                    var us = f.us;
                    var g = JSON.parse(f.data);
                    for (var R in g) {
                        var lkbt;
                        if (us != "") {
                            lkbt = "LIKE(" + g[R].pk + ")";
                        } else {
                            lkbt = "LIKE(this)";
                        }
                        var onc = "showContent(" + g[R].pk + ")";
                        var lkout = "LIKEDONE(" + g[R].pk + ")";
                        var lkovr = "LIKEOVER(" + g[R].pk + ")";
                        var img = '/media/data_image/'+g[R].fields.path_data +"/"+ g[R].fields.image;// + '.png';
                        if (atr == 'wall' || atr=='viewuser') {
                            var use = g[R].fields.user_post[2];
                            var imgh ='"'+g[R].fields.image+'"';
                            var imgv1 = '/media/data_image/'+g[R].fields.path_data +"/"+ g[R].fields.image;// + '.png';
                            var date = new Date(g[R].fields.date_post);
                            if (parseInt(date.getMinutes()) < 10) {
                                minutes = "0" + date.getMinutes();
                            } else minutes = date.getMinutes();
                            html += "<div class='message' onmouseover='getIndex(this);'><div class='views-title' style='width: 100%;float: left;'><div class='user-cord' ><img src='/media/data_image/"+ g[R].fields.user_post[1] +"/tm_"+ g[R].fields.user_post[0] +"' class='imgUs' height='400' width='auto' onclick='userPROFILE(" + use + ")'><a onclick='showContent(" + g[R].pk + ")' class='postview'><span style='font-weight: bolder;' >"+ g[R].fields.user_post[3] +"</span><span class='arrow'> → </span><span class='message-title'>" + g[R].fields.title + "</span></a></div><span class='datetime'>" + date.getHours() + ':' + minutes + "</span></div><div class='field-image' atribut=" + g[R].pk + "><img src='" + imgv1 + "'width='" + wd + "' height='" + hd + "' onclick='showImg(this)' imgb='"+ g[R].fields.image +"' class='wallpost'></div><div class='body'><div class='text' style='padding:5px;'>"+g[R].fields.body +"</div><div id='post_like_block_"+ g[R].pk +"' style='width: 100%;'><img src='/media/images/mesvF.png' onclick='comView("+g[R].pk +")'><img src='/media/images/frv1.png' onclick='LIKE("+g[R].pk +")' onmouseover='LIKEOVER("+g[R].pk +")' onmouseout='LIKEDONE("+g[R].pk +")'><img src='/media/images/rpvF.png' onclick='rpPost(" + '"' +g[R].pk + '"' +","+ '"' +us +'"'+")'><div class='box-com' style='display:none;margin: 0 auto;margin-top: 15px;' id='"+ g[R].pk +"'></div></div></div></div>";
                        } else {
                            html += "<li class='views-row' onmouseover='getIndex(this);'><div class='field-image' atribut=" + g[R].pk + "><img style='background: url("+ img +");width:300px;height:230px;background-size: cover;'  onclick='showContent(" + g[R].pk + ")'></div><div id='" + g[R].pk + "'data-tooltip='" + g[R].pk + "'></div><div id='" + g[R].pk + "' style='position: relative; opacity: 1;pointer-events: auto; display: none;'></li>";
                        }
                    }
                    if (atr == 'wall') {
                        contv.innerHTML += html;
                    } else {
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
    if (http) {
        http.open('get', '/my/'+link+'/?page=1&usps');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                var f = JSON.parse(http.responseText);
                var g = JSON.parse(f.data);
                for (var R in g) {
                    var use = g[R].fields.user_post;
                    var imgv1 = '/media/data_image/'+ g[R].fields.path_data +'/'+ g[R].fields.image// + '.png';
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

function getNewData(scrollable){
    try {
        r = document.getElementById('IOP').innerText;
        if (r != "undefined"){
            setTimeout(jsons(r, scrollable), 1200);
        }
    } catch (err) {}
}
//function scroll(){
//    console.log('scroll', window.scrollY++, isLoading);
//    if (window.scrollY++ || window.scrollY--){
//        try{document.getElementById('comps').style.opacity = "0.9";}catch (err){}
//    } else {
//        document.getElementById('comps').style.opacity = "1";
//    }
//    if(isLoading) return false;
//    main_wrapper = document.getElementById("main-wrapper");
//    var contentHeight = main_wrapper.offsetHeight;
//    var yOffset = window.pageYOffset;
//    var y = yOffset + window.innerHeight;
//    if(y >= contentHeight){
//        isLoading = true;
//        topbt_position = y;
//        topbt_indicator = "scroll_up";
//        console.log('scroll topbt_position', topbt_position);
//        try{getNewData(document.getElementById("DODO").getAttribute('atr'));} catch (err){}
//    }
//}
//window.onscroll = scroll;

var r;
function NewData(scrollable, r){
//Эмуляция AJAX запроса...
console.log(r);
if (r != "undefined"){
   setTimeout(jsons(r, scrollable), 1200);}
}


function showImg(path_data){
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post');
    block_post.style.display = 'block';
    var img = document.createElement('img');
    img.id = 'conimg';
    img.src = path_data.src;
    img.style.maxHeight = document.body.offsetHeight;
    img.style.maxWidth = document.body.offsetWidth;
    img.style.minWidth = document.body.offsetHeight/1.7;
    block_post.innerHTML = '';
    block_post.appendChild(img);
    var startPoint={};
    var nowPoint;
    var ldelay;
    topbt.style.transform = 'rotate(90deg)';
    topbt_indicator = "handler";

    block_post.addEventListener("click", handler);
    img.addEventListener('touchstart', function(event) {
        event.preventDefault();
        event.stopPropagation();
        startPoint.x=event.changedTouches[0].pageX;
        startPoint.y=event.changedTouches[0].pageY;
        ldelay=new Date();
        if (startPoint.x>400){
            if (len>innode) {
                innode++;
                var h = document.getElementsByClassName('field-image')[innode];
                try{var m = h.children[0].getAttribute('imgb');
                showImg(m);}catch (err){}
            }
        } else {
            if (innode != 0) {
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
        if (Math.abs(otk.x) > 200) {
            if (otk.x<0) {
                if (len>innode){
                          innode++;
                          var h = document.getElementsByClassName('field-image')[innode];
                          try{var m = h.children[0].getAttribute('imgb');
                          showImg(m);}catch (err){}
                          }

                /*СВАЙП ВЛЕВО(ПРЕД.СТРАНИЦА)*/
            }
            if(otk.x > 0){
                if (innode != 0) {
                          innode--;
                          var h = document.getElementsByClassName('field-image')[innode];
                          try{var m = h.children[0].getAttribute('imgb');
                          showImg(m);}catch (err){}

                          }

            /*СВАЙП ВПРАВО(СЛЕД.СТРАНИЦА)*/

            } startPoint={x:nowPoint.pageX,y:nowPoint.pageY}}
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
//    try{document.body.removeChild(document.getElementById('block-post'));}catch (err){}
    //console.log("showContent", topbt_position)
    isLoading = false;
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post'); // ищем элемент с id
//    var block_post = document.createElement('div');
//    block_post.id = 'block-post';
    block_post.style.display = 'block';
    block_post.style.background = 'rgba(0,0,0,.75)';
    block_post.style.overflow = 'auto';
    block_post.setAttribute('atr', 'con');
//    document.body.appendChild(block_post, document.body.lastChild);
    var http = createRequestObject();
    if(link != null) {
        if(http) {
            http.open('get', '/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    block_post.innerHTML = http.responseText;
//                    cont.style.display = 'block';
//                    activate_com(link);
                    try {
                        var vp = document.getElementById('video-placeholder');
                        youd = vp.getAttribute('idv');
                        youps(youd);
                        console.log(block_post.getAttribute('atr'));
                        block_post.onscroll = function () {
                            try {r = document.getElementById('IOPv').innerText;} catch (err){}
                            if(isLoading) return false;
                            var endPos = block_post.scrollHeight - block_post.clientHeight - block_post.scrollTop;
                            if (r != undefined ){
                                if(endPos === 0){
                                    isLoading = true;
                                    NewData(block_post.getAttribute('atr'), r);
                                }
                            }
                        };
                    } catch (err){}
                    topbt = document.getElementById('topbt');
                    topbt.style.transform = 'rotate(90deg)';
                    topbt_indicator = "handler";
                    // листать
                    var textElemv1 = document.createElement('a');
                    textElemv1.id = 'next';
                    var textElemv2 = document.createElement('a');
                    textElemv2.className = 'back';
                    var navlis = document.createElement('div');
                    navlis.className = 'navlis';
                    navlis.appendChild(textElemv1, navlis.firstChild);
                    navlis.appendChild(textElemv2, navlis.lastChild);
                    block_post.insertBefore(navlis, block_post.firstChild);
                    textElemv2.onclick = function LISTING(){
                        if (len>innode){
                            innode++;
                            var h = document.getElementsByClassName('field-image')[innode];
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
    try{document.getElementById('tooltip_'+link).remove();}catch(err) {}
    var tooltipElem = document.createElement('div');
    tooltipElem.id = 'tooltip_'+link;
    tooltipElem.setAttribute("style", "position: fixed;z-index: 100;max-width: 200px;padding: 10px 20px;border-radius: 2px;text-align: center;font: 14px/1.3 arial, sans-serif;color: #333;background: #fff;");
    var over = document.getElementById("post_like_block_"+link);
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
    try{document.getElementById('tooltip_'+link).remove();}catch(err) {}
}

var canvas;
var file;
var context;
var dataURL_v1;
var reader = new FileReader();
var im;
function OnOn(id) {
    console.log('canvas_'+id)
    canvas = document.getElementById('canvas_'+id);
    context = canvas.getContext('2d');
    var input = document.getElementById('id_image_'+id);
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


var textcontext, textinput;
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
//  ищем элемент с id
//  if(comv) return false;
    var conr = document.getElementById(link);
    if (comv == false) {
        var http = createRequestObject();
        if (http) {
            http.open('get', 'comment/'+link);
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
        console.log("CLOSE")
        conr.style.display = 'none';
        comv = false;
    }
}


var activmen=false;
function openMenu(){
    if(activmen == false) {
        document.getElementById('butMen').style.display = 'block';
        activmen = true;
    } else if (activmen ==true){document.getElementById('butMen').style.display = 'none';
        activmen = false;
    }
}


/// добвать пост
function addPost(){
    try{
        html ='<form class="message_form" id="message_form" style="display: block;" id="formsend"><input id="id_title" inputmode="search" placeholder="НАЗВАНИЕ" maxlength="100"><div class="field-image" style="width: auto;border: none;margin: 0 auto;"><div id="UploadBox"><span id="UploadArea"></span></div><input type="file" id="image_file" onchange="OnOnW()" style="overflow: hidden;z-index: -1;opacity: 0;display: none;"><label for="image_file" class="image_file">загрузка картинки</label><div id="cn"><canvas id="canvas" width="0" height="0"></canvas></div></div><div class="field-text"><textarea id="id_body" maxlength="400" placeholder="Введите Ваше сообщение..." onfocus="geturlimg()"></textarea></div><div id="send"><img src="/media/images/cloud.png" onclick="send_wall()" id="send-img"></div></form>';
        document.body.style.overflow = 'hidden';
        var block_post = document.getElementById('block-post');
        block_post.style.display = 'block';
        block_post.innerHTML = html;
        topbt.style.transform = 'rotate(90deg)';
        topbt_indicator = "addPost";
        //Ready();
    } catch (err){}
}

 
// Репосты 
function rpPost(link, us) {
    var http = createRequestObject();
        var linkfull = '/rppos/'+ link +'?username=' + us+'&user_blank=1';
        if (http) {
            http.open('get', linkfull);
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


// Подписка пользователь 
function addfollow(link, us, id){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    var http = createRequestObject();
    var linkfull = '/users/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=1';
    if (http) {
        http.open('post', linkfull);
        http.setRequestHeader('X-CSRFToken', crsv);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               console.log(http.responseText)
               var follow_btn = document.getElementById("follw_"+id);
               follow_btn.innerHTML = "ОТПИСАТЬСЯ";
               follow_btn.setAttribute('onclick', 'delfollow("'+ link +'","'+ us +'","'+ id +'")')
               var foll_coun = document.getElementById("foll_coun_"+id);
               foll_coun.innerHTML = parseInt(foll_coun.innerHTML)+1;
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


function delfollow(link, us, id){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    var http = createRequestObject();
    var linkfull = '/users/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=0';
    console.log(linkfull);
    if (http) {
        http.open('post', linkfull);
        http.setRequestHeader('X-CSRFToken', crsv);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
               console.log(http.responseText)
               var follow_btn = document.getElementById("follw_"+id);
               follow_btn.innerHTML = "ПОДПИСАТЬСЯ";
               follow_btn.setAttribute('onclick', 'addfollow("'+ link +'","'+ us +'","'+ id +'")')
               
               var foll_coun = document.getElementById("foll_coun_"+id);
               foll_coun.innerHTML = parseInt(foll_coun.innerHTML)-1;
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


function foll(link){
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post');
    var http = createRequestObject();
    var linkfull = '/follow/'+ link;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                block_post.innerHTML = http.responseText;
                block_post.style.display = 'block';
                main_wrapper.style.opacity = 0.2;
                //var textElem = document.createElement('div');
                //textElem.id = 'close';
                //cont.insertBefore(textElem, cont.firstChild);
                topbt.style.transform = 'rotate(90deg)';
                topbt_indicator = "foll";
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}

function folls(link){
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post');
    var http = createRequestObject();
    var linkfull = '/follows/'+ link;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                block_post.innerHTML = http.responseText;
                block_post.style.display = 'block';
                //cont.style.overflow = 'auto';
                main_wrapper.style.opacity = 0.2;
                //var textElem = document.createElement('div');
                //textElem.id = 'close';
                //cont.insertBefore(textElem, cont.firstChild);
                topbt.style.transform = 'rotate(90deg)';
                topbt_indicator = "foll";
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


//------------------------------------------------>
function FileSlicer(file) {
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


function getlkpost(link){
        document.body.style.overflow = 'hidden';
        var block_post = document.getElementById('block-post');
        var http = createRequestObject();
        var linkfull = '/getlkpost/'+ link;
        if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                block_post.innerHTML = http.responseText;
                block_post.style.display = 'block';
                main_wrapper.style.opacity = 0.2;
                //var textElem = document.createElement('div');
                //textElem.id = 'close';
                //cont.insertBefore(textElem, cont.firstChild);
                topbt.style.transform = 'rotate(90deg)';
                topbt_indicator = "foll";
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


/// мой профиль
function myPROFILE(link){
    var block_post = document.getElementById('block-post');
    var http = createRequestObject();
    if( http )   {
        http.open('get', '/my/'+link);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                //window.location.hash = ;
                history.pushState({"view": "USCON", 'lk': link }, null, null);
                //cont.style.opacity = 1;
                main_wrapper.style.display = 'block';
                block_post.style.display = 'none';
                document.body.style.overflow = 'auto';
                isLoading = false;
                _page = "myPROFILE";
                document.getElementById('topbt').style.transform = 'rotate(0deg)';
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
                canvas.style.display = "block";
                canvas.width = img.width;
                canvas.height = img.height;
                var ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0);
                dataURL_wall = canvas.toDataURL("image/png");
        }
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

// загрузка websocket файлов

var readerwall = new FileReader();
var dataURL_wall;
function OnOnW() {
    currentChunk = 1.0
    canvaswall = document.getElementById('canvas');
    canvaswall.style.display = "block";
    contextwall = canvaswall.getContext('2d');
    var inputwall = document.getElementById('image_file');
    filewall = inputwall.files;
    SelectedFile = filewall[0];
    Name = SelectedFile.name;
    fileSize = SelectedFile.size;
    type_file = Name.split(".")
    type_file = type_file[type_file.length-1].toLowerCase()
    console.log("ONNNN", Name)
    if (type_file == "png" || type_file == "jpg" || type_file == "jpeg") {
        readerwall.readAsDataURL(filewall[0]);
        readerwall.onload = function (e) {
            var im = new Image();
            im.onload = function (e) {
                canvaswall.width = im.width;
                canvaswall.height = im.height;
                contextwall.drawImage(im, 0, 0, im.width, im.height);
                dataURL_wall = canvaswall.toDataURL("image/png");
            };
            im.src = readerwall.result;
            StartUpload()
        }
    }
}


var SelectedFile;
var Name;
var fileSize;
var PR;
var sPR;

var chunkSize = 1024.0 * 1024.0;
var currentChunk;
var totalChunks;
var t_el = document.createElement("div");
t_el.id = "loader";
t_el.style.display = "block";

function Ready(){
    if(window.File && window.FileReader){ //These are the necessary HTML5 objects the we are going to use
        //document.getElementById('UploadButton').addEventListener('click', StartUpload);
        //document.getElementById('FileBox').addEventListener('change', FileChosen);
        //document.getElementById('image_file').addEventListener('change', StartUpload);
    }
    else
    {
        document.getElementById('UploadArea').innerHTML = "Your Browser Doesn't Support The File API Please Update Your Browser";
    }
} 
 

function FileChosen(evnt) {
    SelectedFile = evnt.target.files[0];
    Name = SelectedFile.name;
    fileSize = SelectedFile.size;
}

function StartUpload(){
    if(document.getElementById('image_file').value != "") {
        var Content = "<span id='NameArea'>Uploading " + SelectedFile.name + " as " + Name + "</span>";
        Content += '<div id="ProgressContainer"><div id="ProgressBar"></div></div><span id="percent">50%</span>';
        if (SelectedFile.size/1000 < 1.0) {
            Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + fileSize + " B</span>";
        } else {
            Content += "<span id='Uploaded'> - <span id='MB'>0</span>/" + fileSize / 1000000.0 + " MB</span>";
        };
        document.getElementById('UploadArea').innerHTML = Content;
        ws_wall.send(JSON.stringify({'event': 'Start', 'Name' : Name, 'Size' : fileSize }));
        totalChunks = Math.ceil((fileSize/chunkSize), chunkSize);
        sPR = 0;
        PR = (fileSize/totalChunks)/1000000.0
        UpdateBar(0);
        console.log("Event Start");
        } else {
            alert("Нужно выбрать файл");
        }
}

function UpdateBar(percent){
    document.getElementById('ProgressBar').style.width = percent + '%';
    document.getElementById('percent').innerHTML = (Math.round(percent*100.0)/100.0) + '%';
    sPR = sPR + PR;                  
    var MBDone = sPR-PR;
    document.getElementById('MB').innerHTML = MBDone;
}

/////////////
// WEB SOKET 
/////////////
// стена -------------------------------------->
var ws_wall;
function activate_wall(user_name) {
    function start_wall() {
        ws_wall = new WebSocket("ws://"+ IP_ADDR +":"+PORT+"/");
        ws_wall.onmessage = function(event) {
            var fc = document.createElement('div');
            fc.className = 'message';
            var message_data = JSON.parse(event.data);
            if (message_data["status"]=="wallpost") {
                var date = new Date(message_data.timestamp*1000);
                fc.innerHTML = '<div class="views-title" style="width: 100%;float: left;"><div class="user-cord" atribut="1165"><a onclick="myPROFILE(' +"'"+message_data.user_post+"'"+')">' + '<img src="/media/data_image/'+ message_data.path_data + '/'+ message_data.image_user +'" width="30" height="30"></a><a class="postview" onclick="showContent('+ message_data.id +')"><span style="font-weight: bolder;">' + message_data.user_post + '</span><span class="arrow"> → </span><span class="message-title">'+ message_data.title + '</span></a></div><span class="datetime">' + date.getHours() + ':' + date.getMinutes() + '</span></div><div class="field-image"><img src="/media/data_image/'+ message_data.path_data +'/'+ message_data.image +'" height="auto" width="auto" onclick="showImg(this)" class="wallpost"><div class="body"><div class="text" style="padding:5px;">'+ message_data.text +'</div><div id="post_like_block_'+ message_data.id +'" style="width: 100%"><img src="/media/images/mesvF.png" onclick="comView('+ "'" + message_data.id+ "'" +')"><img id="post_image_'+ message_data.id + '" src="/media/images/frv1.gif" onclick="LIKE('+ "'" + message_data.id +"'" +')" onmouseover="LIKEOVER('+ "'" + message_data.id + "'" + ')" onmouseout="LIKEDONE('+ "'" + message_data.id + "'" + ')"><img src="/media/images/rpvF.png" onclick="rpPost('+ "'" + message_data.id + "','" + message_data.user_post + "'" + ')"><div class="box-com" style="display:none;margin: 0 auto;margin-top: 15px;" id="' + message_data.id + '"></div></div></div></div>';
                try {
                    var tev = document.getElementById('conversation');
                    tev.insertBefore(fc, tev.firstChild);
                } catch (err) {
                    console.log("save data")
                }
                document.getElementById('block-post').removeChild(t_el);
                document.getElementById('message_form').style.display = "block";
                //alert('ЗАГУЗИЛИ');
            } else if (message_data["status"]=="deletepost") {
                
            } else if (message_data["status"]=="MoreData") {
                console.log("More Data", currentChunk <= totalChunks);
                if (currentChunk <= totalChunks) {
                        var offset = (currentChunk-1.0) * chunkSize;
                        var currentFilePart = SelectedFile.slice(offset, (offset+chunkSize));
                        var reader = new FileReader();
                        reader.onload = function (e) {
                               UpdateBar(Math.ceil((currentChunk*100.0)/totalChunks));
                               ws_wall.send(JSON.stringify({'event':'Upload', 'Name' : 'more', 'Data' : e.target.result }));
                               currentChunk++;
                        }
                        reader.readAsDataURL(currentFilePart) 
                } else {
                        console.log("Event Done");
                        document.getElementById('UploadBox').style.display = "none";
                        ws_wall.send(JSON.stringify({'event':'Done'}));
                }            
            
            } else if (message_data["status"]=="Done") { 
                    console.log("DONE");
                    
            }
        };
        ws_wall.onclose = function(){
            // Try to reconnect in 5 seconds
            setTimeout(function() {start_wall()}, 5000);
        };
    }

    if ("WebSocket" in window) {
        start_wall();
    } else {
        var formMS = document.getElementById('message_form');
        formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';

        return false;
    }
}
activate_wall();

function send_wall() {
        var title = document.getElementById('id_title');
        var body = document.getElementById('id_body');
//        var audio = document.getElementById('id_audio');
        if (title.value == "") {
            return false;
        }
        if (ws_wall.readyState != WebSocket.OPEN) {
            return false;
        }
        document.getElementById('block-post').appendChild(t_el);
        document.getElementById('message_form').style.display = "none";
        //StartUpload();
        var bx = body.value;
        var tx = title.value;
        var event = { title : tx,
                      body: bx,
                      image: dataURL_wall,
                      event: "wallpost",
                      //video : youd
                      //video : Name
                      //audio: audio
        };
        var data = JSON.stringify(event);
        //console.log(data);
        ws_wall.send(data);
}
// удалить
function deletepost(id){
    var event = { id : id, event: "deletepost"};
    var data = JSON.stringify(event);
    ws_wall.send(data);
}

//////////////////////////////////////////////////////////////////
///  комментарии /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function activate_com(post_id) {
    var ws_com;
    function start_com_ws() {
        var tev = document.getElementById('field-comment_'+post_id);
        ws_com = new WebSocket("ws://"+ IP_ADDR + ":"+PORT+"/comment/" + post_id + "/");
        ws_com.onmessage = function(event) {
            var fc = document.createElement('div');
            fc.className = 'f-c';
            var message_data = JSON.parse(event.data);
            console.log(">>>>>>>>>>>>>COM", message_data)
            if (message_data.comment_image != "") {
                fc.innerHTML = '<a>' + message_data.comment_user + '</a> ' +'<img src="media/data_image/'+ message_data.comment_image +'">'+message_data.comment_text;
            } else {fc.innerHTML = '<a>' + message_data.comment_user + '</a> '+ message_data.comment_text;}
            tev.insertBefore(fc, tev.lastChild);
        };
        ws_com.onclose = function(){
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
        console.log(dataURL_v1, typeof dataURL_v1)
        if (typeof dataURL_v1 == 'undefined') {
            dataURL_v1 = "";
        }
        var comment_text = document.getElementById('comment_text_' + cip);
        if (comment_text.value == "") {
            return false;
        }
        if (ws_com.readyState != WebSocket.OPEN) {
            return false;
        }
        var tx = comment_text.value;
        var event = { comment_text : tx,
                      comment_image: dataURL_v1 };
        var data = JSON.stringify(event);
        ws_com.send(data);
        comment_text.value = "";
    }

    var onMESv1 = document.getElementById('add_'+ post_id);
    onMESv1.onclick = function (){
        console.log('add comment');
        send_com(post_id);

    };
    return ws_com;
}
/////////////////////////// ТЕСТ

function nodeScriptReplace(node) {
        if ( nodeScriptIs(node) === true ) {
                node.parentNode.replaceChild( nodeScriptClone(node) , node );
        }
        else {
                var i = -1, children = node.childNodes;
                while ( ++i < children.length ) {
                      nodeScriptReplace( children[i] );
                }
        }

        return node;
}
function nodeScriptClone(node){
        var script  = document.createElement("script");
        script.text = node.innerHTML;

        var i = -1, attrs = node.attributes, attr;
        while ( ++i < attrs.length ) {                                    
              script.setAttribute( (attr = attrs[i]).name, attr.value );
        }
        return script;
}

function nodeScriptIs(node) {
        return node.tagName === 'SCRIPT';
}


//////////////////////////////////////////////////////////////////
//  личные сообщения /////////////////////////////////////////////
//////////////////////////////////////////////////////////////////
function privatMES(){
   var block_post = document.getElementById('block-post');
   var http = createRequestObject();
   if( http )   {
        var linkfull = '/messages';
        http.open('get', linkfull);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                history.pushState({'view':'MES'}, null, null);
                //cont.style.opacity = 1;
                main_wrapper.style.display = 'block';
                block_post.style.display = 'none';
                main_wrapper.innerHTML = http.responseText;
                //document.body.style.overflow = 'auto';
                document.getElementById('topbt').style.transform = 'rotate(0deg)';
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
                    //console.log("send P mess", http)
                    main_wrapper.innerHTML = http.responseText;
                    nodeScriptReplace(main_wrapper);
//                    var arr = m_wrapper.getElementsByTagName('script');
//                    for (var n = 0; n < arr.length; n++) {
//                        eval(arr[n].innerHTML);
//                        }
                }
            };
            http.send(data);
        }
    } else {alert('Не нажимай лишний раз кнопку, если не заполнил поле')}
}

//////////////////////////////
//////////////////////////////
//////////////////////////////
var WS_UA = navigator.userAgent.toLowerCase();

var browser={
  version: (WS_UA.match( /.+(?:me|ox|on|rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [0,'0'])[1],
  opera: /opera/i.test(WS_UA),
  msie: (!this.opera && /msie/i.test(WS_UA)),
  msie6: (!this.opera && /msie 6/i.test(WS_UA)),
  msie7: (!this.opera && /msie 7/i.test(WS_UA)),  
  msie8: (!this.opera && /msie 8/i.test(WS_UA)),
  mozilla: /firefox/i.test(WS_UA),
  chrome: /chrome/i.test(WS_UA),
  safari: (!this.chrome && /webkit|safari|khtml/i.test(WS_UA)),
  iphone: /iphone/i.test(WS_UA),
  ipad: /ipad/i.test(WS_UA)
}



function $(obj){	
  if(typeof(obj)=='object') return obj;	
  if(typeof(obj)!='string' || !obj) return false;
  if (document.getElementById) return document.getElementById(obj);  
  else if (document.all) return document.all[obj];
  else if (document.layers) return document.layers[obj]; 
  return false;
}

function get_doc_body(){
  return document.body || document.documentElement;
}

function abs_pos(obj) {
  var a={'x': 0, 'y':0, 'w':0, 'h':0};
  if(!(obj=$(obj))) return a;
  a['w']=parseInt(get_style(obj, 'width'));  
  a['h']=parseInt(get_style(obj, 'height'));
  while(obj){ 	
    a['x']+=obj.offsetLeft;
    a['y']+=obj.offsetTop;
    obj=obj.offsetParent; 
  } 
  if(WS_UA.indexOf("Mac")!=-1 && typeof(document.body.leftMargin)!="undefined"){
    a['x']+=document.body.leftMargin;
    a['y']+=document.body.topMargin;
  }  
  return a; 
}

function get_client_width(){
  return ( (document.compatMode=='CSS1Compat') && !window.opera) ? document.documentElement.clientWidth : document.body.clientWidth;
}

function get_client_height(){
  return ((document.compatMode=='CSS1Compat') && !window.opera) ? document.documentElement.clientHeight : document.body.clientHeight;
}

function get_scroll_top(obj){
  if(!(obj=$(obj))) return 0;
  else if(typeof(obj.scrollTop)!='undefined') return obj.scrollTop;
  else if(typeof(obj.pageYOffset)!='undefined') return obj.pageYOffset;
  return 0;
}

function get_scroll_height(obj){
  if(!(obj=$(obj))) return 0; 
  return (obj.scrollHeight>obj.offsetHeight) ? obj.scrollHeight : obj.offsetHeight;
}

function set_scroll_top(obj, p){
//  console.log("set_scroll_top>>>", obj, p)
  if(!(obj=$(obj))) return false;
    p=parseInt(p)
  if(typeof(obj.scrollTop)!='undefined') obj.scrollTop=p;
  
  else if(typeof(obj.pageYOffset)!='undefined') obj.pageYOffset=p;
  return false;
}

function each(obj, callback) {
  var name, i=0, length=obj.length;
  if ( length === undefined ) {
    for ( name in obj )
      if ( callback.call( obj[ name ], name, obj[ name ] ) === false )
        break;
  } else
    for ( var value = obj[0];
      i < length && callback.call( value, i, value ) !== false; value = obj[++i] ){}
	
  return obj;
}

function get_class_style(selector, prop) {
  if(document.styleSheets){
    for(var i = 0; i<document.styleSheets.length; i++){
      var styleRules=document.styleSheets[i];
      try{
	    if(styleRules.rules) styleRules=styleRules.rules;		
	    else if(styleRules.cssRules) styleRules=styleRules.cssRules;	  
	  }catch(e){continue;}	
	  if(!styleRules) continue;	
      for(var j=0; j<styleRules.length; j++) {
        if(styleRules[j].selectorText.toLowerCase()==selector.toLowerCase()){ 
		  return (styleRules[j].style[prop]) ? styleRules[j].style[prop] : undefined; 
		}
      }
    }
  }
  return undefined;
}

function get_style(obj, name, force) {
  if(!(obj=$(obj))) return;  
  if(typeof(force)=="undefined") force=true;
  
  if(!force && name == 'opacity' && browser.msie) {
    var filter = obj.style['filter'];
    return filter ? (filter.indexOf("opacity=") >= 0 ?
      (parseFloat(filter.match(/opacity=([^)]*)/)[1] ) / 100) + '' : '1') : '';
  }  

  if(force && (name=='width' || name=='height')) {	  
 	if(name=='width' && obj.offsetWidth) return obj.offsetWidth+'px';
	else if(name=='height' && obj.offsetHeight) return obj.offsetHeight+'px';
	force=false;
  }

  if(!force && typeof(obj.style[name])!='undefined' && obj.style[name]) 
    return obj.style[name];

  var ret, defaultView = document.defaultView || window;
  if (defaultView.getComputedStyle) {
    name = name.replace( /([A-Z])/g, "-$1" ).toLowerCase();
    var computedStyle = defaultView.getComputedStyle( obj, null );
    if (computedStyle) ret = computedStyle.getPropertyValue(name);
	
  }else if (obj.currentStyle) {
    if (name == 'opacity' && browser.msie) {
      var filter = obj.currentStyle['filter'];
      return filter && filter.indexOf("opacity=") >= 0 ?
        (parseFloat(filter.match(/opacity=([^)]*)/)[1] ) / 100) + '' : '1';
    }
    var camelCase = name.replace(/\-(\w)/g, function(all, letter){
      return letter.toUpperCase();
    });
    ret = obj.currentStyle[name] || obj.currentStyle[camelCase];
    //dummy fix for ie
    if(ret == 'auto') ret = 0;
    // If we're not dealing with a regular pixel number
    // but a number that has a weird ending, we need to convert it to pixels
    if ( !/^\d+(px)?$/i.test( ret ) && /^\d/.test( ret ) ) {
      // Remember the original values
      var left = style.left, rsLeft = obj.runtimeStyle.left;

      // Put in the new values to get a computed value out
      obj.runtimeStyle.left = obj.currentStyle.left;
      style.left = ret || 0;
      ret = style.pixelLeft + "px";

      // Revert the changed values
      style.left = left;
      obj.runtimeStyle.left = rsLeft;
    }
  }

  if((!ret || ret=='0px') && obj.className){
    var x=get_class_style('.'+obj.className, name);  
	if(x) ret=x;
  }
  
  return ret;
}

function set_style(obj, name, value){
  if(!(obj=$(obj))) return;
  if(typeof(name)=='object') 
    return each(name, function(k, v){ set_style(obj, k, v);} );
  if(name == 'opacity'){
    if(browser.msie){
      obj.style.filter = (is_int(value)) ? "alpha(opacity=" + value*100 + ")" : '';
      obj.style.zoom = 1;
    };
    obj.style.opacity = value;
	
  }else{
    var isNum = typeof(value)=='number' && !(/z-?index|font-?weight|opacity|zoom|line-?height/i).test(name);
    if(isNum && value<0 && (/^(width|height)$/i).test(name)) value = 0; //fix for IE;
    obj.style[name] = isNum ? value + 'px' : value;
  }
} 


//////////////////////////////
//////////////////////////////
//////////////////////////////


function mesID(thread_id, user_name, number_of_messages){
   var http = createRequestObject();
   if( http )   {
        var linkfull = 'messages/chat/' + thread_id;
        http.open('get', linkfull);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                activate_chat(thread_id, user_name, number_of_messages);
                //document.body.style.overflow = "hidden";
                //--------------------------------------------------------------->
                // работает                
                window.scrollBy(0, document.getElementById("conver").scrollHeight);
                _page = "chat";
                document.getElementById('topbt').style.transform = 'rotate(0deg)';
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


function auto_height_text(elem) {  /* javascript */
    elem.style.height = "1px";
    elem.style.height = (elem.scrollHeight)+"px";
}

var ws_chat;
function activate_chat(thread_id, user_name, number_of_messages) {
    var received = document.getElementById('received').innerText;
    var sent = document.getElementById('sent').innerText;
    console.log("activate_chat", thread_id);
    function start_chat_ws() {
        var tev = document.getElementById('conver');
        ws_chat = new WebSocket("ws://"+ IP_ADDR +":"+PORT+"/" + thread_id + "/");
        ws_chat.onmessage = function(event) {
            var message_data = JSON.parse(event.data);
            if (message_data["event"] == "privatemessages") {
                var date = new Date(message_data.timestamp*1000);
                tev.innerHTML += '<div class="message"><p class="author ' + ((message_data.sender == user_name) ? 'we' : 'partner') + '"><img src="/media/data_image/'+ message_data.path_data +'/tm_'+ message_data.image_user +'" class="usPr" onclick="myPROFILE('+ "'" + message_data.sender + "'" +')"></p><p class="txtmessage '+((message_data.sender == user_name) ? 'we' : 'partner') + '">' + message_data.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />') + '<span class="datetime" style="font-size: 15px;color: #afafaf;">' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</span></p></div>';

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
                //document.getElementById("conver").scrollTop = document.getElementById("conver").scrollHeight;
                var tempNewVal = parseInt(document.getElementById("wscroll").scrollHeight) + 100;
                console.log(tempNewVal);
                set_style('wscroll', 'height', tempNewVal);
                window.scrollBy(0, tempNewVal);
                // Работает старая версия
                //window.scrollBy(0, document.getElementById("conver").scrollHeight);
                
            } else if (message_data["event"]=="loadmore") {
            //----------------------------------->
                var request_user_id = message_data["request_user_id"];
                var g = JSON.parse(message_data.data);
                all_pages = message_data.all_pages;
                document.getElementById('IOP').innerText = message_data.op1;
                var final_string = "";
                for (var R in g) {
                    var data_path = g[R].fields.sender[1];
                    var image_file = g[R].fields.sender[0];
                    var sender_id = g[R].fields.sender[2];
                    var sender_name = g[R].fields.sender[3];
                    var temp_string = document.createElement('div');
                    temp_string.className = "message";
                    if (request_user_id == sender_id) {
                        temp_string.innerHTML += '<p class="author we"><img src="/media/data_image/'+ data_path +'/tm_'+ image_file +'" class="usPr" onclick="myPROFILE('+ sender_name +')" style="float:none;"><p class="txtmessage we">'+ g[R].fields.text +'<span class="datetime" style="font-size: 15px;color: #afafaf;">'+g[R].fields.datetime +'</span></p></p>';
                    } else { 
                        temp_string.innerHTML += '<p class="author partner"><img src="/media/data_image/'+ data_path +'/tm_'+ image_file +'" class="usPr" onclick="userPROFILE('+ sender_name +')" style="float:none;"><p class="txtmessage partner">'+ g[R].fields.text +'<span class="datetime" style="font-size: 15px;color: #afafaf;">'+g[R].fields.datetime +'</span></p></p>';
                    }
                    document.getElementById("conver").insertBefore(temp_string, document.getElementById("conver").firstChild); 
                }    
//                cont.innerHTML += html;
//                isLoading = false;
            //----------------------------------->                
            }
        };
        ws_chat.onclose = function(){
            // переподключение через 5 секунд
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

    var onMESv1 = document.getElementById('btn');
    onMESv1.addEventListener('click', send_message);
    onMESv1.onclick = function (){
        send_message();
    };
    
}

function send_message() {
    var textarea = document.getElementById('message_textarea');
    if (textarea.innerText == "") {
        return false;
    }
    if (ws_chat.readyState != WebSocket.OPEN) {
        return false;
    }
    ws_chat.send(JSON.stringify({"event":"privatemessages", "message":textarea.innerText}));
    textarea.innerText = "";
}

document.addEventListener('keypress', function (e) {
    console.log(">>>>>>>>>>>>>>>>", _page);
    if (_page == "chat") {
        if (e.keyCode == 13 && !event.shiftKey) {
            e.preventDefault();
            send_message();
            return false;
        } 
    }
});

