// ==================== ИНИЦИАЛИЗАЦИЯ ====================
const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted } = Vue;
const { createRouter, createWebHistory, useRoute, useRouter } = VueRouter;

// Конфигурация
const CONFIG = {
    WS_PROTOCOL: 'ws://',
    DEFAULT_AVATAR: '/static/images/oneProf.png',
    NO_IMAGE: '/static/images/no_image.png',
    LIKE_GIF: '/static/images/frv1.gif',
    LIKE_PNG: '/static/images/frv1.png',
    RP_OPEN: '/static/images/close3.png',
    RP_CLOSED: '/static/images/rpvF.png',
    ED_PROF_OPEN: '/static/images/close3.png',
    ED_PROF_CLOSED: '/static/images/edprof.png',
};

// Получение CSRF-токена из cookie
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

const csrftoken = getCookie('csrftoken');

// Настройка axios
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.headers.common['X-CSRFToken'] = csrftoken;

// ==================== ГЛОБАЛЬНОЕ СОСТОЯНИЕ (STORE) ====================
const store = reactive({
    user: null,
    notifications: [],
    wsWall: null,
    wsChats: {},
    countries: [],
    modalOpen: false,
});

// ==================== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ====================
function truncateUsername(username, maxLength = 15) {
    if (!username) return '';
    return username.length > maxLength ? username.slice(0, maxLength - 3) + '...' : username;
}

function getNumEnding(number, endings) {
    number %= 100;
    if (number >= 11 && number <= 19) return endings[2];
    const i = number % 10;
    if (i === 1) return endings[0];
    if (i >= 2 && i <= 4) return endings[1];
    return endings[2];
}

// ==================== WEB SOCKET (СТЕНА) ====================
function initWallWebSocket() {
    console.log("initWallWebSocket.........")
    const host = window.location.hostname;
    const port = '8888';
    store.wsWall = new WebSocket(`${CONFIG.WS_PROTOCOL}${host}:${port}/`);

    store.wsWall.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWallMessage(data);
    };

    store.wsWall.onclose = () => {
        setTimeout(initWallWebSocket, 5000);
    };

    store.wsWall.onerror = (err) => {
        console.error('Wall WebSocket error', err);
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
            if (store.user && store.user.username !== data.sender) {
                store.notifications.push(data.thread_id);
            }
            break;
        case 'autocomplete':
            store.countries = data.answer_autocomplete || [];
            break;
        case 'search':
            window.dispatchEvent(new CustomEvent('search-results', { detail: data }));
            break;
    }
}

