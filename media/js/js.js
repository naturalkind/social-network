var IP_ADDR = "xn--90aci8aadpej1e.com";
var PORT = "80";

var innode;
var len;
var topbt;
var topbt_indicator;
var topbt_position;
var main_wrapper;
var _page = "wallpost";
var yOffset;
var temp_position;
var isLoading = false;
var all_pages;
window.onload = function(){
    try {    
        topbt = document.getElementById('topbt');
        topbt.style.display = "none"
    } catch (e) {};
    main_wrapper = document.getElementById("main-wrapper");
}
window.addEventListener('load', (event) => {
    try {    
        topbt = document.getElementById('topbt');
        topbt.style.display = "none"
    } catch (e) {};
    main_wrapper = document.getElementById("main-wrapper");
})

document.addEventListener('DOMContentLoaded', function() {
    console.log("load......")
    history.pushState({"view": "wallpost", 'lk': `/` }, null, `/`);
    try {    
        topbt = document.getElementById('topbt');
        topbt.style.display = "none"
    } catch (e) {};
    main_wrapper = document.getElementById("main-wrapper");
}, false);

// работает если в html script defer
//topbt = document.getElementById('topbt');
//main_wrapper = document.getElementById("main-wrapper");

function getScrollPercent() {
    var h = document.documentElement, 
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';
    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
}
var processed_page;
function scroll(){
    try{
        document.getElementById('tooltip').remove();
        document.getElementsByClassName('edprof')[0].setAttribute("open-atr", "close");
        document.getElementsByClassName('edprof')[0].src = "/media/images/edprof.png";
        document.getElementsByClassName('edprof')[0].style.background = " #507299";  
    }catch(err) {}
    processed_page = getScrollPercent();
    if(isLoading) return false;
    yOffset = window.pageYOffset;
    var y = yOffset + window.innerHeight;
    try {
        if (document.getElementById('IOP').innerText!="STOP") {
            if (_page == "chat") {
                if(processed_page <= 30){
                    isLoading = true;
                    topbt.style.display = "block";
                    topbt.style.transform = 'rotate(180deg)'
                    topbt_indicator = "scroll_down_chat";
                    temp_position = window.innerHeight;
                    document.getElementById("dot-loader").style.display = "block";
                    ws_chat.send(JSON.stringify({"event":"loadmore", "message":document.getElementById('IOP').innerText}));
                } 
            } else {
                if(processed_page >= 80){
                    isLoading = true;
                    topbt_position = y;
                    topbt_indicator = "scroll_up";
                    topbt.style.display = "block";
                    jsons(document.getElementById('IOP').innerText, document.getElementById("DODO").getAttribute('atr'))
                }
            }
        } else {
            if(processed_page <= 30){
                    if (_page == "chat") {
                        topbt_indicator = "scroll_down_chat";
                        topbt.style.transform = 'rotate(180deg)';
                    } else {
                        topbt_indicator = "scroll_down";
                        topbt.style.transform = 'rotate(180deg)';
                    }
            } else if (processed_page >= 80){
                if (_page == "chat") {
                    topbt_indicator = "scroll_up_chat";
                    topbt.style.transform = 'rotate(0deg)';            
                } else {
                    topbt_indicator = "scroll_up";
                    topbt.style.transform = 'rotate(0deg)';
                }
            }
        }
    } catch (e) {};
}
window.onscroll = scroll;


function event_topbt(e){
    var block_post = document.getElementById('block-post');
    console.log("event_topbt", topbt_indicator, _page);
    try{document.getElementById('tooltip').remove();}catch(err) {}
    if (topbt_indicator == "editPROFF") {
        document.getElementsByClassName("edprof")[0].setAttribute("open-atr", "close");
        handler(e);                     
    } else if (topbt_indicator == "scroll_down_chat") { 
        e.style.transform = 'rotate(0deg)';
        topbt_indicator = "scroll_up_chat";
        window.scrollTo(0, document.body.scrollHeight);
    } else if (topbt_indicator == "scroll_up_chat") {  
        e.style.transform = 'rotate(180deg)';
        topbt_indicator = "scroll_down_chat";
        window.scrollTo(0, 0); 
    } else if (topbt_indicator == "scroll_up"){
        e.style.transform = 'rotate(180deg)';
        topbt_indicator = "scroll_down";
        temp_position = yOffset;
        window.scrollTo(0, 0);
    } else if (topbt_indicator == "scroll_down") {
        e.style.transform = 'rotate(0deg)';
        window.scrollTo(0, temp_position);
        topbt_indicator = "scroll_up";
    } else if (topbt_indicator == "handler") {
        handler(e)
        if (_page == "wallpost") {
            history.pushState({"view": "wallpost", 'lk': `/` }, null, `/`);
        } else if (_page == "user") {
            history.pushState({"view": "user", 'lk': `/user/${document.getElementById("user_id").innerText}` }, 
                                null, `/user/${document.getElementById("user_id").innerText}`);
        } else if (_page == "chat") {
            history.pushState({"view": "user", 'lk': `/messages/chat/${document.getElementById("chat_id").innerText}` }, 
                                null, `/messages/chat/${document.getElementById("chat_id").innerText}`);            
        }
        
        //history.pushState({"view": "wallpost", 'lk': `/` }, null, `/`);
    } else if (topbt_indicator == "addPost") {
        handler(e);
        isLoading = false;                            
    } else if (topbt_indicator == "foll") {
        handler(e);
    } 
};


function handler(e) {
    var block_post = document.getElementById('block-post');
    block_post.innerHTML = "";
    block_post.style.display = 'none';
    document.body.style.overflow = 'auto';
    topbt.style.transform = 'rotate(0deg)';
    main_wrapper.style.opacity = 1
    var contentHeight = main_wrapper.offsetHeight;
    if (topbt_position > contentHeight) {
        topbt_indicator = "scroll_down";
    } else {
        topbt_indicator = "scroll_up";
    }
}



window.addEventListener("popstate", function(e) {
    var state = e.state;
    state = typeof state !== 'null' ?  state : "wallpost";
    console.log("popstate............", state, _page, state.lk);
    if (state.view == "post" || state.view == "wallpost") {
        handler("o");
        if (_page == "wallpost") {
            history.pushState({"view": "wallpost", 'lk': `/` }, null, `/`);
        } else {
            history.pushState({"view": "user", 
                               'lk': `/user/${document.getElementById("user_id").innerText}` }, 
                                null, `/user/${document.getElementById("user_id").innerText}`);
        }
    } else if (state.view == "privatmes") {
        privatMES();
    } else if (state.view == "user") {
        if (_page=="user") {
            handler("o");
            history.pushState({"view": "user", 
                               'lk': `/user/${document.getElementById("user_id").innerText}` }, 
                                null, `/user/${document.getElementById("user_id").innerText}`);
        } else {
            userPROFILE(state.lk.split('/')[2]);
        }
    } else if (state.view == "users") {
        users()
    } else if (state.view == "mesID") {
        handler("o");
    }
});




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


function openMenu(self){
    if(self.getAttribute("open-atr") == "close") {
        document.getElementById('butMen').style.display = 'block';
        self.setAttribute("open-atr", "open")
    } else {
        document.getElementById('butMen').style.display = 'none';
        self.setAttribute("open-atr", "close")
    }
}


