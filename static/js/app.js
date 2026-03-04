// ==================== ИНИЦИАЛИЗАЦИЯ ====================
const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = Vue;
const { createRouter, createWebHistory, useRoute, useRouter } = VueRouter;

// Конфигурация (полностью совместимая с оригиналом)
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

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (оригинальные) ====================

// Получение cookie (оригинальная функция)
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

// CSRF-токен
function getCSRFToken() {
    const csrfElement = document.getElementsByName('csrfmiddlewaretoken')[0];
    return csrfElement ? csrfElement.value : getCookie('csrftoken');
}

// Форматирование окончаний (оригинальная)
function getNumEnding(number, endings) {
    number %= 100;
    if (number >= 11 && number <= 19) return endings[2];
    const i = number % 10;
    switch (i) {
        case 1: return endings[0];
        case 2:
        case 3:
        case 4: return endings[1];
        default: return endings[2];
    }
}

// Процент прокрутки (оригинальная)
function getScrollPercent(element = document.documentElement) {
    const scrollTop = element.scrollTop || document.body.scrollTop;
    const scrollHeight = element.scrollHeight || document.body.scrollHeight;
    const clientHeight = element.clientHeight;
    return (scrollTop / (scrollHeight - clientHeight)) * 100 || 0;
}

// Обрезка имени (оригинальная)
function truncateUsername(username, maxLength = 15) {
    if (!username) return '';
    return username.length > maxLength ? username.slice(0, maxLength - 3) + '...' : username;
}

// Звуковой сигнал (оригинальная)
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

// Генерация HTML аватара (оригинальная, адаптированная)
function getAvatarSrc(imageUser, pathData) {
    return imageUser !== "oneProf.png" 
        ? `/media/data_image/${pathData}/tm_${imageUser}`
        : CONFIG.DEFAULT_AVATAR;
}

// Настройка axios
const csrftoken = getCSRFToken();
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.headers.common['X-CSRFToken'] = csrftoken;

// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ ====================
const store = reactive({
    user: null,
    notifications: JSON.parse(localStorage.getItem("notification") || "[]"),
    wsWall: null,
    wsChats: {},
    countries: [],
    modalOpen: false,
    page: "wallpost", // _page из оригинала
    innode: 0,        // из оригинала
    len: 0,           // из оригинала
    yOffset: 0,
    temp_position: 0,
    isLoading: false,
    all_pages: null,
    processed_page: 0
});

// Сохранение уведомлений в localStorage
watch(() => store.notifications, (newVal) => {
    localStorage.setItem("notification", JSON.stringify(newVal));
}, { deep: true });

// ==================== WEB SOCKET (СТЕНА) ====================
function initWallWebSocket() {
    const host = window.location.hostname;
    store.wsWall = new WebSocket(`${CONFIG.WS_PROTOCOL}${host}:${CONFIG.PORT}/`);

    store.wsWall.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handleWallMessage(data);
        } catch (e) {
            console.error('WebSocket parse error:', e);
        }
    };

    store.wsWall.onclose = () => {
        console.log('Wall WebSocket closed, reconnecting...');
        setTimeout(initWallWebSocket, 5000);
    };

    store.wsWall.onerror = (err) => {
        console.error('Wall WebSocket error', err);
        if (store.wsWall.readyState === 3) {
            alert("ОШИБКА ПОДКЛЮЧЕНИЯ! Установите последнюю версию браузера или отключите VPN");
        }
    };
}

function handleWallMessage(data) {
    switch (data.status) {
        case 'wallpost':
            window.dispatchEvent(new CustomEvent('new-wall-post', { detail: data }));
            break;
        case 'deletepost':
            window.dispatchEvent(new CustomEvent('delete-wall-post', { detail: data }));
            break;
        case 'notification':
            handleNotification(data);
            break;
        case 'autocomplete':
            store.countries = data.answer_autocomplete || [];
            break;
        case 'search':
            window.dispatchEvent(new CustomEvent('search-results', { detail: data }));
            break;
        case 'MoreData':
            window.dispatchEvent(new CustomEvent('more-data'));
            break;
        case 'Done':
            console.log("upload done");
            break;
        case 'Kandinsky-2.0':
            window.dispatchEvent(new CustomEvent('kandinsky-update', { detail: data }));
            break;
        case 'send_comment':
            window.dispatchEvent(new CustomEvent('new-comment', { detail: data }));
            break;
        case 'delete_com':
            window.dispatchEvent(new CustomEvent('delete-comment', { detail: data }));
            break;
        case 'delete_pm':
            window.dispatchEvent(new CustomEvent('delete-pm', { detail: data }));
            break;
    }
}

function handleNotification(data) {
    console.log("notification:", data, history.state);
    
    if (store.page === "privatmes") {
        const event = new CustomEvent('show-notification', { detail: data });
        window.dispatchEvent(event);
    } else if (history.state?.id !== data.thread_id) {
        beep();
        if (!store.notifications.includes(String(data.thread_id))) {
            store.notifications.push(String(data.thread_id));
        }
    }
    
    // Обновление навигации
    const notificationNav = document.getElementById("notification-nav");
    if (notificationNav) {
        notificationNav.style.display = store.notifications.length > 0 ? "block" : "none";
    }
}

// ==================== МОДАЛЬНОЕ ОКНО ДЛЯ ИЗОБРАЖЕНИЙ ====================
const ImageModal = {
    template: `
        <div v-if="isOpen" class="modal-overlay" @click.self="close">
            <div class="modal-container" :style="modalStyle">
                <img :src="imageUrl" class="modal-image" :style="imageStyle" @click.stop>
                <button class="modal-close-btn" @click.stop="close">×</button>
            </div>
        </div>
    `,
    setup() {
        const imageUrl = ref(null);
        const isOpen = ref(false);
        const imageStyle = ref({});
        const modalStyle = ref({});
        
        const open = (url) => {
            console.log('Opening modal with:', url);
            imageUrl.value = url;
            isOpen.value = true;
            store.modalOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Адаптация под размер экрана (как в showImg)
            if (document.body.offsetHeight > document.body.offsetWidth) {
                imageStyle.value = {
                    maxHeight: document.body.offsetHeight + 'px',
                    maxWidth: document.body.offsetWidth + 'px',
                    width: '100%'
                };
                modalStyle.value = {
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                };
            } else {
                imageStyle.value = {
                    maxHeight: document.body.offsetHeight + 'px',
                    maxWidth: document.body.offsetWidth + 'px'
                };
            }
        };
        
        const close = () => {
            isOpen.value = false;
            imageUrl.value = null;
            store.modalOpen = false;
            document.body.style.overflow = 'auto';
        };

        const handleKeyDown = (e) => {
            if (e.key === 'Escape' && isOpen.value) {
                close();
            }
        };

        onMounted(() => {
            window.addEventListener('show-image', (e) => open(e.detail));
            window.addEventListener('close-modal', close);
            window.addEventListener('keydown', handleKeyDown);
        });

        onUnmounted(() => {
            window.removeEventListener('show-image', open);
            window.removeEventListener('close-modal', close);
            window.removeEventListener('keydown', handleKeyDown);
        });

        return { imageUrl, isOpen, imageStyle, modalStyle, close };
    },
};