// ==================== МОДАЛЬНОЕ ОКНО ДЛЯ ИЗОБРАЖЕНИЙ ====================
const ImageModal = {
    template: `
        <div v-if="isOpen" class="modal-overlay" @click.self="close">
            <div class="modal-container">
                <img :src="imageUrl" class="modal-image" @click.stop>
                <button class="modal-close-btn" @click.stop="close">×</button>
            </div>
        </div>
    `,
    setup() {
        const imageUrl = ref(null);
        const isOpen = ref(false);
        
        const open = (url) => {
            console.log('Opening modal with:', url);
            imageUrl.value = url;
            isOpen.value = true;
            store.modalOpen = true;
            document.body.style.overflow = 'hidden'; // Блокируем прокрутку
        };
        
        const close = () => {
            isOpen.value = false;
            imageUrl.value = null;
            store.modalOpen = false;
            document.body.style.overflow = 'auto'; // Возвращаем прокрутку
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

        return { imageUrl, isOpen, close };
    },
};

// ==================== КОММЕНТАРИИ ====================
const Comments = {
    props: ['postId'],
    template: `
        <div>
            <a v-if="hasNext" class="see_more_button" @click="loadMore">Показать следующие комментарии</a>
            <div :id="'field-comment_' + postId">
                <div v-for="comment in comments" :key="comment.id" class="f-c">
                    <img :src="comment.authorAvatar" class="imgUs" @click="goToUser(comment.author.id)">
                    <a @click="goToUser(comment.author.id)" id="user-comment">{{ comment.author.username }}</a>
                    <p id="comment-text">{{ comment.comment_text }}</p>
                    <img v-if="comment.comment_image" :src="comment.image_url" @click="showImage(comment.image_url)" style="max-width:200px;">
                    <div id="time-comment">{{ formatDate(comment.timecomment) }}</div>
                    <div v-if="canDelete(comment)" class="delete-pm" @click="deleteComment(comment.id)"></div>
                </div>
            </div>
            <div class="compose">
                <div :id="'comment_text_' + postId"
                     class="message_textarea"
                     contenteditable="true"
                     placeholder="Напишите комментарий..."
                     @keydown.enter.prevent="sendComment"
                     ref="commentInput"></div>
                <button @click="sendComment">ОТПРАВИТЬ</button>
            </div>
        </div>
    `,
    setup(props) {
        const router = useRouter();
        const comments = ref([]);
        const nextPage = ref(1);
        const hasNext = ref(false);
        const commentInput = ref(null);
        const commentImage = ref(null);
        const commentImageData = ref(null);

        const loadComments = async (page = 1) => {
            const response = await axios.get(`/api/comments/?post=${props.postId}&page=${page}`);
            const newComments = response.data.results.map(c => ({
                ...c,
                authorAvatar: c.author?.avatar_url || CONFIG.DEFAULT_AVATAR,
            }));
            comments.value = page === 1 ? newComments : [...comments.value, ...newComments];
            hasNext.value = !!response.data.next;
            nextPage.value = page + 1;
        };

        const loadMore = () => {
            if (hasNext.value) loadComments(nextPage.value);
        };
        
        const handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (event) => {
                commentImageData.value = event.target.result; // dataURL
            };
            reader.readAsDataURL(file);
        };

        const sendComment = async () => {
            const text = commentInput.value?.innerText?.trim();
            if (!text && !commentImageData.value) return;

            const formData = new FormData();
            formData.append('comment_text', text);
            formData.append('post', props.postId);
            if (commentImageData.value) {
                // Преобразуем dataURL в blob
                const blob = await fetch(commentImageData.value).then(r => r.blob());
                formData.append('comment_image', blob, 'comment.png');
            }

            await axios.post('/api/comments/', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            commentInput.value.innerText = '';
            commentImageData.value = null;
            commentImage.value = null;
            loadComments(1);
        };

        const deleteComment = async (commentId) => {
            await axios.delete(`/api/comments/${commentId}/`);
            comments.value = comments.value.filter(c => c.id !== commentId);
        };

        const canDelete = (comment) => store.user && comment.author?.id === store.user.id;
        const goToUser = (id) => router.push(`/user/${id}`);
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const formatDate = (ts) => new Date(ts).toLocaleString();

        onMounted(() => loadComments(1));

        return {
            comments,
            hasNext,
            commentInput,
            loadMore,
            sendComment,
            deleteComment,
            canDelete,
            goToUser,
            showImage,
            formatDate,
        };
    },
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
                    <div v-for="post in posts" :key="post.id" class="message" @mouseover="getIndex(post.id, $event)">
                        <div class="views-title" style="width:100%;float:left;">
                            <div class="user-cord">
                                <img :src="post.authorAvatar" class="imgUs" loading="lazy">
                                <a class="postview" @click="goToPost(post.id)">
                                    <span style="font-weight:bolder;">{{ truncate(post.authorName) }}</span>
                                    <span v-if="post.body" class="arrow"> → </span>
                                    <span class="message-title">{{ truncate(post.body, 20) }}</span>
                                </a>
                            </div>
                            <span class="datetime">{{ formatTime(post.date_post) }}</span>
                        </div>
                        <div class="field-image" :atribut="post.id">
                            <img :src="post.imageUrl" height="auto" width="auto" class="wallpost" @click="showImage(post.imageUrl)">
                        </div>
                        <div id="body-post-wall">
                            <div :id="'post_like_block_' + post.id" style="width:100%">
                                <img class="icon-like" src="/static/images/mesvF.png" @click="toggleComments(post.id)" :open-atr="commentOpen[post.id] ? 'open' : 'close'" :id-comment="post.id">
                                <img class="icon-like" :id="'post_image_' + post.id" :src="post.liked ? CONFIG.LIKE_GIF : CONFIG.LIKE_PNG" @click="toggleLike(post)">
                                <img class="icon-like" :src="post.reposted ? CONFIG.RP_OPEN : CONFIG.RP_CLOSED" @click="toggleRepost(post)">
                            </div>
                            <div v-if="commentOpen[post.id]" :id="'box-com-' + post.id" class="box-com">
                                <Comments :postId="post.id" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div v-if="loading" class="loader">Загрузка...</div>
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
            if (page === 'STOP') return;
            loading.value = true;
            try {
                const response = await axios.get(`/api/posts/?page=${page}`);
                const newPosts = response.data.results.map(formatPost);
                posts.value = page === 1 ? newPosts : [...posts.value, ...newPosts];
                nextPage.value = response.data.next ? page + 1 : 'STOP';
            } finally {
                loading.value = false;
            }
        };

        const formatPost = (post) => {
            const formatted = {
                ...post,
                authorName: post.author?.username || 'Anonymous',
                authorAvatar: post.author?.avatar_url || CONFIG.DEFAULT_AVATAR,
                imageUrl: post.image_url || CONFIG.NO_IMAGE,
                liked: post.likes?.includes(store.user?.id),
                reposted: post.relike?.includes(store.user?.id),
            };
            console.log('!!!!!!!formatted post:', formatted);
            return formatted;
        };

        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        const truncate = (text, max = 15) => truncateUsername(text, max);
        const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));

        const toggleLike = async (post) => {
            if (!store.user) return;
            await axios.post(`/api/posts/${post.id}/like/`);
            post.liked = !post.liked;
        };

        const toggleRepost = async (post) => {
            if (!store.user) return;
            await axios.post(`/api/posts/${post.id}/repost/`);
            post.reposted = !post.reposted;
        };

        const toggleComments = (postId) => {
            commentOpen[postId] = !commentOpen[postId];
        };

        const getIndex = () => {};

        onMounted(() => {
            loadPosts(1);
            window.addEventListener('new-wall-post', (e) => {
                console.log('new-wall-post received:', e.detail)
                const newPost = formatPost(e.detail);
                posts.value.unshift(newPost);
            });
            window.addEventListener('delete-wall-post', (e) => {
                const index = posts.value.findIndex(p => p.id === e.detail.post_id);
                if (index !== -1) posts.value.splice(index, 1);
            });
            loadPosts(1);
        });

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const visibleHeight = window.innerHeight;
            const totalHeight = document.documentElement.scrollHeight;
            if (totalHeight - (scrollY + visibleHeight) < 200 && !loading.value && nextPage.value !== 'STOP') {
                loadPosts(nextPage.value);
            }
        };
        onMounted(() => window.addEventListener('scroll', handleScroll));
        onUnmounted(() => window.removeEventListener('scroll', handleScroll));

        return {
            posts,
            nextPage,
            loading,
            commentOpen,
            CONFIG,
            goToPost,
            truncate,
            formatTime,
            toggleLike,
            toggleRepost,
            toggleComments,
            getIndex,
            showImage,
        };
    },
};