/// пользователи
function users(_type){
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    window.scrollTo(0, 0);
    var http = createRequestObject();
    if(http) {
        http.open('get', '/users/?_type='+_type);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                var block_post = document.getElementById('block-post');
                main_wrapper.style.opacity = 1;
                main_wrapper.style.display = 'block'
                document.body.style.overflow = 'auto';
                block_post.style.display = 'none';
                isLoading = false;
                _page = "users"
                topbt = document.getElementById('topbt');
                topbt.style.transform = 'rotate(0deg)';
                topbt.style.display = "none";
                history.pushState({"view": "users", 'lk': '/users/' }, null, '/users/');
                document.getElementsByClassName("enter")[0].style.display = "none";
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
    if (http) {
        http.open('get', '/logout');
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                cont.innerHTML = http.responseText;
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
                history.pushState({"view": "register", 'lk': `/register` }, null, `/register`);
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}


function load_image_profile(self, id) {
//    console.log(self, id)
    var input = document.getElementById('id_image_'+id);
    file = input.files;
    try {
        reader.readAsDataURL(file[0]);
        reader.onload = function (e) {
                    var im = document.getElementById("image-user-profile");
                    dataURL_v1 = reader.result;
                    im.src = reader.result;
        };
    } catch (e) {}    

}



function editPROFF(self){
    if (self.getAttribute("open-atr")=="close") {
//        document.body.style.overflow = 'hidden';
        var block_post = document.getElementById('block-post'); 
        var http = createRequestObject();
        if (http) {
            http.open('get', '/profile');
            http.onreadystatechange = function () {
            if(http.readyState == 4) {
                var self_coord = self.getBoundingClientRect();
                  
                var color_picker = document.createElement('div');
                color_picker.id = 'color-picker';
                color_picker.className = "cp-default";
//                block_post.appendChild(color_picker);
                  // получить координаты картинки
                var image_user_profile = document.getElementById("image-user-profile");
                var _coord = image_user_profile.getBoundingClientRect();
                
                var header_height = document.getElementById("header").getBoundingClientRect()["height"];
                var z = document.createElement('div');
                z.id = 'tooltip';
                z.setAttribute("style", ` 
                                         top:${_coord["height"]/2}px;
                                         left:${_coord["left"]}px;
                                         height: 0;
                                         width:${_coord["width"]}px;
                                         position:absolute;
                                         opacity: 1;
                                         padding:0;
                                         max-width: 100%; 
                                         `)   //background:#1797a7; height:${_coord["height"]}px; 
                                              //top:${(_coord["top"]-header_height)}px; 
                                              //top:${self_coord["top"]}px; 
                z.innerHTML = http.responseText             
                var uspgimg = document.getElementsByClassName('uspgimg')[0];
//                z.appendChild(color_picker);
//                uspgimg.appendChild(z);
//                // выпадающее сообщение
                var tooltipElem = document.createElement('div');
                tooltipElem.id = 'YO2'//+user_id;
//                tooltipElem.innerHTML = "<a>цвет имени</a>"
//                _coord = self.getBoundingClientRect();
//                tooltipElem.setAttribute("style", `
//                                                   top:${_coord["top"]+_coord["height"]+header_height+10}px; 
//                                                   left:${_coord["left"]}px;
//                                                   position: fixed;
//                                                    `)
                tooltipElem.setAttribute("style", `
                                                   top:${_coord["top"]+_coord["height"]+header_height+10}px; 
                                                   left:${_coord["left"]}px;
                                                   position: fixed;
                                                    `)
                                                    
                //                                    
//                var textElemv1 = document.createElement('img');
//                textElemv1.id = 'close';//id = 'close'; //
//                textElemv1.className = "icon-like";
//                textElemv1.onclick = function close() {
//                    self.style.transform = "rotate(0deg)"; 
//                    document.getElementById('tooltip').remove();
//                    self.setAttribute("open-atr", "close");
//                } 
//                textElemv1.src = "/media/images/close3.png";   
//                textElemv1.setAttribute("style", "width:100px;height:100px;background-image:url(/media/images/controlsv4.png)") 


//                var over = document.getElementById("user-page"); 

                tooltipElem.appendChild(color_picker);  
//                tooltipElem.appendChild(textElemv1);  
                z.appendChild(tooltipElem);
                uspgimg.appendChild(z);  
                
//                block_post.appendChild(tooltipElem);  
//                // координаты кнопки редактировать профиль        
//                var coords_button = self.getBoundingClientRect()["top"];
//                console.log(coords_button);
//                
//                over.appendChild(tooltipElem);
          
                self.setAttribute("open-atr", "open");
                topbt_indicator = "editPROFF"
                ColorPicker(
                    color_picker,
                    function(hex, hsv, rgb) {
                      //console.log(hsv.h, hsv.s, hsv.v);         // [0-359], [0-1], [0-1]
                      console.log(rgb.r, rgb.g, rgb.b);         // [0-255], [0-255], [0-255]
                      //document.body.style.backgroundColor = hex;        // #HEX
                      //us_name_class.style.backgroundColor = hex;
                      user_page_name.style.color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                      console.log(user_page_name.style.color);
                });  
                self.src = "/media/images/close3.png"  
                self.style.background = " #ffffff";    
                console.log(self)  
//                self.className = "icon-like"  
            }
        };
        http.send(null);
        } else {
            document.location = link;
        }    
    } else {
        self.setAttribute("open-atr", "close");
//        self.className = "edprof"
        self.src = "/media/images/edprof.png"
        self.style.background = " #507299";  
        try {
            document.getElementById('tooltip').remove();
//            self.setAttribute("open-atr", "close")
        } catch (e) {
            
            editPROFF(self);
        };
    }
}




function profilePOST(link){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value; // токен
    var linkfull = '/profile/?username='+link;
    var http = new XMLHttpRequest();
    if (http) {
        dataURL_v1 = typeof dataURL_v1 !== 'undefined' ?  dataURL_v1 : 'undefined';
        event = { my_image: dataURL_v1, color: user_page_name.style.color };
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


/// пользователь
function userPROFILE(link, _type){
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    window.scrollTo(0, 0);
    var http = createRequestObject();
    if(http) {
        http.open('get', '/user/'+link+"/?_type="+_type);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                var block_post = document.getElementById('block-post');
                block_post.style.display = 'none';
                main_wrapper.style.opacity = 1;
                main_wrapper.style.display = 'block';
                document.body.style.overflow = 'auto';
                topbt = document.getElementById('topbt');
                topbt.style.transform = 'rotate(0deg)';
                topbt.style.display = "none";
                isLoading = false;
                history.pushState({"view": "user", 'lk': '/user/'+link }, null, '/user/'+link);
                _page = "user";
                try {
                    document.getElementById('atr-user').getAttribute('atr-user');
                    document.getElementsByClassName("enter")[0].style.display = "block";
                } catch (e) {
                
                }
            }
        };
        http.send(null);
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


function jsons(link, atr){
    var linkfull;
    var wd, hd, us, contv;
    if (atr == 'user'){
        contv = document.getElementById('DODO');
        wd = 300;
        hd = 230;
        us = document.getElementById('user_id').innerText;
        linkfull = '/user/'+us+'/?page=' + link;
    }
    else if (atr == 'users'){
        contv = document.getElementById('DODO');
        wd = 180;//300;
        hd = 160;//230;
        linkfull = '/users/?page=' + link;
    }
    else if (atr == 'wall'){
        contv = document.getElementById('conversation');
        wd = "auto";
        hd = "auto";
        linkfull = '/?page=' + link;
    }
    else if (atr== "wall-nonregister"){
        contv = document.getElementById('DODO');
        wd = "auto";
        hd = "auto";
        linkfull = '/?page=' + link;
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
                    len += g.length;
                    all_pages = f.all_pages;
                    document.getElementById('IOP').innerText = f.op1;
                    for (var R in g) {
                       if (g[R].fields.username.length>15) {
                           var tuser =  g[R].fields.username.slice(0,12) + "...";
                        } else {
                            var tuser = g[R].fields.username;
                        }
                        
                       if (g[R].fields.image_user!="oneProf.png") {
                           var div_image_user = `<img src='/media/data_image/${g[R].fields.path_data}/tm_${g[R].fields.image_user}' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                        } else {
                            var div_image_user = `<img src='/media/images/oneProf.png' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                        }                        
                            
                       html += `<div class='views-row' onclick='userPROFILE(${g[R].pk})'>
                                    ${div_image_user}
                                    <div class='user-name'><a atribut='${g[R].pk}' id="user-link">${tuser}</a></div>
                                </div>`
                    }
                    contv.innerHTML += html;
                    isLoading = false;
                }  
                else {
                    var f = JSON.parse(http.responseText);
                    all_pages = f.all_pages;
                    document.getElementById('IOP').innerText = f.op1;
                    var us = f.us;
                        if (atr == 'wall') {
                            html += f.data;
                            len += 6;
                            
                        } else if (atr=='wall-nonregister') {
                            var g = JSON.parse(f.data);
                            len += g.length;
                            for (var R in g) {
                                var img = '/media/data_image/'+g[R].fields.path_data +"/"+ g[R].fields.image;// + '.png';
                                html += `<li class='views-row' onmouseover='getIndex(this);'>
                                            <div class='field-image' atribut='${g[R].pk}'>
                                                <img style='background: url("${img}");width:300px;height:230px;background-size: cover;'  
                                                     onclick='showContent(${g[R].pk})' 
                                                     loading='lazy'>
                                            </div>
                                            <div id='${g[R].pk}' data-tooltip='${g[R].pk}'></div>
                                         </li>`;
                                         // END STRING
                            }
                        } else if (atr=='user') {
                            var g = JSON.parse(f.data);
                            len += g.length;
                            for (var R in g) {
                                if (g[R].fields.image != "") {
                                    var img = '/media/data_image/'+g[R].fields.path_data +"/"+ g[R].fields.image;// + '.png';
                                } else {
                                    var img = "/media/images/no_image.png";// + '.png';
                                }
                                
                                html += `<li class='views-row' onmouseover='getIndex(this);'>
                                            <div class='field-image' atribut='${g[R].pk}'>
                                                <img style='background:url("${img}");width:300px;height:230px;background-size: cover;'  
                                                     onclick='showContent(${g[R].pk})' 
                                                     loading='lazy'>
                                            </div>
                                            <div id='${g[R].pk}'
                                                 data-tooltip='${g[R].pk}'></div>
                                            <div id='${g[R].pk}' 
                                                 style='position: relative; opacity: 1;pointer-events: auto; display: none;'>
                                                    <img class='icon-like' 
                                                         src='/media/images/mesvF.png' 
                                                         onclick='comView(this)' 
                                                         open-atr='close' 
                                                         id-comment='${g[R].pk}' 
                                                         id='comment_image_id_${g[R].pk}' 
                                                         type-div='icon' 
                                                         indicator-ws='close' 
                                                         style='display:none;'>
                                         </li>`;
                                         // END STRING
                            }
                        }
                    contv.innerHTML += html;
                    isLoading = false;
                }
            }
        };
        http.send();
    } else {
        document.location = link;
    }
}


function showImg(path_data, _type){
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    try{document.getElementById('tooltip').remove();}catch(err) {}
    document.body.style.overflow = 'hidden';
    var block_post = document.getElementById('block-post');
    block_post.style.display = 'block';
    var img = document.createElement('img');
    img.id = 'conimg';
    img.src = path_data.src;
    if (document.body.offsetHeight > document.body.offsetWidth) {
        img.style.maxHeight = document.body.offsetHeight;
        img.style.maxWidth = document.body.offsetWidth;
        img.style.width = "100%";    
    } else {
        img.style.maxHeight = document.body.offsetHeight;
        img.style.maxWidth = document.body.offsetWidth;
    }
    if (_type == "qr") {
        img.style.background = "#ffffff";
        img.style.minWidth = "280px";
    }
    block_post.innerHTML = '';
    block_post.appendChild(img);
    var startPoint={};
    var nowPoint;
    var ldelay;
    topbt.style.transform = "rotate(90deg)";
    topbt.style.display = "block";
    topbt_indicator = "handler";
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


// лайки при наведении

function LIKEOVER(link, page_num, loadmore) {
    if(isLoading) return false;
    page_num = typeof page_num !== 'undefined' ?  page_num : 1;
    console.log(link, page_num, loadmore)
    if (loadmore == "loadmore") {
        var div_iop3 = document.getElementById("IOP3");
        var block_post = document.getElementById('friends_list');
        var tooltipElem = document.getElementById('tooltip_'+link);
    } else { 
        try{document.getElementById('tooltip_'+link).remove();}catch(err) {}
        var tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip_'+link;
        tooltipElem.setAttribute("style", `max-height: ${window.innerHeight*0.7};overflow-y: scroll;float: left;position: relative;`);
        document.getElementById("block-post").style.overflowY = 'hidden';
        var over = document.getElementById("tooltip");
        var div_iop3 = document.createElement("div");
        div_iop3.id = "IOP3";
    }    
    var http = createRequestObject();
    var linkfull = '/likeover/?post_id=' + link + "&page="+page_num;
    var html = ""
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
        if (http.readyState == 4) {
            var data = JSON.parse(http.responseText);
            console.log(data.op1)
            div_iop3.innerText = data.op1;
            data = JSON.parse(data.data);
            for (var z in data) {
                if (data[z].fields.image_user != "oneProf.png") {
                    var div_image_user = `<img src="/media/data_image/${data[z].fields.path_data}/tm_${data[z].fields.image_user}" class="imgUs" onclick="userPROFILE(${data[z].pk})" style="cursor:pointer;" loading="lazy">`;
                } else {
                    var div_image_user = `<img src="/media/images/oneProf.png" class="imgUs" onclick="userPROFILE(${data[z].pk})" style="cursor:pointer;" loading="lazy">`;
                }
                html += div_image_user
            }
            if (loadmore == "loadmore") { 
                tooltipElem.innerHTML += html;
            } else {
                tooltipElem.innerHTML = html;
                over.appendChild(tooltipElem); 
                over.appendChild(div_iop3);
            }
//            tooltipElem.innerHTML = http.responseText;
//            over.appendChild(tooltipElem); 
  
            function getScrollPercent() {
                var h = tooltipElem, 
                    b = document.body,
                    st = 'scrollTop',
                    sh = 'scrollHeight';
                return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
            }                
            function test_scroll() {
                processed_page = getScrollPercent();  
                if (div_iop3.innerText!="STOP") {
                    if (processed_page >= 80) {
                        LIKEOVER(link, div_iop3.innerText, "loadmore");
                        isLoading = true;
                    }
                }
            }   
            tooltipElem.onscroll = test_scroll;
            isLoading = false;          
        }
    };
    http.send(null);
    } else {
        document.location = link;
    }
}


