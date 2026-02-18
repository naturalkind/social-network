// ==================== КОНФИГУРАЦИЯ ====================
const CONFIG = {
    PORT: "8888",
    WS_PROTOCOL: "ws://",
    DEFAULT_AVATAR: "/static/images/oneProf.png",
    NO_IMAGE: "/static/images/no_image.png",
    LIKE_GIF: "/static/images/frv1.gif",
    LIKE_PNG: "/static/images/frv1.png",
    RP_OPEN: "/static/images/close3.png",
    RP_CLOSED: "/static/images/rpvF.png",
    ED_PROF_OPEN: "/static/images/close3.png",
    ED_PROF_CLOSED: "/static/images/edprof.png",
    CHUNK_SIZE: 1024 * 1024,
    SCROLL_THRESHOLD: 80,
    CHAT_SCROLL_THRESHOLD: 30
};

// ==================== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ ====================
const IP_ADDR = window.location.hostname;
let _page = "wallpost";
let innode;
let len;
let topbt;
let topbt_indicator;
let topbt_position;
let main_wrapper;
let yOffset;
let temp_position;
let isLoading = false;
let all_pages;
let arr_notification = [];
let processed_page;
let countries = [];

// WebSocket словарь
const ws_dict = {};

// Canvas и FileReader
let canvas;
let context;
let currentCanvasId = null;
let reader = new FileReader();
let dataURL_v1;
let dataURL_wall;
let filewall;
let SelectedFile;
let Name;
let fileSize;
let currentChunk = 1.0;
let totalChunks;
let sPR = 0;
let PR = 0;

// Элемент загрузчика
const t_el = document.createElement("div");
t_el.id = "loader";
t_el.style.display = "block";

// ==================== УТИЛИТЫ ====================

/**
 * Создание XMLHttpRequest с поддержкой старых браузеров
 */
function createRequestObject() {
    try { return new XMLHttpRequest(); }
    catch(e) {
        try { return new ActiveXObject('Msxml2.XMLHTTP'); }
        catch(e) {
            try { return new ActiveXObject('Microsoft.XMLHTTP'); }
            catch(e) { return null; }
        }
    }
}

/**
 * Безопасный AJAX-запрос
 */
function ajaxRequest(options) {
    const {
        url,
        method = 'GET',
        data = null,
        headers = {},
        responseType = 'json',
        onSuccess,
        onError
    } = options;

    const http = createRequestObject();
    if (!http) {
        console.error('XMLHttpRequest не поддерживается');
        if (onError) onError(new Error('XMLHttpRequest не поддерживается'));
        return;
    }

    http.open(method, url, true);
    
    // Установка заголовков по умолчанию
    http.setRequestHeader('Content-type', 'application/json; charset=utf-8');
    
    // Дополнительные заголовки
    Object.keys(headers).forEach(key => {
        http.setRequestHeader(key, headers[key]);
    });

    http.onreadystatechange = function() {
        if (http.readyState === 4) {
            if (http.status >= 200 && http.status < 300) {
                if (onSuccess) {
                    try {
                        const result = responseType === 'json' 
                            ? JSON.parse(http.responseText) 
                            : http.responseText;
                        onSuccess(result);
                    } catch (e) {
                        onSuccess(http.responseText);
                    }
                }
            } else {
                if (onError) onError(new Error(`HTTP error ${http.status}`));
            }
        }
    };

    http.send(data ? JSON.stringify(data) : null);
}

/**
 * Получение cookie
 */
function getCookie(name) {
    if (!document.cookie || document.cookie === '') return null;
    
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
        const cookie = cookies[i].trim();
        if (cookie.substring(0, name.length + 1) === (name + '=')) {
            return decodeURIComponent(cookie.substring(name.length + 1));
        }
    }
    return null;
}

/**
 * CSRF-токен
 */
function getCSRFToken() {
    const csrfElement = document.getElementsByName('csrfmiddlewaretoken')[0];
    return csrfElement ? csrfElement.value : getCookie('csrftoken');
}

/**
 * Форматирование окончаний
 */
function getNumEnding(number, endings) {
    number %= 100;
    if (number >= 11 && number <= 19) {
        return endings[2];
    }
    
    const i = number % 10;
    switch (i) {
        case 1: return endings[0];
        case 2:
        case 3:
        case 4: return endings[1];
        default: return endings[2];
    }
}

/**
 * Процент прокрутки
 */
function getScrollPercent(element = document.documentElement) {
    const scrollTop = element.scrollTop || document.body.scrollTop;
    const scrollHeight = element.scrollHeight || document.body.scrollHeight;
    const clientHeight = element.clientHeight;
    
    return (scrollTop / (scrollHeight - clientHeight)) * 100 || 0;
}

/**
 * Звуковой сигнал
 */
function beep(freq = 660, duration = 90) {
    try {
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gain = context.createGain();
        
        gain.gain.setValueAtTime(0, context.currentTime);
        gain.gain.linearRampToValueAtTime(1, context.currentTime + 0.002);
        
        oscillator.connect(gain);
        oscillator.frequency.value = freq;
        oscillator.type = "square";
        gain.connect(context.destination);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + duration * 0.001);
        oscillator.onended = () => context.close();
    } catch (e) {
        console.warn('Аудио не поддерживается:', e);
    }
}

/**
 * Обрезка имени
 */
function truncateUsername(username, maxLength = 15) {
    if (!username) return '';
    return username.length > maxLength ? username.slice(0, maxLength - 3) + '...' : username;
}

/**
 * Генерация HTML аватара
 */
function getAvatarHTML(imageUser, pathData, size = 180, className = '', onClick = '') {
    const imgSrc = imageUser !== "oneProf.png" 
        ? `/media/data_image/${pathData}/tm_${imageUser}`
        : CONFIG.DEFAULT_AVATAR;
    
    const clickHandler = onClick ? `onclick="${onClick}"` : '';
    
    return `<img src="${imgSrc}" 
                width="${size}" 
                height="${size}" 
                loading="lazy" 
                class="${className}" 
                ${clickHandler}>`;
}

// ==================== УПРАВЛЕНИЕ ИСТОРИЕЙ ====================

const historyManager = {
    push(view, link, id = null) {
        const state = { view, link };
        if (id) state.id = id;
        history.pushState(state, null, link);
    },
    
    replace(view, link, id = null) {
        const state = { view, link };
        if (id) state.id = id;
        history.replaceState(state, null, link);
    },
    
    updatePageView(view) {
        _page = view;
    },
    
    handlePopState(e) {
        const state = e.state || { view: "wallpost" };
        console.log("popstate:", state, _page);
        
        const handlers = {
            wallpost: () => {
                if (state.view === _page) {
                    handler("o");
                } else {
                    main_page();
                }
            },
            post: () => showContent(state.id),
            user: () => userPROFILE(state.id),
            users: () => users(),
            privatmes: () => {
                privatMES();
                handler("o");
            },
            mesID: () => mesID(state.id, state.user_name, state.number_of_messages),
            addpost: () => addPost()
        };
        
        if (handlers[state.view]) {
            handlers[state.view]();
        }
    },
    
    setDefault() {
        history.pushState({ view: "wallpost", link: "/" }, null, "/");
    }
};

// ==================== УПРАВЛЕНИЕ TOPBT ====================

const topbtManager = {
    init() {
        topbt = document.getElementById('topbt');
        if (topbt) topbt.style.display = "none";
    },
    
    show(transform = 'rotate(0deg)') {
        if (!topbt) return;
        topbt.style.display = "block";
        topbt.style.transform = transform;
    },
    
    hide() {
        if (!topbt) return;
        topbt.style.display = "none";
    },
    
    setIndicator(indicator) {
        topbt_indicator = indicator;
    },
    
    handleEvent(e) {
        console.log("event topbt", topbt_indicator, _page);
        
        const handlers = {
            editPROFF: () => {
                document.getElementsByClassName("edprof")[0]?.setAttribute("open-atr", "close");
                handler(e);
            },
            scroll_down_chat: () => {
                e.style.transform = 'rotate(0deg)';
                topbt_indicator = "scroll_up_chat";
                window.scrollTo(0, document.body.scrollHeight);
            },
            scroll_up_chat: () => {
                e.style.transform = 'rotate(180deg)';
                topbt_indicator = "scroll_down_chat";
                window.scrollTo(0, 0);
            },
            scroll_up: () => {
                e.style.transform = 'rotate(180deg)';
                topbt_indicator = "scroll_down";
                temp_position = yOffset;
                window.scrollTo(0, 0);
            },
            scroll_down: () => {
                e.style.transform = 'rotate(0deg)';
                window.scrollTo(0, temp_position);
                topbt_indicator = "scroll_up";
            },
            handler: () => {
                handler(e);
                historyManager.push(
                    getCurrentPageView(),
                    getCurrentPageLink(),
                    getCurrentPageId()
                );
            },
            addPost: () => {
                handler(e);
                isLoading = false;
                historyManager.push(
                    getCurrentPageView(),
                    getCurrentPageLink(),
                    getCurrentPageId()
                );
            },
            foll: () => handler(e)
        };
        
        if (handlers[topbt_indicator]) {
            handlers[topbt_indicator]();
        }
    }
};

// Вспомогательные функции для topbtManager
function getCurrentPageView() {
    if (_page === "wallpost") return "wallpost";
    if (_page === "user") return "user";
    if (_page === "chat") return "user";
    return _page;
}

function getCurrentPageLink() {
    if (_page === "wallpost") return "/";
    if (_page === "user") {
        const userId = document.getElementById("user_id")?.innerText;
        return userId ? `/user/${userId}` : "/";
    }
    if (_page === "chat") {
        const chatId = document.getElementById("chat_id")?.innerText;
        return chatId ? `/messages/chat/${chatId}` : "/";
    }
    return "/";
}

function getCurrentPageId() {
    if (_page === "user") return document.getElementById("user_id")?.innerText;
    if (_page === "chat") return document.getElementById("chat_id")?.innerText;
    return null;
}

// ==================== УПРАВЛЕНИЕ УВЕДОМЛЕНИЯМИ ====================

const notificationManager = {
    load() {
        const saved = localStorage.getItem("notification");
        if (saved) {
            try {
                arr_notification = JSON.parse(saved);
            } catch (e) {
                arr_notification = [];
            }
        }
        return arr_notification;
    },
    
    save() {
        localStorage.setItem("notification", JSON.stringify(arr_notification));
    },
    
    add(threadId) {
        if (!arr_notification.includes(String(threadId))) {
            arr_notification.push(String(threadId));
            this.save();
            this.updateNavDisplay();
        }
    },
    
    remove(threadId) {
        const index = arr_notification.indexOf(String(threadId));
        if (index !== -1) {
            arr_notification.splice(index, 1);
            this.save();
            this.updateNavDisplay();
            this.removeNotificationElement(threadId);
        }
    },
    
    removeNotificationElement(threadId) {
        const elem = document.getElementById(`notification-${threadId}`);
        if (elem) elem.remove();
    },
    
    updateNavDisplay() {
        const notificationNav = document.getElementById("notification-nav");
        if (!notificationNav) return;
        
        const hasNotifications = arr_notification.length > 0 || 
                               (parseInt(getCookie('notifications')) > 0);
        
        notificationNav.style.display = hasNotifications ? "block" : "none";
    },
    
    displayOnPage() {
        if (_page !== "privatmes") return;
        
        if (arr_notification.length === 0) {
            document.getElementById("notification-nav").style.display = "none";
            return;
        }
        
        arr_notification.forEach(threadId => {
            const posElement = document.getElementById(`pm-block-${threadId}`);
            if (posElement && !document.getElementById(`notification-${threadId}`)) {
                const notificationDiv = document.createElement("div");
                notificationDiv.id = `notification-${threadId}`;
                notificationDiv.className = "notification";
                notificationDiv.style.display = "block";
                notificationDiv.innerText = "!";
                posElement.appendChild(notificationDiv);
            }
        });
    }
};