// ==================== КНОПКА TOPBT ====================
const TopButton = {
    template: `
        <img v-if="visible"
             src="/static/images/topv1.png"
             class="topbt"
             :style="buttonStyle"
             @click="handleClick"
        />
    `,
    setup() {
        const visible = ref(false);
        const direction = ref('up');        // 'up' – прокрутить вверх, 'down' – вниз
        const savedScrollY = ref(0);         // сохранённая позиция для возврата
        const route = useRoute();

        // Проверка наличия прокрутки
        const hasScroll = () => document.documentElement.scrollHeight > window.innerHeight;

        // Обновление направления на основе текущей позиции и маршрута
        const updateDirection = () => {
            const scrollY = window.scrollY;
            const winHeight = window.innerHeight;
            const docHeight = document.documentElement.scrollHeight;
            const scrollPercent = (scrollY / (docHeight - winHeight)) * 100;

            if (route.name === 'chat') {
                // В чате: вверху → вниз, внизу → вверх
                if (scrollY <= 30) direction.value = 'down';
                else if (scrollPercent >= 80) direction.value = 'up';
                else direction.value = null;
            } else {
                // На обычных страницах: у верхней границы → вниз, у нижней → вверх
                if (scrollY <= 100) direction.value = 'down';
                else if (scrollPercent >= 80) direction.value = 'up';
                else direction.value = null;
            }
        };

        // Видимость кнопки: если есть прокрутка и мы в крайней позиции
        const shouldShow = () => hasScroll() && direction.value !== null;

        // Обработчик скролла с throttling
        let ticking = false;
        const onScroll = () => {
            if (!ticking) {
                requestAnimationFrame(() => {
                    updateDirection();
                    visible.value = shouldShow() && !store.modalOpen; // скрываем, если открыта модалка
                    ticking = false;
                });
                ticking = true;
            }
        };

        // Поворот кнопки: если открыта модалка – 90°, иначе зависит от направления
        const buttonStyle = computed(() => {
            if (store.modalOpen) {
                return { transform: 'rotate(90deg)' };
            }
            const rotate = direction.value === 'down' ? 'rotate(180deg)' : 'rotate(0deg)';
            return { transform: rotate };
        });

        // Обработка клика
        const handleClick = () => {
            // Если открыта модалка – закрываем её
            if (store.modalOpen) {
                window.dispatchEvent(new CustomEvent('close-modal')); // модалка сама подпишется
                store.modalOpen = false;
                updateDirection();
                visible.value = shouldShow();
                return;
            }

            if (direction.value === 'up') {
                // Прокрутка вверх
                if (route.name === 'chat') {
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } else {
                    savedScrollY.value = window.scrollY;
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else if (direction.value === 'down') {
                // Прокрутка вниз
                if (route.name === 'chat') {
                    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                } else {
                    if (savedScrollY.value > 0) {
                        window.scrollTo({ top: savedScrollY.value, behavior: 'smooth' });
                        savedScrollY.value = 0;
                    } else {
                        window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
                    }
                }
            }
        };

        onMounted(() => {
            window.addEventListener('scroll', onScroll);
            updateDirection();
            visible.value = shouldShow();

            // Слушаем закрытие модалки через событие (если нужно обновить видимость)
            window.addEventListener('close-modal', () => {
                store.modalOpen = false;
                updateDirection();
                visible.value = shouldShow();
            });
        });

        onUnmounted(() => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('close-modal', () => {});
        });

        // При смене маршрута пересчитываем
        watch(() => route.name, () => {
            updateDirection();
            visible.value = shouldShow();
        });

        return { visible, buttonStyle, handleClick };
    }
};

// ==================== ПОЛЬЗОВАТЕЛИ ====================
const UsersView = {
    template: `
        <div>
            <div id="pages" style="display:none;">
                <span id="IOP">{{ nextPage }}</span>
            </div>
            <div v-if="store.user" id="filter-users-page">
                <a @click="showFriends">друзья {{ store.user.total_friends }}</a>
            </div>
            <div class="us-block" id="user-content-block" atr="users">
                <div v-for="user in usersList" :key="user.id" class="views-row" @click="goToUser(user.id)">
                    <div class="img-user-block">
                        <div class="user-image">
                            <img :src="user.avatarUrl" loading="lazy">
                        </div>
                        <div class="user-name">
                            <a>{{ truncate(user.username) }}</a>
                        </div>
                        <div class="numberCircle_users" :style="{ background: user.online ? '#37b73c' : '#c3c3c3' }"></div>
                    </div>
                </div>
            </div>
            <div v-if="loading" class="loader">Загрузка...</div>
        </div>
    `,
    setup() {
        const router = useRouter();
        const usersList = ref([]);
        const nextPage = ref(1);
        const loading = ref(false);

        const fetchUsers = async (page = 1) => {
            if (page === 'STOP') return;
            loading.value = true;
            try {
                const res = await axios.get(`/api/users/?page=${page}&page_size=40`);
                const newUsers = res.data.results.map(u => ({
                    ...u,
                    avatarUrl: u.avatar_url || CONFIG.DEFAULT_AVATAR,
                    online: u.online === true,
                }));
                usersList.value = page === 1 ? newUsers : [...usersList.value, ...newUsers];
                nextPage.value = res.data.next ? page + 1 : 'STOP';
            } finally {
                loading.value = false;
            }
        };

        const goToUser = (id) => router.push(`/user/${id}`);
        const truncate = (name) => truncateUsername(name, 10);
        const showFriends = () => {
            if (store.user) {
                router.push(`/user/${store.user.id}/friends`);
            }
        };

        onMounted(() => fetchUsers(1));

        const handleScroll = () => {
            const scrollY = window.scrollY;
            const visibleHeight = window.innerHeight;
            const totalHeight = document.documentElement.scrollHeight;
            if (totalHeight - (scrollY + visibleHeight) < 200 && !loading.value && nextPage.value !== 'STOP') {
                fetchUsers(nextPage.value);
            }
        };
        onMounted(() => window.addEventListener('scroll', handleScroll));
        onUnmounted(() => window.removeEventListener('scroll', handleScroll));

        return {
            store,
            usersList,
            nextPage,
            loading,
            goToUser,
            truncate,
            showFriends,
        };
    },
};

// ==================== ПРОСМОТР ПОСТА ====================
const PostDetailView = {
    template: `
        <div v-if="post" class="post-detail">
            <div class="breadcrumb" style="background:#507299;">
                <div class="user"> Опубликовал <a @click="goToUser(post.author.id)">{{ post.author.username }}</a> {{ formatDate(post.date_post) }}</div>
            </div>
            <div class="auto-images">
                <img :src="post.imageUrl" width="auto" @click="showImage(post.imageUrl)">
            </div>
            <div class="about">
                <p id="post-text">{{ post.body }}</p>
                <Comments :postId="post.id" />
            </div>
        </div>
    `,
    components: { Comments },
    setup() {
        const route = useRoute();
        const router = useRouter();
        const post = ref(null);

        const fetchPost = async () => {
            const response = await axios.get(`/api/posts/${route.params.id}/`);
            post.value = {
                ...response.data,
                author: response.data.author,
                imageUrl: response.data.image_url || CONFIG.NO_IMAGE,
            };
        };

        const goToUser = (id) => router.push(`/user/${id}`);
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const formatDate = (ts) => new Date(ts).toLocaleString();

        onMounted(fetchPost);

        return { post, goToUser, showImage, formatDate };
    },
};

// ==================== ПРОФИЛЬ ПОЛЬЗОВАТЕЛЯ ====================
const UserProfileView = {
    template: `
        <div>
            <div class="info">
                <div class="us-name" :style="{ color: userInfo.color }">
                    <h3>{{ userInfo.username }}</h3>
                </div>
                <div class="uspgimg">
                    <div class="img-user-block">
                        <img :src="userInfo.avatarUrl" loading="lazy" id="image-user-profile" @click="showImage(userInfo.avatarUrl)">
                        <div class="numberCircle" :style="{ background: userInfo.online ? '#37b73c' : '#c3c3c3' }"></div>
                    </div>
                </div>
                <div class="soc">
                    <template v-if="store.user && store.user.id === userInfo.id">
                        <img src="/static/images/edprof.png" class="edprof" @click="editProfile" open-atr="close">
                    </template>
                    <template v-else-if="store.user">
                        <a :id="'follw_' + userInfo.id" @click="toggleFollow" :atr-follow="isFollowing ? 'true' : 'false'">
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
                    <a @click="showFollowers">Подписчики <span>{{ followersCount }}</span></a>
                    <em>•</em>
                    <a @click="showFollowing">Подписан <span>{{ followingCount }}</span></a>
                    <em>•</em>
                    <a @click="showLikedPosts">Нравится <span>{{ totalLikes }}</span></a>
                </div>
            </div>
            <ul class="day-block" id="user-content-block">
                <li v-for="post in userPosts" :key="post.id" class="views-row">
                    <div class="field-image" :atribut="post.id">
                        <img :src="post.imageUrl" style="width:300px;height:230px;object-fit:cover;" @click="goToPost(post.id)">
                    </div>
                </li>
            </ul>
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

        const fetchUser = async () => {
            try {
                const res = await axios.get(`/api/users/${userId.value}/`);
                
                userInfo.value = {
                    ...res.data,
                    avatarUrl: res.data.avatar_url || CONFIG.DEFAULT_AVATAR,
                    online: res.data.online === true,
                };
                const followersRes = await axios.get(`/api/users/${userId.value}/followers/`);
                followersCount.value = followersRes.data.count || 0;

                const followingRes = await axios.get(`/api/users/${userId.value}/following/`);
                followingCount.value = followingRes.data.count || 0;

                const postsRes = await axios.get(`/api/posts/?author=${userId.value}`);
                userPosts.value = postsRes.data.results.map(p => ({
                    ...p,
                    imageUrl: p.image_url || CONFIG.NO_IMAGE,
                }));

                if (store.user) {
                    const checkFollow = await axios.get(`/api/users/${store.user.id}/following/`);
                    isFollowing.value = checkFollow.data.results?.some(u => u.id === userId.value) || false;
                }
            } catch (error) {
                console.error('Error fetching user:', error);
            }
        };
        
        watch(userId, fetchUser, { immediate: true });
        
        const toggleFollow = async () => {
            if (!store.user) return;
            try {
                if (isFollowing.value) {
                    await axios.post(`/api/users/${userId}/unfollow/`);
                } else {
                    await axios.post(`/api/users/${userId}/follow/`);
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
                const response = await axios.post('/api/threads/', { 
                    recipient: userId.value, 
                    message: messageText.value 
                });
                messageText.value = '';
                const threadId = response.data.id;  // id созданного треда
                router.push(`/messages/chat/${threadId}`);            
//                router.push('/messages');
            } catch (error) {
                console.error('Error sending message:', error);
            }
        };

        const showFollowers = () => {
            // TODO: Implement followers modal
        };
        const showFollowing = () => {
            // TODO: Implement following modal
        };
        const showLikedPosts = () => {
            // TODO: Implement liked posts view
        };
        const editProfile = () => { router.push('/profile'); };
        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));

        onMounted(fetchUser);

        return {
            store,
            userInfo,
            userPosts,
            followersCount,
            followingCount,
            totalLikes,
            isFollowing,
            messageText,
            toggleFollow,
            sendMessage,
            showFollowers,
            showFollowing,
            showLikedPosts,
            editProfile,
            goToPost,
            showImage,
        };
    },
};

// ==================== ЛИЧНЫЕ СООБЩЕНИЯ ====================
const PrivateMessagesView = {
    template: `
        <div class="private_messages">
            <h1>СОБЕСЕДНИКИ {{ threads.length }}</h1>
            <div class="partners">
                <div v-for="thread in threads" :key="thread.id" class="pm-block" :id="'pm-block-' + thread.id">
                    <div class="pm" @click="goToChat(thread.id)">
                        <img :src="thread.partnerAvatar" class="usPr">
                        <div class="pmu">{{ thread.partnerName }} ({{ thread.total_messages }} {{ messagesWord(thread.total_messages) }})</div>
                    </div>
                    <div class="delete-pm" @click="deleteThread(thread.id)"></div>
                    <div v-if="notifications.includes(thread.id)" class="notification" style="display:block;">!</div>
                </div>
            </div>
            <form class="new_message" @submit.prevent="createChat">
                <div class="autocomplete">
                    <input id="recipient_name" v-model="recipient" placeholder="ИМЯ ПОЛУЧАТЕЛЯ">
                </div>
                <div class="compose">
                    <div id="message_textarea" contenteditable="true" @input="e => newMessage = e.target.innerText" placeholder="Введите ваше сообщение..."></div>
                    <button type="submit">ОТПРАВИТЬ</button>
                </div>
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
                    partnerAvatar: t.partner?.avatar_url || CONFIG.DEFAULT_AVATAR,
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
            } catch (error) {
                console.error('Error deleting thread:', error);
            }
        };
        
        const createChat = async () => {
            if (!recipient.value || !newMessage.value) return;
            try {
                const response = await axios.post('/api/threads/', { 
                    recipient: recipient.value, 
                    message: newMessage.value 
                });
                recipient.value = '';
                newMessage.value = '';
                const threadId = response.data.id;
                router.push(`/messages/chat/${threadId}`);
//                fetchThreads();
            } catch (error) {
                console.error('Error creating chat:', error);
            }
        };

        onMounted(fetchThreads);

        return {
            threads,
            recipient,
            newMessage,
            notifications,
            messagesWord,
            goToChat,
            deleteThread,
            createChat,
        };
    },
};