//function LIKEOVER(link) {
//    var html= '';
//    try{document.getElementById('tooltip_'+link).remove();}catch(err) {}
//    var tooltipElem = document.createElement('div');
//    tooltipElem.id = 'tooltip_'+link;
//    var over = document.getElementById("tooltip");
//    var http = createRequestObject();
//    var linkfull = '/likeover/?post_id=' + link;
//    if (http) {
//        http.open('get', linkfull);
//        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
//        http.onreadystatechange = function () {
//            if (http.readyState == 4) {
//                var f = JSON.parse(http.responseText);
//                for (var r in f) {
//                    if (f[r].fields.image_user != "oneProf.png"){
//                        var div_image_user = `<img src="/media/data_image/${f[r].fields.path_data}/tm_${f[r].fields.image_user}" class="imgUs" onclick="userPROFILE(${f[r].pk})" style="cursor:pointer;" loading="lazy">`;
//                    } else {
//                        var div_image_user = `<img src="/media/images/oneProf.png" class="imgUs" onclick="userPROFILE(${f[r].pk})" style="cursor:pointer;" loading="lazy">`;
//                    }                
//                    html += `<div class="user-cord">
//                                ${div_image_user}  
//                             </div>`
//                }
//                tooltipElem.innerHTML = html;
//                over.appendChild(tooltipElem);
//                var coords = over.getBoundingClientRect();
//                var left = coords.left + (over.offsetWidth - tooltipElem.offsetWidth) / 2;
//                if (left < 0) left = 0;
//                var top = coords.top - tooltipElem.offsetHeight - 5;
//                if (top < 0) {top = coords.top + over.offsetHeight + 5;}
//                tooltipElem.style.left = left + 'px';
//                tooltipElem.style.top = top + 'px';
//            }
//        };
//        http.send(null);
//    } else {
//        document.location = link;
//    }
//}

// отследить убрать наведение с обьекта при лайке
function LIKEDONE(self, link){
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
    try {
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
    } catch (e) {}
}


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


/// добвать пост
function addPost(){
    try{document.getElementById('tooltip').remove();}catch(err) {}
    try{
        html = `<div id="node">
                    <form class="message_form" id="message_form" style="display: block;" id="formsend">
                        <div class="field-image" style="width: auto;border: none;margin: 0 auto;">
                            <div id="UploadBox">
                                <span id="UploadArea"></span>
                            </div>
                            <input type="file" 
                                   id="image_file" 
                                   onchange="OnOnW()" 
                                   style="overflow: hidden;z-index: -1;opacity: 0;display: none;">
                            <label for="image_file" class="image_file">ЗАГРУЗКА КАРТИНКИ</label>
                            <div id="cn">
                                <canvas id="canvas" width="0" height="0"></canvas>
                            </div>
                        </div>
                        <div class="field-text">
                            <textarea id="id_body" placeholder="Введите Ваше сообщение..." ></textarea>
                        </div>
                        <button onclick="send_wall()" type="button">ОТПРАВИТЬ</button>
                    </form>
                </div>`; 
        document.body.style.overflow = 'hidden';
        var block_post = document.getElementById('block-post');
        block_post.style.display = 'block';
        block_post.innerHTML = html;
        topbt.style.transform = 'rotate(90deg)';
        topbt_indicator = "addPost";
        topbt.style.display = "block";
        
        function test_scroll() {
        }
        block_post.onscroll = test_scroll;   
        
    } catch (err){}
}


// простая версия репоста
function rpPost(self, link, us) {
    if (self.getAttribute("open-atr")=="close") {
        var http = createRequestObject();
        var linkfull = '/rppos/'+ link +'?username=' + us+'&user_blank=1';
        if (http) {
            http.open('get', linkfull);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    var data = JSON.parse(http.responseText);
                    if (data["like-indicator"]==1) { 
                        self.setAttribute("src", "/media/images/close3.png");                     
                    } else {
                        self.setAttribute("src", "/media/images/rpvF.png");
                    }
            }
        };
        http.send(null);
        } else {
            document.location = link;
        }
    } 
} 