// ==================== КОММЕНТАРИИ ====================
const Comments = {
    props: ['postId'],
    template: `
        <div>
            <a v-if="hasNext" class="see_more_button" @click="loadMore">Показать следующие комментарии</a>
            <div :id="'field-comment_' + postId" class="comments-container">
                <div v-for="comment in comments" :key="comment.id" class="f-c" :id="'com-block-' + comment.id">
                    <img :src="comment.authorAvatar" class="imgUs" @click="goToUser(comment.authorId)" style="cursor:pointer;">
                    <a @click="goToUser(comment.authorId)" id="user-comment" style="cursor:pointer;">{{ comment.authorName }}</a>
                    <p id="comment-text" v-html="formatText(comment.comment_text)"></p>
                    <img v-if="comment.comment_image" :src="comment.imageUrl" @click="showImage(comment.imageUrl)" style="max-width:200px; cursor:pointer;">
                    <div id="time-comment">{{ formatDate(comment.timecomment) }}</div>
                    <div v-if="canDelete(comment)" class="delete-pm" @click="deleteComment(comment.id)"></div>
                </div>
            </div>
            <div :class="'compose_' + postId" class="compose">
                <div :id="'comment_text_' + postId"
                     class="message_textarea"
                     contenteditable="true"
                     @keydown.enter.prevent="sendComment"
                     ref="commentInput"></div>
                <div class="comment-actions">
                    <input type="file" :id="'comment_image_' + postId" @change="handleImageUpload" accept="image/*" style="display:none;">
                    <label :for="'comment_image_' + postId" class="image-upload-label">📷</label>
                    <button @click="sendComment">ОТПРАВИТЬ</button>
                </div>
                <canvas v-if="commentImageData" :id="'canvas_comment_' + postId" style="display:block; max-width:100px;"></canvas>
            </div>
            <div :id="'results_' + postId"></div>
            <div :id="'IOPcom_' + postId" style="display:none;">{{ nextPage }}</div>
        </div>
    `,
    setup(props) {
        const router = useRouter();
        const comments = ref([]);
        const nextPage = ref(1);
        const hasNext = ref(false);
        const commentInput = ref(null);
        const commentImageData = ref(null);
        const commentImageFile = ref(null);

        const loadComments = async (page = 1) => {
            try {
                const response = await axios.get(`/api/comments/?post=${props.postId}&page=${page}`);
                const newComments = response.data.results.map(c => ({
                    ...c,
                    authorId: c.author?.id,
                    authorName: c.author?.username || 'Anonymous',
                    authorAvatar: getAvatarSrc(c.author?.image_user, c.author?.path_data),
                    imageUrl: c.comment_image ? `/media/data_image/${c.author?.path_data}/${c.comment_image}.png` : null,
                    timecomment: new Date(c.timecomment).toLocaleString()
                }));
                comments.value = page === 1 ? newComments : [...comments.value, ...newComments];
                hasNext.value = !!response.data.next;
                nextPage.value = response.data.next ? page + 1 : 'STOP';
            } catch (error) {
                console.error('Error loading comments:', error);
            }
        };

        const loadMore = () => {
            if (hasNext.value) loadComments(nextPage.value);
        };
        
        const handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            commentImageFile.value = file;
            
            const canvas = document.getElementById(`canvas_comment_${props.postId}`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    commentImageData.value = canvas.toDataURL("image/png");
                    
                    // Стилизуем как в оригинале
                    canvas.style.width = '90px';
                    canvas.style.height = 'auto';
                    canvas.style.cursor = 'pointer';
                    canvas.style.display = 'block';
                    
                    canvas.onclick = () => {
                        showImage(commentImageData.value);
                    };
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        const sendComment = async () => {
            const text = commentInput.value?.innerText?.trim();
            if (!text && !commentImageData.value) return;

            // Показываем загрузчик
            const loader = document.createElement("div");
            loader.id = "loader";
            loader.style.display = "block";
            document.getElementById(`results_${props.postId}`)?.appendChild(loader);
            
            document.getElementsByClassName(`compose_${props.postId}`)[0].style.display = "none";

            // Отправляем через WebSocket как в оригинале
            if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                store.wsWall.send(JSON.stringify({
                    comment_text: text,
                    comment_image: commentImageData.value || "",
                    event: "comment_post",
                    post_id: props.postId
                }));
                
                commentInput.value.innerText = "";
                
                // Очистка canvas
                const canvas = document.getElementById(`canvas_comment_${props.postId}`);
                if (canvas) {
                    const ctx = canvas.getContext('2d');
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    canvas.width = 0;
                    canvas.height = 0;
                }
                commentImageData.value = null;
                commentImageFile.value = null;
            } else {
                alert('WebSocket не подключен');
            }
        };

        const deleteComment = async (commentId) => {
            if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                store.wsWall.send(JSON.stringify({
                    event: "delete_com",
                    data: { 
                        comment_id: commentId, 
                        request_user: store.user?.username 
                    }
                }));
            }
        };

        const canDelete = (comment) => store.user && comment.authorId === store.user.id;
        const goToUser = (id) => router.push(`/user/${id}`);
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const formatDate = (ts) => new Date(ts).toLocaleString();
        const formatText = (text) => {
            if (!text) return '';
            return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />');
        };

        // Обработка нового комментария через WebSocket
        const handleNewComment = (data) => {
            if (data.post_id != props.postId) return;
            
            const newComment = {
                id: data.comment_id,
                authorId: data.user_id,
                authorName: data.comment_user,
                authorAvatar: getAvatarSrc(data.image_user, data.path_data),
                comment_text: data.comment_text,
                comment_image: data.comment_image,
                imageUrl: data.comment_image ? `/media/data_image/${data.comment_image}` : null,
                timecomment: data.timecomment
            };
            comments.value.push(newComment);
            
            // Убираем загрузчик
            const loader = document.getElementById("loader");
            if (loader) loader.remove();
            
            document.getElementsByClassName(`compose_${props.postId}`)[0].style.display = "block";
        };

        const handleDeleteComment = (data) => {
            comments.value = comments.value.filter(c => c.id != data.comment_id);
        };

        onMounted(() => {
            loadComments(1);
            window.addEventListener('new-comment', (e) => handleNewComment(e.detail));
            window.addEventListener('delete-comment', (e) => handleDeleteComment(e.detail));
        });

        onUnmounted(() => {
            window.removeEventListener('new-comment', handleNewComment);
            window.removeEventListener('delete-comment', handleDeleteComment);
        });

        return {
            comments,
            nextPage,
            hasNext,
            commentInput,
            commentImageData,
            loadMore,
            sendComment,
            deleteComment,
            canDelete,
            goToUser,
            showImage,
            formatDate,
            formatText,
            handleImageUpload
        };
    },
};

