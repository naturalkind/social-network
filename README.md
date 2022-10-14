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

запуск
```
python3 manage.py migrate --run-syncdb
```

```
gunicorn app.wsgi:application --bind 192.168.1.50:8888 & daphne app.asgi:application --bind 0.0.0.0 --port 8889
```

генирация пользователей и контента   
```
python3 gen_user.py
```

```
./manage.py shell < gen_content.py
```

дополнительно   
```
redis-cli flushall
```

```
sudo rm -R db.sqlite3
```


### Пример работы:
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr1.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr2.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr3.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.2/media/skr4.png)

