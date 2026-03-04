import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';

export default {
  name: 'TopButton',
  setup() {
    const route = useRoute();
    const visible = ref(false);
    const direction = ref('up');        // 'up' – прокрутить вверх, 'down' – прокрутить вниз
    const savedScrollY = ref(0);        // сохранённая позиция для возврата
    const chatThreshold = 30;           // порог для чата (в пикселях от верха)
    const scrollPercentThreshold = 80;  // порог для обычных страниц (в процентах)

    // Проверка наличия прокрутки
    const hasScroll = () => {
      return document.documentElement.scrollHeight > window.innerHeight;
    };

    // Обновление направления на основе текущей позиции
    const updateDirection = () => {
      const scrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollPercent = (scrollY / (documentHeight - windowHeight)) * 100;

      if (route.name === 'chat') {
        // В чате: вверху -> прокрутить вниз, внизу -> прокрутить вверх
        if (scrollY <= chatThreshold) {
          direction.value = 'down';     // хотим вниз (кнопка смотрит вверх)
        } else if (scrollPercent >= scrollPercentThreshold) {
          direction.value = 'up';       // хотим вверх (кнопка смотрит вниз)
        } else {
          direction.value = null;       // в середине не показываем
        }
      } else {
        // На обычных страницах
        if (scrollY <= 100) {           // почти вверху
          direction.value = 'down';     // можем прокрутить вниз
        } else if (scrollPercent >= scrollPercentThreshold) { // почти внизу
          direction.value = 'up';       // можем прокрутить вверх
        } else {
          direction.value = null;       // в середине не показываем
        }
      }
    };

    // Решение о видимости кнопки
    const shouldShow = () => {
      return hasScroll() && direction.value !== null;
    };

    // Обработчик скролла с throttling
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          updateDirection();
          visible.value = shouldShow();
          ticking = false;
        });
        ticking = true;
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

    // Пересчёт при смене маршрута
    watch(() => route.name, () => {
      updateDirection();
      visible.value = shouldShow();
    });

    // Стиль кнопки (поворот)
    const buttonStyle = computed(() => {
      // Когда direction = 'down' – кнопка смотрит вверх (rotate 180°)
      // Когда direction = 'up' – кнопка смотрит вниз (rotate 0°)
      const rotate = direction.value === 'down' ? 'rotate(180deg)' : 'rotate(0deg)';
      return {
        transform: rotate,
        cursor: 'pointer',
        zIndex: 9999,
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '50px',
        height: '50px',
      };
    });

    // Обработка клика
    const handleClick = () => {
      if (direction.value === 'up') {
        // Прокрутка вверх
        if (route.name === 'chat') {
          // В чате просто наверх (без сохранения позиции)
          window.scrollTo({ top: 0, behavior: 'smooth' });
          direction.value = 'down';
        } else {
          // Сохраняем текущую позицию и прокручиваем наверх
          savedScrollY.value = window.scrollY;
          window.scrollTo({ top: 0, behavior: 'smooth' });
          direction.value = 'down';
        }
      } else if (direction.value === 'down') {
        // Прокрутка вниз
        if (route.name === 'chat') {
          // В чате в самый низ
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          });
          direction.value = 'up';
        } else {
          if (savedScrollY.value > 0) {
            // Возврат к сохранённой позиции
            window.scrollTo({ top: savedScrollY.value, behavior: 'smooth' });
            savedScrollY.value = 0;
            direction.value = 'up';
          } else {
            // Иначе прокрутка в самый низ
            window.scrollTo({
              top: document.documentElement.scrollHeight,
              behavior: 'smooth'
            });
            direction.value = 'up';
          }
        }
      }
    };

    return {
      visible,
      buttonStyle,
      handleClick,
    };
  },
};