// ==================== ЧАТ ====================
const ChatView = {
    template: `
        <div>
            <div class="parchat">
                <p class="name" @click="goToPartner">{{ partnerName }}</p>
                <p>{{ messagesTotal }} {{ messagesWord(messagesTotal) }} (получено {{ messagesReceived }}, отправлено {{ messagesSent }})</p>
            </div>
            <div id="conver" ref="messagesContainer">
                <div v-for="msg in messages" :key="msg.id" class="message">
                    <p :class="['author', msg.isMine ? 'we' : 'partner']">
                        <img :src="msg.senderAvatar" class="usPr" @click="goToUser(msg.senderId)">
                    </p>
                    <p :class="['txtmessage', msg.isMine ? 'we' : 'partner']">
                        <!-- Изображение, если есть -->
                        <img v-if="msg.image" :src="msg.image" @click="showImage(msg.image)" style="width:90px;border-radius:15px;">
                        <!-- Текст, если есть -->
                        <span v-if="msg.text">{{ msg.text }}</span>
                        <!-- Ссылка на пересланный пост, если нет ни изображения, ни текста -->
                        <span v-else-if="msg.resend" @click="goToPost(msg.resend)">СМОТРЕТЬ→</span>
                        <span class="datetime">{{ formatTime(msg.timestamp) }}</span>
                    </p>
                </div>
            </div>

            <!-- Блок предпросмотра и загрузки изображения -->
            <div v-if="selectedFile" class="image-preview">
                <img :src="previewUrl" style="max-width:200px; max-height:200px;">
                <button @click="clearSelectedFile" :disabled="isUploading">Удалить</button>
                <div v-if="isUploading" class="progress">Загрузка: {{ uploadProgress }}%</div>
            </div>

            <form id="message_form" @submit.prevent="sendMessage">
                <div class="compose">
                    <div id="message_textarea" contenteditable="true" 
                         @input="e => newMessage = e.target.innerText" 
                         placeholder="Введите сообщение..."></div>
                </div>
                <input type="file" ref="fileInput" @change="handleFileUpload" accept="image/*" :disabled="isUploading">
                <button type="submit" :disabled="isUploading">ОТПРАВИТЬ</button>
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
        const ws = ref(null);
        const messagesContainer = ref(null);

        // Переменные для загрузки файлов
        const selectedFile = ref(null);
        const previewUrl = ref(null);
        const isUploading = ref(false);
        const uploadProgress = ref(0);
        const tempMessageId = ref(null);
        let moreDataResolver = null;  // для ожидания подтверждения чанка

        // 1. Загружаем информацию о треде (партнёр, счётчики)
        const fetchThread = async () => {
            try {
                const res = await axios.get(`/api/threads/${threadId}/`);
                const data = res.data;
                partnerName.value = data.partner?.username || 'Unknown';
                messagesTotal.value = data.messages_total || 0;
                messagesSent.value = data.messages_sent || 0;
                messagesReceived.value = data.messages_received || 0;
            } catch (error) {
                console.error('Ошибка загрузки треда:', error);
            }
        };

        // 2. Загружаем сообщения
        const fetchMessages = async () => {
            try {
                const res = await axios.get(`/api/threads/${threadId}/messages/`);
                const messagesData = res.data.results || [];
                messages.value = messagesData.map(m => ({
                    id: m.id,
                    text: m.text,
                    image: m.image_url,
                    senderId: m.sender?.id,
                    senderAvatar: m.sender?.avatar_url || CONFIG.DEFAULT_AVATAR,
                    isMine: m.sender?.id === store.user?.id,
                    timestamp: m.datetime,
                }));

                setTimeout(() => {
                    if (messagesContainer.value) {
                        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                    }
                }, 100);
            } catch (error) {
                console.error('Ошибка загрузки сообщений:', error);
            }
        };

        // Инициализация WebSocket для чата
        const initChatWebSocket = () => {
            const host = window.location.hostname;
            const port = '8888';
            ws.value = new WebSocket(`${CONFIG.WS_PROTOCOL}${host}:${port}/${threadId}/`);

            ws.value.onmessage = (e) => {
                const data = JSON.parse(e.data);
                console.log(data);
                // Приватное сообщение
                if (data.event === 'privatemessages') {
                    const newMsg = {
                        id: data.message_id || Date.now(),
                        text: data.message,
                        image: data.pm_image ? `/media/data_image/${data.path_data}/${data.pm_image}.png` : null,
                        sender: { id: data.sender_id, username: data.sender },
                        isMine: data.sender_id == store.user?.id,
                        senderAvatar: (data.image_user && data.image_user !== 'oneProf.png') 
                            ? `/media/data_image/${data.path_data}/tm_${data.image_user}` 
                            : CONFIG.DEFAULT_AVATAR,
                        timestamp: new Date(parseInt(data.timestamp) * 1000),
                        senderId: data.sender_id,
                    };
                    messages.value.push(newMsg);

                    if (data.sender_id != store.user?.id) {
                        messagesReceived.value++;
                    } else {
                        messagesSent.value++;
                    }
                    messagesTotal.value++;

                    setTimeout(() => {
                        if (messagesContainer.value) {
                            messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
                        }
                    }, 100);
                }
                
                // Подтверждение получения чанка
                else if (data.event === 'more_data' && data.temp_id === tempMessageId.value) {
                    if (moreDataResolver) {
                        moreDataResolver();
                        moreDataResolver = null;
                    }
                }
                
                // Прогресс загрузки
                else if (data.event === 'upload_progress' && data.temp_id === tempMessageId.value) {
                    uploadProgress.value = data.progress;
                }
                
                // Завершение загрузки
                else if (data.event === 'upload_complete' && data.temp_id === tempMessageId.value) {
                    isUploading.value = false;
                    selectedFile.value = null;
                    previewUrl.value = null;
                    uploadProgress.value = 0;
                    tempMessageId.value = null;
                    newMessage.value = '';
                    const textarea = document.getElementById('message_textarea');
                    if (textarea) textarea.innerText = '';
                }
                
                // Ошибка загрузки
                else if (data.event === 'upload_error' && data.temp_id === tempMessageId.value) {
                    alert('Ошибка загрузки: ' + data.error);
                    isUploading.value = false;
                    uploadProgress.value = 0;
                    selectedFile.value = null;
                    previewUrl.value = null;
                    if (moreDataResolver) {
                        moreDataResolver = null;
                    }
                }
            };

            ws.value.onclose = () => {
                setTimeout(initChatWebSocket, 5000);
            };
        };

        // Вспомогательная функция для чтения чанка как DataURL
        const readChunkAsDataURL = (blob) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        // Функция ожидания подтверждения more_data
        const waitForMoreData = (timeout = 10000) => {
            return new Promise((resolve, reject) => {
                moreDataResolver = resolve;
                setTimeout(() => {
                    if (moreDataResolver) {
                        moreDataResolver = null;
                        reject(new Error('Timeout waiting for server response'));
                    }
                }, timeout);
            });
        };

        // Загрузка файла чанками
        const uploadFileInChunks = async (file, text) => {
            const CHUNK_SIZE = 64 * 1024; // 64 KB
            let offset = 0;
            const totalSize = file.size;
            const tempId = Date.now();

            isUploading.value = true;
            uploadProgress.value = 0;
            tempMessageId.value = tempId;

            // Отправляем Start
            ws.value.send(JSON.stringify({
                event: 'chat_upload_start',
                name: file.name,
                thread_id: threadId,
                temp_id: tempId
            }));

            // Ждём первое подтверждение (опционально)
            try {
                await waitForMoreData();
            } catch (err) {
                console.error('Start upload timeout', err);
                isUploading.value = false;
                return;
            }

            while (offset < totalSize) {
                const chunk = file.slice(offset, offset + CHUNK_SIZE);
                const dataUrl = await readChunkAsDataURL(chunk);
                const base64 = dataUrl.split(',')[1];

                ws.value.send(JSON.stringify({
                    event: 'chat_upload_chunk',
                    data: base64,
                    temp_id: tempId
                }));

                offset += CHUNK_SIZE;
                uploadProgress.value = Math.min(100, Math.round((offset / totalSize) * 100));

                // Ждём подтверждения получения чанка
                try {
                    await waitForMoreData();
                } catch (err) {
                    console.error('Chunk upload timeout', err);
                    isUploading.value = false;
                    return;
                }
            }

            // Все чанки отправлены, отправляем Done
            ws.value.send(JSON.stringify({
                event: 'chat_upload_done',
                text: text,
                temp_id: tempId,
                thread_id: threadId
            }));

            // Очистка поля ввода текста (сообщение уйдёт с изображением)
            newMessage.value = '';
            const textarea = document.getElementById('message_textarea');
            if (textarea) textarea.innerText = '';
        };

        // Выбор файла
        const handleFileUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            selectedFile.value = file;
            if (previewUrl.value) {
                URL.revokeObjectURL(previewUrl.value);
            }
            previewUrl.value = URL.createObjectURL(file);
        };

        // Очистка выбранного файла
        const clearSelectedFile = () => {
            if (previewUrl.value) {
                URL.revokeObjectURL(previewUrl.value);
            }
            selectedFile.value = null;
            previewUrl.value = null;
            uploadProgress.value = 0;
        };

        // Отправка сообщения (текст или текст+изображение)
        const sendMessage = () => {
            const text = newMessage.value?.trim();
            if (!text && !selectedFile.value) return;

            if (selectedFile.value) {
                // Загружаем файл с текстом (текст может быть пустым)
                uploadFileInChunks(selectedFile.value, text || '');
            } else {
                // Только текст
                ws.value.send(JSON.stringify({
                    event: 'privatemessages',
                    message: text,
                    pm_image: '',
                }));
                newMessage.value = '';
                const textarea = document.getElementById('message_textarea');
                if (textarea) textarea.innerText = '';
            }
        };

        // Вспомогательные функции
        const goToPartner = () => {
            // Если нужно перейти на страницу партнёра (можно добавить partnerId)
        };
        const goToUser = (id) => router.push(`/user/${id}`);
        const goToPost = (id) => {
            window.dispatchEvent(new CustomEvent('open-post-modal', { detail: id }));
        };
        const showImage = (url) => window.dispatchEvent(new CustomEvent('show-image', { detail: url }));
        const messagesWord = (count) => getNumEnding(count, ['сообщение', 'сообщения', 'сообщений']);
        const formatTime = (ts) => new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        onMounted(() => {
            fetchThread();
            fetchMessages();
            initChatWebSocket();
            // Удаляем уведомление для этого треда
            const idx = store.notifications.findIndex(id => String(id) === String(threadId));
            if (idx !== -1) store.notifications.splice(idx, 1);
        });

        onUnmounted(() => {
            if (ws.value) ws.value.close();
            if (previewUrl.value) {
                URL.revokeObjectURL(previewUrl.value);
            }
        });

        return {
            messages,
            partnerName,
            messagesTotal,
            messagesReceived,
            messagesSent,
            newMessage,
            messagesContainer,
            selectedFile,
            previewUrl,
            isUploading,
            uploadProgress,
            goToPartner,
            goToUser,
            goToPost,
            showImage,
            messagesWord,
            formatTime,
            sendMessage,
            handleFileUpload,
            clearSelectedFile,
        };
    },
};
// ==================== ДОБАВЛЕНИЕ ПОСТА ====================
const AddPostView = {
    template: `
        <div id="node">
            <form class="message_form" @submit.prevent="submitPost">
                <div class="field-image">
                    <input type="file" id="image_file" @change="handleImageUpload" accept="image/*" style="display:none;">
                    <label for="image_file" class="image_file">ЗАГРУЗКА КАРТИНКИ</label>
                    <div v-if="previewUrl" class="image-preview">
                        <img :src="previewUrl" style="max-width:100%; max-height:200px;">
                    </div>
                    <div v-else-if="selectedFile" class="file-info">
                        <span>Выбран файл: {{ selectedFile.name }}</span>
                    </div>
                    <div v-if="uploading" class="upload-progress">
                        Загрузка: {{ uploadProgress }}%
                    </div>
                </div>
                <div class="field-text">
                    <textarea id="id_body" v-model="postBody" placeholder="Сообщение..."></textarea>
                </div>
                <button type="submit" :disabled="uploading">ОТПРАВИТЬ</button>
            </form>
        </div>
    `,
    setup() {
        const router = useRouter();
        const postBody = ref('');
        const selectedFile = ref(null);
        const previewUrl = ref(null);
        const uploading = ref(false);
        const uploadProgress = ref(0);

        // Обработчик выбора файла
        const handleImageUpload = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            selectedFile.value = file;
            // Создаём URL для предпросмотра
            if (previewUrl.value) {
                URL.revokeObjectURL(previewUrl.value);
            }
            previewUrl.value = URL.createObjectURL(file);
        };

        // Функция отправки чанка с ожиданием подтверждения
        const sendChunkWithAck = (chunkData, isLast = false) => {
            return new Promise((resolve, reject) => {
                const ws = store.wsWall;
                if (!ws) {
                    reject(new Error('WebSocket not connected'));
                    return;
                }

                // Временный обработчик сообщений
                const messageHandler = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.status === 'MoreData' || data.status === 'Done') {
                        ws.removeEventListener('message', messageHandler);
                        resolve(data.status);
                    }
                };

                ws.addEventListener('message', messageHandler);

                // Отправляем чанк
                const eventName = isLast ? 'Done' : 'Upload';
                ws.send(JSON.stringify({
                    event: eventName,
                    Data: chunkData,
                }));

                // Таймаут
                setTimeout(() => {
                    ws.removeEventListener('message', messageHandler);
                    reject(new Error('Timeout waiting for server response'));
                }, 10000);
            });
        };

        // Загрузка файла чанками
        const uploadFileInChunks = async (file) => {
            const CHUNK_SIZE = 64 * 1024; // 64 KB
            let offset = 0;
            const totalSize = file.size;

            // Отправляем Start
            store.wsWall.send(JSON.stringify({
                event: 'Start',
                Name: file.name
            }));

            // Даём серверу время подготовиться (можно дождаться первого MoreData, но для простоты пауза)
            await new Promise(r => setTimeout(r, 100));

            while (offset < totalSize) {
                const chunk = file.slice(offset, offset + CHUNK_SIZE);
                const dataUrl = await readChunkAsDataURL(chunk);
                const base64 = dataUrl.split(',')[1]; // убираем префикс

                // Отправляем чанк и ждём подтверждения
                await sendChunkWithAck(base64, false);

                offset += CHUNK_SIZE;
                uploadProgress.value = Math.min(100, Math.round((offset / totalSize) * 100));
            }

            // Все чанки отправлены, отправляем Done
            await sendChunkWithAck('', true);
            uploadProgress.value = 100;
        };

        // Вспомогательная функция для чтения chunk как DataURL
        const readChunkAsDataURL = (blob) => {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        };

        const submitPost = async () => {
            if (!postBody.value && !selectedFile.value) return;
            if (!store.wsWall || store.wsWall.readyState !== WebSocket.OPEN) {
                alert('WebSocket не подключен');
                return;
            }

            uploading.value = true;
            uploadProgress.value = 0;

            try {
                if (selectedFile.value) {
                    await uploadFileInChunks(selectedFile.value);
                }

                // Отправляем событие wallpost с текстом
                store.wsWall.send(JSON.stringify({
                    event: 'wallpost',
                    body: postBody.value,
                    image: false  // изображение уже загружено через Start/Upload/Done
                }));

                // Очищаем форму
                postBody.value = '';
                if (previewUrl.value) {
                    URL.revokeObjectURL(previewUrl.value);
                    previewUrl.value = null;
                }
                selectedFile.value = null;

                // Переходим на главную
                router.push('/');
            } catch (error) {
                console.error('Upload error:', error);
                alert('Ошибка при загрузке изображения');
            } finally {
                uploading.value = false;
                uploadProgress.value = 0;
            }
        };

        // Очистка URL при уничтожении компонента
        onUnmounted(() => {
            if (previewUrl.value) {
                URL.revokeObjectURL(previewUrl.value);
            }
        });

        return {
            postBody,
            selectedFile,
            previewUrl,
            uploading,
            uploadProgress,
            handleImageUpload,
            submitPost,
        };
    }
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
            authorAvatar: postData.author?.avatar_url || CONFIG.DEFAULT_AVATAR,
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


// ==================== ЛОГИН ====================
const LoginView = {
    template: `
        <div class="auth-form">
            <h2>Вход</h2>
            <form @submit.prevent="login">
                <input type="text" v-model="username" placeholder="Имя пользователя" required>
                <input type="password" v-model="password" placeholder="Пароль" required>
                <button type="submit">Войти</button>
                <div v-if="error" class="error-message">{{ error }}</div>
            </form>
            <p>Нет аккаунта? <a @click="goToRegister">Зарегистрироваться</a></p>
        </div>
    `,
    setup() {
        const router = useRouter();
        const username = ref('');
        const password = ref('');
        const error = ref('');

        const login = async () => {
            try {
                error.value = '';
                const response = await axios.post('/login/', {
                    username: username.value,
                    password: password.value
                });
                
                store.user = response.data;
                router.push('/');
            } catch (err) {
                console.error('Login error:', err);
                error.value = err.response?.data?.error || 'Ошибка входа';
            }
        };

        const goToRegister = () => router.push('/register');

        return { username, password, error, login, goToRegister };
    },
};

// ==================== РЕГИСТРАЦИЯ ====================
const RegisterView = {
    template: `
        <div class="auth-form">
            <h2>Регистрация</h2>
            <form @submit.prevent="register" enctype="multipart/form-data">
                <input type="text" v-model="username" placeholder="Имя пользователя" required>
                <input type="password" v-model="password1" placeholder="Пароль" required>
                <input type="password" v-model="password2" placeholder="Подтверждение пароля" required>
                
                <div class="avatar-upload">
                    <label>Аватар (необязательно):</label>
                    <input type="file" @change="handleAvatarUpload" accept="image/*">
                    <div v-if="avatarPreview" class="avatar-preview">
                        <img :src="avatarPreview" style="max-width:100px; max-height:100px;">
                    </div>
                </div>
                
                <button type="submit">Зарегистрироваться</button>
                
                <div v-if="errors" class="error-message">
                    <div v-for="(err, field) in errors" :key="field">
                        {{ field }}: {{ err.join(', ') }}
                    </div>
                </div>
            </form>
            <p>Уже есть аккаунт? <a @click="goToLogin">Войти</a></p>
        </div>
    `,
    setup() {
        const router = useRouter();
        const username = ref('');
        const password1 = ref('');
        const password2 = ref('');
        const avatarFile = ref(null);
        const avatarPreview = ref(null);
        const errors = ref(null);

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

        const register = async () => {
            try {
                errors.value = null;
                
                const formData = new FormData();
                formData.append('username', username.value);
                formData.append('password', password1.value);
                formData.append('password2', password2.value);
                
                if (avatarFile.value) {
                    formData.append('image', avatarFile.value);
                }

                const response = await axios.post('/register/', formData, {
                    headers: { 'Content-Type': 'multipart/form-data' }
                });
                
                store.user = response.data.user;
                router.push('/');
            } catch (err) {
                console.error('Registration error:', err);
                errors.value = err.response?.data || { error: ['Ошибка регистрации'] };
            }
        };

        const goToLogin = () => router.push('/login');

        return { 
            username, password1, password2, 
            avatarPreview, errors,
            handleAvatarUpload, register, goToLogin 
        };
    },
};

// ==================== РЕДАКТИРОВАНИЕ ПРОФИЛЯ ====================
const ProfileEditView = {
    template: `
        <div class="profile-edit">
            <h2>Редактирование профиля</h2>
            <form @submit.prevent="saveProfile">
                <div class="avatar-upload">
                    <img :src="avatarPreview" class="avatar-preview">
                    <input type="file" @change="handleAvatarUpload" accept="image/*">
                </div>
                <input type="color" v-model="color" placeholder="Цвет имени">
                <button type="submit">Сохранить</button>
            </form>
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
                <a @click="goToAddPost" id="addPost"></a>
                <a @click="goToUsers" id="userA"></a>
                <img src="/static/images/mesv4.png" @click="goToMessages" id="mespr">
                <div id="notification-nav" class="notification" @click="goToMessages" v-if="hasNotifications">!</div>
                <img :src="userAvatar" @click="goToProfile" class="usPr" :client-id-user="user?.id" />
            </div>
            <div id="logo">
                <img src="/static/images/compasv3.png" class="compas" @click="toggleMenu" id="comps" :open-atr="menuOpen ? 'open' : 'close'">
                <a href="/" class="aLogo">СООБЩЕСТВО <img class="logoF" src="/static/images/famaly_logo.png"></a>
                <img v-if="user" src="/static/images/EXITv1.png" @click="logout" class="enter">
                <img v-else src="/static/images/EXITv4png.png" @click="goToLogin" class="enter" id="enter">
            </div>
        </div>
        <div id="search-box" v-if="$route.name !== 'messages' && $route.name !== 'chat'" :style="{ display: 'block' }">
            <form class="search-bar" @submit.prevent="search">
                <div class="autocomplete">
                    <input id="search-input" type="search" v-model="searchQuery" placeholder="Поиск" required>
                    <button class="search" type="submit">Найти</button>
                </div>
            </form>
        </div>
    `,
    setup() {
        const router = useRouter();
        const menuOpen = ref(false);
        const searchQuery = ref('');
        const user = computed(() => store.user);
        const hasNotifications = computed(() => store.notifications.length > 0);
        const isLoading = ref(false); // Для предотвращения множественных запросов

        const userAvatar = computed(() => {
            if (user.value && user.value.avatar_url && user.value.avatar_url !== 'oneProf.png') {
                return `${user.value.avatar_url}`;
            }
            return CONFIG.DEFAULT_AVATAR;
        });

        const headerStyle = computed(() => {
            return user.value ? { backgroundSize: 'contain', display: 'block' } : { backgroundColor: '#507299' };
        });

        const toggleMenu = () => { menuOpen.value = !menuOpen.value; };
        const goToProfile = () => { router.push(`/user/${user.value.id}`); };
        const goToAddPost = () => { router.push('/addpost'); };
        const goToUsers = () => { router.push('/users'); };
        const goToMessages = () => { router.push('/messages'); };
        const goToLogin = () => { router.push('/login'); };
        
        const logout = async () => {
            // Предотвращаем множественные запросы
            if (isLoading.value) return;
            
            isLoading.value = true;
            
            try {
                // Используем POST запрос для logout
                await axios.post('/logout/', {}, {
                    headers: {
                        'X-CSRFToken': getCookie('csrftoken'), // Функция для получения CSRF токена
                    }
                });
                
                // Очищаем данные пользователя в сторе
                store.user = null;
                store.notifications = [];
                
                // Закрываем WebSocket соединения если они есть
                if (store.wsWall) {
                    store.wsWall.close();
                    store.wsWall = null;
                }
                if (store.wsNotify) {
                    store.wsNotify.close();
                    store.wsNotify = null;
                }
                
                // Перенаправляем на страницу входа
                router.push('/login');
                
            } catch (error) {
                console.error('Ошибка при выходе:', error);
                
                // Даже если сервер вернул ошибку, очищаем локальные данные
                store.user = null;
                store.notifications = [];
                router.push('/login');
                
            } finally {
                isLoading.value = false;
            }
        };
        
        const search = () => {
            if (searchQuery.value && store.wsWall) {
                store.wsWall.send(JSON.stringify({ event: 'search', data: searchQuery.value }));
            }
        };

        // Вспомогательная функция для получения CSRF токена
        const getCookie = (name) => {
            let cookieValue = null;
            if (document.cookie && document.cookie !== '') {
                const cookies = document.cookie.split(';');
                for (let i = 0; i < cookies.length; i++) {
                    const cookie = cookies[i].trim();
                    if (cookie.substring(0, name.length + 1) === (name + '=')) {
                        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                        break;
                    }
                }
            }
            return cookieValue;
        };

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
            search,
            isLoading,
        };
    },
};

// ==================== РОУТИНГ ====================
const routes = [
    { path: '/', component: WallPostsView, name: 'wall' },
    { path: '/users', component: UsersView, name: 'users' },
    { path: '/user/:id', component: UserProfileView, name: 'user' },
    { path: '/post/:id', component: PostDetailView, name: 'post' },
    { path: '/messages', component: PrivateMessagesView, name: 'messages' },
    { path: '/messages/chat/:id', component: ChatView, name: 'chat' },
    { path: '/addpost', component: AddPostView, name: 'addpost' },
    { path: '/login', component: LoginView, name: 'login' },
    { path: '/register', component: RegisterView, name: 'register' },
    { path: '/profile', component: ProfileEditView, name: 'profile' },
];

const router = createRouter({
    history: createWebHistory(),
    routes,
});

// ==================== ГЛАВНОЕ ПРИЛОЖЕНИЕ ====================
const App = {
    components: { AppHeader, ImageModal, TopButton, PostModal},
    template: `
        <div>
            <AppHeader />
            <router-view />
            <ImageModal />
            <PostModal />
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
        });
        return { store };
    },
};

// ==================== СОЗДАНИЕ ПРИЛОЖЕНИЯ ====================
const app = createApp(App);
app.use(router);
app.mount('#app');