// ==================== УПРАВЛЕНИЕ БЛОКОМ POST ====================

const postBlockManager = {
    show(content = '', options = {}) {
        const blockPost = document.getElementById('block-post');
        if (!blockPost) return;
        
        blockPost.innerHTML = content;
        blockPost.style.display = 'block';
        
        if (options.overflowHidden) {
            document.body.style.overflow = 'hidden';
        }
        
        if (options.scrollTo) {
            blockPost.scrollTo(0, options.scrollTo);
        }
        
        if (options.className) {
            blockPost.className = options.className;
        }
        
        if (options.background) {
            blockPost.style.background = options.background;
        }
        
        if (options.overflow) {
            blockPost.style.overflow = options.overflow;
        }
    },
    
    hide() {
        const blockPost = document.getElementById('block-post');
        if (blockPost) {
            blockPost.innerHTML = '';
            blockPost.style.display = 'none';
        }
        document.body.style.overflow = 'auto';
    },
    
    clear() {
        const blockPost = document.getElementById('block-post');
        if (blockPost) blockPost.innerHTML = '';
    }
};

// ==================== ОСНОВНЫЕ ФУНКЦИИ ====================

/**
 * Инициализация при загрузке
 */
function initApp() {
    console.log("load......");
    
    // Инициализация элементов
    topbtManager.init();
    main_wrapper = document.getElementById("main-wrapper");
    
    // Уведомления
    notificationManager.load();
    notificationManager.updateNavDisplay();
    
    // История
    historyManager.setDefault();
    _page = "wallpost";
    
    // Скрыть поиск
    try {
        document.getElementById("search-box").style.display = "none";
    } catch (e) {}
}

window.onload = initApp;
window.addEventListener('load', initApp);
document.addEventListener('DOMContentLoaded', initApp);

/**
 * Обработчик прокрутки
 */
function scrollHandler() {
    // Удаление тултипов
    try {
        document.getElementById('tooltip')?.remove();
        const edprof = document.getElementsByClassName('edprof')[0];
        if (edprof) {
            edprof.setAttribute("open-atr", "close");
            edprof.src = CONFIG.ED_PROF_CLOSED;
            edprof.style.background = "#507299";
        }
    } catch (err) {}
    
    if (isLoading) return;
    
    processed_page = getScrollPercent();
    yOffset = window.pageYOffset;
    
    const iop = document.getElementById('IOP');
    const isActive = iop && iop.innerText !== "STOP";
    
    if (isActive) {
        if (_page === "chat" && processed_page <= CONFIG.CHAT_SCROLL_THRESHOLD) {
            handleChatScroll();
        } else if (processed_page >= CONFIG.SCROLL_THRESHOLD) {
            handleMainScroll();
        }
    } else {
        updateTopbtDirection();
    }
}

function handleChatScroll() {
    isLoading = true;
    topbtManager.show('rotate(180deg)');
    topbt_indicator = "scroll_down_chat";
    temp_position = window.innerHeight;
    
    const loader = document.getElementById("dot-loader");
    if (loader) loader.style.display = "block";
    
    const chatId = document.getElementById("chat_id")?.innerText;
    const iop = document.getElementById('IOP')?.innerText;
    
    if (chatId && iop && ws_dict[chatId]) {
        ws_dict[chatId].send(JSON.stringify({
            event: "loadmore",
            message: iop
        }));
    }
}

function handleMainScroll() {
    isLoading = true;
    topbt_position = window.pageYOffset + window.innerHeight;
    topbt_indicator = "scroll_up";
    topbtManager.show();
    
    const iop = document.getElementById('IOP')?.innerText;
    const atr = document.getElementById("user-content-block")?.getAttribute('atr');
    
    if (iop && atr) {
        jsons(iop, atr);
    }
}

function updateTopbtDirection() {
    if (!topbt) return;
    
    if (processed_page <= CONFIG.CHAT_SCROLL_THRESHOLD) {
        topbt_indicator = _page === "chat" ? "scroll_down_chat" : "scroll_down";
        topbt.style.transform = 'rotate(180deg)';
    } else if (processed_page >= CONFIG.SCROLL_THRESHOLD) {
        topbt_indicator = _page === "chat" ? "scroll_up_chat" : "scroll_up";
        topbt.style.transform = 'rotate(0deg)';
    }
}

window.onscroll = scrollHandler;

/**
 * Закрытие модального окна
 */
function handler(e) {
    const blockPost = document.getElementById('block-post');
    if (blockPost) {
        blockPost.innerHTML = "";
        blockPost.style.display = 'none';
    }
    
    document.body.style.overflow = 'auto';
    
    if (topbt) {
        topbt.style.transform = 'rotate(0deg)';
    }
    
    if (main_wrapper) {
        main_wrapper.style.opacity = 1;
    }
    
    const contentHeight = main_wrapper?.offsetHeight || 0;
    topbt_indicator = topbt_position > contentHeight ? "scroll_down" : "scroll_up";
}

/**
 * Удаление поста с закрытием
 */
function handler_delete(postId) {
    const blockPost = document.getElementsByClassName(`block-post-${postId}`)[0];
    if (blockPost) {
        blockPost.innerHTML = "";
        blockPost.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        if (topbt) {
            topbt.style.transform = 'rotate(0deg)';
        }
        
        if (main_wrapper) {
            main_wrapper.style.opacity = 1;
        }
        
        const contentHeight = main_wrapper?.offsetHeight || 0;
        topbt_indicator = topbt_position > contentHeight ? "scroll_down" : "scroll_up";
    }
}

/**
 * Загрузка основного контента
 */
function loadContent(url, callback) {
    ajaxRequest({
        url: `${url}?_type=javascript`,
        method: 'GET',
        responseType: 'text',
        onSuccess: (response) => {
            if (main_wrapper) {
                main_wrapper.innerHTML = response;
                if (callback) callback();
            }
        }
    });
}

/**
 * Главная страница
 */
function main_page() {
    loadContent('/', () => {
        _page = "wallpost";
    });
}

/**
 * Пользователи
 */
function users(_type = "javascript") {
    window.scrollTo(0, 0);
    
    ajaxRequest({
        url: `/users/?_type=${_type}`,
        responseType: 'text',
        onSuccess: (response) => {
            if (!main_wrapper) return;
            
            main_wrapper.innerHTML = response;
            main_wrapper.style.opacity = 1;
            main_wrapper.style.display = 'block';
            
            document.body.style.overflow = 'auto';
            
            postBlockManager.hide();
            isLoading = false;
            
            topbtManager.init();
            topbtManager.hide();
            
            try {
                document.getElementsByClassName("enter")[0].style.display = "none";
                document.getElementById("search-box").style.display = "block";
            } catch (e) {}
            
            if (history.state?.view !== "users") {
                historyManager.push("users", "/users/");
                _page = "users";
            }
            
            const searchInput = document.getElementById("search-input");
            if (searchInput) {
                autocomplete(searchInput);
            }
        }
    });
}

/**
 * Выход
 */
function quit() {
    ajaxRequest({
        url: '/logout',
        method: 'GET',
        responseType: 'text',
        onSuccess: () => {
            window.location.reload();
        }
    });
}

/**
 * Вход
 */
function enter() {
    ajaxRequest({
        url: '/login',
        responseType: 'text',
        onSuccess: (response) => {
            if (main_wrapper) {
                main_wrapper.innerHTML = response;
            }
        }
    });
}

/**
 * Регистрация
 */
function addREG(_type = "javascript") {
    ajaxRequest({
        url: `/register/?_type=${_type}`,
        responseType: 'text',
        onSuccess: (response) => {
            if (main_wrapper) {
                main_wrapper.innerHTML = response;
                historyManager.push("register", "/register");
            }
        }
    });
}

/**
 * Профиль пользователя
 */
function userPROFILE(link, _type = "javascript") {
    window.scrollTo(0, 0);
    
    ajaxRequest({
        url: `/user/${link}/?_type=${_type}`,
        responseType: 'text',
        onSuccess: (response) => {
            if (!main_wrapper) return;
            
            main_wrapper.innerHTML = response;
            main_wrapper.style.opacity = 1;
            main_wrapper.style.display = 'block';
            
            postBlockManager.hide();
            document.body.style.overflow = 'auto';
            
            topbtManager.init();
            topbtManager.hide();
            
            isLoading = false;
            
            try {
                const searchBox = document.getElementById("search-box");
                if (searchBox) searchBox.style.display = "none";
            } catch (e) {}
            
            // Управление историей
            const currentState = history.state;
            if (currentState?.view !== "user") {
                historyManager.push("user", `/user/${link}`, link);
                _page = "user";
            } else if (currentState.id !== link) {
                historyManager.push("user", `/user/${link}`, link);
            } else {
                historyManager.replace("user", `/user/${link}`, link);
            }
            
            try {
                document.getElementById('atr-user')?.getAttribute('atr-user');
                document.getElementsByClassName("enter")[0].style.display = "block";
            } catch (e) {}
        }
    });
}

/**
 * Лучшие посты
 */
function filterBEST() {
    ajaxRequest({
        url: '/best',
        responseType: 'text',
        onSuccess: (response) => {
            if (main_wrapper) {
                main_wrapper.innerHTML = response;
            }
        }
    });
}

/**
 * Меню настроек
 */
function menuset(self, link, username, del_indicator, like_count, total_friends) {
    if (self.getAttribute("open-atr") === "close") {
        self.style.transform = "rotate(90deg)";
        self.setAttribute("open-atr", "open");
        
        const tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip';
        
        const deleteLink = del_indicator === 'true' 
            ? `<a id="deletepost" onclick="deletepost(this, '${link}')" del-atr="false">УДАЛИТЬ</a>`
            : "";
        
        tooltipElem.innerHTML = `
            <div id="post_like_block_${link}" style="width: 100%">
                ${deleteLink}
                <a onclick="LIKEOVER('${link}')">понравилось ${like_count}</a>
                <a onclick="FRIENDS('${link}')">отправить ${total_friends}</a>
            </div>
        `;
        
        const closeBtn = document.createElement('a');
        closeBtn.id = 'close';
        closeBtn.onclick = () => {
            self.style.transform = "rotate(0deg)";
            document.getElementById('tooltip')?.remove();
            self.setAttribute("open-atr", "close");
            document.getElementById("block-post").style.overflowY = 'scroll';
        };
        
        const divIop3 = document.createElement("div");
        divIop3.id = "IOP3";
        
        tooltipElem.insertBefore(divIop3, tooltipElem.firstChild);
        tooltipElem.insertBefore(closeBtn, tooltipElem.firstChild);
        
        document.getElementById("breadcrumb")?.appendChild(tooltipElem);
        
        const coords = self.getBoundingClientRect();
        let left = coords.left + (self.offsetWidth - tooltipElem.offsetWidth) / 2;
        if (left < 0) left = 0;
        
        let top = coords.top - tooltipElem.offsetHeight - 5;
        if (top < 0) top = coords.top + self.offsetHeight + 5;
        
        tooltipElem.style.top = (top + 10) + 'px';
        
        const test_scroll = () => {};
        document.getElementById("block-post").onscroll = test_scroll;
        
    } else {
        self.style.transform = "rotate(0deg)";
        self.setAttribute("open-atr", "close");
        document.getElementById('tooltip')?.remove();
    }
}