function getCookie(name) {
    var cookieValue = null;
    if (document.cookie && document.cookie != '') {
        var cookies = document.cookie.split(';');
        for (var i = 0; i < cookies.length; i++) {
            var cookie = cookies[i].trim();
            // Does this cookie string begin with the name we want?
            if (cookie.substring(0, name.length + 1) == (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function reSend(user_id, post_id) {
    var crsv = getCookie('csrftoken'); // токен
    console.log(user_id, post_id, crsv);
    var http = createRequestObject();
    var linkfull = '/friends/';
    if (http) {
        http.open('post', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.setRequestHeader('X-CSRFToken', crsv);
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
//                console.log(http.responseText);
            }
        }
        http.send(JSON.stringify({"user_id":user_id, "post_id":post_id}));   
    } 
}

// Друзья
function FRIENDS_PAGE(link, count_users, page_num, loadmore) {
    if(isLoading) return false;
    page_num = typeof page_num !== 'undefined' ?  page_num : 1;
    if (loadmore == "loadmore") {
        var div_iop2 = document.getElementById("IOP2");
        var block_post = document.getElementById('friends_list');
    } else { 
        var block_post = document.getElementById('block-post');
        block_post.innerHTML = "";
        document.getElementById("block-post").style.overflowY = 'scroll';
        var div_iop2 = document.createElement("div");
        div_iop2.id = "IOP2";
        document.body.style.overflow = 'hidden';
        var tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip';
        tooltipElem.setAttribute("style", "position:relative;max-width: 100%;float:left;")
        
    }
    document.getElementById("block-post").scrollTo(0,0);
    var http = createRequestObject();
    var linkfull = '/friends/'+ link + "/?page="+page_num;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var html = ""
                var data_0 = JSON.parse(http.responseText);
                all_pages = data_0.all_pages; 
                data = JSON.parse(data_0.data);
                               
                for (var z in data) {
                    if (data[z].fields.image_user != "oneProf.png") {
                        var div_image_user = `<img src="/media/data_image/${data[z].fields.path_data}/tm_${data[z].fields.image_user}" loading="lazy" class="imgUs" onclick="userPROFILE('${data[z].pk}', 'javascript')">`;
                    } else {
                        var div_image_user = `<img src="/media/images/oneProf.png" loading="lazy" class="imgUs" onclick="userPROFILE('${data[z].pk}', 'javascript')">`;
                    }
                    html += `<div id="user_friends_list" style="float: left;display: block;">${div_image_user}</div>`
                }
                if (loadmore == "loadmore") {
                    block_post.innerHTML += html; 
                    div_iop2.innerText = data_0.op1; 
                } else { 
                
                    tooltipElem.innerHTML = `<h1 id="h1-friends">ДРУЗЬЯ ${count_users}</h1>`;
                    tooltipElem.innerHTML += `<div id="friends_list">${html}</div>`;
                    var node = document.createElement('div');
                    node.id = 'node';
                    node.appendChild(tooltipElem);
                    block_post.appendChild(node);         
                              
                    block_post.style.display = 'block';
                    main_wrapper.style.opacity = 0.2;
                    topbt.style.display = "block"
                    topbt.style.transform = 'rotate(90deg)';
                    topbt_indicator = "foll";
                    div_iop2.innerText = data_0.op1;
                    block_post.appendChild(div_iop2);
                }

                //------------------------------->
                function getScrollPercent() {
                    var h = document.getElementById("block-post"), 
                        b = document.body,
                        st = 'scrollTop',
                        sh = 'scrollHeight';
                    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
                }                
                function test_scroll() {
                    processed_page = getScrollPercent();
                    if (div_iop2.innerText!="STOP") {
                        if (processed_page >= 80) {
                            FRIENDS_PAGE(link, count_users, div_iop2.innerText, "loadmore");
                            isLoading = true;
                        }
                    }
                    
                }
                isLoading = false;   
                document.getElementById("block-post").onscroll = test_scroll;                
                //
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}

// друзья переслать
function FRIENDS(link, page_num, loadmore) {
    if(isLoading) return false;
    page_num = typeof page_num !== 'undefined' ?  page_num : 1;
    console.log(link, page_num, loadmore)
    if (loadmore == "loadmore") {
        var div_iop3 = document.getElementById("IOP3");
        var block_post = document.getElementById('friends_list');
        var tooltipElem = document.getElementById('tooltip_'+link);
    } else { 
        try{document.getElementById('tooltip_'+link).remove();}catch(err) {}
        var tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip_'+link;
        tooltipElem.setAttribute("style", `max-height: ${window.innerHeight*0.7};overflow-y: scroll;float: left;position: relative;`);
        document.getElementById("block-post").style.overflowY = 'hidden';
        var over = document.getElementById("tooltip");
        var div_iop3 = document.createElement("div");
        div_iop3.id = "IOP3";
    }    
    var http = createRequestObject();
    var linkfull = '/friends/'+ link + "/?page="+page_num;
    var html = ""
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
        if (http.readyState == 4) {
            var data = JSON.parse(http.responseText);
            console.log(data.op1)
            div_iop3.innerText = data.op1;
            data = JSON.parse(data.data);
            for (var z in data) {
                if (data[z].fields.image_user != "oneProf.png") {
                    var div_image_user = `<img src="/media/data_image/${data[z].fields.path_data}/tm_${data[z].fields.image_user}" loading="lazy" class="imgUs" onclick="reSend(${data[z].pk}, ${link})">`;
                } else {
                    var div_image_user = `<img src="/media/images/oneProf.png" loading="lazy" class="imgUs" onclick="reSend(${data[z].pk}, ${link})">`;
                }
                html += div_image_user
            }
            if (loadmore == "loadmore") { 
                tooltipElem.innerHTML += html;
                 
            } else {
                tooltipElem.innerHTML = html;
                over.appendChild(tooltipElem); 
                over.appendChild(div_iop3);
            }
//            tooltipElem.innerHTML = http.responseText;
//            over.appendChild(tooltipElem); 
  
            function getScrollPercent() {
                var h = tooltipElem, 
                    b = document.body,
                    st = 'scrollTop',
                    sh = 'scrollHeight';
                return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
            }                
            function test_scroll() {
                processed_page = getScrollPercent();  
                if (div_iop3.innerText!="STOP") {
                    if (processed_page >= 80) {
                        FRIENDS(link, div_iop3.innerText, "loadmore");
                        isLoading = true;
                    }
                }
            }   
            tooltipElem.onscroll = test_scroll;
            isLoading = false;          
        }
    };
    http.send(null);
    } else {
        document.location = link;
    }
}


// меню 
function menuset(self, link, username, del_indicator, like_count, total_friends) {
    console.log(link, username, del_indicator, like_count)
    if (self.getAttribute("open-atr")=="close") {
        self.style.transform = "rotate(90deg)"; 
        self.setAttribute("open-atr", "open")
        var tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip';
        if (del_indicator == 'true') {
            var t = `<a id="deletepost" onclick="deletepost(this, ${link})" del-atr="false">УДАЛИТЬ</a>`;
        } else {
            var t = "";
        }
        tooltipElem.innerHTML = `<div id="post_like_block_${link}" style="width: 100%">
                                 ${t}
                                 <a onclick="LIKEOVER(${link})">понравилось ${like_count}</a>
                                 <a onclick="FRIENDS(${link})">отправить ${total_friends}</a>
                                 </div>
                                `; //<a>статистика</a>
        
        var textElemv1 = document.createElement('a');
        textElemv1.id = 'close';
        textElemv1.onclick = function close() {
            self.style.transform = "rotate(0deg)"; 
            document.getElementById('tooltip').remove();
            self.setAttribute("open-atr", "close");
            document.getElementById("block-post").style.overflowY = 'scroll';
        }
        tooltipElem.insertBefore(textElemv1, tooltipElem.firstChild);
        document.getElementById("breadcrumb").appendChild(tooltipElem);
        var coords = self.getBoundingClientRect();
        var left = coords.left + (self.offsetWidth - tooltipElem.offsetWidth) / 2;
        if (left < 0) left = 0;
        var top = coords.top - tooltipElem.offsetHeight - 5;
        if (top < 0) {top = coords.top + self.offsetHeight + 5;}
        tooltipElem.style.top = top+10 + 'px';   
        function test_scroll() {
//            try{document.getElementById('tooltip').remove();
//                self.setAttribute("open-atr", "close");
//                self.style.transform = "rotate(0deg)"; 
//                }catch(err) {}
            
        }   
        document.getElementById("block-post").onscroll = test_scroll;
        
    } else {
        self.style.transform = "rotate(0deg)"; 
        self.setAttribute("open-atr", "close")
        document.getElementById('tooltip').remove();
    }
}

// простая версия лайка
function LIKE(self, link) {
    if (self.getAttribute("open-atr")=="close") {
        var http = createRequestObject();
        var linkfull = '/add_like/?post_id=' + link;
        if (http) {
            http.open('get', linkfull);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    var data = JSON.parse(http.responseText);
                  if (data["like-indicator"] == "1"){
                        self.setAttribute("src", "/media/images/frv1.gif");
                    } else {
                        self.setAttribute("src", "/media/images/frv1.png");
                    }
                }
            };
            http.send(null);
        } else {
            document.location = link;
        }
    } 
} 

