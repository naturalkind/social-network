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
    if(isLoading) return false;
    var contentHeight = main_wrapper.offsetHeight;
    yOffset = window.pageYOffset;
    var y = yOffset + window.innerHeight;
//    console.log('scroll', yOffset);
    if (_page == "chat") {
        if(y >= contentHeight){
            isLoading = false;
            topbt_position = y;
            topbt_indicator = "scroll_up";
        } else if (yOffset <= 0) {
            try {
                if (all_pages != document.getElementById('IOP').innerText) {
                    document.getElementById("dot-loader").style.display = "block";
                    ws_chat.send(JSON.stringify({"event":"loadmore", "message":document.getElementById('IOP').innerText}));
                }
            } catch(e) {}
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
    block_post.innerHTML = "";
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
//    MY(link);
    if (isNaN(link) == false) {
        var linkfull = '/add_like/?post_id=' + link;
        var http = createRequestObject();
        if (http) {
            http.open('get', linkfull);
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    console.log(http.responseText, link)
                    document.getElementById("box-indicator-"+link).innerHTML = http.responseText;
                    document.getElementById("box-indicator-"+link).style.display = 'block';
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
                main_wrapper.innerHTML = http.responseText;
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
        block_post.style.overflow = 'auto';
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
    console.log(link, atr)
    var linkfull;
    var wd, hd, us, cont;
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
                       html += "<div class='views-row' onclick='userPROFILE("+ g[R].pk +")'><img src='/media/data_image/"+g[R].fields.path_data+"/"+g[R].fields.image_user +"' width='180' height='180' loading='lazy'><div class='user-name'><a atribut='"+g[R].pk+"' style='padding: 0px;border-radius: 7px;font-size: 20px;color: #507299;'>"+g[R].fields.username +"</a></div></div>"
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
//     "+g[R].pk +"      <img src="/media/images/mesvF.png" onclick="comView(this)" open-atr="close" id-comment="{{ message.id }}" id="comment_image_id_{{ message.id }}" type-div="icon" indicator-ws="close">
                            html += "<div class='message' onmouseover='getIndex(this);'><div class='views-title' style='width: 100%;float: left;'><div class='user-cord' ><img src='/media/data_image/"+ g[R].fields.user_post[1] +"/tm_"+ g[R].fields.user_post[0] +"' class='imgUs' height='400' width='auto' onclick='userPROFILE(" + use + ")' loading='lazy'><a onclick='showContent(" + g[R].pk + ")' class='postview'><span style='font-weight: bolder;' >"+ g[R].fields.user_post[3] +"</span><span class='arrow'> → </span><span class='message-title'>" + g[R].fields.title + "</span></a></div><span class='datetime'>" + date.getHours() + ':' + minutes + "</span></div><div class='field-image' atribut=" + g[R].pk + "><img src='" + imgv1 + "'width='" + wd + "' height='" + hd + "' onclick='showImg(this)' imgb='"+ g[R].fields.image +"' class='wallpost' loading='lazy'></div><div class='body'><div class='text' style='padding:5px;'>"+g[R].fields.body +"</div><div id='post_like_block_"+ g[R].pk +"' style='width: 100%;'><img src='/media/images/mesvF.png' onclick='comView(this)' open-atr='close' id-comment="+ g[R].pk +" id='comment_image_id_"+g[R].pk+"' type-div='icon' indicator-ws='close'><img src='/media/images/frv1.png' onclick='LIKE("+g[R].pk +")' onmouseover='LIKEOVER("+g[R].pk +")' onmouseout='LIKEDONE("+g[R].pk +")'><img src='/media/images/rpvF.png' onclick='rpPost(" + '"' +g[R].pk + '"' +","+ '"' +us +'"'+")'><div class='box-com' style='display:none;margin: 0 auto;margin-top: 15px;' id='"+ g[R].pk +"'></div></div></div></div>";
                        } else {
                            html += "<li class='views-row' onmouseover='getIndex(this);'><div class='field-image' atribut=" + g[R].pk + "><img style='background: url("+ img +");width:300px;height:230px;background-size: cover;'  onclick='showContent(" + g[R].pk + ")' loading='lazy'></div><div id='" + g[R].pk + "'data-tooltip='" + g[R].pk + "'></div><div id='" + g[R].pk + "' style='position: relative; opacity: 1;pointer-events: auto; display: none;'></li>";
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
    if (r != "undefined"){
       setTimeout(jsons(r, scrollable), 1200);
   }
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
                    document.getElementById("box-indicator-"+link).innerHTML = http.responseText;
                    document.getElementById("box-indicator-"+link).style.display = 'block';
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
} 


// Подписка пользователь 

function addfollow(self, link, us, id){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    var follow = self.getAttribute("atr-follow"); 
    var linkfull;
    if (follow=="false") {
        console.log(follow, link, us, id);
        linkfull = '/users/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=1';
        self.setAttribute("atr-follow", "true");
        
    } else {
        console.log(follow, link, us, id);
        linkfull = '/users/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=0';
        self.setAttribute("atr-follow", "false");
    }
    var http = createRequestObject();
    if (http) {
        http.open('post', linkfull);
        http.setRequestHeader('X-CSRFToken', crsv);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var follow_btn = document.getElementById("follw_"+id);
                if  (follow=="false") {
                    follow_btn.innerHTML = "ОТПИСАТЬСЯ";
                    var foll_coun = document.getElementById("foll_coun_"+id);
                    foll_coun.innerHTML = parseInt(foll_coun.innerHTML)+1;
                } else {
                   follow_btn.innerHTML = "ПОДПИСАТЬСЯ";
                   var foll_coun = document.getElementById("foll_coun_"+id);
                   foll_coun.innerHTML = parseInt(foll_coun.innerHTML)-1;
                }
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


// нарезка файлов 
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


// показать понравившееся
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

/////////////////////////////////////////////////
// стена ////////////////////////////////////////
/////////////////////////////////////////////////

function showContent(link) {
    try {
        var comv = document.getElementById("comment_image_id_"+link).getAttribute("open-atr");
        if (comv == "open") {
            comView(document.getElementById("comment_image_id_"+link));
        } else {
            if (link in ws_dict){
                console.log("showContent", ws_dict, link in ws_dict);
            } else {
                ws_dict[link] = activate_com(link);
            }
            document.getElementById("comment_image_id_"+link).setAttribute("indicator-ws", "open")  
        }
    } catch (e) {} 
    console.log(comv)
    isLoading = false;
    _page = "showContent";
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post'); // ищем элемент с id
    block_post.style.display = 'block';
    block_post.style.background = 'rgba(0,0,0,.75)';
    block_post.style.overflow = 'auto';
    block_post.setAttribute('atr', 'con');
    var http = createRequestObject();
    if(link != null) {
        if(http) {
            http.open('get', '/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    block_post.innerHTML = http.responseText;
                    try {
                        var vp = document.getElementById('video-placeholder');
                        youd = vp.getAttribute('idv');
                        youps(youd);
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
                    textElemv2.id = 'back';
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
//                <img src="/media/images/mesvF.png" onclick="comView(this)" open-atr="close" id-comment="{{ message.id }}" id="comment_image_id_{{ message.id }}" type-div="icon" indicator-ws="close">
                fc.innerHTML = '<div class="views-title" style="width: 100%;float: left;"><div class="user-cord" atribut="1165"><a onclick="myPROFILE(' +"'"+message_data.user_post+"'"+')">' + '<img src="/media/data_image/'+ message_data.path_data + '/'+ message_data.image_user +'" width="30" height="30"></a><a class="postview" onclick="showContent('+ message_data.id +')"><span style="font-weight: bolder;">' + message_data.user_post + '</span><span class="arrow"> → </span><span class="message-title">'+ message_data.title + '</span></a></div><span class="datetime">' + date.getHours() + ':' + date.getMinutes() + '</span></div><div class="field-image"><img src="/media/data_image/'+ message_data.path_data +'/'+ message_data.image +'" height="auto" width="auto" onclick="showImg(this)" class="wallpost"><div class="body"><div class="text" style="padding:5px;">'+ message_data.text +'</div><div id="post_like_block_'+ message_data.id +'" style="width: 100%"><img src="/media/images/mesvF.png" onclick="comView(this)" open-atr="close" id-comment='+message_data.id+' id="comment_image_id_'+message_data.id+'" type-div="icon" indicator-ws="close"><img id="post_image_'+ message_data.id + '" src="/media/images/frv1.gif" onclick="LIKE('+ "'" + message_data.id +"'" +')" onmouseover="LIKEOVER('+ "'" + message_data.id + "'" + ')" onmouseout="LIKEDONE('+ "'" + message_data.id + "'" + ')"><img src="/media/images/rpvF.png" onclick="rpPost('+ "'" + message_data.id + "','" + message_data.user_post + "'" + ')"></div></div></div>';
//                <div class="box-com" style="display:none;margin: 0 auto;margin-top: 15px;" id="box-com-' + message_data.id + '"></div>
                try {
                    var tev = document.getElementById('conversation');
                    tev.insertBefore(fc, tev.firstChild);
                } catch (err) {
                    console.log("save data")
                }
                try {
                    document.getElementById('block-post').removeChild(t_el);
                    document.getElementById('message_form').style.display = "block";
                } catch (e) {};
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
                        try {
                            document.getElementById('UploadBox').style.display = "none";
                        } catch (e) {};
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
        ws_wall.send(data);
}
// удалить
function deletepost(id){
    var event = { id : id, event: "deletepost"};
    var data = JSON.stringify(event);
    ws_wall.send(data);
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
    var cont = document.getElementById('message_textarea').innerText;
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


function mesID(thread_id, user_name, number_of_messages){
    isLoading = false;
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
                document.getElementById("wscroll").height = tempNewVal;
                window.scrollBy(0, tempNewVal);
                // Работает старая версия
                //window.scrollBy(0, document.getElementById("conver").scrollHeight);
                
            } else if (message_data["event"]=="loadmore") {
            //----------------------------------->
                var request_user_id = message_data["request_user_id"];
                var g = JSON.parse(message_data.data);
//                console.log(g)
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
                document.getElementById("dot-loader").style.display = "none";  
                  
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


//////////////////////////////////////////////////////////////////
///  комментарии /////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

var ws_dict = {}
function comView(z){
    var comv = z.getAttribute('open-atr');
    var link = z.getAttribute('id-comment');
    var type_div = z.getAttribute('type-div');
    var conr = document.getElementById("post_like_block_"+link);
    if (comv == 'close') {
        z.setAttribute("open-atr", "open");
        var http = createRequestObject();
        if (http) {
            http.open('get', 'comment/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    var apcom = document.createElement('div');
                    //div class="box-com" style="display:none;margin: 0 auto;margin-top: 15px;" id="box-com-{{ id }}">
                    apcom.id = 'box-com-'+link;
                    apcom.className = "box-com";
                    apcom.style.display = "block";
                    
                    apcom.innerHTML = http.responseText;
                    conr.appendChild(apcom);
                    conr.style.display = 'block';
                    if (type_div == "icon" && z.getAttribute("indicator-ws") == "close") {
//                        var test_id = ws_com.url.split('/')[4]
                        z.setAttribute("indicator-ws", "open")
                        ws_dict[link] = activate_com(link);
                        console.log(link, ws_dict[link])
                    }
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
    } else {
        z.setAttribute("open-atr", "close");
        document.getElementById('box-com-'+link).remove();
    }
}


// отправить комментарий
function send_com(self, cip) {
    if (typeof dataURL_v1 == 'undefined') {
        dataURL_v1 = "";
    }
    var zetr = document.getElementById("comment_image_id_"+cip);
    
    var comment_text = document.getElementById('comment_text_' + cip);
    if (comment_text.innerText == "") {
        return false;
    }
    if (ws_dict[cip].url.split('/')[4] != cip) {
        console.log(ws_dict[cip], cip, zetr.getAttribute("indicator-ws"));
    } else {
        if (ws_dict[cip].readyState != WebSocket.OPEN) {
            return false;
        }
        var data = JSON.stringify({ comment_text : comment_text.innerText,
                                    comment_image: dataURL_v1 });
        ws_dict[cip].send(data);
        comment_text.innerText = "";
    }
}

function activate_com(post_id) {
    function start_com_ws() {
        var ws_com = new WebSocket("ws://"+ IP_ADDR + ":"+PORT+"/comment/" + post_id + "/");
        ws_com.onmessage = function(event) {
            var tev = document.getElementById('field-comment_'+post_id);
            var fc = document.createElement('div');
            fc.className = 'f-c';
            var message_data = JSON.parse(event.data);
            console.log(message_data);
            if (message_data.comment_image != "") {
                fc.innerHTML = '<img id="image-user" src="/media/data_image/' + message_data.path_data +'/tm_'+message_data.image_user+'" class="imgUs" onclick="userPROFILE('+message_data.user_id+')" style="cursor:pointer;" loading="lazy"><a onclick="userPROFILE('+ message_data.user_id +')" style="display: block;padding: 4px;margin: 9px 0px 9px 50px;">'+message_data.comment_user+'</a><p style="padding:4px;">'+message_data.comment_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />') + '</p><img id="comment-image" src="media/data_image/'+ message_data.comment_image +'">';
            } else {
                fc.innerHTML = '<img id="image-user" src="/media/data_image/' + message_data.path_data +'/tm_'+message_data.image_user+'" class="imgUs" onclick="userPROFILE('+message_data.user_id+')" style="cursor:pointer;" loading="lazy"><a onclick="userPROFILE('+ message_data.user_id +')" style="display: block;padding: 4px;margin: 9px 0px 9px 50px;">'+message_data.comment_user+'</a><p style="padding:4px;">'+message_data.comment_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />') + '</p>';
            }
            fc.innerHTML += "<div id='time-comment'>"+ message_data.timecomment +"</div>"
            tev.insertBefore(fc, tev.lastChild);
        };
        return ws_com
    }

    if ("WebSocket" in window) {
        return start_com_ws();
    } else {
        var formMS = document.getElementById('message_form');
        formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';
        return false;
    }
}


////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////


document.addEventListener('keypress', function (e) {
    //console.log("keypress", _page, e.keyCode);
    if (_page == "chat") {
        if (e.keyCode == 13 && !event.shiftKey) {
            e.preventDefault();
            send_message();
            return false;
        } 
    }
});