// ==================== КНОПКА TOPBT ====================
const TopButton = {
    template: `
        <img v-if="visible"
             src="/static/images/topv1.png"
             class="topbt"
             id="topbt"
             :style="buttonStyle"
             @click="handleClick"
        />
    `,
    setup() {
        const visible = ref(false);
        const direction = ref('up');        // 'up' – прокрутить вверх, 'down' – вниз
        const savedScrollY = ref(0);
        const route = useRoute();

        // Проверка наличия прокрутки
        const hasScroll = () => document.documentElement.scrollHeight > window.innerHeight;

        // Обновление направления на основе текущей позиции
        const updateDirection = () => {
            const scrollY = window.scrollY;
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollY / (docHeight - winHeight)) * 100;

            if (route.name === 'chat') {
                if (scrollY <= CONFIG.CHAT_SCROLL_THRESHOLD) {
                    direction.value = 'down';
                } else if (scrollPercent >= CONFIG.SCROLL_THRESHOLD) {
                    direction.value = 'up';
                } else {
                    direction.value = null;
                }
            } else {
                if (scrollY <= 100) {
                    direction.value = 'down';
                } else if (scrollPercent >= CONFIG.SCROLL_THRESHOLD) {
                    direction.value = 'up';
                } else {
                    direction.value = null;
                }
            }
        };

        // Видимость кнопки
        const shouldShow = () => hasScroll() && direction.value !== null && !store.modalOpen;

        // Обработчик скролла
        let ticking = false;
        const onScroll = () => {
            store.yOffset = window.pageYOffset;
            store.processed_page = getScrollPercent();
            
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateDirection();
                    visible.value = shouldShow();
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Поворот кнопки
        const buttonStyle = computed(() => {
            if (store.modalOpen) {
                return { transform: 'rotate(90deg)' };
            }
            const rotate = direction.value === 'down' ? 'rotate(180deg)' : 'rotate(0deg)';
            return { transform: rotate };
        });

        // Обработка клика (как в оригинальном topbtManager)
        const handleClick = () => {
            if (store.modalOpen) {
                window.dispatchEvent(new CustomEvent('close-modal'));
                store.modalOpen = false;
                updateDirection();
                visible.value = shouldShow();
                return;
            }

            if (route.name === 'chat') {
                if (direction.value === 'up') {
                    direction.value = 'down';
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (direction.value === 'down') {
                    direction.value = 'up';
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                }
            } else {
                if (direction.value === 'up') {
                    direction.value = 'down';
                    store.temp_position = store.yOffset;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else if (direction.value === 'down') {
                    direction.value = 'up';
                    window.scrollTo({ top: store.temp_position, behavior: 'smooth' });
                }
            }
        };

        onMounted(() => {
            window.addEventListener('scroll', onScroll);
            updateDirection();
            visible.value = shouldShow();
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', onScroll);
        });

        // При смене маршрута пересчитываем
        watch(() => route.name, () => {
            updateDirection();
            visible.value = shouldShow();
        });

        return { visible, buttonStyle, handleClick };
    }
};

// ==================== ГЛАВНАЯ ЛЕНТА ====================
const WallPostsView = {
    template: `
        <div>
            <div id="pages" style="display:none;">
                <span id="IOP">{{ nextPage }}</span>
            </div>
            <div class="chat" id="user-content-block" atr="wall">
                <div id="conversation">
                    <div v-for="(post, index) in posts" :key="post.id" class="message" @mouseover="getIndex(index)">
                        <div class="views-title" style="width:100%;float:left;">
                            <div class="user-cord" :atribut="post.authorId">
                                <a @click="goToUser(post.authorId)" style="cursor:pointer;">
                                    <img :src="post.authorAvatar" class="imgUs" loading="lazy" style="cursor:pointer;">
                                </a>
                                <a class="postview" @click="goToPost(post.id)" style="cursor:pointer;">
                                    <span style="font-weight:bolder;">{{ truncate(post.authorName) }}</span>
                                    <span v-if="post.body" class="arrow"> → </span>
                                    <span class="message-title">{{ truncate(post.body, 20) }}</span>
                                </a>
                            </div>
                            <span class="datetime">{{ formatTime(post.date_post) }}</span>
                        </div>
                        <div class="field-image" :atribut="post.id">
                            <img :src="post.imageUrl" height="auto" width="auto" class="wallpost" @click="showImage(post.imageUrl)" :id="'image-post-' + post.id" style="cursor:pointer;">
                        </div>
                        <div id="body-post-wall">
                            <div :id="'post_like_block_' + post.id" style="width:100%">
                                <img class="icon-like" src="/static/images/mesvF.png" 
                                     @click="toggleComments(post.id)" 
                                     :open-atr="commentOpen[post.id] ? 'open' : 'close'" 
                                     :id-comment="post.id"
                                     :id="'comment_image_id_' + post.id"
                                     type-div="icon"
                                     indicator-ws="close"
                                     style="cursor:pointer;">
                                <img class="icon-like" 
                                     :id="'post_image_' + post.id" 
                                     :src="post.liked ? CONFIG.LIKE_GIF : CONFIG.LIKE_PNG" 
                                     @click="toggleLike(post)"
                                     open-atr="close"
                                     type="wall"
                                     style="cursor:pointer;">
                                <img class="icon-like" 
                                     :src="post.reposted ? CONFIG.RP_OPEN : CONFIG.RP_CLOSED" 
                                     @click="toggleRepost(post)"
                                     open-atr="close"
                                     type="wall"
                                     style="cursor:pointer;">
                                <div class="box-indicator" style="display:none;margin: 0 auto;margin-top: 15px;" 
                                     :id="'box-indicator-' + post.id"></div>
                            </div>
                            <div v-if="commentOpen[post.id]" :id="'box-com-' + post.id" class="box-com" style="display:block;">
                                <Comments :postId="post.id" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="loading" id="loader" style="display:block;">Загрузка...</div>
        </div>
    `,
    components: { Comments },
    setup() {
        const router = useRouter();
        const posts = ref([]);
        const nextPage = ref(1);
        const loading = ref(false);
        const commentOpen = reactive({});

        const loadPosts = async (page = 1) => {
            if (page === 'STOP' || loading.value) return;
            loading.value = true;
            try {
                const response = await axios.get(`/api/posts/?page=${page}`);
                const newPosts = response.data.results.map(formatPost);
                posts.value = page === 1 ? newPosts : [...posts.value, ...newPosts];
                nextPage.value = response.data.next ? page + 1 : 'STOP';
                document.getElementById('IOP').innerText = nextPage.value;
            } catch (error) {
                console.error('Error loading posts:', error);
            } finally {
                loading.value = false;
                store.isLoading = false;
            }
        };

        const formatPost = (post) => ({
            ...post,
            authorId: post.author?.id,
            authorName: post.author?.username || 'Anonymous',
            authorAvatar: getAvatarSrc(post.author?.image_user, post.author?.path_data),
            imageUrl: post.image ? `/media/data_image/${post.path_data}/${post.image}` : CONFIG.NO_IMAGE,
            liked: post.likes?.includes(store.user?.id),
            reposted: post.relike?.includes(store.user?.id),
            date_post: new Date(post.date_post)
        });

        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        
        const goToUser = (id) => router.push(`/user/${id}`);
        const truncate = (text, max = 15) => truncateUsername(text, max);
        const formatTime = (ts) => {
            const d = new Date(ts);
            return `${d.getHours()}:${d.getMinutes().toString().padStart(2, '0')}`;
        };
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const getIndex = (index) => {
            store.innode = index;
            store.len = posts.value.length;
        };

        const toggleLike = async (post) => {
            if (!store.user) return;
            try {
                await axios.post(`/api/posts/${post.id}/like/`);
                post.liked = !post.liked;
            } catch (error) {
                console.error('Error toggling like:', error);
            }
        };

        const toggleRepost = async (post) => {
            if (!store.user) return;
            try {
                await axios.post(`/api/posts/${post.id}/repost/`);
                post.reposted = !post.reposted;
            } catch (error) {
                console.error('Error toggling repost:', error);
            }
        };

        const toggleComments = (postId) => {
            commentOpen[postId] = !commentOpen[postId];
        };

        // Обработка нового поста через WebSocket
        const handleNewPost = (data) => {
            const newPost = {
                id: data.id,
                authorId: data.user_id,
                authorName: data.user_post,
                authorAvatar: getAvatarSrc(data.image_user, data.path_data),
                body: data.text,
                imageUrl: data.image ? `/media/data_image/${data.path_data}/${data.image}` : CONFIG.NO_IMAGE,
                liked: false,
                reposted: false,
                date_post: new Date(data.timestamp * 1000)
            };
            posts.value.unshift(newPost);
            
            // Убираем загрузчик и показываем форму
            const loader = document.getElementById('loader');
            if (loader) loader.remove();
            const messageForm = document.getElementById('message_form');
            if (messageForm) messageForm.style.display = "block";
        };

        const handleDeletePost = (data) => {
            const index = posts.value.findIndex(p => p.id == data.post_id);
            if (index !== -1) {
                posts.value.splice(index, 1);
                if (store.innode === index) {
                    store.innode = Math.min(store.innode, posts.value.length - 1);
                }
            }
        };

        const handleKandinsky = (data) => {
            const post = posts.value.find(p => p.id == data.post);
            if (post) {
                post.imageUrl = `/media/data_image/${data.path_data}/${data.data}`;
            }
        };

        // Бесконечная прокрутка
        const handleScroll = () => {
            if (loading.value || nextPage.value === 'STOP') return;
            
            const scrollPercent = getScrollPercent();
            store.processed_page = scrollPercent;
            
            if (scrollPercent >= CONFIG.SCROLL_THRESHOLD && !store.isLoading) {
                store.isLoading = true;
                loadPosts(nextPage.value);
            }
        };

        onMounted(() => {
            loadPosts(1);
            window.addEventListener('scroll', handleScroll);
            window.addEventListener('new-wall-post', (e) => handleNewPost(e.detail));
            window.addEventListener('delete-wall-post', (e) => handleDeletePost(e.detail));
            window.addEventListener('kandinsky-update', (e) => handleKandinsky(e.detail));
            store.page = "wallpost";
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll);
            window.removeEventListener('new-wall-post', handleNewPost);
            window.removeEventListener('delete-wall-post', handleDeletePost);
            window.removeEventListener('kandinsky-update', handleKandinsky);
        });

        return {
            posts,
            nextPage,
            loading,
            commentOpen,
            CONFIG,
            goToPost,
            goToUser,
            truncate,
            formatTime,
            toggleLike,
            toggleRepost,
            toggleComments,
            getIndex,
            showImage
        };
    },
};

// ==================== ПОЛЬЗОВАТЕЛИ ====================
const UsersView = {
    template: `
        <div>
            <div id="pages" style="display:none;">
                <span id="IOP">{{ nextPage }}</span>
            </div>
            <div v-if="store.user" id="filter-users-page" style="display:block;">
                <a @click="showFriends" style="cursor:pointer;">друзья {{ store.user.total_friends || 0 }}</a>
            </div>
            <div class="us-block" id="user-content-block" atr="users">
                <div v-for="user in usersList" :key="user.id" class="views-row" @click="goToUser(user.id)" style="cursor:pointer;">
                    <div class="img-user-block">
                        <div class="user-image">
                            <img :src="user.avatarUrl" loading="lazy" style="width:180px; height:160px;">
                        </div>
                        <div class="user-name">
                            <a :atribut="user.id" id="user-link">{{ truncate(user.username) }}</a>
                        </div>
                        <div class="numberCircle_users" :style="{ background: user.online ? '#37b73c' : '#c3c3c3' }"></div>
                    </div>
                </div>
            </div>
            <div v-if="loading" id="loader" style="display:block;">Загрузка...</div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const usersList = ref([]);
        const nextPage = ref(1);
        const loading = ref(false);

        const fetchUsers = async (page = 1) => {
            if (page === 'STOP' || loading.value) return;
            loading.value = true;
            try {
                const res = await axios.get(`/api/users/?page=${page}`);
                const newUsers = res.data.results.map(u => ({
                    ...u,
                    avatarUrl: getAvatarSrc(u.image_user, u.path_data),
                    online: u.online === 'true'
                }));
                usersList.value = page === 1 ? newUsers : [...usersList.value, ...newUsers];
                nextPage.value = res.data.next ? page + 1 : 'STOP';
                document.getElementById('IOP').innerText = nextPage.value;
            } catch (error) {
                console.error('Error loading users:', error);
            } finally {
                loading.value = false;
                store.isLoading = false;
            }
        };

        const goToUser = (id) => router.push(`/user/${id}`);
        const truncate = (name) => truncateUsername(name, 10);
        const showFriends = () => {
            if (store.user) {
                window.dispatchEvent(new CustomEvent('open-friends-modal', { detail: store.user.id }));
            }
        };

        // Бесконечная прокрутка
        const handleScroll = () => {
            if (loading.value || nextPage.value === 'STOP') return;
            
            const scrollPercent = getScrollPercent();
            if (scrollPercent >= CONFIG.SCROLL_THRESHOLD && !store.isLoading) {
                store.isLoading = true;
                fetchUsers(nextPage.value);
            }
        };

        onMounted(() => {
            fetchUsers(1);
            window.addEventListener('scroll', handleScroll);
            store.page = "users";
            
            // Скрыть поиск как в оригинале
            const searchBox = document.getElementById("search-box");
            if (searchBox) searchBox.style.display = "block";
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll);
        });

        return {
            store,
            usersList,
            nextPage,
            loading,
            goToUser,
            truncate,
            showFriends
        };
    },
};

// ==================== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ====================
const UserProfileView = {
    template: `
        <div>
            <div class="info">
                <div class="us-name" :style="{ color: userInfo.color || '#000000' }">
                    <h3 id="user_page_name">{{ userInfo.username }}</h3>
                </div>
                <div class="uspgimg">
                    <div class="img-user-block">
                        <img :src="userInfo.avatarUrl" loading="lazy" id="image-user-profile" @click="showImage(userInfo.avatarUrl)" style="cursor:pointer;">
                        <div class="numberCircle" :style="{ background: userInfo.online ? '#37b73c' : '#c3c3c3' }"></div>
                    </div>
                </div>
                <div class="soc">
                    <template v-if="store.user && store.user.id === userInfo.id">
                        <img src="/static/images/edprof.png" class="edprof" @click="editProfile" open-atr="close" style="cursor:pointer;">
                    </template>
                    <template v-else-if="store.user">
                        <a :id="'follw_' + userInfo.id" @click="toggleFollow" :atr-follow="isFollowing ? 'true' : 'false'" style="cursor:pointer;">
                            <img :src="isFollowing ? '/static/images/dusr.png' : '/static/images/addusr.png'" class="addusr">
                            <span id="follow-text">{{ isFollowing ? 'ОТПИСАТЬСЯ' : 'ПОДПИСАТЬСЯ' }}</span>
                        </a>
                        <div class="pm-mes">
                            <div class="compose">
                                <div id="message_textarea" contenteditable="true" placeholder="Введите сообщение..." @input="e => messageText = e.target.innerText"></div>
                            </div>
                            <button @click="sendMessage">ОТПРАВИТЬ</button>
                        </div>
                    </template>
                    <a @click="showFollowers" style="cursor:pointer;">Подписчики <span id="foll_coun">{{ followersCount }}</span></a>
                    <em>•</em>
                    <a @click="showFollowing" style="cursor:pointer;">Подписан <span>{{ followingCount }}</span></a>
                    <em>•</em>
                    <a @click="showLikedPosts" style="cursor:pointer;">Нравится <span>{{ totalLikes }}</span></a>
                </div>
            </div>
            <span id="user_id" style="display:none;">{{ userInfo.id }}</span>
            <ul class="day-block" id="user-content-block" atr="user">
                <li v-for="post in userPosts" :key="post.id" class="views-row" @mouseover="getIndex(post.index)">
                    <div class="field-image" :atribut="post.id">
                        <img :src="post.imageUrl" style="width:300px;height:230px;object-fit:cover; cursor:pointer;" @click="goToPost(post.id)">
                    </div>
                </li>
            </ul>
            <div v-if="loadingPosts" id="loader" style="display:block;">Загрузка...</div>
        </div>
    `,
    setup() {
        const route = useRoute();
        const router = useRouter();
        const userId = computed(() => route.params.id);
        const userInfo = ref({});
        const userPosts = ref([]);
        const followersCount = ref(0);
        const followingCount = ref(0);
        const totalLikes = ref(0);
        const isFollowing = ref(false);
        const messageText = ref('');
        const nextPage = ref(1);
        const loadingPosts = ref(false);

        const fetchUser = async () => {
            try {
                const res = await axios.get(`/api/users/${userId.value}/`);
                userInfo.value = {
                    ...res.data,
                    avatarUrl: getAvatarSrc(res.data.image_user, res.data.path_data),
                    online: res.data.online === 'true'
                };

                const followersRes = await axios.get(`/api/users/${userId.value}/followers/`);
                followersCount.value = followersRes.data.count || 0;

                const followingRes = await axios.get(`/api/users/${userId.value}/following/`);
                followingCount.value = followingRes.data.count || 0;

                const likesRes = await axios.get(`/api/users/${userId.value}/likes/`);
                totalLikes.value = likesRes.data.count || 0;

                if (store.user) {
                    const checkFollow = await axios.get(`/api/users/${store.user.id}/following/`);
                    isFollowing.value = checkFollow.data.results?.some(u => u.id == userId.value) || false;
                }
                
                fetchPosts(1);
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };

        const fetchPosts = async (page = 1) => {
            if (page === 'STOP' || loadingPosts.value) return;
            loadingPosts.value = true;
            try {
                const postsRes = await axios.get(`/api/posts/?author=${userId.value}&page=${page}`);
                const newPosts = postsRes.data.results.map((p, idx) => ({
                    ...p,
                    imageUrl: p.image ? `/media/data_image/${p.path_data}/${p.image}` : CONFIG.NO_IMAGE,
                    index: userPosts.value.length + idx
                }));
                userPosts.value = page === 1 ? newPosts : [...userPosts.value, ...newPosts];
                nextPage.value = postsRes.data.next ? page + 1 : 'STOP';
                document.getElementById('IOP').innerText = nextPage.value;
            } finally {
                loadingPosts.value = false;
            }
        };

        const toggleFollow = async () => {
            if (!store.user) return;
            try {
                if (isFollowing.value) {
                    await axios.post(`/api/users/${userId.value}/unfollow/`);
                } else {
                    await axios.post(`/api/users/${userId.value}/follow/`);
                }
                isFollowing.value = !isFollowing.value;
                followersCount.value += isFollowing.value ? 1 : -1;
            } catch (error) {
                console.error('Error toggling follow:', error);
            }
        };

        const sendMessage = async () => {
            if (!messageText.value?.trim()) return;
            try {
                await axios.post('/api/threads/', { 
                    recipient: userId.value, 
                    message: messageText.value 
                });
                messageText.value = '';
                document.getElementById('message_textarea').innerText = '';
                router.push('/messages');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        };

        const showFollowers = () => {
            window.dispatchEvent(new CustomEvent('open-followers-modal', { detail: userId.value }));
        };
        
        const showFollowing = () => {
            window.dispatchEvent(new CustomEvent('open-following-modal', { detail: userId.value }));
        };
        
        const showLikedPosts = () => {
            window.dispatchEvent(new CustomEvent('open-liked-posts-modal', { detail: userId.value }));
        };
        
        const editProfile = () => { router.push('/profile'); };
        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const getIndex = (index) => {
            store.innode = index;
            store.len = userPosts.value.length;
        };

        // Бесконечная прокрутка постов
        const handleScroll = () => {
            if (loadingPosts.value || nextPage.value === 'STOP') return;
            
            const scrollPercent = getScrollPercent();
            if (scrollPercent >= CONFIG.SCROLL_THRESHOLD && !store.isLoading) {
                store.isLoading = true;
                fetchPosts(nextPage.value);
            }
        };

        watch(userId, () => {
            userInfo.value = {};
            userPosts.value = [];
            nextPage.value = 1;
            fetchUser();
        });

        onMounted(() => {
            fetchUser();
            window.addEventListener('scroll', handleScroll);
            store.page = "user";
            
            // Скрыть поиск как в оригинале
            const searchBox = document.getElementById("search-box");
            if (searchBox) searchBox.style.display = "none";
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', handleScroll);
        });

        return {
            store,
            userInfo,
            userPosts,
            followersCount,
            followingCount,
            totalLikes,
            isFollowing,
            messageText,
            loadingPosts,
            toggleFollow,
            sendMessage,
            showFollowers,
            showFollowing,
            showLikedPosts,
            editProfile,
            goToPost,
            showImage,
            getIndex
        };
    },
};

// ==================== ЛИЧНЫЕ СООБЩЕНИЯ ====================
const PrivateMessagesView = {
    template: `
        <div class="private_messages">
            <h1>СОБЕСЕДНИКИ</h1>
            <div class="partners">
                <div v-for="thread in threads" :key="thread.id" class="pm-block" :id="'pm-block-' + thread.id">
                    <div class="pm" @click="goToChat(thread.id)" style="cursor:pointer;">
                        <img :src="thread.partnerAvatar" class="usPr">
                        <div class="pmu">{{ thread.partnerName }} ({{ thread.total_messages }} {{ messagesWord(thread.total_messages) }})</div>
                    </div>
                    <div class="delete-pm" @click="deleteThread(thread.id)" style="cursor:pointer;"></div>
                    <div v-if="notifications.includes(String(thread.id))" class="notification" style="display:block;" :id="'notification-' + thread.id">!</div>
                </div>
            </div>
            <form class="new_message" @submit.prevent="createChat">
                <div class="autocomplete">
                    <input id="recipient_name" v-model="recipient" placeholder="ИМЯ ПОЛУЧАТЕЛЯ" @input="handleAutocomplete">
                </div>
                <div class="compose">
                    <div id="message_textarea" contenteditable="true" @input="e => newMessage = e.target.innerText" placeholder="Введите ваше сообщение..."></div>
                </div>
                <button type="submit">ОТПРАВИТЬ</button>
            </form>
        </div>
    `,
    setup() {
        const router = useRouter();
        const threads = ref([]);
        const recipient = ref('');
        const newMessage = ref('');
        const notifications = computed(() => store.notifications);

        const fetchThreads = async () => {
            try {
                const res = await axios.get('/api/threads/');
                threads.value = res.data.results.map(t => ({
                    ...t,
                    partnerAvatar: getAvatarSrc(t.partner?.image_user, t.partner?.path_data),
                    partnerName: t.partner?.username || 'Unknown',
                }));
            } catch (error) {
                console.error('Error fetching threads:', error);
            }
        };

        const messagesWord = (count) => getNumEnding(count, ['сообщение', 'сообщения', 'сообщений']);
        const goToChat = (id) => router.push(`/messages/chat/${id}`);
        
        const deleteThread = async (id) => {
            try {
                await axios.delete(`/api/threads/${id}/`);
                threads.value = threads.value.filter(t => t.id !== id);
                store.notifications = store.notifications.filter(n => n != id);
            } catch (error) {
                console.error('Error deleting thread:', error);
            }
        };
        
        const createChat = async () => {
            if (!recipient.value || !newMessage.value) return;
            try {
                await axios.post('/api/threads/', { 
                    recipient: recipient.value, 
                    message: newMessage.value 
                });
                recipient.value = '';
                newMessage.value = '';
                document.getElementById('message_textarea').innerText = '';
                fetchThreads();
            } catch (error) {
                console.error('Error creating chat:', error);
            }
        };

        const handleAutocomplete = () => {
            if (recipient.value.length > 0 && store.wsWall) {
                store.wsWall.send(JSON.stringify({
                    event: "autocomplete",
                    data: recipient.value
                }));
            }
        };

        const handleNotification = (data) => {
            const posElement = document.getElementById(`pm-block-${data.thread_id}`);
            if (posElement) {
                const div_notification = document.createElement("div");
                div_notification.id = `notification-${data.thread_id}`;
                div_notification.className = "notification";
                div_notification.style.display = "block";
                div_notification.innerText = "!";
                posElement.appendChild(div_notification);
            }
        };

        const handleDeletePM = (data) => {
            threads.value = threads.value.filter(t => t.id != data.thread_id);
        };

        onMounted(() => {
            fetchThreads();
            store.page = "privatmes";
            
            // Скрыть поиск
            const searchBox = document.getElementById("search-box");
            if (searchBox) searchBox.style.display = "none";
            
            window.addEventListener('show-notification', (e) => handleNotification(e.detail));
            window.addEventListener('delete-pm', (e) => handleDeletePM(e.detail));
        });

        onUnmounted(() => {
            window.removeEventListener('show-notification', handleNotification);
            window.removeEventListener('delete-pm', handleDeletePM);
        });

        return {
            threads,
            recipient,
            newMessage,
            notifications,
            messagesWord,
            goToChat,
            deleteThread,
            createChat,
            handleAutocomplete
        };
    },
};

// ==================== ЧАТ ====================
const ChatView = {
    template: `
        <div>
            <span id="chat_id" style="display:none;">{{ threadId }}</span>
            <div class="parchat">
                <p class="name" @click="goToPartner" style="cursor:pointer;">{{ partnerName }}</p>
                <p id="messages_total">{{ messagesTotal }} {{ messagesWord(messagesTotal) }} 
                   (получено <span id="received">{{ messagesReceived }}</span>, 
                   отправлено <span id="sent">{{ messagesSent }}</span>)</p>
            </div>
            <div id="conver" ref="messagesContainer" class="chat-messages">
                <div v-for="msg in messages" :key="msg.id" class="message">
                    <p :class="['author', msg.isMine ? 'we' : 'partner']">
                        <img :src="msg.senderAvatar" class="usPr" @click="goToUser(msg.senderId)" style="cursor:pointer;">
                    </p>
                    <p :class="['txtmessage', msg.isMine ? 'we' : 'partner']">
                        <img v-if="msg.image" :src="msg.image" @click="showImage(msg.image)" style="width:90px;border-radius:15px; cursor:pointer;">
                        <a v-else-if="msg.resend && msg.resend !== 'False'" @click="goToPost(msg.resend)" style="cursor:pointer;">СМОТРЕТЬ→</a>
                        <span v-else v-html="formatText(msg.text)"></span>
                        <span class="datetime" style="font-size: 15px;color: #afafaf;">{{ formatTime(msg.timestamp) }}</span>
                    </p>
                </div>
            </div>
            <div id="dot-loader" style="display:none;">Загрузка...</div>
            <form id="message_form" @submit.prevent="sendMessage">
                <div class="compose">
                    <div id="message_textarea" contenteditable="true" @input="e => newMessage = e.target.innerText" placeholder="Введите сообщение..."></div>
                </div>
                <div class="message-actions">
                    <input type="file" :id="'id_image_' + threadId" @change="handleImageUpload" accept="image/*" style="display:none;">
                    <label :for="'id_image_' + threadId" class="image-upload-label">📷</label>
                    <canvas v-if="imageData" :id="'canvas_' + threadId" style="display:block; max-width:90px; cursor:pointer;" @click="showImage(imageData)"></canvas>
                    <button id="clearCanvas" v-if="imageData" @click="clearCanvas" style="display:block; background-color:white;">Очистить</button>
                    <button type="submit">ОТПРАВИТЬ</button>
                </div>
            </form>
        </div>
    `,
    setup() {
        const route = useRoute();
        const router = useRouter();
        const threadId = route.params.id;
        const messages = ref([]);
        const partnerName = ref('');
        const messagesTotal = ref(0);
        const messagesReceived = ref(0);
        const messagesSent = ref(0);
        const newMessage = ref('');
        const nextPage = ref(1);
        const ws = ref(null);
        const messagesContainer = ref(null);
        const imageData = ref(null);
        const imageFile = ref(null);

        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/threads/${threadId}/`);
                const thread = res.data;
                partnerName.value = thread.partner?.username || 'Unknown';
                messagesTotal.value = thread.total_messages || 0;
                messagesReceived.value = thread.messages_received || 0;
                messagesSent.value = thread.messages_sent || 0;
                
                const msgsRes = await axios.get(`/api/threads/${threadId}/messages/`);
                messages.value = msgsRes.data.results.map(m => formatMessage(m));
                nextPage.value = msgsRes.data.next ? 2 : 'STOP';
                document.getElementById('IOP').innerText = nextPage.value;
                
                scrollToBottom();
            } catch (error) {
                console.error('Error fetching messages:', error);
            }
        };

        const formatMessage = (m) => ({
            ...m,
            isMine: m.sender?.id === store.user?.id,
            senderAvatar: getAvatarSrc(m.sender?.image_user, m.sender?.path_data),
            senderId: m.sender?.id,
            timestamp: new Date(m.datetime),
            text: m.text,
            image: m.pm_image ? `/media/data_image/${m.sender?.path_data}/${m.pm_image}.png` : null,
            resend: m.resend
        });

        const loadMore = async () => {
            if (nextPage.value === 'STOP' || store.isLoading) return;
            store.isLoading = true;
            document.getElementById("dot-loader").style.display = "block";
            
            try {
                const res = await axios.get(`/api/threads/${threadId}/messages/?page=${nextPage.value}`);
                const newMessages = res.data.results.map(m => formatMessage(m)).reverse();
                messages.value = [...newMessages, ...messages.value];
                nextPage.value = res.data.next ? nextPage.value + 1 : 'STOP';
                document.getElementById('IOP').innerText = nextPage.value;
            } finally {
                document.getElementById("dot-loader").style.display = "none";
                store.isLoading = false;
            }
        };

        const initChatWebSocket = () => {
            const host = window.location.hostname;
            ws.value = new WebSocket(`${CONFIG.WS_PROTOCOL}${host}:${CONFIG.PORT}/${threadId}/`);
            store.wsChats[threadId] = ws.value;
            
            ws.value.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.event === 'privatemessages') {
                    const newMsg = {
                        id: Date.now(),
                        text: data.message,
                        image: data.pm_image ? `/media/data_image/${data.path_data}/${data.pm_image}.png` : null,
                        senderId: data.sender_id,
                        isMine: data.sender === store.user?.username,
                        senderAvatar: getAvatarSrc(data.image_user, data.path_data),
                        timestamp: new Date(data.timestamp * 1000),
                        resend: data.resend || false
                    };
                    messages.value.push(newMsg);
                    
                    if (data.sender !== store.user?.username) {
                        messagesReceived.value++;
                    } else {
                        messagesSent.value++;
                    }
                    messagesTotal.value++;
                    
                    scrollToBottom();
                } else if (data.event === 'loadmore') {
                    handleLoadMore(data);
                }
            };
            
            ws.value.onclose = () => {
                setTimeout(initChatWebSocket, 5000);
            };
        };

        const handleLoadMore = (data) => {
            const g = JSON.parse(data.data);
            nextPage.value = data.op1;
            document.getElementById('IOP').innerText = nextPage.value;
            
            g.reverse().forEach(msg => {
                const newMsg = {
                    id: msg.pk,
                    text: msg.fields.text,
                    resend: msg.fields.resend,
                    senderId: msg.fields.sender[2],
                    isMine: msg.fields.sender[2] === store.user?.id,
                    senderAvatar: getAvatarSrc(msg.fields.sender[0], msg.fields.sender[1]),
                    timestamp: new Date(msg.fields.datetime),
                    image: null
                };
                messages.value.unshift(newMsg);
            });
            
            document.getElementById("dot-loader").style.display = "none";
            store.isLoading = false;
        };

        const sendMessage = () => {
            const text = newMessage.value?.trim();
            if ((!text && !imageData.value) || !ws.value) return;

            ws.value.send(JSON.stringify({
                event: "privatemessages",
                message: text || "",
                pm_image: imageData.value || ""
            }));

            newMessage.value = "";
            const textarea = document.getElementById('message_textarea');
            if (textarea) textarea.innerText = "";
            
            clearCanvas();
        };

        const handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            imageFile.value = file;
            
            const canvas = document.getElementById(`canvas_${threadId}`);
            if (!canvas) return;
            
            const ctx = canvas.getContext('2d');
            const reader = new FileReader();
            
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    imageData.value = canvas.toDataURL("image/png");
                    
                    canvas.style.width = '90px';
                    canvas.style.height = 'auto';
                    canvas.style.cursor = 'pointer';
                    canvas.style.display = 'block';
                    
                    canvas.onclick = () => {
                        showImage(imageData.value);
                    };
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
        };

        const clearCanvas = () => {
            const canvas = document.getElementById(`canvas_${threadId}`);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = 0;
                canvas.height = 0;
                canvas.style.display = 'none';
            }
            imageData.value = null;
            imageFile.value = null;
            
            const fileInput = document.getElementById(`id_image_${threadId}`);
            if (fileInput) fileInput.value = '';
            
            const clearBtn = document.getElementById("clearCanvas");
            if (clearBtn) clearBtn.style.display = "none";
        };

        const scrollToBottom = () => {
            setTimeout(() => {
                if (messagesContainer.value) {
                    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                }
            }, 100);
        };

        const handleScroll = () => {
            if (store.isLoading || nextPage.value === 'STOP') return;
            
            const container = messagesContainer.value;
            if (container && container.scrollTop <= 30) {
                loadMore();
            }
        };

        const goToPartner = () => router.push('/messages');
        const goToUser = (id) => router.push(`/user/${id}`);
        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const messagesWord = (count) => getNumEnding(count, ['сообщение', 'сообщения', 'сообщений']);
        const formatTime = (ts) => {
            return `${ts.getHours().toString().padStart(2, '0')}:${ts.getMinutes().toString().padStart(2, '0')}:${ts.getSeconds().toString().padStart(2, '0')}`;
        };
        const formatText = (text) => {
            if (!text) return '';
            return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g, '<br />');
        };

        onMounted(() => {
            fetchMessages();
            initChatWebSocket();
            store.page = "chat";
            
            const idx = store.notifications.findIndex(id => String(id) === String(threadId));
            if (idx !== -1) store.notifications.splice(idx, 1);
            
            const container = messagesContainer.value;
            if (container) {
                container.addEventListener('scroll', handleScroll);
            }
        });

        onUnmounted(() => {
            if (ws.value) ws.value.close();
            delete store.wsChats[threadId];
            
            const container = messagesContainer.value;
            if (container) {
                container.removeEventListener('scroll', handleScroll);
            }
        });

        return {
            threadId,
            messages,
            partnerName,
            messagesTotal,
            messagesReceived,
            messagesSent,
            newMessage,
            imageData,
            messagesContainer,
            goToPartner,
            goToUser,
            goToPost,
            showImage,
            messagesWord,
            formatTime,
            formatText,
            sendMessage,
            handleImageUpload,
            clearCanvas
        };
    },
};