/**
 * Лайк
 */
function LIKE(self, link) {
    if (self.getAttribute("open-atr") !== "close") return;
    
    ajaxRequest({
        url: `/add_like/?post_id=${link}`,
        onSuccess: (data) => {
            self.setAttribute("src", data["like-indicator"] == "1" ? CONFIG.LIKE_GIF : CONFIG.LIKE_PNG);
        }
    });
}

/**
 * Лайки при наведении
 */
function LIKEOVER(link, page_num = 1, loadmore = null) {
    if (isLoading) return false;
    
    const divIop3 = document.getElementById("IOP3");
    let tooltipElem;
    let isLoadMore = loadmore === "loadmore";
    
    if (isLoadMore) {
        tooltipElem = document.getElementById(`tooltip_${link}`);
    } else {
        document.getElementById(`tooltip_${link}`)?.remove();
        
        tooltipElem = document.createElement('div');
        tooltipElem.id = `tooltip_${link}`;
        tooltipElem.style.cssText = `max-height: ${window.innerHeight * 0.7}px; overflow-y: auto; float: left; position: relative; width: 100%;`;
        
        document.getElementById("block-post").style.overflowY = 'hidden';
        
        const over = document.getElementById("tooltip");
        if (over) {
            over.appendChild(tooltipElem);
            if (divIop3) over.appendChild(divIop3);
        }
    }
    
    ajaxRequest({
        url: `/likeover/?post_id=${link}&page=${page_num}`,
        onSuccess: (data) => {
            if (divIop3) divIop3.innerText = data.op1;
            
            const usersData = JSON.parse(data.data);
            let html = '';
            
            usersData.forEach(user => {
                html += getAvatarHTML(
                    user.fields.image_user,
                    user.fields.path_data,
                    30,
                    'imgUs',
                    `userPROFILE('${user.pk}')`
                );
            });
            
            if (isLoadMore) {
                if (tooltipElem) tooltipElem.innerHTML += html;
            } else {
                if (tooltipElem) tooltipElem.innerHTML = html;
            }
            
            function tooltipScroll() {
                if (divIop3?.innerText !== "STOP") {
                    const scrollPercent = getScrollPercent(tooltipElem);
                    if (scrollPercent >= 80) {
                        LIKEOVER(link, divIop3.innerText, "loadmore");
                        isLoading = true;
                    }
                }
            }
            
            if (tooltipElem) tooltipElem.onscroll = tooltipScroll;
            isLoading = false;
        }
    });
}

function LIKEDONE(self, link) {
    document.getElementById(`tooltip_${link}`)?.remove();
}

/**
 * Репост
 */
function rpPost(self, link, username) {
    if (self.getAttribute("open-atr") !== "close") return;
    
    ajaxRequest({
        url: `/rppos/${link}?username=${username}&user_blank=1`,
        onSuccess: (data) => {
            self.setAttribute("src", 
                data["like-indicator"] === 1 ? CONFIG.RP_OPEN : CONFIG.RP_CLOSED);
        }
    });
}

/**
 * Отправить пост другу
 */
function reSend(user_id, post_id) {
    const crsv = getCSRFToken();
    
    ajaxRequest({
        url: '/friends/',
        method: 'POST',
        headers: { 'X-CSRFToken': crsv },
        data: { user_id, post_id },
        onSuccess: () => alert("отправлено")
    });
}

/**
 * Подписка/отписка
 */
function addfollow(self, link, username, id) {
    const crsv = getCSRFToken();
    const follow = self.getAttribute("atr-follow") === "true";
    const userBlank = follow ? 0 : 1;
    
    ajaxRequest({
        url: `/user/${link}/?username=${username}&userid=${id}&user_blank=${userBlank}`,
        method: 'POST',
        headers: { 'X-CSRFToken': crsv },
        onSuccess: () => {
            const followBtn = document.getElementById(`follw_${id}`);
            if (!followBtn) return;
            
            if (!follow) {
                followBtn.innerHTML = "<img src='/static/images/dusr.png' class='addusr'><span id='follow-text'>ОТПИСАТЬСЯ</span>";
                self.setAttribute("atr-follow", "true");
                
                const follCoun = document.getElementById(`foll_coun_${id}`);
                if (follCoun) {
                    follCoun.innerHTML = parseInt(follCoun.innerHTML) + 1;
                }
            } else {
                followBtn.innerHTML = "<img src='/static/images/addusr.png' class='addusr'><span id='follow-text'>ПОДПИСАТЬСЯ</span>";
                self.setAttribute("atr-follow", "false");
                
                const follCoun = document.getElementById(`foll_coun_${id}`);
                if (follCoun) {
                    follCoun.innerHTML = parseInt(follCoun.innerHTML) - 1;
                }
            }
        }
    });
}

// ==================== ЗАГРУЗКА ДАННЫХ (JSONS) ====================

/**
 * Загрузка дополнительного контента (бесконечная прокрутка)
 */
function jsons(link, atr) {
    let linkfull;
    let contv;
    let width, height;
    let userId;
    
    // Настройка параметров в зависимости от типа
    switch (atr) {
        case 'user':
            contv = document.getElementById('user-content-block');
            width = 300;
            height = 230;
            userId = document.getElementById('user_id').innerText;
            linkfull = `/user/${userId}/?page=${link}`;
            break;
        case 'users':
            contv = document.getElementById('user-content-block');
            width = 180;
            height = 160;
            linkfull = `/users/?page=${link}`;
            break;
        case 'wall':
            contv = document.getElementById('conversation');
            width = "auto";
            height = "auto";
            linkfull = `/?page=${link}`;
            break;
        case 'wall-nonregister':
            contv = document.getElementById('user-content-block');
            width = "auto";
            height = "auto";
            linkfull = `/?page=${link}`;
            break;
        default:
            return;
    }
    
    ajaxRequest({
        url: linkfull,
        onSuccess: (f) => {
            all_pages = f.all_pages;
            document.getElementById('IOP').innerText = f.op1;
            
            let html = '';
            
            if (atr === 'users') {
                const g = JSON.parse(f.data);
                len = (len || 0) + g.length;
                
                g.forEach(user => {
                    const username = truncateUsername(user.fields.username);
                    const avatarHTML = getAvatarHTML(
                        user.fields.image_user,
                        user.fields.path_data,
                        180
                    );
                    const onlineHTML = `<div class="numberCircle_users" style="background:${user.fields.online ? '#37b73c' : '#c3c3c3'};"></div>`;
                    
                    html += `<div class='views-row' onclick='userPROFILE("${user.pk}")'>
                                <div class="img-user-block">
                                    ${avatarHTML}
                                    <div class='user-name'><a atribut='${user.pk}' id="user-link">${username}</a></div>
                                    ${onlineHTML}
                                </div>
                            </div>`;
                });
                
                contv.innerHTML += html;
                isLoading = false;
                
            } else if (atr === 'wall') {
                html += f.data;
                len = (len || 0) + 6;
                contv.innerHTML += html;
                isLoading = false;
                
            } else if (atr === 'wall-nonregister' || atr === 'user') {
                const g = JSON.parse(f.data);
                len = (len || 0) + g.length;
                
                g.forEach(post => {
                    const img = post.fields.image 
                        ? `/media/data_image/${post.fields.path_data}/${post.fields.image}`
                        : CONFIG.NO_IMAGE;
                    
                    let postHTML = `<li class='views-row' onmouseover='getIndex(this);'>
                                        <div class='field-image' atribut='${post.pk}'>
                                            <img style='background: url("${img}"); width:300px; height:230px; background-size: cover;'  
                                                 onclick='showContent("${post.pk}")' 
                                                 loading='lazy'>
                                        </div>
                                        <div id='${post.pk}' data-tooltip='${post.pk}'></div>`;
                    
                    if (atr === 'user') {
                        postHTML += `<div id='${post.pk}' 
                                           style='position: relative; opacity: 1; pointer-events: auto; display: none;'>
                                            <img class='icon-like' 
                                                 src='/static/images/mesvF.png' 
                                                 onclick='comView(this)' 
                                                 open-atr='close' 
                                                 id-comment='${post.pk}' 
                                                 id='comment_image_id_${post.pk}' 
                                                 type-div='icon' 
                                                 indicator-ws='close' 
                                                 style='display:none;'>
                                        </div>`;
                    }
                    
                    postHTML += `</li>`;
                    html += postHTML;
                });
                
                contv.innerHTML += html;
                isLoading = false;
            }
        }
    });
}

// ==================== РАБОТА С ИЗОБРАЖЕНИЯМИ ====================

/**
 * Показать изображение крупно
 */
function showImg(path_data, _type = "javascript") {
    try {
        document.getElementById('tooltip')?.remove();
    } catch (err) {}
    
    document.body.style.overflow = 'hidden';
    
    const blockPost = document.getElementById('block-post');
    if (!blockPost) return;
    
    blockPost.style.display = 'block';
    
    const img = document.createElement('img');
    img.id = 'conimg';
    img.src = path_data.src;
    
    if (_type === "qr") {
        img.style.background = "#ffffff";
        img.style.minWidth = "280px";
    }
    
    if (document.body.offsetHeight > document.body.offsetWidth) {
        img.style.maxHeight = document.body.offsetHeight + 'px';
        img.style.maxWidth = document.body.offsetWidth + 'px';
        img.style.width = "100%";
    } else {
        img.style.maxHeight = document.body.offsetHeight + 'px';
        img.style.maxWidth = document.body.offsetWidth + 'px';
    }
    
    blockPost.innerHTML = '';
    blockPost.appendChild(img);
    
    topbtManager.show('rotate(90deg)');
    topbt_indicator = "handler";
}

/**
 * Загрузка изображения профиля
 */
function load_image_profile(self, id) {
    const input = document.getElementById(`id_image_${id}`);
    if (!input || !input.files || !input.files[0]) return;
    
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(e) {
        const im = document.getElementById("image-user-profile");
        if (im) {
            im.src = reader.result;
            dataURL_v1 = reader.result;
        }
    };
}

/**
 * Редактирование профиля
 */
function editPROFF(self) {
    if (self.getAttribute("open-atr") === "close") {
        ajaxRequest({
            url: '/profile',
            responseType: 'text',
            onSuccess: (response) => {
                const blockPost = document.getElementById('block-post');
                const self_coord = self.getBoundingClientRect();
                const image_user_profile = document.getElementById("image-user-profile");
                
                if (!image_user_profile) return;
                
                const _coord = image_user_profile.getBoundingClientRect();
                const header_height = document.getElementById("header")?.getBoundingClientRect()?.height || 0;
                
                const tooltip = document.createElement('div');
                tooltip.id = 'tooltip';
                tooltip.style.cssText = `
                    top: ${_coord.height / 2}px;
                    left: ${_coord.left}px;
                    height: 0;
                    width: ${_coord.width}px;
                    position: absolute;
                    opacity: 1;
                    padding: 0;
                    max-width: 100%;
                `;
                tooltip.innerHTML = response;
                
                const color_picker = document.createElement('div');
                color_picker.id = 'color-picker';
                color_picker.className = "cp-default";
                
                const tooltipElem = document.createElement('div');
                tooltipElem.id = 'YO2';
                tooltipElem.style.cssText = `
                    top: ${_coord.top + _coord.height + header_height + 10}px;
                    left: ${_coord.left}px;
                    position: fixed;
                `;
                tooltipElem.appendChild(color_picker);
                tooltip.appendChild(tooltipElem);
                
                const uspgimg = document.getElementsByClassName('uspgimg')[0];
                if (uspgimg) uspgimg.appendChild(tooltip);
                
                self.setAttribute("open-atr", "open");
                topbt_indicator = "editPROFF";
                
                // Инициализация ColorPicker
                if (typeof ColorPicker === 'function') {
                    ColorPicker(color_picker, (hex, hsv, rgb) => {
                        const user_page_name = document.getElementById('user_page_name');
                        if (user_page_name) {
                            user_page_name.style.color = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
                        }
                    });
                }
                
                self.src = CONFIG.ED_PROF_OPEN;
                self.style.background = "#ffffff";
            }
        });
    } else {
        self.setAttribute("open-atr", "close");
        self.src = CONFIG.ED_PROF_CLOSED;
        self.style.background = "#507299";
        document.getElementById('tooltip')?.remove();
    }
}