// Подписка пользователь 
function addfollow(self, link, us, id){
    var crsv = document.getElementsByName('csrfmiddlewaretoken')[0].value;
    var follow = self.getAttribute("atr-follow"); 
    var linkfull;
    if (follow=="false") {
        linkfull = '/user/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=1';
        self.setAttribute("atr-follow", "true");
    } else {
        linkfull = '/user/'+ link +'/?username=' + us +'&userid='+ id +'&user_blank=0';
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
                
                
                    follow_btn.innerHTML = "<img src='/media/images/dusr.png' class='addusr'><span id='follow-text'>ОТПИСАТЬСЯ</span>";
                    var foll_coun = document.getElementById("foll_coun_"+id);
                    foll_coun.innerHTML = parseInt(foll_coun.innerHTML)+1;
                } else {
                    
                    follow_btn.innerHTML = "<img src='/media/images/addusr.png' class='addusr'><span id='follow-text'>ПОДПИСАТЬСЯ</span>";
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

// подписчики
function foll(link, page_num, loadmore){
    if(isLoading) return false;
    page_num = typeof page_num !== 'undefined' ?  page_num : 1;
    if (loadmore == "loadmore") {
        var div_iop2 = document.getElementById("IOP2");
        var block_post = document.getElementById('foll');
    } else { 
        var block_post = document.getElementById('block-post');
        var div_iop2 = document.createElement("div");
        div_iop2.id = "IOP2";
        document.body.style.overflow = 'hidden';
    }
    var http = createRequestObject();
    var linkfull = '/follow/'+ link + "/?page="+page_num;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var f = JSON.parse(http.responseText);
                var g = JSON.parse(f.data);
                len += g.length;
                all_pages = f.all_pages;
                var html = "";
                for (var R in g) {
                    if (g[R].fields.image_user!="oneProf.png") {
                           var div_image_user = `<img src='/media/data_image/${g[R].fields.path_data}/tm_${g[R].fields.image_user}' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                    } else {
                            var div_image_user = `<img src='/media/images/oneProf.png' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                    }       
                   if (g[R].fields.username.length>15) {
                       var tuser =  g[R].fields.username.slice(0,10) + "...";
                    } else {
                        var tuser = g[R].fields.username;
                    }            
                    html += `<div class="fr-cell">
                              <a onclick='userPROFILE(${g[R].pk})' style="color:#ffffff">
                              ${div_image_user}${tuser}</a></div>`   
                }
                if (loadmore == "loadmore") {
                    block_post.innerHTML += html; 
                    div_iop2.innerText = f.op1; 
                } else { 
                    block_post.innerHTML = `<div id='foll'>${html}</div>`;
                    block_post.style.display = 'block';
                    main_wrapper.style.opacity = 0.2;
                    topbt.style.display = "block"
                    topbt.style.transform = 'rotate(90deg)';
                    topbt_indicator = "foll";
                    div_iop2.innerText = f.op1;
                    block_post.appendChild(div_iop2);
                    block_post.scrollTo(0,0);
                    block_post.onscroll = test_scroll;
                }

                //------------------------------->
                function getScrollPercent() {
                    var h = document.getElementById("block-post"), 
                        b = document.body,
                        st = 'scrollTop',
                        sh = 'scrollHeight';
                    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
                }                
                function test_scroll() {
                    processed_page = getScrollPercent();
                    if (div_iop2.innerText!="STOP") {
                        if (processed_page >= 80) {
                            foll(link, div_iop2.innerText, "loadmore");
                            isLoading = true;
                        }
                    }
                    
                }
                isLoading = false;   
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}

// подписан 
function folls(link, page_num, loadmore){
    if(isLoading) return false;
    page_num = typeof page_num !== 'undefined' ?  page_num : 1;
    if (loadmore == "loadmore") {
        var div_iop2 = document.getElementById("IOP2");
        var block_post = document.getElementById('foll');
    } else { 
        var block_post = document.getElementById('block-post');
        var div_iop2 = document.createElement("div");
        div_iop2.id = "IOP2";
        document.body.style.overflow = 'hidden';
    }
    var http = createRequestObject();
    var linkfull = '/follows/'+ link + "/?page="+page_num;
    if (http) {
        http.open('get', linkfull);
        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
        http.onreadystatechange = function () {
            if (http.readyState == 4) {
                var f = JSON.parse(http.responseText);
                var g = JSON.parse(f.data);
                len += g.length;
                all_pages = f.all_pages;
                var html = "";
                for (var R in g) {
                    if (g[R].fields.image_user!="oneProf.png") {
                           var div_image_user = `<img src='/media/data_image/${g[R].fields.path_data}/tm_${g[R].fields.image_user}' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                    } else {
                            var div_image_user = `<img src='/media/images/oneProf.png' 
                                                      width='180' 
                                                      height='180' 
                                                      loading='lazy'>`;
                    }       
                   if (g[R].fields.username.length>15) {
                       var tuser =  g[R].fields.username.slice(0,10) + "...";
                    } else {
                        var tuser = g[R].fields.username;
                    }            
                    html += `<div class="fr-cell">
                              <a onclick='userPROFILE(${g[R].pk})' style="color:#ffffff">
                              ${div_image_user}${tuser}</a></div>`   
                }
                if (loadmore == "loadmore") {
                    block_post.innerHTML += html; 
                    div_iop2.innerText = f.op1; 
                } else { 
                    block_post.innerHTML = `<div id='foll'>${html}</div>`;
                    block_post.style.display = 'block';
                    main_wrapper.style.opacity = 0.2;
                    topbt.style.display = "block"
                    topbt.style.transform = 'rotate(90deg)';
                    topbt_indicator = "foll";
                    div_iop2.innerText = f.op1;
                    block_post.appendChild(div_iop2);
                    block_post.scrollTo(0,0);
                    block_post.onscroll = test_scroll; 
                }

                //------------------------------->
                function getScrollPercent() {
                    var h = document.getElementById("block-post"), 
                        b = document.body,
                        st = 'scrollTop',
                        sh = 'scrollHeight';
                    return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
                }                
                function test_scroll() {
                    processed_page = getScrollPercent();
                    if (div_iop2.innerText!="STOP") {
                        if (processed_page >= 80) {
                            folls(link, div_iop2.innerText, "loadmore");
                            isLoading = true;
                        }
                    }
                    
                }
                isLoading = false;   
            }
        };
        http.send(null);
    } else {
        document.location = link;
    }
}

/////////////////////////////


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
//Вариант 2

function getlkpost(link, page_num, loadmore) {
        if(isLoading) return false;
        page_num = typeof page_num !== 'undefined' ?  page_num : 1;
        var block_post = document.getElementById('block-post');
        if (loadmore == "loadmore") {
            var div_iop2 = document.getElementById("IOP2");
            var node = document.getElementById('foll');
        } else { 
            block_post.innerHTML = "";
            var div_iop2 = document.createElement("div");
            div_iop2.id = "IOP2";
            document.body.style.overflow = 'hidden';
            var node = document.createElement('div');
            node.id = 'foll';
            block_post.appendChild(div_iop2)
        }  
        var http = createRequestObject();
        var linkfull = '/getlkpost/'+ link + "/?page="+page_num;
        if (http) {
            http.open('get', linkfull);
            http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
            http.onreadystatechange = function () {
                if (http.readyState == 4) {
                    var f = JSON.parse(http.responseText);
                    div_iop2.innerText = f.op1; 
                    if (loadmore == "loadmore") {
                        node.innerHTML += f["data"]; 
                    } else { 
                        node.innerHTML = f["data"];
                        block_post.appendChild(node);                
                                   
                        block_post.style.display = 'block';
                        main_wrapper.style.opacity = 0.2;
                        topbt.style.display = "block";
                        topbt.style.transform = 'rotate(90deg)';
                        topbt_indicator = "foll";
                        block_post.scrollTo(0,0); 
                        block_post.onscroll = test_scroll;
                    }
                    
                    function getScrollPercent() {
                        var h = document.getElementById("block-post"), 
                            b = document.body,
                            st = 'scrollTop',
                            sh = 'scrollHeight';
                        return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
                    }                
                    function test_scroll() {
                        processed_page = getScrollPercent();
                        if (div_iop2.innerText!="STOP") {
                            if (processed_page >= 80) {
                                getlkpost(link, div_iop2.innerText, "loadmore");
                                isLoading = true;
                            }
                        }
                    } 
                    isLoading = false;
//                    block_post.onscroll = test_scroll;
                }
            };
            http.send(null);
    } else {
        document.location = link;
    }
}


// Вариант 1

//function getlkpost(link){
//        document.body.style.overflow = 'hidden';
//        var block_post = document.getElementById('block-post');
//        var http = createRequestObject();
//        var linkfull = '/getlkpost/'+ link;
//        if (http) {
//        http.open('get', linkfull);
//        http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
//        http.onreadystatechange = function () {
//            if (http.readyState == 4) {
//                var f = JSON.parse(http.responseText);
//                var data = JSON.parse(f["data"]);
//                console.log(data)
//                for (var ix in data) {
//                    var fc = document.createElement('div');
//                    fc.className = 'message';
//                    fc.setAttribute("onmouseover", "getIndex(this);");                
//                    if (data[ix].fields.user_post[3].length>15) {
//                       var tuser =  data[ix].fields.user_post[3].slice(0,15) + "...";
//                    } else {
//                        var tuser = data[ix].fields.user_post[3];
//                    }

//                    if (data[ix].fields.body.length>18) {
//                       var ttext =  "<span class='arrow'> → </span><span class='message-title'>" + data[ix].fields.body.slice(0,20) + "...</span>";
//                    } else if (data[ix].fields.body.length == 0) {
//                        var ttext = "";
//                    } else {
//                        var ttext = "<span class='arrow'> → </span><span class='message-title'>" + data[ix].fields.body+ "</span>";
//                    }
//                    
////                    data[ix].fields.path_data
////                    data[ix].fields.user_post[1]

//                    if (data[ix].fields.user_post[0] != "oneProf.png"){
//                        var div_image_user = `<img src="/media/data_image/${data[ix].fields.user_post[1]}/${data[ix].fields.user_post[0]}" width="30" height="30">`
//                    } else {
//                        var div_image_user = `<img src="/media/images/oneProf.png" width="30" height="30">`
//                    }

//                    if (data[ix].fields.image != ""){
//                        var div_image_post = `<img src="/media/data_image/${data[ix].fields.path_data}/${data[ix].fields.image}"
//                                                     height="auto" 
//                                                     width="auto" 
//                                                     onclick="showImg(this)" 
//                                                     class="wallpost">`;
//                                                     
//                    } else {
//                        var div_image_post = `<img src="/media/images/no_image.png"
//                                                     height="auto" 
//                                                     width="auto" 
//                                                     onclick="showImg(this)" 
//                                                     class="wallpost">`;
//                    }
//                    var date = new Date(data[ix].fields.date_post);
//                    fc.innerHTML = `<div class="views-title" style="width: 100%;float: left;">
//                                        <div class="user-cord" atribut="1165">
//                                            <a onclick="userPROFILE(${data[ix].fields.user_post[2]})">
//                                                ${div_image_user}
//                                            </a>
//                                            <a class="postview" onclick="showContent(${data[ix].pk})">
//                                                <span style="font-weight: bolder;">${tuser}</span>${ttext}</a>
//                                        </div>
//                                        <span class="datetime">${date.getHours()}:${date.getMinutes()}</span>
//                                    </div>
//                                    <div class="field-image" atribut="${data[ix].pk}">
//                                        ${div_image_post}
//                                        <div id="body-post-wall">
//                                            <div id="post_like_block_${data[ix].pk}" style="width: 100%">
//                                                <img class="icon-like" 
//                                                     src="/media/images/mesvF.png" 
//                                                     onclick="comView(this)" 
//                                                     open-atr="close" 
//                                                     id-comment=${data[ix].pk} 
//                                                     id="comment_image_id_${data[ix].pk}" 
//                                                     type-div="icon" 
//                                                     indicator-ws="close">
//                                                <img class="icon-like" 
//                                                     id="post_image_${data[ix].pk}" 
//                                                     src="/media/images/frv1.png" 
//                                                     onclick="LIKE(this, ${data[ix].pk})" 
//                                                     open-atr="close" 
//                                                     type="wall">
//                                                <img class="icon-like" 
//                                                     src="/media/images/rpvF.png" 
//                                                     onclick="rpPost(this, ${data[ix].pk},'${data[ix].fields.user_post[3]}')" 
//                                                     open-atr="close" 
//                                                     type="wall">
//                                                <div class="box-indicator" 
//                                                     style="display:none;margin: 0 auto;margin-top: 15px;" 
//                                                     id="box-indicator-${data[ix].pk}"></div>
//                                            </div>
//                                        </div>
//                                    </div>`                
////                    var data_path = data[ix].fields.sender[1];
////                    console.log(data_path)
//                    var node = document.createElement('div');
//                    node.id = 'foll';
//                    node.appendChild(fc);
//                    block_post.appendChild(node);
//                }
//                
//                block_post.style.display = 'block';
//                main_wrapper.style.opacity = 0.2;
//                topbt.style.display = "block";
//                topbt.style.transform = 'rotate(90deg)';
//                topbt_indicator = "foll";
//                
//                function test_scroll() {
//                    
//                }   
//                document.getElementById("block-post").onscroll = test_scroll;
//            }
//        };
//        http.send(null);
//    } else {
//        document.location = link;
//    }
//}



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

function getIndex(node) {
    var childs = node.parentNode.children;
    for (i = 0; i < childs.length; i++) {
        len = childs.length;
    if (node == childs[i]) break;
    }
    return  innode=i;
}

function showContent(link, _type) {
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    try{document.getElementById('tooltip').remove();}catch(err) {}
    
    try{topbt.style.display = "block";}catch(err) {}
    try {
        var comv = document.getElementById("comment_image_id_"+link).getAttribute("open-atr");
        if (comv == "open") {
            comView(document.getElementById("comment_image_id_"+link));
        } else {
            if (link in ws_dict){
                console.log("showContent", link in ws_dict); //ws_dict
            } else {
                ws_dict[link] = activate_com(link);
            }
            document.getElementById("comment_image_id_"+link).setAttribute("indicator-ws", "open")  
        }
    } catch (e) {} 
    if (_page=="chat") {
        ws_dict[link] = activate_com(link);
    }
    //------------------------------->
    function getScrollPercent() {
        var h = document.getElementById("block-post"), 
            b = document.body,
            st = 'scrollTop',
            sh = 'scrollHeight';
        return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
    }                
    function test_scroll() {
        processed_page = getScrollPercent();
    }
    try {
        document.getElementById("block-post").onscroll = test_scroll;  
    } catch (e) {}
    isLoading = false;
    //_page = "showContent";
    document.body.style.overflow = 'hidden';
    var http = createRequestObject();
    if(link != null) {
        if(http) {
            http.open('get', '/data/'+link +"?_type="+_type+"&page=-1"); 
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    var block_post = document.getElementById('block-post'); // ищем элемент с id
                    block_post.innerHTML = http.responseText;
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
//                    _type = typeof _type !== 'undefined' ?  _type : "javascript";
                    if (innode == 0) {
                       textElemv1.style.display = 'none';
                       textElemv2.style.display = 'block';
                    } else if (innode==(len-1)) {
                       textElemv1.style.display = 'block';
                       textElemv2.style.display = 'none';
                    } 
                    else if (typeof innode == 'undefined' && typeof len == 'undefined') {
                       textElemv1.style.display = 'none';
                       textElemv2.style.display = 'none';                    
                    }
                    
                    if ((len-2)==innode && document.getElementById("IOP").innerText != "STOP") {
                        jsons(document.getElementById('IOP').innerText, document.getElementById("DODO").getAttribute('atr'))
                    }
                    textElemv2.onclick = function LISTING(){
                        if ((len-1)>=innode){
                            try{
                                innode++;
                                var h = document.getElementsByClassName('field-image')[innode];
                                var g = h.getAttribute('atribut');
                                showContent(g);
                            } catch (err){
                            }
                        }
                    };
                    textElemv1.onclick = function LISTING(){
                        if (innode > 0){
                            innode--;
                            var h = document.getElementsByClassName('field-image')[innode];
                            try{var g = h.getAttribute('atribut');}catch (err){}
                            showContent(g);
                        } 
                    };
                    block_post.style.display = 'block';
                    block_post.style.background = 'rgba(0,0,0,.75)';
                    block_post.style.overflow = 'auto';
                    block_post.setAttribute('atr', 'con');
                    history.pushState({"view": "post", 'lk': `/data/${link}` }, null, `/data/${link}`);
                    block_post.scrollTo(0,0);
                    
                    
                    function getScrollPercent() {
                        var h = document.getElementById("block-post"), 
                            b = document.body,
                            st = 'scrollTop',
                            sh = 'scrollHeight';
                        return (h[st]||b[st]) / ((h[sh]||b[sh]) - h.clientHeight) * 100;
                    }                
                    function test_scroll() {
                        processed_page = getScrollPercent();
                        var cord_y = document.getElementById("_post_like_block_"+link).getBoundingClientRect()["y"];
//                        console.log(processed_page, (cord_y/document.getElementById("block-post")['scrollHeight'])*100)
                    }
                    block_post.onscroll = test_scroll;
                    try { 
                        document.getElementById("see_more_button_"+link).onclick = function() {
                            console.log("see_more_button", document.getElementById("IOPcom_"+link).innerText);
                            load_more_comment(link, document.getElementById("IOPcom_"+link).innerText)
                        }
                    } catch (e) {}
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
            fc.setAttribute("onmouseover", "getIndex(this);");
            var message_data = JSON.parse(event.data);
            if (message_data["status"]=="wallpost") {
                var date = new Date(message_data.timestamp*1000);
                if (message_data.user_post.length>15) {
                   var tuser =  message_data.user_post.slice(0,15) + "...";
                } else {
                    var tuser = message_data.user_post;
                }

                if (message_data.text.length>18) {
                   var ttext =  "<span class='arrow'> → </span><span class='message-title'>" + message_data.text.slice(0,20) + "...</span>";
                } else if (message_data.text.length == 0) {
                    var ttext = "";
                } else {
                    var ttext = "<span class='arrow'> → </span><span class='message-title'>" + message_data.text+ "</span>";
                }
                if (message_data.image_user != "oneProf.png"){
                    var div_image_user = `<img src="/media/data_image/${message_data.path_data}/${message_data.image_user}" width="30" height="30">`
                } else {
                    var div_image_user = `<img src="/media/images/oneProf.png" width="30" height="30">`
                }

                if (message_data.image != ""){
                    var div_image_post = `<img src="/media/data_image/${message_data.path_data}/${message_data.image}"
                                                 height="auto" 
                                                 width="auto" 
                                                 onclick="showImg(this)" 
                                                 class="wallpost">`;
                                                 
                } else {
                    var div_image_post = `<img src="/media/images/no_image.png"
                                                 height="auto" 
                                                 width="auto" 
                                                 onclick="showImg(this)" 
                                                 class="wallpost">`;
                }
                
                fc.innerHTML = `<div class="views-title" style="width: 100%;float: left;">
                                    <div class="user-cord" atribut="1165">
                                        <a onclick="userPROFILE(${message_data.user_id})">
                                            ${div_image_user}
                                        </a>
                                        <a class="postview" onclick="showContent(${message_data.id})">
                                            <span style="font-weight: bolder;">${tuser}</span>${ttext}</a>
                                    </div>
                                    <span class="datetime">${date.getHours()}:${date.getMinutes()}</span>
                                </div>
                                <div class="field-image" atribut="${message_data.id}">
                                    ${div_image_post}
                                    <div id="body-post-wall">
                                        <div id="post_like_block_${message_data.id}" style="width: 100%">
                                            <img class="icon-like" 
                                                 src="/media/images/mesvF.png" 
                                                 onclick="comView(this)" 
                                                 open-atr="close" 
                                                 id-comment=${message_data.id} 
                                                 id="comment_image_id_${message_data.id}" 
                                                 type-div="icon" 
                                                 indicator-ws="close">
                                            <img class="icon-like" 
                                                 id="post_image_${message_data.id}" 
                                                 src="/media/images/frv1.png" 
                                                 onclick="LIKE(this, ${message_data.id})" 
                                                 open-atr="close" 
                                                 type="wall">
                                            <img class="icon-like" 
                                                 src="/media/images/rpvF.png" 
                                                 onclick="rpPost(this, ${message_data.id},'${message_data.user_post}')" 
                                                 open-atr="close" 
                                                 type="wall">
                                            <div class="box-indicator" 
                                                 style="display:none;margin: 0 auto;margin-top: 15px;" 
                                                 id="box-indicator-${message_data.id}"></div>
                                        </div>
                                    </div>
                                </div>`
                                // END STRING
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
            } else if (message_data["status"]=="deletepost") {
                try { 
                    var conversation = document.getElementById("conversation");
                    conversation.children[innode].remove();
                    handler(0);
                } catch(e) {
                    var conversation = document.getElementById("DODO");
                    conversation.children[innode].remove();
                    handler(0);
                }
                
                if (_page=="user") {
                        history.pushState({"view": "user", 
                                           'lk': `/user/${document.getElementById("user_id").innerText}` }, 
                                            null, `/user/${document.getElementById("user_id").innerText}`);
                } else if(_page=="wallpost") {
                    history.pushState({"view": "wallpost", 'lk': `/` }, null, `/`);
                }
                
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
        var title =  document.getElementById('id_body');
        var body = document.getElementById('id_body');
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
        };
        var data = JSON.stringify(event);
        ws_wall.send(data);
}
// удалить
function deletepost(self, id){
    if (self.getAttribute("del-atr")=="false") {
        self.innerText = "ДА"
        self.setAttribute("del-atr", "true");
    } else if (self.getAttribute("del-atr")=="true") {
        var event = { id : id, event: "deletepost"};
        var data = JSON.stringify(event);
        ws_wall.send(data);
    }
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
function privatMES(_type){
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    window.scrollTo(0, 0);
    var http = createRequestObject();
    if (http) {
        var linkfull = '/messages/';
        http.open('get', linkfull+'?_type='+_type);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                var block_post = document.getElementById('block-post');
                main_wrapper.style.opacity = 1;
                main_wrapper.style.display = 'block';
                block_post.style.display = 'none';
                topbt = document.getElementById('topbt');
                topbt.style.transform = 'rotate(0deg)';
                topbt.style.display = "none";
                _page = "privatmes";
                history.pushState({"view": "privatmes", 'lk': linkfull }, null, linkfull);
                document.getElementsByClassName("enter")[0].style.display = "none";
                document.body.style.overflow = 'auto';
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
        var linkfull = '/messages/send_message/';
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
                }
            };
            http.send(data);
        }
    } else {alert('Не нажимай лишний раз кнопку, если не заполнил поле')}
}


function mesID(thread_id, user_name, number_of_messages, _type){
    _type = typeof _type !== 'undefined' ?  _type : "javascript";
    isLoading = false;
    var http = createRequestObject();
    if( http )   {
        var linkfull = '/messages/chat/' + thread_id;
        http.open('get', linkfull+"/?_type="+_type);
        http.onreadystatechange = function () {
            if(http.readyState == 4) {
                main_wrapper.innerHTML = http.responseText;
                activate_chat(thread_id, user_name, number_of_messages);
                window.scrollBy(0, document.getElementById("conver").scrollHeight);
                _page = "chat";
                document.getElementById('topbt').style.transform = 'rotate(0deg)';
                history.pushState({"view": "mesID", 'lk': linkfull }, null, linkfull);
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
                if (message_data.image_user != "oneProf.png") {
                    var div_image_user = `<img src="/media/data_image/${message_data.path_data}/tm_${message_data.image_user}"
                                             class="usPr" 
                                             onclick="userPROFILE(${message_data.sender_id})">`;
                } else {
                    var div_image_user = `<img src="/media/images/oneProf.png"
                                             class="usPr" 
                                             onclick="userPROFILE(${message_data.sender_id})">`;
                }
                tev.innerHTML += `<div class="message">
                                    <p class="author ${((message_data.sender == user_name) ? 'we' : 'partner')}">
                                    ${div_image_user}
                                    </p>
                                    <p class="txtmessage ${((message_data.sender == user_name) ? 'we' : 'partner')}">
                                        ${message_data.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />')}
                                        <span class="datetime" style="font-size: 15px;color: #afafaf;">${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}
                                        </span>
                                    </p>
                                  </div>`;
//                 '<div class="message"><p class="author ' + ((message_data.sender == user_name) ? 'we' : 'partner') + '"><img src="/media/data_image/'+ message_data.path_data +'/tm_'+ message_data.image_user +'" class="usPr" onclick="userPROFILE('+ "'" + message_data.sender_id + "'" +')"></p><p class="txtmessage '+((message_data.sender == user_name) ? 'we' : 'partner') + '">' + message_data.text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />') + '<span class="datetime" style="font-size: 15px;color: #afafaf;">' + date.getHours() + ':' + date.getMinutes() + ':' + date.getSeconds() + '</span></p></div>';

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
                var tempNewVal = parseInt(document.getElementById("wscroll").scrollHeight) + 100;
                document.getElementById("wscroll").height = tempNewVal;
                window.scrollBy(0, document.getElementById("conver").getBoundingClientRect()["height"]);
                
            } else if (message_data["event"]=="loadmore") {
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
                    if (image_file != "oneProf.png") {
                        var div_image_user = `<img src="/media/data_image/${data_path}/tm_${image_file}"
                                                 class="usPr" 
                                                 onclick="userPROFILE(${sender_id})"
                                                 style="float:none;">`;
                    } else {
                        var div_image_user = `<img src="/media/images/oneProf.png"
                                                 class="usPr" 
                                                 onclick="userPROFILE(${sender_id})"
                                                 style="float:none;">`;
                    }
//                        {% if message.resend != "False" %}
//                            <a onclick="showContent({{message.text}})">СМОТРЕТЬ→</a>
//                        {% else %}
//                            {{ message.text|linebreaksbr }}
//                        {% endif %}                    
  
                    if (g[R].fields.resend != "False") {
                        var field_text = `<a onclick="showContent(${g[R].fields.text})">СМОТРЕТЬ→</a>`;
                    } else {
                        var field_text = g[R].fields.text;
                    }
                    
                    if (request_user_id == sender_id) {
                        temp_string.innerHTML += '<p class="author we">'+ div_image_user +'<p class="txtmessage we">'+ field_text +'<span class="datetime" style="font-size: 15px;color: #afafaf;">'+g[R].fields.datetime +'</span></p></p>';
                    } else { 
                        temp_string.innerHTML += '<p class="author partner">'+ div_image_user +'<p class="txtmessage partner">'+ field_text +'<span class="datetime" style="font-size: 15px;color: #afafaf;">'+g[R].fields.datetime +'</span></p></p>';
                    }
                    document.getElementById("conver").insertBefore(temp_string, document.getElementById("conver").firstChild);
                }
                document.getElementById("dot-loader").style.display = "none";  
                isLoading = false; 
                
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
    if (comv == 'close') {
        z.setAttribute("open-atr", "open");
        var http = createRequestObject();
        if (http) {
            http.open('get', '/comment/'+link);
            http.onreadystatechange = function () {
                if(http.readyState == 4) {
                    var conr = document.getElementById("post_like_block_"+link);
                    var apcom = document.createElement('div');
                    apcom.id = 'box-com-'+link;
                    apcom.className = "box-com";
                    apcom.style.display = "block";
                    apcom.innerHTML = http.responseText;
                    conr.appendChild(apcom);
                    conr.style.display = 'block';
                    if (type_div == "icon" && z.getAttribute("indicator-ws") == "close") {
                        z.setAttribute("indicator-ws", "open")
                        ws_dict[link] = activate_com(link);
                    }
                    try { 
                        document.getElementById("see_more_button_"+link).onclick = function() {
                            load_more_comment(link, document.getElementById("IOPcom_"+link).innerText)
                            //)
                        }
                    } catch (e) {}
//                    if (document.getElementById("IOPcom").innerText == "STOP") {
//                        try {
//                            document.getElementById("see_more_button").style.display = "none";
//                        } catch (e) {};
//                    }
                    
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

// загрузить еще комментарии
function load_more_comment(link, page) {
    if (page != "STOP") {      
        var http = createRequestObject();
        if(link != null) {
            if(http) {
                http.open('get', '/comment/'+link +"?&page="+page); 
                http.onreadystatechange = function () {
                    if(http.readyState == 4) {
    //                    document.getElementById("field-comment_"+link).insertBefore()
                        var f = JSON.parse(http.responseText);
                        var data = JSON.parse(f["data"]);
                        console.log("load_more_comment................", data)
                        for (var z in data) {
                            var f_c = document.createElement('div');
                            f_c.className = 'f-c';
                            if (data[z].fields.comment_user[0] != "oneProf.png") {
                                var div_image_user = `<img id="image-user" src="/media/data_image/${data[z].fields.comment_user[1]}/tm_${data[z].fields.comment_user[0]}" loading="lazy" class="imgUs" onclick="userPROFILE('${data[z].fields.comment_user[2]}', 'javascript')">`;
                            } else {
                                var div_image_user = `<img id="image-user" src="/media/images/oneProf.png" loading="lazy" class="imgUs" onclick="userPROFILE('${data[z].fields.comment_user[2]}', 'javascript')">`;
                            }
                            
                            if (data[z].fields.comment_image) {
                                var comment_image = `<img id="comment-image" src="/media/data_image/${data[z].fields.comment_user[1]}/${data[z].fields.comment_image}.png" onclick="showImg(this)">`;
                            } else {
                                var comment_image = "";
                            }
    //            {% if cm.comment_image %}
    //                
    //<!--                display:block;margin:0 auto;max-width:400px;width: auto;height:auto;max-height: 240px;-->
    //            {% endif %}                        
                            var comment_date = new Date(data[z].fields.timecomment);
                            var comment_month = comment_date.toLocaleString('en-US', { month: 'short' });
                            f_c.innerHTML = `${div_image_user}<a onclick="userPROFILE('${data[z].fields.comment_user[2]}', 'javascript')" id="user-comment">${data[z].fields.comment_user[3]}</a>
                <p id="comment-text">${data[z].fields.comment_text}</p>
                ${comment_image}
                <div id="time-comment">${comment_date.getDate()} ${comment_month.toLowerCase()} ${comment_date.getFullYear()} в ${comment_date.getHours()}:${comment_date.getMinutes()}</div>
            </div>`
                            document.getElementById("field-comment_"+link).insertBefore(f_c ,document.getElementById("field-comment_"+link).firstChild);
                            
                        }
                        document.getElementById("IOPcom_"+link).innerText = f.op1;
                        if (f.op1 == "STOP") {
                            document.getElementById("see_more_button_"+link).style.display = "none";
                        }                        
                    
                    }
                }
                http.send(null); 
            }
        } else {
                document.location = link;
        }  
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
    document.getElementsByClassName('compose_'+cip)[0].style.display = "none";
    document.getElementById('results_'+cip).appendChild(t_el);
    var data = JSON.stringify({ comment_text : comment_text.innerText,
                                comment_image: dataURL_v1 });
    try {
        if (ws_dict[cip].url.split('/')[4] != cip) {
        } else {
            if (ws_dict[cip].readyState != WebSocket.OPEN) {
                return false;
            }
            ws_dict[cip].send(data);
            comment_text.innerText = "";
            if (typeof context !== 'undefined') {
                context.clearRect(0, 0, canvas.width, canvas.height);
                dataURL_v1 = "";
                canvas.width = 0;
                canvas.height = 0;
            }

        }
    } catch(e) {
//        console.log(cip, e);
        zetr.setAttribute("indicator-ws", "open");
        ws_dict[cip] = activate_com(cip);
        ws_dict[cip].send(data);
        comment_text.innerText = "";
    }
    console.log(zetr, _page, ws_dict, cip);
}

function activate_com(post_id) {
    function start_com_ws() {
        var ws_com = new WebSocket("ws://"+ IP_ADDR + ":"+PORT+"/comment/" + post_id + "/");
        ws_com.onmessage = function(event) {
            var tev = document.getElementById('field-comment_'+post_id);
            var fc = document.createElement('div');
            fc.className = 'f-c';
            var message_data = JSON.parse(event.data);
            if (message_data.image_user != "oneProf.png") {
                var img_com_user = `"/media/data_image/${message_data.path_data}/tm_${message_data.image_user}"`;
            } else {
                var img_com_user = `"/media/images/oneProf.png"`;
            }
            if (message_data.comment_image != "") {
                fc.innerHTML = `<img id="image-user" 
                                     src=${img_com_user} 
                                     class="imgUs" 
                                     onclick="userPROFILE(${message_data.user_id})" s
                                     tyle="cursor:pointer;" loading="lazy">
                                <a onclick="userPROFILE(${message_data.user_id})" 
                                   id="user-comment">${message_data.comment_user}</a>
                                <p id="comment-text">${message_data.comment_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />')}</p>
                                <img id="comment-image" 
                                     src="/media/data_image/${message_data.comment_image}" 
                                     onclick="showImg(this)">`
            } else {
                fc.innerHTML = `<img id="image-user" 
                                     src=${img_com_user} 
                                     class="imgUs" 
                                     onclick="userPROFILE(${message_data.user_id})" 
                                     style="cursor:pointer;" 
                                     loading="lazy">
                                <a onclick="userPROFILE(${message_data.user_id})" 
                                   id="user-comment">${message_data.comment_user}</a>
                                <p id="comment-text">${message_data.comment_text}</p>`
            }
            fc.innerHTML += "<div id='time-comment'>"+ message_data.timecomment +"</div>"
            tev.insertBefore(fc, tev.lastChild);
            document.getElementsByClassName('compose_'+post_id)[0].style.display = "block";
            try {
                document.getElementById('results_'+post_id).removeChild(t_el);
            } catch (e) {}
            try {
                document.getElementById("block-post").scrollTo(0, document.getElementById("node").getBoundingClientRect()['height']);
            } catch (e) {}
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
    if (_page == "chat") {
        if (e.keyCode == 13 && !event.shiftKey) {
            e.preventDefault();
            send_message();
            return false;
        } 
    }
});

