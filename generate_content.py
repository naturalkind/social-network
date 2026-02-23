#!/usr/bin/env python
"""
Единый скрипт для генерации тестового контента в Django.
Запуск: python generate_content.py --help
"""

import os
import sys
import random
import uuid
import json
import shutil
import argparse
from pathlib import Path

# ------------------------------------------------------------
#  Настройка Django (должна быть выполнена до импорта моделей)
# ------------------------------------------------------------
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'app.settings')  # замените your_project
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
import django
django.setup()

# ------------------------------------------------------------
#  Импорт моделей и констант Django
# ------------------------------------------------------------
from django.conf import settings
from django.contrib.auth.hashers import make_password
from django.db import transaction
from PIL import Image
from myapp.models import User, Post, Comment, Relationship
from myapp.models import RELATIONSHIP_FOLLOWING  # предполагаемая константа
from gen_nikename import generate_nicknames       # ваша функция генерации имён

# ------------------------------------------------------------
#  Конфигурация (можно переопределить через переменные окружения)
# ------------------------------------------------------------
DEFAULT_IMAGES_DIR = getattr(settings, 'GENERATION_IMAGES_DIR', 
                             '/home/npu/Изображения/Снимки экрана/')
USER_LOGS_FILE = Path(getattr(settings, 'GENERATION_USER_LOGS', 
                              settings.BASE_DIR / 'media' / 'generated_users.json'))
THUMBNAIL_SIZE = getattr(settings, 'THUMBNAIL_SIZE', (150, 150))

# ------------------------------------------------------------
#  ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (работа с изображениями, логирование)
# ------------------------------------------------------------

def load_images_from_dir(dir_path):
    """Возвращает список путей к файлам изображений из папки (рекурсивно)."""
    images = []
    valid_ext = ('.png', '.jpg', '.jpeg')
    for root, _, files in os.walk(dir_path):
        for file in files:
            if file.lower().endswith(valid_ext):
                images.append(os.path.join(root, file))
    return images

def ensure_image_is_png(source_path, dest_dir, base_name):
    """
    Конвертирует изображение в PNG (если необходимо) и сохраняет в dest_dir.
    Возвращает имя сохранённого файла (base_name.png) или None при ошибке.
    """
    dest_path = os.path.join(dest_dir, f"{base_name}.png")
    try:
        with Image.open(source_path) as img:
            if img.mode in ('RGBA', 'P'):
                img = img.convert('RGB')
            img.save(dest_path, 'PNG', optimize=True)
        return f"{base_name}.png"
    except Exception as e:
        print(f"Ошибка конвертации {source_path}: {e}")
        return None