/**
 * Отправка данных профиля
 */
function profilePOST(link) {
    const crsv = getCSRFToken();
    const user_page_name = document.getElementById('user_page_name');
    
    const event = {
        my_image: dataURL_v1 || 'undefined',
        color: user_page_name?.style.color || ''
    };
    
    ajaxRequest({
        url: `/profile/?username=${link}`,
        method: 'POST',
        headers: { 'X-CSRFToken': crsv },
        data: event,
        onSuccess: () => alert('Все загружено!!!')
    });
}

/**
 * Canvas подготовка изображения
 */
function OnOn(id) {
    currentCanvasId = id;
    const canvas = document.getElementById(`canvas_${id}`);
    if (!canvas) return;
    
    const context = canvas.getContext('2d');
    const input = document.getElementById(`id_image_${id}`);
    
    if (!input || !input.files || !input.files[0]) return;
    
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(e) {
        const im = new Image();
        im.onload = function() {
            canvas.width = im.width;
            canvas.height = im.height;
            context.drawImage(im, 0, 0, im.width, im.height);
            dataURL_v1 = canvas.toDataURL("image/png");
            
            // Стилизуем canvas как миниатюру
            canvas.style.width = '90px';
            canvas.style.height = 'auto';
            canvas.style.cursor = 'pointer';
            canvas.style.display = 'block';
            
            // При клике открываем полноразмерное изображение
            canvas.onclick = function() {
                // Создаём временный объект изображения для showImg
                const fullImg = new Image();
                fullImg.src = dataURL_v1;
                showImg(fullImg); // функция showImg ожидает DOM элемент <img>
            };
            
            // Показываем кнопку очистки (если есть)
            const clearBtn = document.getElementById("clearCanvas");
            if (clearBtn) {
                clearBtn.style.display = "block";
                clearBtn.style.backgroundColor = "white";
            }
        };
        im.src = reader.result;
    };
}

/**
 * Canvas для регистрации
 */
function OnOnreg() {
    const ik = document.getElementById('oimg');
    const input = document.getElementById('id_image_user');
    
    if (!input || !input.files || !input.files[0] || !ik) return;
    
    reader.readAsDataURL(input.files[0]);
    reader.onload = function(e) {
        ik.src = reader.result;
        document.getElementById('regb').style.display = 'block';
    };
}

/**
 * Добавить пост
 */
function addPost() {
    try {
        document.getElementById('tooltip')?.remove();
    } catch (err) {}
    
    ajaxRequest({
        url: '/addpost/?_type=javascript',
        responseType: 'text',
        onSuccess: (response) => {
            document.body.style.overflow = 'hidden';
            
            const blockPost = document.getElementById('block-post');
            if (!blockPost) return;
            
            blockPost.style.display = 'block';
            blockPost.innerHTML = response;
            
            topbtManager.show('rotate(90deg)');
            topbt_indicator = "addPost";
            
            if (history.state?.view !== "addpost") {
                historyManager.push("addpost", "/addpost");
            }
            
            blockPost.onscroll = () => {};
        }
    });
}

// ==================== УПРАВЛЕНИЕ ДРУЗЬЯМИ ====================

/**
 * Страница друзей
 */
function FRIENDS_PAGE(link, count_users, page_num = 1, loadmore = null) {
    if (isLoading) return false;
    
    let divIop2;
    let blockPost;
    let tooltipElem;
    const isLoadMore = loadmore === "loadmore";
    
    if (isLoadMore) {
        divIop2 = document.getElementById("IOP2");
        blockPost = document.getElementById('friends_list');
    } else {
        blockPost = document.getElementById('block-post');
        if (!blockPost) return;
        
        blockPost.innerHTML = "";
        blockPost.style.overflowY = 'scroll';
        
        divIop2 = document.createElement("div");
        divIop2.id = "IOP2";
        
        document.body.style.overflow = 'hidden';
        
        tooltipElem = document.createElement('div');
        tooltipElem.id = 'tooltip';
        tooltipElem.style.cssText = "position:relative;max-width: 100%;float:left;";
    }
    
    document.getElementById("block-post")?.scrollTo(0, 0);
    
    ajaxRequest({
        url: `/friends/${link}/?page=${page_num}`,
        onSuccess: (data_0) => {
            all_pages = data_0.all_pages;
            const users = JSON.parse(data_0.data);
            
            let html = '';
            users.forEach(user => {
                html += getAvatarHTML(
                    user.fields.image_user,
                    user.fields.path_data,
                    30,
                    'imgUs',
                    `userPROFILE('${user.pk}', 'javascript')`
                );
            });
            html = `<div id="user_friends_list" style="float: left;display: block;">${html}</div>`;
            
            if (isLoadMore) {
                if (blockPost) blockPost.innerHTML += html;
                if (divIop2) divIop2.innerText = data_0.op1;
            } else {
                if (!tooltipElem) return;
                
                tooltipElem.innerHTML = `<h1 id="h1-friends">ДРУЗЬЯ ${count_users}</h1>`;
                tooltipElem.innerHTML += `<div id="friends_list">${html}</div>`;
                
                const node = document.createElement('div');
                node.id = 'node';
                node.appendChild(tooltipElem);
                
                blockPost.appendChild(node);
                blockPost.style.display = 'block';
                
                if (main_wrapper) main_wrapper.style.opacity = 0.2;
                
                topbtManager.show('rotate(90deg)');
                topbt_indicator = "foll";
                
                if (divIop2) {
                    divIop2.innerText = data_0.op1;
                    blockPost.appendChild(divIop2);
                }
            }
            
            function friendsScroll() {
                const scrollPercent = getScrollPercent(document.getElementById("block-post"));
                if (divIop2?.innerText !== "STOP" && scrollPercent >= 80) {
                    FRIENDS_PAGE(link, count_users, divIop2.innerText, "loadmore");
                    isLoading = true;
                }
            }
            
            isLoading = false;
            document.getElementById("block-post").onscroll = friendsScroll;
        }
    });
}

/**
 * Друзья для отправки
 */
function FRIENDS(link, page_num = 1, loadmore = null) {
    if (isLoading) return false;
    
    const divIop3 = document.getElementById("IOP3");
    const isLoadMore = loadmore === "loadmore";
    
    let tooltipElem;
    
    if (isLoadMore) {
        tooltipElem = document.getElementById(`tooltip_${link}`);
    } else {
        document.getElementById(`tooltip_${link}`)?.remove();
        
        tooltipElem = document.createElement('div');
        tooltipElem.id = `tooltip_${link}`;
        tooltipElem.style.cssText = `max-height: ${window.innerHeight * 0.7}px; overflow-y: auto; float: left; position: relative; width: 100%;`;
        
        document.getElementById("block-post").style.overflowY = 'hidden';
        
        const over = document.getElementById("tooltip");
        if (over) {
            over.appendChild(tooltipElem);
            if (divIop3) over.appendChild(divIop3);
        }
    }
    
    ajaxRequest({
        url: `/friends/${link}/?page=${page_num}`,
        onSuccess: (data) => {
            if (divIop3) divIop3.innerText = data.op1;
            
            const users = JSON.parse(data.data);
            let html = '';
            
            users.forEach(user => {
                html += getAvatarHTML(
                    user.fields.image_user,
                    user.fields.path_data,
                    30,
                    'imgUs',
                    `reSend('${user.pk}', '${link}')`
                );
            });
            
            if (isLoadMore) {
                if (tooltipElem) tooltipElem.innerHTML += html;
            } else {
                if (tooltipElem) tooltipElem.innerHTML = html;
            }
            
            function friendsScroll() {
                const scrollPercent = getScrollPercent(tooltipElem);
                if (divIop3?.innerText !== "STOP" && scrollPercent >= 80) {
                    FRIENDS(link, divIop3.innerText, "loadmore");
                    isLoading = true;
                }
            }
            
            if (tooltipElem) tooltipElem.onscroll = friendsScroll;
            isLoading = false;
        }
    });
}

/**
 * Подписчики
 */
function foll(link, page_num = 1, loadmore = null) {
    loadFollowers('/follow/', link, page_num, loadmore);
}

/**
 * Подписки
 */
function folls(link, page_num = 1, loadmore = null) {
    loadFollowers('/follows/', link, page_num, loadmore);
}

/**
 * Общая функция для подписчиков/подписок
 */
function loadFollowers(baseUrl, link, page_num = 1, loadmore = null) {
    if (isLoading) return false;
    
    let divIop2;
    let blockPost;
    const isLoadMore = loadmore === "loadmore";
    
    if (isLoadMore) {
        divIop2 = document.getElementById("IOP2");
        blockPost = document.getElementById('foll');
    } else {
        blockPost = document.getElementById('block-post');
        if (!blockPost) return;
        
        divIop2 = document.createElement("div");
        divIop2.id = "IOP2";
        document.body.style.overflow = 'hidden';
    }
    
    ajaxRequest({
        url: `${baseUrl}${link}/?page=${page_num}`,
        onSuccess: (f) => {
            const users = JSON.parse(f.data);
            len = (len || 0) + users.length;
            all_pages = f.all_pages;
            
            let html = '';
            users.forEach(user => {
                const avatarHTML = getAvatarHTML(
                    user.fields.image_user,
                    user.fields.path_data,
                    180
                );
                const username = truncateUsername(user.fields.username, 10);
                
                html += `<div class="fr-cell">
                            <a onclick='userPROFILE("${user.pk}")' style="color:#ffffff">
                                ${avatarHTML}${username}
                            </a>
                        </div>`;
            });
            
            if (isLoadMore) {
                if (blockPost) blockPost.innerHTML += html;
                if (divIop2) divIop2.innerText = f.op1;
            } else {
                if (!blockPost) return;
                
                blockPost.innerHTML = `<div id='foll'>${html}</div>`;
                blockPost.style.display = 'block';
                
                if (main_wrapper) main_wrapper.style.opacity = 0.2;
                
                topbtManager.show('rotate(90deg)');
                topbt_indicator = "foll";
                
                if (divIop2) {
                    divIop2.innerText = f.op1;
                    blockPost.appendChild(divIop2);
                }
                
                blockPost.scrollTo(0, 0);
                blockPost.onscroll = function() {
                    const scrollPercent = getScrollPercent(blockPost);
                    if (divIop2?.innerText !== "STOP" && scrollPercent >= 80) {
                        loadFollowers(baseUrl, link, divIop2.innerText, "loadmore");
                        isLoading = true;
                    }
                };
            }
            
            isLoading = false;
        }
    });
}

