# social-network - очередная реализация социальной сети на python

При создании, учитывал возможность использовать в проектах с высокой нагрузкой.   
Демонстрация http://сообщество.com/   

#### Для запуска нужно:

* Django 4.x - работа с БД
* Channels 4.x - websocket
* Channels-redis 4.x - django channels, используют Redis в качестве резервного хранилища
* Daphne 4.x - ASGI сервер протоколов Django
* Gunicorn - python WSGI HTTP сервер для UNIX
* PostgreSQL - основное хранилище
* Redis - дополнительное хранилище

#### Пуск:

установка нужных компонентов   

RedisSearch   
```
docker run -p 6379:6379 redis/redis-stack-server:latest
```

виртуальная среда для работы с Django   
```
python3.9 -m venv <myenvname>
source <myenvname>/bin/activate
pip install --upgrade pip
pip install -r requirements.txt
```

синхронизация с postgresql   
```
./manage.py makemigrations   
./manage.py migrate auth   
./manage.py migrate --run-syncdb   
./manage.py createsuperuser   
python manage.py index   # индексация базы данных для поиска   
```

быстрый пуск   
```
./run.sh
```

взаимодействие   
```
python manage.py shell < gen_content.py   #см. файл   
python simple_api_client.py   
```

### Пример работы:
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.5/static/presentation.png)

### Нужно сделать
- [x] aioredis 2   
- [x] выполнения ресурсоемких задач в очереди   
- [ ] улучшить страницу пользователя   
- [ ] инструменты для обучения ChatGPT   
- [ ] подключить natural-motion   
- [ ] инструменты генирации изображения   
- [x] стартовая страница для незарегестрированных пользователей   
- [x] исправить работу history state клиентской части   
- [ ] оптимизация для поисковых ботов   
- [x] загрузка файлов   
- [ ] CKEditor 5   
- [x] полнотекстовый поиск   
- [x] уведомление личных сообщений   
- [x] следить за активностью пользователя   
- [ ] ссылка на страницу пользователя по псевдониму с проверкой   
- [ ] редактировать изображение   
- [ ] шифрование данных   
- [ ] хранение переписки на устройствах пользователя   
- [ ] мультичат с настройками   