def create_thumbnail(source_png_path, dest_dir, base_name, size=THUMBNAIL_SIZE):
    """
    Создаёт миниатюру из уже сохранённого PNG-файла.
    Возвращает имя файла миниатюры (tm_<base_name>.png) или None.
    """
    try:
        with Image.open(source_png_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            thumb_name = f"tm_{base_name}.png"
            thumb_path = os.path.join(dest_dir, thumb_name)
            img.save(thumb_path, 'PNG')
        return thumb_name
    except Exception as e:
        print(f"Ошибка создания миниатюры для {source_png_path}: {e}")
        return None

def load_generated_users_log():
    """Загружает лог созданных пользователей."""
    if USER_LOGS_FILE.exists():
        with open(USER_LOGS_FILE, 'r') as f:
            return json.load(f)
    return []

def save_generated_users_log(users_data):
    """Сохраняет лог созданных пользователей."""
    with open(USER_LOGS_FILE, 'w') as f:
        json.dump(users_data, f, indent=2)

# ------------------------------------------------------------
#  ОСНОВНЫЕ ФУНКЦИИ ГЕНЕРАЦИИ (каждая соответствует команде)
# ------------------------------------------------------------

def generate_users(count=10):
    """Создание тестовых пользователей с аватарками."""
    print(f"Начинаю генерацию {count} пользователей...")

    images_dir = DEFAULT_IMAGES_DIR
    if not os.path.exists(images_dir):
        print(f"Ошибка: папка с изображениями не найдена: {images_dir}")
        return

    all_images = load_images_from_dir(images_dir)
    if len(all_images) < count:
        print(f"Ошибка: недостаточно изображений (нужно {count}, есть {len(all_images)})")
        return

    selected_images = random.sample(all_images, count)

    existing_usernames = set(User.objects.values_list('username', flat=True))
    all_nicks = generate_nicknames()
    available_nicks = [n for n in all_nicks if n not in existing_usernames]
    if len(available_nicks) < count:
        print(f"Ошибка: недостаточно уникальных никнеймов (нужно {count}, доступно {len(available_nicks)})")
        return

    created_users = []
    users_for_log = []

    for i in range(count):
        username = available_nicks[i]
        clean_pass = username.replace(' ', '')
        if len(clean_pass) < 8:
            clean_pass += str(random.randint(1000, 9999))

        user = User(
            username=username,
            email=f"{username}@example.com",
            password=make_password(clean_pass),
            path_data=str(uuid.uuid4()),
            color="#{:06x}".format(random.randint(0, 0xFFFFFF))
        )
        user.save()
        created_users.append(user)

        user_media_dir = os.path.join(settings.MEDIA_ROOT, 'data_image', user.path_data)
        os.makedirs(user_media_dir, exist_ok=True)

        src_img = selected_images[i]
        base_name = os.path.splitext(os.path.basename(src_img))[0]

        png_name = ensure_image_is_png(src_img, user_media_dir, base_name)
        if png_name:
            user.image_user = png_name
            # Создаём миниатюру (не привязываем к модели, но файл будет)
            create_thumbnail(
                os.path.join(user_media_dir, png_name),
                user_media_dir, base_name
            )
        else:
            user.image_user = 'oneProf.png'

        user.save()

        users_for_log.append({
            'username': username,
            'path_data': user.path_data,
            'image': user.image_user,
            'created_at': str(user.date_joined)
        })

        print(f"Создан пользователь: {username} (пароль: {clean_pass})")

    existing_log = load_generated_users_log()
    existing_log.extend(users_for_log)
    save_generated_users_log(existing_log)

    print(f"Успешно создано {count} пользователей")
    return created_users

def generate_posts(posts_per_user=5, max_images=100):
    """Создание постов для существующих пользователей."""
    print(f"Генерация постов (по {posts_per_user} на пользователя)...")

    users = list(User.objects.all())
    if not users:
        print("Нет пользователей. Сначала запустите generate_users.")
        return

    images_dir = DEFAULT_IMAGES_DIR
    if not os.path.exists(images_dir):
        print(f"Ошибка: папка с изображениями не найдена: {images_dir}")
        return

    all_images = load_images_from_dir(images_dir)
    if max_images and max_images < len(all_images):
        all_images = random.sample(all_images, max_images)
    if not all_images:
        print("Нет доступных изображений")
        return

    posts_to_create = []
    for user in users:
        user_dir = os.path.join(settings.MEDIA_ROOT, 'data_image', user.path_data)
        os.makedirs(user_dir, exist_ok=True)

        for _ in range(posts_per_user):
            src_img = random.choice(all_images)
            base_name = os.path.splitext(os.path.basename(src_img))[0]
            unique_suffix = str(random.randint(1000, 9999))
            dest_base = f"{base_name}_{unique_suffix}"

            png_name = ensure_image_is_png(src_img, user_dir, dest_base)
            if not png_name:
                continue

            post = Post(
                title="",
                body="",
                image=png_name,
                path_data=user.path_data,
                user_post=user
            )
            posts_to_create.append(post)

            if len(posts_to_create) % 100 == 0:
                print(f"Подготовлено {len(posts_to_create)} постов...")

    Post.objects.bulk_create(posts_to_create, batch_size=500)
    print(f"Создано {len(posts_to_create)} постов")

def generate_relationships(avg_follows=10):
    """Создание случайных подписок между пользователями."""
    users = list(User.objects.all())
    if len(users) < 2:
        print("Недостаточно пользователей для создания подписок")
        return

    print(f"Генерация подписок (в среднем {avg_follows} на пользователя)...")

    relationships = []
    existing_pairs = set()

    for user in users:
        num_follows = random.randint(0, min(2 * avg_follows, len(users)-1))
        candidates = [u for u in users if u != user]
        selected = random.sample(candidates, min(num_follows, len(candidates)))
        for followed in selected:
            pair_key = (user.id, followed.id)
            if pair_key not in existing_pairs:
                relationships.append(
                    Relationship(
                        from_user=user,
                        to_user=followed,
                        status=RELATIONSHIP_FOLLOWING
                    )
                )
                existing_pairs.add(pair_key)

    with transaction.atomic():
        created = Relationship.objects.bulk_create(
            relationships,
            ignore_conflicts=True,
            batch_size=1000
        )
    print(f"Создано {len(created)} новых подписок")

def generate_comments(max_per_post=5):
    """Создание случайных комментариев к постам."""
    users = list(User.objects.all())
    posts = list(Post.objects.all())

    if not users or not posts:
        print("Нет пользователей или постов")
        return

    print(f"Генерация комментариев (до {max_per_post} на пост)...")

    texts = [
        "Отличный пост!", "Спасибо", "Интересно", "👍", "🔥",
        "Согласен", "Нужно подумать", "Класс!", "++", "Поддерживаю"
    ]

    comments = []
    for post in posts:
        num_comments = random.randint(0, max_per_post)
        if num_comments == 0:
            continue
        commentators = random.sample(users, min(num_comments, len(users)))
        for user in commentators:
            comments.append(
                Comment(
                    comment_text=random.choice(texts),
                    post_id=post,
                    comment_user=user
                )
            )

    with transaction.atomic():
        created = Comment.objects.bulk_create(comments, batch_size=1000)
    print(f"Создано {len(created)} комментариев")

def generate_likes(max_per_post=20):
    """Создание случайных лайков к постам."""
    users = list(User.objects.all())
    posts = list(Post.objects.all())

    if not users or not posts:
        print("Нет пользователей или постов")
        return

    print(f"Генерация лайков (до {max_per_post} на пост)...")

    through_model = Post.likes.through  # предполагаем ManyToMany поле 'likes'
    like_relations = []
    existing_pairs = set()

    for post in posts:
        num_likes = random.randint(0, min(max_per_post, len(users)))
        if num_likes == 0:
            continue
        likers = random.sample(users, num_likes)
        for user in likers:
            pair = (post.id, user.id)
            if pair not in existing_pairs:
                like_relations.append(
                    through_model(post_id=post.id, user_id=user.id)
                )
                existing_pairs.add(pair)

    with transaction.atomic():
        created = through_model.objects.bulk_create(
            like_relations,
            ignore_conflicts=True,
            batch_size=1000
        )
    print(f"Добавлено {len(created)} лайков")

def delete_generated_users():
    """Удаление всех пользователей, созданных через generate_users, и их медиа."""
    print("Начинаю удаление сгенерированных пользователей...")
    log_data = load_generated_users_log()
    if not log_data:
        print("Файл лога пуст или не существует. Ничего не удалено.")
        return

    deleted_count = 0
    for entry in log_data:
        username = entry.get('username')
        path_data = entry.get('path_data')
        try:
            user = User.objects.get(username=username)
            user.delete()
            user_dir = os.path.join(settings.MEDIA_ROOT, 'data_image', path_data)
            if os.path.exists(user_dir):
                shutil.rmtree(user_dir)
                print(f"Удалена директория: {user_dir}")
            deleted_count += 1
        except User.DoesNotExist:
            print(f"Пользователь {username} не найден в БД, возможно уже удалён.")
        except Exception as e:
            print(f"Ошибка при удалении {username}: {e}")

    save_generated_users_log([])
    print(f"Удалено пользователей: {deleted_count}")

def generate_all(users=10, posts_per_user=5, avg_follows=5, max_comments=5, max_likes=10):
    """Запуск всех этапов генерации."""
    print("=== ЗАПУСК ПОЛНОЙ ГЕНЕРАЦИИ ===")
    generate_users(count=users)
    generate_posts(posts_per_user=posts_per_user)
    generate_relationships(avg_follows=avg_follows)
    generate_comments(max_per_post=max_comments)
    generate_likes(max_per_post=max_likes)
    print("=== ГЕНЕРАЦИЯ ЗАВЕРШЕНА ===")

# ------------------------------------------------------------
#  ОБРАБОТКА АРГУМЕНТОВ КОМАНДНОЙ СТРОКИ
# ------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description='Генерация тестового контента для Django')
    subparsers = parser.add_subparsers(dest='command', help='Команда')

    # users
    parser_users = subparsers.add_parser('users', help='Создать пользователей')
    parser_users.add_argument('--count', type=int, default=10, help='Количество пользователей')

    # posts
    parser_posts = subparsers.add_parser('posts', help='Создать посты')
    parser_posts.add_argument('--posts-per-user', type=int, default=5, help='Постов на пользователя')
    parser_posts.add_argument('--max-images', type=int, default=100, help='Максимум изображений для использования')

    # relationships
    parser_rel = subparsers.add_parser('relationships', help='Создать подписки')
    parser_rel.add_argument('--avg-follows', type=int, default=10, help='Среднее количество подписок на пользователя')

    # comments
    parser_com = subparsers.add_parser('comments', help='Создать комментарии')
    parser_com.add_argument('--max-per-post', type=int, default=5, help='Максимум комментариев на пост')

    # likes
    parser_likes = subparsers.add_parser('likes', help='Создать лайки')
    parser_likes.add_argument('--max-per-post', type=int, default=20, help='Максимум лайков на пост')

    # delete
    parser_del = subparsers.add_parser('delete', help='Удалить сгенерированных пользователей')

    # all
    parser_all = subparsers.add_parser('all', help='Выполнить все шаги генерации')
    parser_all.add_argument('--users', type=int, default=10, help='Количество пользователей')
    parser_all.add_argument('--posts-per-user', type=int, default=5, help='Постов на пользователя')
    parser_all.add_argument('--avg-follows', type=int, default=5, help='Среднее количество подписок')
    parser_all.add_argument('--max-comments', type=int, default=5, help='Максимум комментариев на пост')
    parser_all.add_argument('--max-likes', type=int, default=10, help='Максимум лайков на пост')

    args = parser.parse_args()

    if args.command == 'users':
        generate_users(count=args.count)
    elif args.command == 'posts':
        generate_posts(posts_per_user=args.posts_per_user, max_images=args.max_images)
    elif args.command == 'relationships':
        generate_relationships(avg_follows=args.avg_follows)
    elif args.command == 'comments':
        generate_comments(max_per_post=args.max_per_post)
    elif args.command == 'likes':
        generate_likes(max_per_post=args.max_per_post)
    elif args.command == 'delete':
        delete_generated_users()
    elif args.command == 'all':
        generate_all(
            users=args.users,
            posts_per_user=args.posts_per_user,
            avg_follows=args.avg_follows,
            max_comments=args.max_comments,
            max_likes=args.max_likes
        )
    else:
        parser.print_help()

if __name__ == '__main__':
    main()
