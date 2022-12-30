# social-network - очередная реализация социальной сети на python

При создании, учитывал возможность использовать в проектах с высокой нагрузкой

#### Для запуска нужно:

* Django 3.2.16 - работа с БД
* Channels 3.0.1 - websocket
* Channels-redis 2.4.2 - django channels, которые используют Redis в качестве резервного хранилища
* Daphne - ASGI сервер протоколов Django
* Gunicorn - python WSGI HTTP сервер для UNIX

#### Пуск:

установка нужных компонентов   
```
python3 -m venv <myenvname>
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

### Пример работы:
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr1.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr2.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr3.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr4.png)

