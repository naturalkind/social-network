# social-network - очередная реализация социальной сети на python

При создании, учитывал возможность использовать в проектах с высокой нагрузкой

#### Для запуска нужно:

* Django 3.2.16 - работа с БД
* Channels 3.0.1 - websocket
* Channels-redis 4 - django channels, используют Redis в качестве резервного хранилища
* Daphne - ASGI сервер протоколов Django
* Gunicorn - python WSGI HTTP сервер для UNIX

#### Пуск:

установка нужных компонентов   

Redis 6   
```
sudo add-apt-repository ppa:redislabs/redis
sudo apt-get update
sudo apt-get install redis

/etc/init.d/redis-server restart
```

Виртуальная среда для работы с Django 3
```
python3.9 -m venv <myenvname>
```

```
source <myenvname>/bin/activate
```

```
pip install --upgrade pip
```

```
pip install -r requirements.txt
```

```
pip uninstall channels
```

```
pip install channels==3.0.1
```

создание базы данных с sqlite3   
```
python3 manage.py migrate --run-syncdb
```

создание базы данных с postgresql
```
./manage.py makemigrations   
./manage.py migrate auth   
./manage.py migrate --run-syncdb   
./manage.py createsuperuser   
```

пуск   
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

дополнительно   
очистить redis   
```
redis-cli flushall
```
удалить если используем   
```
sudo rm -R db.sqlite3
```
создания копии базы данных в json   
```
./manage.py dumpdata > data_dump.json
```
работа с postgresql   
```
sudo -u postgres psql postgres
\du+
\l+
DROP DATABASE com;
CREATE DATABASE com;
grant all privileges on database com to sadko;
\q
```
### Пример работы:
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr1.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr2.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr3.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr4.png)

### Нужно сделать
- [ ] использовать aioredis 2   
- [ ] выполнения ресурсоемких задач в очереди   
- [ ] улучшить страницу пользователя   
- [ ] создать инструменты для обучения ChatGPT   
- [ ] подключить natural-motion   
- [ ] улучшить инструменты генирации изображений   
- [ ] сделать стартовую страницу для незарегестрированных пользователей   
- [x] исправить работу history state клиентской части   
- [ ] оптимизировать для поисковых ботов   
- [ ] сделать загрузку файлов   
- [ ] добавить CKEditor 5   
- [ ] полнотекстовый поиск   