/**
 * Получить понравившиеся посты
 */
function getlkpost(link, page_num = 1, loadmore = null) {
    if (isLoading) return false;
    
    const blockPost = document.getElementById('block-post');
    if (!blockPost) return;
    
    let divIop2;
    let node;
    const isLoadMore = loadmore === "loadmore";
    
    if (isLoadMore) {
        divIop2 = document.getElementById("IOP2");
        node = document.getElementById('foll');
    } else {
        blockPost.innerHTML = "";
        divIop2 = document.createElement("div");
        divIop2.id = "IOP2";
        document.body.style.overflow = 'hidden';
        node = document.createElement('div');
        node.id = 'foll';
        blockPost.appendChild(divIop2);
    }
    
    ajaxRequest({
        url: `/getlkpost/${link}/?page=${page_num}`,
        onSuccess: (f) => {
            if (divIop2) divIop2.innerText = f.op1;
            
            if (isLoadMore) {
                if (node) node.innerHTML += f.data;
            } else {
                if (node) node.innerHTML = f.data;
                if (blockPost) {
                    blockPost.appendChild(node);
                    blockPost.style.display = 'block';
                    
                    if (main_wrapper) main_wrapper.style.opacity = 0.2;
                    
                    topbtManager.show('rotate(90deg)');
                    topbt_indicator = "foll";
                    
                    blockPost.scrollTo(0, 0);
                }
            }
            
            function lkpostScroll() {
                const scrollPercent = getScrollPercent(blockPost);
                if (divIop2?.innerText !== "STOP" && scrollPercent >= 80) {
                    getlkpost(link, divIop2.innerText, "loadmore");
                    isLoading = true;
                }
            }
            
            if (!isLoadMore) {
                blockPost.onscroll = lkpostScroll;
            }
            
            isLoading = false;
        }
    });
}

// ==================== КОММЕНТАРИИ ====================

/**
 * Показать комментарии
 */
function comView(z) {
    const comv = z.getAttribute('open-atr');
    const link = z.getAttribute('id-comment');
    const type_div = z.getAttribute('type-div');
    
    if (comv === 'close') {
        z.setAttribute("open-atr", "open");
        
        ajaxRequest({
            url: `/comment/${link}`,
            responseType: 'text',
            onSuccess: (response) => {
                const conr = document.getElementById(`post_like_block_${link}`);
                if (!conr) return;
                
                const apcom = document.createElement('div');
                apcom.id = `box-com-${link}`;
                apcom.className = "box-com";
                apcom.style.display = "block";
                apcom.innerHTML = response;
                
                conr.appendChild(apcom);
                conr.style.display = 'block';
                
                if (type_div === "icon" && z.getAttribute("indicator-ws") === "close") {
                    z.setAttribute("indicator-ws", "open");
                }
                
                const seeMoreBtn = document.getElementById(`see_more_button_${link}`);
                if (seeMoreBtn) {
                    seeMoreBtn.onclick = function() {
                        const iopCom = document.getElementById(`IOPcom_${link}`);
                        if (iopCom) {
                            load_more_comment(link, iopCom.innerText);
                        }
                    };
                }
            }
        });
    } else {
        z.setAttribute("open-atr", "close");
        document.getElementById(`box-com-${link}`)?.remove();
    }
}

/**
 * Загрузить еще комментарии
 */
function load_more_comment(link, page) {
    if (page === "STOP") return;
    
    ajaxRequest({
        url: `/comment/${link}?&page=${page}`,
        onSuccess: (f) => {
            const comments = JSON.parse(f.data);
            
            comments.forEach(comment => {
                const commentData = comment.fields;
                const userData = commentData.comment_user;
                
                const avatarHTML = getAvatarHTML(
                    userData[0],
                    userData[1],
                    30,
                    'imgUs',
                    `userPROFILE('${userData[2]}', 'javascript')`
                );
                
                const commentImage = commentData.comment_image 
                    ? `<img id="comment-image" src="/media/data_image/${userData[1]}/${commentData.comment_image}.png" onclick="showImg(this)">`
                    : "";
                
                const commentDate = new Date(commentData.timecomment);
                const commentMonth = commentDate.toLocaleString('en-US', { month: 'short' });
                const time = commentDate.toLocaleTimeString('en', { timeStyle: 'short', hour12: false, timeZone: 'UTC' });
                
                const f_c = document.createElement('div');
                f_c.className = 'f-c';
                f_c.innerHTML = `
                    ${avatarHTML}
                    <a onclick="userPROFILE('${userData[2]}', 'javascript')" id="user-comment">${userData[3]}</a>
                    <p id="comment-text">${commentData.comment_text}</p>
                    ${commentImage}
                    <div id="time-comment">${commentDate.getUTCDate()} ${commentMonth.toLowerCase()} ${commentDate.getUTCFullYear()} в ${time}</div>
                `;
                
                const fieldComment = document.getElementById(`field-comment_${link}`);
                if (fieldComment) {
                    fieldComment.insertBefore(f_c, fieldComment.firstChild);
                }
            });
            
            const iopCom = document.getElementById(`IOPcom_${link}`);
            if (iopCom) {
                iopCom.innerText = f.op1;
            }
            
            const seeMoreBtn = document.getElementById(`see_more_button_${link}`);
            if (seeMoreBtn && f.op1 === "STOP") {
                seeMoreBtn.style.display = "none";
            }
        }
    });
}

/**
 * Удалить комментарий
 */
function delete_com(comment_id, user_name) {
    console.log("delete comment");
    ws_wall.send(JSON.stringify({
        event: "delete_com",
        data: { comment_id, request_user: user_name }
    }));
}

// ==================== WEB SOCKET ====================

let ws_wall;

/**
 * Активация WebSocket для стены
 */
function activate_wall(user_name) {
    function start_wall() {
        ws_wall = new WebSocket(`${CONFIG.WS_PROTOCOL}${IP_ADDR}:${CONFIG.PORT}/`);
        
        ws_wall.onmessage = function(event) {
            try {
                const message_data = JSON.parse(event.data);
                handleWallMessage(message_data);
            } catch (e) {
                console.error('WebSocket parse error:', e);
            }
        };
        
        ws_wall.onclose = function(e) {
            console.log(`WebSocket closed: code ${e.code}`);
            setTimeout(() => start_wall(), 5000);
        };
        
        ws_wall.onerror = function(e) {
            console.error("WebSocket error:", e);
            if (ws_wall.readyState === 3) {
                alert("ОШИБКА ПОДКЛЮЧЕНИЯ! Установите последнюю версию браузера или отключите VPN");
            }
        };
    }
    
    if ("WebSocket" in window) {
        start_wall();
    } else {
        const formMS = document.getElementById('message_form');
        if (formMS) {
            formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';
        }
        return false;
    }
}

/**
 * Обработчик сообщений WebSocket
 */
function handleWallMessage(message_data) {
    switch (message_data.status) {
        case "wallpost":
            handleWallpostMessage(message_data);
            break;
        case "deletepost":
            handleDeletePost(message_data);
            break;
        case "MoreData":
            handleMoreData();
            break;
        case "Done":
            console.log("upload done");
            break;
        case "Kandinsky-2.0":
            handleKandinsky(message_data);
            break;
        case "send_comment":
            handleSendComment(message_data);
            break;
        case "notification":
            handleNotification(message_data);
            break;
        case "autocomplete":
            countries = message_data.answer_autocomplete || [];
            break;
        case "search":
            handleSearchResults(message_data);
            break;
        case "delete_pm":
            handleDeletePM(message_data);
            break;
        case "delete_com":
            handleDeleteCom(message_data);
            break;
    }
}

/**
 * Обработка нового поста
 */
function handleWallpostMessage(message_data) {
    const fc = document.createElement('div');
    fc.className = 'message';
    fc.setAttribute("onmouseover", "getIndex(this);");
    
    const date = new Date(message_data.timestamp * 1000);
    const username = truncateUsername(message_data.user_post);
    
    const textHTML = message_data.text.length > 18
        ? `<span class='arrow'> → </span><span class='message-title'>${message_data.text.slice(0, 20)}...</span>`
        : (message_data.text ? `<span class='arrow'> → </span><span class='message-title'>${message_data.text}</span>` : "");
    
    const avatarHTML = getAvatarHTML(
        message_data.image_user,
        message_data.path_data,
        30,
        '',
        `userPROFILE('${message_data.user_id}')`
    );
    
    const imageHTML = message_data.image
        ? `<img src="/media/data_image/${message_data.path_data}/${message_data.image}"
                height="auto" width="auto" onclick="showImg(this)" class="wallpost"
                id="image-post-${message_data.id}">`
        : `<img src="${CONFIG.NO_IMAGE}" height="auto" width="auto" 
                onclick="showImg(this)" class="wallpost" id="image-post-${message_data.id}">`;
    
    fc.innerHTML = `
        <div class="views-title" style="width: 100%;float: left;">
            <div class="user-cord" atribut="1165">
                <a onclick="userPROFILE('${message_data.user_id}')">
                    ${avatarHTML}
                </a>
                <a class="postview" onclick="showContent('${message_data.id}')">
                    <span style="font-weight: bolder;">${username}</span>${textHTML}
                </a>
            </div>
            <span class="datetime">${date.getHours()}:${date.getMinutes()}</span>
        </div>
        <div class="field-image" atribut="${message_data.id}">
            ${imageHTML}
            <div id="body-post-wall">
                <div id="post_like_block_${message_data.id}" style="width: 100%">
                    <img class="icon-like" src="/static/images/mesvF.png" 
                         onclick="comView(this)" open-atr="close" 
                         id-comment="${message_data.id}" 
                         id="comment_image_id_${message_data.id}" 
                         type-div="icon" indicator-ws="close">
                    <img class="icon-like" id="post_image_${message_data.id}" 
                         src="${CONFIG.LIKE_PNG}" onclick="LIKE(this, '${message_data.id}')" 
                         open-atr="close" type="wall">
                    <img class="icon-like" src="${CONFIG.RP_CLOSED}" 
                         onclick="rpPost(this, '${message_data.id}','${message_data.user_post}')" 
                         open-atr="close" type="wall">
                    <div class="box-indicator" style="display:none;margin: 0 auto;margin-top: 15px;" 
                         id="box-indicator-${message_data.id}"></div>
                </div>
            </div>
        </div>
    `;
    
    try {
        const tev = document.getElementById('conversation');
        if (tev) tev.insertBefore(fc, tev.firstChild);
    } catch (err) {
        console.log("save data", err);
    }
    
    try {
        document.getElementById('block-post')?.removeChild(t_el);
        document.getElementById('message_form').style.display = "block";
    } catch (e) {}
}

/**
 * Обработка удаления поста
 */
function handleDeletePost(message_data) {
    console.log("delete post", history.state, _page);
    
    if (_page === "wallpost" || _page === "user") {
        try {
            const container = _page === "wallpost" 
                ? document.getElementById("conversation")
                : document.getElementById("user-content-block");
            
            if (container && container.children[innode]) {
                container.children[innode].remove();
                handler_delete(message_data.post_id);
            }
        } catch(e) {}
        
        if (_page === "wallpost") {
            historyManager.push("wallpost", "/");
        } else if (_page === "user") {
            const userId = document.getElementById("user_id")?.innerText;
            if (userId) {
                historyManager.push("user", `/user/${userId}`, userId);
            }
        }
    }
}