// ==================== ДОБАВЛЕНИЕ ПОСТА ====================
const AddPostView = {
    template: `
        <div id="node">
            <div id="UploadArea"></div>
            <form class="message_form" @submit.prevent="submitPost">
                <div class="field-image">
                    <input type="file" id="image_file" @change="handleImageUpload" accept="image/*" style="display:none;">
                    <label for="image_file" class="image_file">ЗАГРУЗКА КАРТИНКИ</label>
                    <canvas v-if="imagePreview" id="canvas_addpost" :width="canvasWidth" :height="canvasHeight" style="display:block; max-width:100%;"></canvas>
                </div>
                <div class="field-text">
                    <textarea id="id_body" v-model="postBody" placeholder="Сообщение..."></textarea>
                </div>
                <button type="submit">ОТПРАВИТЬ</button>
                <div id="UploadBox" style="display:none;"></div>
            </form>
            <div id="clearCanvas" v-if="imagePreview" @click="clearCanvas" style="display:block; background-color:white; cursor:pointer;">Очистить</div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const postBody = ref('');
        const imageData = ref(null);
        const canvasWidth = ref(0);
        const canvasHeight = ref(0);
        const imagePreview = ref(false);
        const fileSize = ref(0);
        const fileName = ref('');
        const currentChunk = ref(1);
        const totalChunks = ref(0);

        const handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            fileName.value = file.name;
            fileSize.value = file.size;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                const img = new Image();
                img.onload = () => {
                    canvasWidth.value = img.width;
                    canvasHeight.value = img.height;
                    imagePreview.value = true;
                    
                    nextTick(() => {
                        const canvas = document.getElementById('canvas_addpost');
                        if (canvas) {
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            imageData.value = canvas.toDataURL('image/png');
                        }
                    });
                };
                img.src = event.target.result;
            };
            reader.readAsDataURL(file);
            
            startUpload(file);
        };

        const startUpload = (file) => {
            const fileSizeMB = fileSize.value / 1000000.0;
            const sizeText = fileSize.value < 1000 
                ? `${fileSize.value} B` 
                : `${fileSizeMB.toFixed(2)} MB`;
            
            const content = `
                <span id='NameArea'>Uploading ${fileName.value}</span>
                <div id='ProgressContainer'><div id='ProgressBar'></div></div>
                <span id='percent'>0%</span>
                <span id='Uploaded'> - <span id='MB'>0</span>/${sizeText}</span>
            `;
            
            document.getElementById('UploadArea').innerHTML = content;
            
            if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                store.wsWall.send(JSON.stringify({
                    event: 'Start',
                    Name: fileName.value,
                    Size: fileSize.value
                }));
            }
            
            totalChunks.value = Math.ceil(fileSize.value / CONFIG.CHUNK_SIZE);
            currentChunk.value = 1;
            
            updateBar(0);
        };

        const updateBar = (percent) => {
            const progressBar = document.getElementById('ProgressBar');
            if (progressBar) progressBar.style.width = percent + '%';
            
            const percentEl = document.getElementById('percent');
            if (percentEl) percentEl.innerHTML = (Math.round(percent * 1000) / 1000) + '%';
        };

        const handleMoreData = () => {
            if (currentChunk.value <= totalChunks.value) {
                const offset = (currentChunk.value - 1) * CONFIG.CHUNK_SIZE;
                const file = document.getElementById('image_file').files[0];
                const currentFilePart = file.slice(offset, offset + CONFIG.CHUNK_SIZE);
                
                const fileReader = new FileReader();
                fileReader.onload = (e) => {
                    updateBar(Math.ceil((currentChunk.value * 100) / totalChunks.value));
                    if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                        store.wsWall.send(JSON.stringify({
                            event: 'Upload',
                            Name: 'more',
                            Data: e.target.result
                        }));
                    }
                    currentChunk.value++;
                };
                fileReader.readAsDataURL(currentFilePart);
            } else {
                if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                    store.wsWall.send(JSON.stringify({ event: 'Done' }));
                }
            }
        };

        const submitPost = () => {
            if (!postBody.value && !imageData.value) return;
            if (store.wsWall && store.wsWall.readyState === WebSocket.OPEN) {
                document.getElementById('block-post').appendChild(document.createElement('div')).id = "loader";
                
                store.wsWall.send(JSON.stringify({
                    event: "wallpost",
                    title: '',
                    body: postBody.value,
                    image: imageData.value || false,
                    arr_keypress: [],
                    all_time_sec: 0,
                    os_info: window.navigator.userAgent
                }));
                
                router.push('/');
            } else {
                alert('WebSocket не подключен');
            }
        };

        const clearCanvas = () => {
            const canvas = document.getElementById('canvas_addpost');
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                canvas.width = 0;
                canvas.height = 0;
            }
            imageData.value = null;
            imagePreview.value = false;
            document.getElementById('image_file').value = '';
            document.getElementById('clearCanvas').style.display = 'none';
        };

        onMounted(() => {
            window.addEventListener('more-data', handleMoreData);
            store.page = "addpost";
        });

        onUnmounted(() => {
            window.removeEventListener('more-data', handleMoreData);
        });

        return {
            postBody,
            canvasWidth,
            canvasHeight,
            imagePreview,
            handleImageUpload,
            submitPost,
            clearCanvas
        };
    },
};

// ==================== МОДАЛЬНОЕ ОКНО ПОСТА ====================
const PostModal = {
    template: `
        <div v-if="isOpen" class="modal-overlay" @click.self="close">
            <div class="modal-container post-modal" :class="'block-post-' + currentPostId">
                <button class="modal-close-btn" @click="close">×</button>
                
                <!-- Навигация между постами -->
                <div class="modal-nav" v-if="hasPrev || hasNext">
                    <button v-if="hasPrev" class="nav-arrow prev" @click="goToPrev" id="back" :disabled="loadingPrev">←</button>
                    <button v-if="hasNext" class="nav-arrow next" @click="goToNext" id="next" :disabled="loadingNext">→</button>
                </div>

                <!-- Контент поста -->
                <div v-if="loading" class="modal-loader">Загрузка...</div>
                <div v-else-if="post" class="post-content">
                    <!-- Шапка с информацией о авторе -->
                    <div class="breadcrumb" style="background:#507299; color:white; padding:10px;">
                        <div class="user" style="display:flex; align-items:center; justify-content:space-between;">
                            <div style="display:flex; align-items:center;">
                                <img :src="post.authorAvatar" class="post-author-avatar" 
                                     @click.stop="goToUser(post.authorId)" 
                                     style="cursor:pointer; width:40px; height:40px; border-radius:50%; margin-right:10px;">
                                <span @click.stop="goToUser(post.authorId)" style="cursor:pointer; font-weight:bold;">
                                    {{ post.authorName }}
                                </span>
                            </div>
                            <span>{{ formatDate(post.date_post) }}</span>
                        </div>
                    </div>

                    <!-- Изображение поста -->
                    <div class="auto-images">
                        <img :src="post.imageUrl" class="post-image" @click="showImage(post.imageUrl)" style="cursor:pointer; max-width:100%;">
                    </div>

                    <!-- Текст поста -->
                    <div class="about" v-if="post.body">
                        <p id="post-text">{{ post.body }}</p>
                    </div>

                    <!-- Действия с постом -->
                    <div class="post-actions" :id="'post_like_block_' + post.id">
                        <img class="icon-like" src="/static/images/mesvF.png" 
                             @click="toggleComments" 
                             :class="{ 'active': commentsOpen }"
                             :id="'comment_image_id_' + post.id"
                             style="cursor:pointer;">
                        <img class="icon-like" :src="post.liked ? CONFIG.LIKE_GIF : CONFIG.LIKE_PNG" 
                             @click="toggleLike"
                             :id="'post_image_' + post.id"
                             style="cursor:pointer;">
                        <img class="icon-like" :src="post.reposted ? CONFIG.RP_OPEN : CONFIG.RP_CLOSED" 
                             @click="toggleRepost"
                             style="cursor:pointer;">
                    </div>

                    <!-- Комментарии -->
                    <div v-if="commentsOpen" :id="'box-com-' + post.id" class="box-com" style="display:block;">
                        <Comments :postId="post.id" />
                    </div>
                </div>
                
                <!-- Индикатор загрузки при подгрузке -->
                <div v-if="loadingPrev || loadingNext" class="modal-loader-bottom" style="text-align:center; padding:10px;">
                    Загрузка постов...
                </div>
            </div>
        </div>
    `,
    components: { Comments },
    setup() {
        const router = useRouter();
        const isOpen = ref(false);
        const currentPostId = ref(null);
        const post = ref(null);
        const loading = ref(false);
        const loadingPrev = ref(false);
        const loadingNext = ref(false);
        const commentsOpen = ref(false);
        
        // Хранилище всех загруженных постов с полными данными
        const loadedPosts = ref([]); // Массив объектов постов в порядке от новых к старым
        const currentIndex = ref(-1);
        const currentPage = ref(1);
        const hasNextPage = ref(true);
        const isLoadingMore = ref(false);
        
        const hasPrev = computed(() => currentIndex.value < loadedPosts.value.length - 1 || hasNextPage.value);
        const hasNext = computed(() => currentIndex.value > 0);

        const open = async (postId) => {
            console.log('Opening post modal:', postId);
            currentPostId.value = postId;
            isOpen.value = true;
            store.modalOpen = true;
            document.body.style.overflow = 'hidden';
            
            // Сбрасываем состояние
            loadedPosts.value = [];
            currentPage.value = 1;
            hasNextPage.value = true;
            
            await findAndLoadPost(postId);
            
            // Устанавливаем класс как в оригинале
            const blockPost = document.querySelector('.post-modal');
            if (blockPost) {
                blockPost.setAttribute('atr', 'con');
            }
        };

        const close = () => {
            isOpen.value = false;
            currentPostId.value = null;
            post.value = null;
            loadedPosts.value = [];
            commentsOpen.value = false;
            store.modalOpen = false;
            document.body.style.overflow = 'auto';
        };

        // Поиск и загрузка поста
        const findAndLoadPost = async (postId) => {
            loading.value = true;
            
            try {
                // Сначала загружаем первую страницу
                await loadPostsPage(1);
                
                // Ищем пост в загруженных
                const index = loadedPosts.value.findIndex(p => p.id == postId);
                
                if (index !== -1) {
                    // Пост найден
                    currentIndex.value = index;
                    post.value = loadedPosts.value[index];
                } else {
                    // Пост не найден на первой странице - загружаем следующие страницы
                    let page = 2;
                    let found = false;
                    
                    while (hasNextPage.value && !found) {
                        await loadPostsPage(page);
                        
                        const newIndex = loadedPosts.value.findIndex(p => p.id == postId);
                        if (newIndex !== -1) {
                            found = true;
                            currentIndex.value = newIndex;
                            post.value = loadedPosts.value[newIndex];
                        }
                        
                        page++;
                    }
                    
                    if (!found) {
                        console.error('Post not found:', postId);
                        close();
                    }
                }
            } catch (error) {
                console.error('Error finding post:', error);
            } finally {
                loading.value = false;
            }
        };

        // Загрузка страницы постов
        const loadPostsPage = async (page) => {
            if (isLoadingMore.value) return;
            
            isLoadingMore.value = true;
            
            try {
                const response = await axios.get(`/api/posts/?page=${page}`);
                
                // Форматируем посты
                const newPosts = response.data.results.map(p => formatPostData(p));
                
                // Добавляем в конец массива (более старые посты)
                loadedPosts.value = [...loadedPosts.value, ...newPosts];
                
                // Проверяем, есть ли следующая страница
                hasNextPage.value = !!response.data.next;
                currentPage.value = page;
                
                console.log(`Loaded page ${page}, total posts: ${loadedPosts.value.length}`);
            } catch (error) {
                console.error('Error loading posts page:', error);
                hasNextPage.value = false;
            } finally {
                isLoadingMore.value = false;
            }
        };

        // Форматирование данных поста
        const formatPostData = (postData) => ({
            id: postData.id,
            authorId: postData.author?.id,
            authorName: postData.author?.username || 'Anonymous',
            authorAvatar: getAvatarSrc(postData.author?.image_user, postData.author?.path_data),
            body: postData.body,
            image: postData.image,
            path_data: postData.path_data,
            imageUrl: postData.image ? `/media/data_image/${postData.path_data}/${postData.image}` : CONFIG.NO_IMAGE,
            liked: postData.likes?.includes(store.user?.id),
            reposted: postData.relike?.includes(store.user?.id),
            date_post: new Date(postData.date_post),
            likes: postData.likes || [],
            relike: postData.relike || []
        });

        // Переход к предыдущему (более старому) посту
        const goToPrev = async () => {
            if (loadingPrev.value) return;
            
            // Если текущий пост не последний в загруженных
            if (currentIndex.value < loadedPosts.value.length - 1) {
                currentIndex.value++;
                post.value = loadedPosts.value[currentIndex.value];
                currentPostId.value = post.value.id;
                commentsOpen.value = false;
                return;
            }
            
            // Если есть следующая страница для загрузки
            if (hasNextPage.value) {
                loadingPrev.value = true;
                
                try {
                    // Загружаем следующую страницу
                    await loadPostsPage(currentPage.value + 1);
                    
                    // Переходим к первому посту с новой страницы
                    if (loadedPosts.value.length > currentIndex.value + 1) {
                        currentIndex.value++;
                        post.value = loadedPosts.value[currentIndex.value];
                        currentPostId.value = post.value.id;
                        commentsOpen.value = false;
                    }
                } catch (error) {
                    console.error('Error loading more posts:', error);
                } finally {
                    loadingPrev.value = false;
                }
            }
        };

        // Переход к следующему (более новому) посту
        const goToNext = async () => {
            if (loadingNext.value) return;
            
            if (currentIndex.value > 0) {
                currentIndex.value--;
                post.value = loadedPosts.value[currentIndex.value];
                currentPostId.value = post.value.id;
                commentsOpen.value = false;
            } else {
                // Достигнут самый новый пост
                console.log('Already at the newest post');
                // Можно показать уведомление
            }
        };

        const toggleComments = () => {
            commentsOpen.value = !commentsOpen.value;
        };

        const toggleLike = async () => {
            if (!store.user || !post.value) return;
            
            try {
                await axios.post(`/api/posts/${post.value.id}/like/`);
                
                // Обновляем состояние в текущем посте
                post.value.liked = !post.value.liked;
                
                // Обновляем состояние в массиве loadedPosts
                const index = loadedPosts.value.findIndex(p => p.id === post.value.id);
                if (index !== -1) {
                    loadedPosts.value[index].liked = post.value.liked;
                }
            } catch (error) {
                console.error('Error toggling like:', error);
            }
        };

        const toggleRepost = async () => {
            if (!store.user || !post.value) return;
            
            try {
                await axios.post(`/api/posts/${post.value.id}/repost/`);
                
                // Обновляем состояние в текущем посте
                post.value.reposted = !post.value.reposted;
                
                // Обновляем состояние в массиве loadedPosts
                const index = loadedPosts.value.findIndex(p => p.id === post.value.id);
                if (index !== -1) {
                    loadedPosts.value[index].reposted = post.value.reposted;
                }
            } catch (error) {
                console.error('Error toggling repost:', error);
            }
        };

        const goToUser = (userId) => {
            close();
            router.push(`/user/${userId}`);
        };

        const showImage = (url) => {
            window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        };

        const formatDate = (ts) => {
            return ts.toLocaleString();
        };

        onMounted(() => {
            window.addEventListener('open-post-modal', (e) => open(e.detail));
            window.addEventListener('close-modal', close);
        });

        onUnmounted(() => {
            window.removeEventListener('open-post-modal', open);
            window.removeEventListener('close-modal', close);
        });

        return {
            isOpen,
            post,
            loading,
            loadingPrev,
            loadingNext,
            commentsOpen,
            currentPostId,
            hasPrev,
            hasNext,
            CONFIG,
            close,
            goToPrev,
            goToNext,
            toggleComments,
            toggleLike,
            toggleRepost,
            goToUser,
            showImage,
            formatDate
        };
    },
};

// ==================== МОДАЛЬНОЕ ОКНО ДРУЗЕЙ ====================
const FriendsModal = {
    template: `
        <div v-if="isOpen" class="modal-overlay" @click.self="close">
            <div class="modal-container friends-modal">
                <button class="modal-close-btn" @click="close">×</button>
                <div class="friends-content" ref="content">
                    <div v-for="user in users" :key="user.id" class="fr-cell" @click="goToUser(user.id)" style="cursor:pointer;">
                        <a style="color:#ffffff">
                            <img :src="user.avatarUrl" style="width:180px; height:180px;">
                            {{ truncate(user.username) }}
                        </a>
                    </div>
                </div>
                <div v-if="loading" id="loader" style="display:block;">Загрузка...</div>
                <div id="IOP2" style="display:none;">{{ nextPage }}</div>
            </div>
        </div>
    `,
    props: ['type'], // 'friends', 'followers', 'following', 'liked'
    setup(props) {
        const router = useRouter();
        const isOpen = ref(false);
        const userId = ref(null);
        const users = ref([]);
        const nextPage = ref(1);
        const loading = ref(false);
        const content = ref(null);

        const open = async (id) => {
            userId.value = id;
            isOpen.value = true;
            store.modalOpen = true;
            document.body.style.overflow = 'hidden';
            await loadUsers(1);
        };

        const close = () => {
            isOpen.value = false;
            userId.value = null;
            users.value = [];
            nextPage.value = 1;
            store.modalOpen = false;
            document.body.style.overflow = 'auto';
        };

        const loadUsers = async (page = 1) => {
            if (page === 'STOP' || loading.value) return;
            loading.value = true;
            
            try {
                let url;
                switch (props.type) {
                    case 'friends':
                        url = `/api/users/${userId.value}/friends/?page=${page}`;
                        break;
                    case 'followers':
                        url = `/api/users/${userId.value}/followers/?page=${page}`;
                        break;
                    case 'following':
                        url = `/api/users/${userId.value}/following/?page=${page}`;
                        break;
                    case 'liked':
                        url = `/api/users/${userId.value}/liked-posts/?page=${page}`;
                        break;
                }
                
                const res = await axios.get(url);
                const newUsers = res.data.results.map(u => ({
                    ...u,
                    avatarUrl: getAvatarSrc(u.image_user, u.path_data),
                    username: u.username
                }));
                users.value = page === 1 ? newUsers : [...users.value, ...newUsers];
                nextPage.value = res.data.next ? page + 1 : 'STOP';
            } finally {
                loading.value = false;
            }
        };

        const handleScroll = () => {
            if (loading.value || nextPage.value === 'STOP' || !content.value) return;
            
            const { scrollTop, scrollHeight, clientHeight } = content.value;
            if (scrollHeight - scrollTop - clientHeight < 100) {
                loadUsers(nextPage.value);
            }
        };

        const goToUser = (id) => {
            close();
            router.push(`/user/${id}`);
        };

        const truncate = (name) => truncateUsername(name, 10);

        onMounted(() => {
            const eventName = `open-${props.type}-modal`;
            window.addEventListener(eventName, (e) => open(e.detail));
            
            if (content.value) {
                content.value.addEventListener('scroll', handleScroll);
            }
        });

        onUnmounted(() => {
            const eventName = `open-${props.type}-modal`;
            window.removeEventListener(eventName, open);
            
            if (content.value) {
                content.value.removeEventListener('scroll', handleScroll);
            }
        });

        return {
            isOpen,
            users,
            nextPage,
            loading,
            content,
            close,
            goToUser,
            truncate
        };
    }
};

// ==================== ЛОГИН ====================
const LoginView = {
    template: `
        <div class="auth-form">
            <h2>Вход</h2>
            <form @submit.prevent="login">
                <input type="text" v-model="username" placeholder="Имя пользователя" required>
                <input type="password" v-model="password" placeholder="Пароль" required>
                <button type="submit">Войти</button>
            </form>
            <p>Нет аккаунта? <a @click="goToRegister" style="cursor:pointer;">Зарегистрироваться</a></p>
        </div>
    `,
    setup() {
        const router = useRouter();
        const username = ref('');
        const password = ref('');

        const login = async () => {
            try {
                const formData = new FormData();
                formData.append('username', username.value);
                formData.append('password', password.value);
                
                await axios.post('/login/', formData);
                const userRes = await axios.get('/api/profile/');
                store.user = userRes.data;
                router.push('/');
            } catch (error) {
                alert('Ошибка входа');
            }
        };

        const goToRegister = () => router.push('/register');

        return { username, password, login, goToRegister };
    },
};

// ==================== РЕГИСТРАЦИЯ ====================
const RegisterView = {
    template: `
        <div class="auth-form">
            <h2>Регистрация</h2>
            <form @submit.prevent="register">
                <input type="text" v-model="username" placeholder="Имя пользователя" required>
                <input type="password" v-model="password1" placeholder="Пароль" required>
                <input type="password" v-model="password2" placeholder="Подтверждение пароля" required>
                <button type="submit">Зарегистрироваться</button>
            </form>
            <p>Уже есть аккаунт? <a @click="goToLogin" style="cursor:pointer;">Войти</a></p>
        </div>
    `,
    setup() {
        const router = useRouter();
        const username = ref('');
        const password1 = ref('');
        const password2 = ref('');

        const register = async () => {
            if (password1.value !== password2.value) {
                alert('Пароли не совпадают');
                return;
            }
            try {
                const formData = new FormData();
                formData.append('username', username.value);
                formData.append('password1', password1.value);
                formData.append('password2', password2.value);
                
                await axios.post('/register/', formData);
                router.push('/login');
            } catch (error) {
                alert('Ошибка регистрации');
            }
        };

        const goToLogin = () => router.push('/login');

        return { username, password1, password2, register, goToLogin };
    },
};

// ==================== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ====================
const ProfileEditView = {
    template: `
        <div class="profile-edit">
            <h2>Редактирование профиля</h2>
            <form @submit.prevent="saveProfile">
                <div class="avatar-upload">
                    <img :src="avatarPreview" class="avatar-preview" id="image-user-profile" style="max-width:200px;">
                    <input type="file" id="id_image_profile" @change="handleAvatarUpload" accept="image/*">
                    <label for="id_image_profile" class="image_file">Загрузить аватар</label>
                </div>
                <input type="color" v-model="color" placeholder="Цвет имени">
                <button type="submit">Сохранить</button>
            </form>
            <div id="color-picker" class="cp-default"></div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const avatarFile = ref(null);
        const avatarPreview = ref(store.user?.avatar_url || CONFIG.DEFAULT_AVATAR);
        const color = ref(store.user?.color || '#000000');

        const handleAvatarUpload = (e) => {
            const file = e.target.files[0];
            if (file) {
                avatarFile.value = file;
                const reader = new FileReader();
                reader.onload = (e) => {
                    avatarPreview.value = e.target.result;
                };
                reader.readAsDataURL(file);
            }
        };

        const saveProfile = async () => {
            try {
                const formData = new FormData();
                if (avatarFile.value) {
                    formData.append('avatar', avatarFile.value);
                }
                formData.append('color', color.value);
                
                await axios.put('/api/profile/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                const userRes = await axios.get('/api/profile/');
                store.user = userRes.data;
                router.push(`/user/${store.user.id}`);
            } catch (error) {
                alert('Ошибка сохранения');
            }
        };

        return { avatarPreview, color, handleAvatarUpload, saveProfile };
    },
};

