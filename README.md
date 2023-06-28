# social-network - очередная реализация социальной сети на python

При создании, учитывал возможность использовать в проектах с высокой нагрузкой

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

Redis   
```
sudo add-apt-repository ppa:redislabs/redis
sudo apt-get update
sudo apt-get install redis

/etc/init.d/redis-server restart
```

Виртуальная среда для работы с Django   
```
python3.9 -m venv <myenvname>
source <myenvname>/bin/activate
```

```
pip install --upgrade pip
```

```
pip install -r requirements.txt
```

синхронизация с postgresql   
```
./manage.py makemigrations   
./manage.py migrate auth   
./manage.py migrate --run-syncdb   
./manage.py createsuperuser   
```

быстрый пуск   
```
python manage.py runserver 192.168.1.50:8888   
python manage.py runworker nnapp   
python manage.py index   
```

gunicorn & daphne, исправить порт в javascript client
```
gunicorn app.wsgi:application --bind 192.168.1.50:8888 & daphne app.asgi:application --bind 0.0.0.0 --port 8889   
```
### Генирация пользователей и контента  
 
простой пример взаимодействия web   
```
python3 simple_api_client.py
```

простой пример генирации данных локально
```
./manage.py shell < gen_content.py
```

### Дополнительно  
 
очистить redis   
```
docker exec -it redis-stack-server redis-cli
flushall
```
из базы данных в json   
```
./manage.py dumpdata > data_dump.json
```
работа с postgresql   
```
sudo -u postgres psql postgres
\du+
\l+
DROP DATABASE com;
DROP USER sadko;
CREATE USER sadko WITH PASSWORD '1qaz';
ALTER ROLE sadko WITH CREATEDB CREATEROLE SUPERUSER;
CREATE DATABASE com;
grant all privileges on database com to sadko;
\q
```
простые команды celery
```
python -m celery -A app worker
celery flower
celery flower --broker=redis://localhost:6379/0 --broker_api=redis://localhost:6379/0
```

### Пример работы:
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v1.3/static/presentation.png)

### Нужно сделать
- [x] aioredis 2   
- [x] выполнения ресурсоемких задач в очереди   
- [ ] улучшить страницу пользователя   
- [ ] инструменты для обучения ChatGPT   
- [ ] подключить natural-motion   
- [ ] инструменты генирации изображения   
- [ ] стартовая страница для незарегестрированных пользователей   
- [x] исправить работу history state клиентской части   
- [ ] оптимизация для поисковых ботов   
- [x] загрузка файлов   
- [ ] CKEditor 5   
- [ ] полнотекстовый поиск   
- [x] уведомление личных сообщений   
- [x] следить за активностью пользователя   
- [ ] ссылка на страницу пользователя по псевдониму с проверкой   