/**
 * Обработка генерации Kandinsky
 */
function handleKandinsky(message_data) {
    try {
        const ImGen = document.getElementById(`image-post-${message_data.post}`);
        if (ImGen) {
            ImGen.src = `/media/data_image/${message_data.path_data}/${message_data.data}`;
        }
    } catch(e) {
        console.log(e);
    }
}

/**
 * Обработка отправки комментария
 */
function handleSendComment(message_data) {
    const tev = document.getElementById(`field-comment_${message_data.post_id}`);
    if (!tev) return;
    
    const fc = document.createElement('div');
    fc.className = 'f-c';
    fc.id = `com-block-${message_data.comment_id}`;
    
    const img_com_user = message_data.image_user !== "oneProf.png"
        ? `"/media/data_image/${message_data.path_data}/tm_${message_data.image_user}"`
        : `"/static/images/oneProf.png"`;
    
    const commentText = message_data.comment_text
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/\n/g, '<br />');
    
    if (message_data.comment_image) {
        fc.innerHTML = `
            <img id="image-user" src=${img_com_user} class="imgUs" 
                 onclick="userPROFILE('${message_data.user_id}')" style="cursor:pointer;" loading="lazy">
            <a onclick="userPROFILE('${message_data.user_id}')" id="user-comment">${message_data.comment_user}</a>
            <p id="comment-text">${commentText}</p>
            <img id="comment-image" src="/media/data_image/${message_data.comment_image}" onclick="showImg(this)">
            <div id="time-comment">${message_data.timecomment}</div>
        `;
    } else {
        fc.innerHTML = `
            <img id="image-user" src=${img_com_user} class="imgUs" 
                 onclick="userPROFILE('${message_data.user_id}')" style="cursor:pointer;" loading="lazy">
            <a onclick="userPROFILE('${message_data.user_id}')" id="user-comment">${message_data.comment_user}</a>
            <p id="comment-text">${commentText}</p>
            <div id="time-comment">${message_data.timecomment}</div>
        `;
    }
    
    try {
        const clientId = document.getElementsByClassName("usPr")[0]?.getAttribute("client-id-user");
        if (clientId === message_data.user_id) {
            fc.innerHTML += `<div class='delete-pm' onclick='delete_com("${message_data.comment_id}", "${message_data.comment_user}")'></div>`;
        }
    } catch(e) {}
    
    try {
        tev.insertBefore(fc, tev.lastChild);
        document.getElementsByClassName(`compose_${message_data.post_id}`)[0].style.display = "block";
        document.getElementById(`results_${message_data.post_id}`)?.removeChild(t_el);
    } catch (e) {}
}

/**
 * Обработка уведомлений
 */
function handleNotification(message_data) {
    console.log("notification:", message_data, history.state);
    
    if (history.state?.view === "privatmes") {
        const pos_element = document.getElementById(`pm-block-${message_data.thread_id}`);
        if (pos_element) {
            const div_notification = document.createElement("div");
            div_notification.id = `notification-${message_data.thread_id}`;
            div_notification.className = "notification";
            div_notification.style.display = "block";
            div_notification.innerText = "!";
            pos_element.appendChild(div_notification);
        }
        
        notificationManager.add(message_data.thread_id);
    } else if (history.state?.id !== message_data.thread_id) {
        beep();
        
        const comps = document.getElementById("comps");
        if (comps?.getAttribute("open-atr") === "close") {
            comps.click();
        }
        
        notificationManager.add(message_data.thread_id);
    }
    
    notificationManager.updateNavDisplay();
}

/**
 * Обработка результатов поиска
 */
function handleSearchResults(message_data) {
    const results = message_data.answer_search || [];
    const us_block = document.getElementsByClassName('us-block')[0];
    if (!us_block) return;
    
    us_block.innerHTML = '';
    
    results.forEach(item => {
        try {
            const search_data = JSON.parse(item);
            const avatarHTML = getAvatarHTML(
                search_data.image_user,
                search_data.path_data,
                30
            );
            const username = truncateUsername(search_data.username, 10);
            
            us_block.innerHTML += `
                <div class="views-row" onclick="userPROFILE('${search_data.pk}', 'javascript')">
                    <div class="user-image">${avatarHTML}</div>
                    <div class="user-name"><a atribut="${search_data.pk}" id="user-link">${username}</a></div>
                </div>
            `;
        } catch(e) {
            console.error(e);
        }
    });
}

/**
 * Обработка удаления личного сообщения
 */
function handleDeletePM(message_data) {
    console.log("delete all msg", _page);
    if (_page === "privatmes") {
        const elem = document.getElementById(`pm-block-${message_data.thread_id}`);
        if (elem) elem.parentNode?.removeChild(elem);
    }
}

/**
 * Обработка удаления комментария
 */
function handleDeleteCom(message_data) {
    console.log("delete comment", _page);
    if (_page === "wallpost") {
        const elem = document.getElementById(`com-block-${message_data.comment_id}`);
        if (elem) elem.parentNode?.removeChild(elem);
    }
}

/**
 * Отправить пост
 */
function send_wall() {
    const title = document.getElementById('id_body');
    const body = document.getElementById('id_body');
    
    if ((!title?.value && !dataURL_wall) || ws_wall?.readyState !== WebSocket.OPEN) {
        return false;
    }
    
    document.getElementById('block-post')?.appendChild(t_el);
    document.getElementById('message_form').style.display = "none";
    
    const event = {
        title: title?.value || '',
        body: body?.value || '',
        image: dataURL_wall || false,
        arr_keypress: window.arr_keystroke || [],
        all_time_sec: window.all_time_sec || 0,
        os_info: window.navigator.userAgent,
        event: "wallpost",
    };
    
    console.log("send wall:", event);
    ws_wall.send(JSON.stringify(event));
}

/**
 * Удалить пост
 */
function deletepost(self, id) {
    const delAtr = self.getAttribute("del-atr");
    
    if (delAtr === "false") {
        self.innerText = "ДА";
        self.setAttribute("del-atr", "true");
    } else if (delAtr === "true") {
        ws_wall.send(JSON.stringify({ id, event: "deletepost" }));
    }
}

/**
 * Отправить комментарий
 */
function send_com(self, cip) {
    const comment_text = document.getElementById(`comment_text_${cip}`);
    
    if (!comment_text?.innerText || ws_wall?.readyState !== WebSocket.OPEN) {
        return false;
    }
    
    document.getElementsByClassName(`compose_${cip}`)[0].style.display = "none";
    document.getElementById(`results_${cip}`)?.appendChild(t_el);
    
    ws_wall.send(JSON.stringify({
        comment_text: comment_text.innerText,
        comment_image: dataURL_v1 || "",
        event: "comment_post",
        post_id: cip
    }));
    
    comment_text.innerText = "";
    
    if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        dataURL_v1 = "";
        canvas.width = 0;
        canvas.height = 0;
    }
}

/**
 * Удалить личное сообщение
 */
function delete_pm(thread_id, user_name) {
    console.log("delete private msg");
    ws_wall.send(JSON.stringify({
        event: "delete_pm",
        data: { thread_id, request_user: user_name }
    }));
}

/**
 * Подготовка данных для скачивания
 */
function crate_data_all(self) {
    const crsv = getCSRFToken();
    
    ajaxRequest({
        url: '/cratealldata/',
        method: 'GET',
        headers: { 'X-CSRFToken': crsv },
        onSuccess: (data) => {
            if (data?.answer) {
                window.open(data.answer, '_blank');
            }
        }
    });
}

// ==================== ЛИЧНЫЕ СООБЩЕНИЯ ====================

/**
 * Страница личных сообщений
 */
function privatMES(_type = "javascript") {
    window.scrollTo(0, 0);
    
    ajaxRequest({
        url: `/messages/?_type=${_type}`,
        responseType: 'text',
        onSuccess: (response) => {
            if (!main_wrapper) return;
            
            main_wrapper.innerHTML = response;
            main_wrapper.style.opacity = 1;
            main_wrapper.style.display = 'block';
            
            postBlockManager.hide();
            document.body.style.overflow = 'auto';
            
            topbtManager.init();
            topbtManager.hide();
            
            try {
                document.getElementsByClassName("enter")[0].style.display = "none";
                document.getElementById("search-box").style.display = "none";
            } catch (e) {}
            
            if (history.state?.view !== "privatmes") {
                historyManager.push("privatmes", "/messages/");
                _page = "privatmes";
            }
            
            const recipientInput = document.getElementById("recipient_name");
            if (recipientInput) {
                autocomplete(recipientInput);
            }
            
            notificationManager.displayOnPage();
        }
    });
}

/**
 * Создать сообщение
 */
function createMES() {
    const crsv = getCSRFToken();
    const cont = document.getElementById('message_textarea')?.innerText;
    const id_text = document.getElementById('recipient_name')?.value;
    
    if (!cont) {
        alert('Не нажимай лишний раз кнопку, если не заполнил поле');
        return;
    }
    
    ajaxRequest({
        url: '/messages/send_message/',
        method: 'POST',
        headers: { 'X-CSRFToken': crsv },
        data: { message: cont, recipient_name: id_text },
        responseType: 'text',
        onSuccess: (response) => {
            if (main_wrapper) {
                main_wrapper.innerHTML = response;
                nodeScriptReplace(main_wrapper);
            }
        }
    });
}

/**
 * Открыть диалог
 */
function mesID(thread_id, user_name, number_of_messages, _type = "javascript") {
    isLoading = false;
    
    ajaxRequest({
        url: `/messages/chat/${thread_id}/?_type=${_type}`,
        responseType: 'text',
        onSuccess: (response) => {
            if (!main_wrapper) return;
            
            main_wrapper.innerHTML = response;
            
            if (!ws_dict[thread_id]) {
                activate_chat(thread_id, user_name, number_of_messages);
            }
            
            window.scrollBy(0, document.getElementById("conver")?.scrollHeight || 0);
            
            const topbtEl = document.getElementById('topbt');
            if (topbtEl) topbtEl.style.transform = 'rotate(0deg)';
            
            if (history.state?.view !== "mesID") {
                historyManager.push("mesID", `/messages/chat/${thread_id}`, thread_id);
                history.state.user_name = user_name;
                history.state.number_of_messages = number_of_messages;
                _page = "chat";
            }
            
            notificationManager.remove(thread_id);
        }
    });
}

/**
 * Активация WebSocket для чата
 */
function activate_chat(thread_id, user_name, number_of_messages) {
    console.log("activate chat", thread_id);
    
    function start_chat_ws() {
        const ws_chat = new WebSocket(`${CONFIG.WS_PROTOCOL}${IP_ADDR}:${CONFIG.PORT}/${thread_id}/`);
        
        ws_chat.onmessage = function(event) {
            // if (history.state?.view !== 'mesID') return; // старая проверка
            if (_page !== 'chat') return; // новая проверка

            try {
                const message_data = JSON.parse(event.data);
                if (String(document.getElementById("chat_id")?.innerText) !== String(message_data.thread_id)) return;

                if (message_data.event === "privatemessages") {
                    handlePrivateMessage(message_data, user_name, number_of_messages);
                } else if (message_data.event === "loadmore") {
                    handleLoadMoreMessages(message_data);
                }
            } catch (e) {
                console.error('Chat WebSocket error:', e);
            }
        };
        
        ws_chat.onclose = function() {
            setTimeout(() => start_chat_ws(), 5000);
        };
        
        ws_dict[thread_id] = ws_chat;
    }
    
    if ("WebSocket" in window) {
        start_chat_ws();
    } else {
        const formMS = document.getElementById('message_form');
        if (formMS) {
            formMS.innerHTML = '<div class="outdated_browser_message"><p><em>Ой!</em> Вы используете устаревший браузер. Пожалуйста, установите любой из современных:</p><ul><li>Для <em>Android</em>: <a href="http://www.mozilla.org/ru/mobile/">Firefox</a>, <a href="http://www.google.com/intl/en/chrome/browser/mobile/android.html">Google Chrome</a>, <a href="https://play.google.com/store/apps/details?id=com.opera.browser">Opera Mobile</a></li><li>Для <em>Linux</em>, <em>Mac OS X</em> и <em>Windows</em>: <a href="http://www.mozilla.org/ru/firefox/fx/">Firefox</a>, <a href="https://www.google.com/intl/ru/chrome/browser/">Google Chrome</a>, <a href="http://ru.opera.com/browser/download/">Opera</a></li></ul></div>';
        }
        return false;
    }
}