// ==================== ШАПКА ====================
const AppHeader = {
    template: `
        <div id="header" :style="headerStyle">
            <div class="butNav" id="butMen" v-if="user" :style="{ display: menuOpen ? 'block' : 'none' }">
                <a @click="goToAddPost" id="addPost" style="cursor:pointer;"></a>
                <a @click="goToUsers" id="userA" style="cursor:pointer;"></a>
                <img src="/static/images/mesv4.png" @click="goToMessages" id="mespr" style="cursor:pointer;">
                <div id="notification-nav" class="notification" @click="goToMessages" v-if="hasNotifications" style="cursor:pointer;">!</div>
                <img :src="userAvatar" @click="goToProfile" class="usPr" :client-id-user="user?.id" style="cursor:pointer;" />
            </div>
            <div id="logo">
                <img src="/static/images/compasv3.png" class="compas" @click="toggleMenu" id="comps" :open-atr="menuOpen ? 'open' : 'close'" style="cursor:pointer;">
                <a href="/" class="aLogo">СООБЩЕСТВО <img class="logoF" src="/static/images/famaly_logo.png"></a>
                <img v-if="user" src="/static/images/EXITv1.png" @click="logout" class="enter" style="cursor:pointer;">
                <img v-else src="/static/images/EXITv4png.png" @click="goToLogin" class="enter" id="enter" style="cursor:pointer;">
            </div>
        </div>
        <div id="search-box" v-if="$route.name !== 'messages' && $route.name !== 'chat'" style="display:block;">
            <form class="search-bar" @submit.prevent="search">
                <div class="autocomplete">
                    <input id="search-input" type="search" v-model="searchQuery" placeholder="Поиск" required>
                    <button class="search" type="submit">Найти</button>
                </div>
            </form>
            <div class="us-block" id="search-results"></div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const menuOpen = ref(false);
        const searchQuery = ref('');
        const user = computed(() => store.user);
        const hasNotifications = computed(() => store.notifications.length > 0);

        const userAvatar = computed(() => {
            if (user.value) {
                return getAvatarSrc(user.value.image_user, user.value.path_data);
            }
            return CONFIG.DEFAULT_AVATAR;
        });

        const headerStyle = computed(() => {
            return user.value ? { backgroundSize: 'contain', display: 'block' } : { backgroundColor: '#507299' };
        });

        const toggleMenu = () => { 
            menuOpen.value = !menuOpen.value; 
        };
        
        const goToProfile = () => { router.push(`/user/${user.value.id}`); };
        const goToAddPost = () => { router.push('/addpost'); };
        const goToUsers = () => { router.push('/users'); };
        const goToMessages = () => { router.push('/messages'); };
        const goToLogin = () => { router.push('/login'); };
        
        const logout = async () => {
            await axios.get('/logout');
            store.user = null;
            router.push('/login');
        };
        
        const search = () => {
            if (searchQuery.value && store.wsWall) {
                store.wsWall.send(JSON.stringify({ event: 'search', data: searchQuery.value }));
            }
        };

        const handleSearchResults = (data) => {
            const results = data.answer_search || [];
            const usBlock = document.getElementById('search-results');
            if (!usBlock) return;
            
            usBlock.innerHTML = '';
            
            results.forEach(item => {
                try {
                    const search_data = JSON.parse(item);
                    const avatarHTML = getAvatarSrc(search_data.image_user, search_data.path_data);
                    const username = truncateUsername(search_data.username, 10);
                    
                    const div = document.createElement('div');
                    div.className = 'views-row';
                    div.onclick = () => router.push(`/user/${search_data.pk}`);
                    div.style.cursor = 'pointer';
                    
                    div.innerHTML = `
                        <div class="user-image"><img src="${avatarHTML}" style="width:30px; height:30px;"></div>
                        <div class="user-name"><a id="user-link">${username}</a></div>
                    `;
                    
                    usBlock.appendChild(div);
                } catch(e) {
                    console.error(e);
                }
            });
        };

        onMounted(() => {
            window.addEventListener('search-results', (e) => handleSearchResults(e.detail));
        });

        onUnmounted(() => {
            window.removeEventListener('search-results', handleSearchResults);
        });

        return {
            menuOpen,
            searchQuery,
            user,
            hasNotifications,
            userAvatar,
            headerStyle,
            toggleMenu,
            goToProfile,
            goToAddPost,
            goToUsers,
            goToMessages,
            goToLogin,
            logout,
            search
        };
    },
};

// ==================== РОУТИНГ ====================
const routes = [
    { path: '/', component: WallPostsView, name: 'wall' },
    { path: '/users', component: UsersView, name: 'users' },
    { path: '/user/:id', component: UserProfileView, name: 'user' },
    { path: '/messages', component: PrivateMessagesView, name: 'messages' },
    { path: '/messages/chat/:id', component: ChatView, name: 'chat' },
    { path: '/addpost', component: AddPostView, name: 'addpost' },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/register', component: RegisterView, name: 'register' },
    { path: '/profile', component: ProfileEditView, name: 'profile' }
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// ==================== ГЛАВНОЕ ПРИЛОЖЕНИЕ ====================
const App = {
    components: { 
        AppHeader, 
        ImageModal, 
        TopButton, 
        PostModal,
        FriendsModal 
    },
    template: `
        <div>
            <AppHeader />
            <router-view />
            <ImageModal />
            <PostModal />
            <FriendsModal type="friends" />
            <FriendsModal type="followers" />
            <FriendsModal type="following" />
            <FriendsModal type="liked" />
            <TopButton /> 
        </div>
    `,
    setup() {
        onMounted(async () => {
            try {
                const res = await axios.get('/api/profile/');
                store.user = res.data;
            } catch (e) {
                store.user = null;
            }
            initWallWebSocket();
            
            // Инициализация как в оригинале
            const topbt = document.getElementById('topbt');
            if (topbt) topbt.style.display = "none";
            
            // Обработка popstate
            window.addEventListener("popstate", (e) => {
                const state = e.state || { view: "wallpost" };
                console.log("popstate:", state, store.page);
                
                if (state.view === "wallpost" && state.view === store.page) {
                    // handler("o") из оригинала
                    window.dispatchEvent(new CustomEvent('close-modal'));
                } else {
                    router.push(state.link || '/');
                }
            });
        });
        
        return { store };
    },
};

// ==================== СОЗДАНИЕ ПРИЛОЖЕНИЯ ====================
const app = createApp(App);
app.use(router);
app.mount('#app');

// Экспорт глобальных функций для совместимости
window.main_page = () => router.push('/');
window.users = () => router.push('/users');
window.quit = async () => {
    await axios.get('/logout');
    store.user = null;
    router.push('/login');
};
window.enter = () => router.push('/login');
window.addREG = () => router.push('/register');
window.userPROFILE = (id) => router.push(`/user/${id}`);
window.privatMES = () => router.push('/messages');
window.mesID = (id) => router.push(`/messages/chat/${id}`);
window.addPost = () => router.push('/addpost');
window.showImg = (img) => window.dispatchEvent(new CustomEvent('show-image', { detail: img.src }));
window.showContent = (id) => window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
window.getCookie = getCookie;
window.getCSRFToken = getCSRFToken;
window.getNumEnding = getNumEnding;
window.truncateUsername = truncateUsername;