/**
 * Обработка личного сообщения в чате
 */
function handlePrivateMessage(message_data, user_name, number_of_messages) {
    const tev = document.getElementById('conver');
    if (!tev) return;
    const date = new Date(message_data.timestamp * 1000);
    
    const avatarHTML = getAvatarHTML(
        message_data.image_user,
        message_data.path_data,
        30,
        'usPr',
        `userPROFILE('${message_data.sender_id}')`
    );
    
    const pmImage = message_data.pm_image && message_data.pm_image !== "pm_image"
        ? `<img id="comment-image" src="/media/data_image/${message_data.pm_image}" onclick="showImg(this)" style="width: 90px;border-radius: 15px;">`
        : "";
    
    const messageText = message_data.text
        .replace(/&/g,'&amp;')
        .replace(/</g,'&lt;')
        .replace(/>/g,'&gt;')
        .replace(/\n/g, '<br />');
    
    tev.innerHTML += `
        <div class="message">
            <p class="author ${message_data.sender === user_name ? 'we' : 'partner'}">
                ${avatarHTML}
            </p>
            <p class="txtmessage ${message_data.sender === user_name ? 'we' : 'partner'}">
                ${pmImage}
                ${messageText}
                <span class="datetime" style="font-size: 15px;color: #afafaf;">
                    ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}
                </span>
            </p>
        </div>
    `;
    
    number_of_messages++;
    
    const sent = parseInt(document.getElementById('sent')?.innerText || 0);
    const received = parseInt(document.getElementById('received')?.innerText || 0);
    
    if (message_data.sender === user_name) {
        document.getElementById('sent').innerText = sent + 1;
    } else {
        document.getElementById('received').innerText = received + 1;
    }
    
    const messagesEl = document.getElementById(`messages_${message_data.thread_id}`);
    if (messagesEl) {
        messagesEl.innerHTML = `
            <span id="total">${number_of_messages}</span> 
            ${getNumEnding(number_of_messages, ["сообщение", "сообщения", "сообщений"])} 
            (<span id="received">${received + (message_data.sender !== user_name ? 1 : 0)}</span> получено, 
            <span id="sent">${sent + (message_data.sender === user_name ? 1 : 0)}</span> отправлено)
        `;
    }
    
    window.scrollBy(0, tev.getBoundingClientRect().height);
}

/**
 * Загрузка дополнительных сообщений в чате
 */
function handleLoadMoreMessages(message_data) {
    const request_user_id = message_data.request_user_id;
    const g = JSON.parse(message_data.data);
    
    all_pages = message_data.all_pages;
    document.getElementById('IOP').innerText = message_data.op1;
    
    g.reverse().forEach(msg => {
        const data_path = msg.fields.sender[1];
        const image_file = msg.fields.sender[0];
        const sender_id = msg.fields.sender[2];
        const sender_name = msg.fields.sender[3];
        
        const temp_string = document.createElement('div');
        temp_string.className = "message";
        
        const avatarHTML = getAvatarHTML(
            image_file,
            data_path,
            30,
            'usPr',
            `userPROFILE('${sender_id}')`
        );
        
        const field_text = msg.fields.resend !== "False"
            ? `<a onclick="showContent('${msg.fields.text}')">СМОТРЕТЬ→</a>`
            : msg.fields.text;
        
        const messageClass = request_user_id === sender_id ? 'we' : 'partner';
        
        temp_string.innerHTML = `
            <p class="author ${messageClass}">
                ${avatarHTML}
            </p>
            <p class="txtmessage ${messageClass}">
                ${field_text}
                <span class="datetime" style="font-size: 15px;color: #afafaf;">
                    ${msg.fields.datetime}
                </span>
            </p>
        `;
        
        document.getElementById("conver")?.insertBefore(temp_string, document.getElementById("conver")?.firstChild);
    });
    
    document.getElementById("dot-loader").style.display = "none";
    isLoading = false;
}

/**
 * Отправить личное сообщение
 */
 function send_message(self, link) {
    const textarea = document.getElementById('message_textarea');
    const hasText = textarea?.innerText && textarea.innerText.trim() !== '';
    const hasImage = dataURL_v1 && dataURL_v1.length > 0;

    // Проверяем: есть ли текст или картинка и работает ли WebSocket
    if ((!hasText && !hasImage) || !ws_dict[link] || ws_dict[link].readyState !== WebSocket.OPEN) {
        return false;
    }

    // Отправляем сообщение (текст может быть пустым)
    ws_dict[link].send(JSON.stringify({
        event: "privatemessages",
        message: hasText ? textarea.innerText : "", // если текста нет — пустая строка
        pm_image: dataURL_v1 || ""
    }));

    // Очищаем поле ввода и изображение
    textarea.innerText = "";
    dataURL_v1 = "";

    // Очистка canvas (как и раньше)
    const canvas = document.getElementById(`canvas_${link}`);
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        canvas.width = 0;
        canvas.height = 0;
        canvas.style.width = '0';
        canvas.style.display = 'none';
        canvas.onclick = null;
    }

    // Сброс input file
    const fileInput = document.getElementById(`id_image_${link}`);
    if (fileInput) fileInput.value = '';

    // Скрыть кнопку очистки
    const clearBtn = document.getElementById("clearCanvas");
    if (clearBtn) clearBtn.style.display = "none";

    // Закрыть block-post, если был открыт
    handler();
}

// ==================== ЗАГРУЗКА ФАЙЛОВ ====================

/**
 * Нарезка файлов
 */
function FileSlicer(file) {
    this.sliceSize = CONFIG.CHUNK_SIZE;
    this.slices = Math.ceil(file.size / this.sliceSize);
    this.currentSlice = 0;
    this.getNextSlice = function() {
        const start = this.currentSlice * this.sliceSize;
        const end = Math.min((this.currentSlice + 1) * this.sliceSize, file.size);
        ++this.currentSlice;
        return file.slice(start, end);
    };
}

/**
 * Загрузка файла через WebSocket
 */
function OnOnW() {
    currentChunk = 1.0;
    
    canvas = document.getElementById('canvas_addpost');
    if (!canvas) return;
    
    canvas.style.display = "block";
    context = canvas.getContext('2d');
    
    const inputwall = document.getElementById('image_file');
    if (!inputwall || !inputwall.files || !inputwall.files[0]) return;
    
    filewall = inputwall.files;
    SelectedFile = filewall[0];
    Name = SelectedFile.name;
    fileSize = SelectedFile.size;
    
    const type_file = Name.split('.').pop().toLowerCase();
    
    if (["png", "jpg", "jpeg"].includes(type_file)) {
        reader.readAsDataURL(filewall[0]);
        reader.onload = function(e) {
            const im = new Image();
            im.onload = function() {
                canvas.width = im.width;
                canvas.height = im.height;
                context.drawImage(im, 0, 0, im.width, im.height);
                dataURL_wall = canvas.toDataURL("image/png");
            };
            im.src = reader.result;
            
            StartUpload();
            
            document.getElementById("clearCanvas").style.display = "block";
            document.getElementById("clearCanvas").style.backgroundColor = "white";
        };
    }
}

/**
 * Очистка Canvas
 */
function clearCanvas(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;

    // Очистка canvas
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    canvas.width = 0;
    canvas.height = 0;

    // Сброс соответствующего input file
    const inputId = canvasId.replace('canvas_', 'id_image_');
    const fileInput = document.getElementById(inputId);
    if (fileInput) fileInput.value = '';

    // Сброс глобальной переменной в зависимости от контекста
    if (canvasId.startsWith('canvas_wall_')) {
        dataURL_wall = "";
    } else if (canvasId.startsWith('canvas_comment_')) {
        dataURL_comment = ""; // если есть
    } else {
        // По умолчанию для чата и других случаев
        dataURL_v1 = "";
    }

    // Скрыть связанную кнопку очистки (если есть отдельная кнопка)
    document.getElementById("clearCanvas").style.display = "none";
}

/**
 * Начать загрузку
 */
function StartUpload() {
    if (!document.getElementById('image_file')?.value) {
        alert("Нужно выбрать файл");
        return;
    }
    
    const fileSizeMB = fileSize / 1000000.0;
    const sizeText = fileSize < 1000 
        ? `${fileSize} B` 
        : `${fileSizeMB.toFixed(2)} MB`;
    
    const Content = `
        <span id='NameArea'>Uploading ${SelectedFile.name} as ${Name}</span>
        <div id='ProgressContainer'><div id='ProgressBar'></div></div>
        <span id='percent'>0%</span>
        <span id='Uploaded'> - <span id='MB'>0</span>/${sizeText}</span>
    `;
    
    document.getElementById('UploadArea').innerHTML = Content;
    
    ws_wall.send(JSON.stringify({
        event: 'Start',
        Name: Name,
        Size: fileSize
    }));
    
    totalChunks = Math.ceil(fileSize / CONFIG.CHUNK_SIZE);
    sPR = 0;
    PR = (fileSize / totalChunks) / 1000000.0;
    UpdateBar(0);
    
    console.log("event start");
}

/**
 * Обновление прогресс-бара
 */
function UpdateBar(percent) {
    const progressBar = document.getElementById('ProgressBar');
    if (progressBar) progressBar.style.width = percent + '%';
    
    const percentEl = document.getElementById('percent');
    if (percentEl) percentEl.innerHTML = (Math.round(percent * 1000) / 1000) + '%';
    
    const mbEl = document.getElementById('MB');
    if (mbEl) {
        sPR += PR;
        const MBDone = sPR - PR;
        mbEl.innerHTML = MBDone.toFixed(2);
    }
}

/**
 * Запрос следующей части файла
 */
function handleMoreData() {
    console.log("more data", currentChunk <= totalChunks);
    
    if (currentChunk <= totalChunks) {
        const offset = (currentChunk - 1.0) * CONFIG.CHUNK_SIZE;
        const currentFilePart = SelectedFile.slice(offset, offset + CONFIG.CHUNK_SIZE);
        
        const fileReader = new FileReader();
        fileReader.onload = function(e) {
            UpdateBar(Math.ceil((currentChunk * 100.0) / totalChunks));
            ws_wall.send(JSON.stringify({
                event: 'Upload',
                Name: 'more',
                Data: e.target.result
            }));
            currentChunk++;
        };
        fileReader.readAsDataURL(currentFilePart);
    } else {
        console.log("event done");
        try {
            document.getElementById('UploadBox').style.display = "none";
        } catch (e) {}
        
        ws_wall.send(JSON.stringify({ event: 'Done' }));
    }
}

// ==================== ПОСТЫ И КОНТЕНТ ====================

/**
 * Получить индекс элемента
 */
function getIndex(node) {
    const childs = node.parentNode.children;
    for (let i = 0; i < childs.length; i++) {
        if (node === childs[i]) {
            innode = i;
            len = childs.length;
            break;
        }
    }
    return innode;
}

/**
 * Показать содержимое поста
 */
function showContent(link, _type = "javascript") {
    try {
        document.getElementById('tooltip')?.remove();
    } catch (err) {}
    
    try {
        topbtManager.show();
    } catch (err) {}
    
    try {
        const comv = document.getElementById(`comment_image_id_${link}`)?.getAttribute("open-atr");
        if (comv === "open") {
            comView(document.getElementById(`comment_image_id_${link}`));
        } else {
            document.getElementById(`comment_image_id_${link}`)?.setAttribute("indicator-ws", "open");
        }
    } catch (e) {}
    
    isLoading = false;
    document.body.style.overflow = 'hidden';
    
    ajaxRequest({
        url: `/data/${link}?_type=${_type}&page=-1`,
        responseType: 'text',
        onSuccess: (response) => {
            const blockPost = document.getElementById('block-post');
            if (!blockPost) return;
            
            blockPost.setAttribute("class", `block-post-${link}`);
            blockPost.innerHTML = response;
            
            topbtManager.show('rotate(90deg)');
            topbt_indicator = "handler";
            
            // Навигация между постами
            const navlis = document.createElement('div');
            navlis.className = 'navlis';
            
            const textElemv1 = document.createElement('a');
            textElemv1.id = 'next';
            
            const textElemv2 = document.createElement('a');
            textElemv2.id = 'back';
            
            navlis.appendChild(textElemv1);
            navlis.appendChild(textElemv2);
            blockPost.insertBefore(navlis, blockPost.firstChild);
            
            // Управление видимостью кнопок
            if (innode === 0) {
                textElemv1.style.display = 'none';
                textElemv2.style.display = 'block';
            } else if (innode === (len - 1)) {
                textElemv1.style.display = 'block';
                textElemv2.style.display = 'none';
            } else if (typeof innode === 'undefined' || typeof len === 'undefined') {
                textElemv1.style.display = 'none';
                textElemv2.style.display = 'none';
            }
            
            // Загрузка дополнительных постов
            if ((len - 2) === innode) {
                const iop = document.getElementById("IOP")?.innerText;
                const atr = document.getElementById("user-content-block")?.getAttribute('atr');
                if (iop !== "STOP" && atr) {
                    jsons(iop, atr);
                }
            }
            
            // Обработчики навигации
            textElemv2.onclick = function() {
                if ((len - 1) >= innode) {
                    try {
                        innode++;
                        const h = document.getElementsByClassName('field-image')[innode];
                        const g = h?.getAttribute('atribut');
                        if (g) showContent(g);
                    } catch (err) {}
                }
            };
            
            textElemv1.onclick = function() {
                if (innode > 0) {
                    innode--;
                    try {
                        const h = document.getElementsByClassName('field-image')[innode];
                        const g = h?.getAttribute('atribut');
                        if (g) showContent(g);
                    } catch (err) {}
                }
            };
            
            blockPost.style.display = 'block';
            blockPost.style.background = 'rgba(0,0,0,.75)';
            blockPost.style.overflow = 'auto';
            blockPost.setAttribute('atr', 'con');
            blockPost.scrollTo(0, 0);
            
            // История навигации
            if (history.state?.view !== "post") {
                historyManager.push("post", `/data/${link}`, link);
            } else if (history.state.id !== link) {
                historyManager.push("post", `/data/${link}`, link);
            } else {
                historyManager.replace("post", `/data/${link}`, link);
            }
            
            // Обработчик прокрутки блока
            blockPost.onscroll = function() {
                processed_page = getScrollPercent(blockPost);
            };
            
            // Обработчик кнопки "еще комментарии"
            try {
                document.getElementById(`see_more_button_${link}`).onclick = function() {
                    const iopCom = document.getElementById(`IOPcom_${link}`);
                    if (iopCom) {
                        load_more_comment(link, iopCom.innerText);
                    }
                };
            } catch (e) {}
        }
    });
}

/**
 * Получить URL изображения
 */
function geturlimg() {
    setTimeout(draw, 5000);
}

/**
 * Рисование изображения по URL
 */
function draw() {
    try {
        const textarea = document.getElementById('id_body');
        const url = textarea.value;
        if (url) start_imgurl(url);
    } catch (e) {}
}

/**
 * Загрузка изображения по URL
 */
function start_imgurl(url) {
    const img = document.createElement("img");
    img.crossOrigin = 'Anonymous';
    img.src = url;
    img.onload = function() {
        const canvas = document.getElementById('canvas');
        if (canvas) {
            canvas.style.display = "block";
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0);
            dataURL_wall = canvas.toDataURL("image/png");
        }
    };
}

// ==================== УПРАВЛЕНИЕ СКРИПТАМИ ====================

/**
 * Замена скриптов
 */
function nodeScriptReplace(node) {
    if (nodeScriptIs(node)) {
        node.parentNode.replaceChild(nodeScriptClone(node), node);
    } else {
        const children = node.childNodes;
        for (let i = 0; i < children.length; i++) {
            nodeScriptReplace(children[i]);
        }
    }
    return node;
}

/**
 * Клонирование скрипта
 */
function nodeScriptClone(node) {
    const script = document.createElement("script");
    script.text = node.innerHTML;
    
    const attrs = node.attributes;
    for (let i = 0; i < attrs.length; i++) {
        script.setAttribute(attrs[i].name, attrs[i].value);
    }
    
    return script;
}

/**
 * Проверка, является ли узел скриптом
 */
function nodeScriptIs(node) {
    return node.tagName === 'SCRIPT';
}

// ==================== АВТОДОПОЛНЕНИЕ ====================

/**
 * Автодополнение
 */
function autocomplete(inp) {
    let currentFocus = -1;
    
    inp.addEventListener("input", function(e) {
        const val = this.value;
        
        closeAllLists();
        
        if (!val) return;
        
        if (val.length !== 0) {
            ws_wall.send(JSON.stringify({
                event: "autocomplete",
                data: val
            }));
        }
        
        currentFocus = -1;
        
        const a = document.createElement("DIV");
        a.setAttribute("id", this.id + "autocomplete-list");
        a.setAttribute("class", "autocomplete-items");
        this.parentNode.appendChild(a);
        
        for (let i = 0; i < countries.length; i++) {
            if (countries[i].substr(0, val.length).toUpperCase() === val.toUpperCase()) {
                const b = document.createElement("DIV");
                b.innerHTML = "<strong>" + countries[i].substr(0, val.length) + "</strong>";
                b.innerHTML += countries[i].substr(val.length);
                b.innerHTML += "<input type='hidden' value='" + countries[i] + "'>";
                
                b.addEventListener("click", function(e) {
                    inp.value = this.getElementsByTagName("input")[0].value;
                    closeAllLists();
                });
                
                a.appendChild(b);
            }
        }
    });
    
    inp.addEventListener("keydown", function(e) {
        let x = document.getElementById(this.id + "autocomplete-list");
        if (x) x = x.getElementsByTagName("div");
        
        if (e.keyCode === 40) {
            currentFocus++;
            addActive(x);
        } else if (e.keyCode === 38) {
            currentFocus--;
            addActive(x);
        } else if (e.keyCode === 13) {
            e.preventDefault();
            if (currentFocus > -1 && x) {
                x[currentFocus].click();
            }
        }
    });
    
    function addActive(x) {
        if (!x) return false;
        removeActive(x);
        if (currentFocus >= x.length) currentFocus = 0;
        if (currentFocus < 0) currentFocus = x.length - 1;
        x[currentFocus].classList.add("autocomplete-active");
    }
    
    function removeActive(x) {
        for (let i = 0; i < x.length; i++) {
            x[i].classList.remove("autocomplete-active");
        }
    }
    
    function closeAllLists(elmnt) {
        const x = document.getElementsByClassName("autocomplete-items");
        for (let i = 0; i < x.length; i++) {
            if (elmnt !== x[i] && elmnt !== inp) {
                x[i].parentNode.removeChild(x[i]);
            }
        }
    }
    
    document.addEventListener("click", function(e) {
        closeAllLists(e.target);
    });
}

/**
 * Поиск
 */
function search_func() {
    const val = document.getElementById("search-input")?.value;
    if (val) {
        ws_wall.send(JSON.stringify({
            event: "search",
            data: val
        }));
    }
}
// ===================== АНИМАЦИЯ МЕНЮ ========================
function openMenu(self){
    if(self.getAttribute("open-atr") == "close") {
        document.getElementById('butMen').style.display = 'block';
        self.setAttribute("open-atr", "open")
    } else {
        document.getElementById('butMen').style.display = 'none';
        self.setAttribute("open-atr", "close")
    }
}

// ==================== ОБРАБОТЧИКИ КЛАВИШ ====================

document.addEventListener('keypress', function(e) {
    if (_page === "chat") {
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            document.getElementById("btn")?.onclick();
            return false;
        }
    } else if (_page === "wallpost") {
        if (e.keyCode === 13 && !e.shiftKey) {
            e.preventDefault();
            const postId = e.srcElement?.getAttribute("post_id");
            if (postId) {
                document.getElementById(`add_${postId}`)?.onclick();
            }
            return false;
        }
    }
});

// ==================== ПОДПИСКА НА СОБЫТИЯ ====================

// Поп-стейт история
window.addEventListener("popstate", historyManager.handlePopState.bind(historyManager));

// Инициализация WebSocket
activate_wall();

// Экспорт глобальных функций
window.main_page = main_page;
window.users = users;
window.quit = quit;
window.enter = enter;
window.addREG = addREG;
window.userPROFILE = userPROFILE;
window.filterBEST = filterBEST;
window.jsons = jsons;
window.showImg = showImg;
window.LIKE = LIKE;
window.LIKEOVER = LIKEOVER;
window.LIKEDONE = LIKEDONE;
window.rpPost = rpPost;
window.reSend = reSend;
window.addfollow = addfollow;
window.foll = foll;
window.folls = folls;
window.getlkpost = getlkpost;
window.menuset = menuset;
window.getIndex = getIndex;
window.showContent = showContent;
window.comView = comView;
window.load_more_comment = load_more_comment;
window.send_com = send_com;
window.send_wall = send_wall;
window.deletepost = deletepost;
window.delete_pm = delete_pm;
window.delete_com = delete_com;
window.privatMES = privatMES;
window.createMES = createMES;
window.mesID = mesID;
window.send_message = send_message;
window.FRIENDS_PAGE = FRIENDS_PAGE;
window.FRIENDS = FRIENDS;
window.autocomplete = autocomplete;
window.search_func = search_func;
window.crate_data_all = crate_data_all;
window.editPROFF = editPROFF;
window.profilePOST = profilePOST;
window.addPost = addPost;
window.OnOn = OnOn;
window.OnOnreg = OnOnreg;
window.load_image_profile = load_image_profile;
window.OnOnW = OnOnW;
window.clearCanvas = clearCanvas;
window.geturlimg = geturlimg;
window.start_imgurl = start_imgurl;
window.openMenu = openMenu;
window.event_topbt = (e) => topbtManager.handleEvent(e);
window.nodeScriptReplace = nodeScriptReplace;
