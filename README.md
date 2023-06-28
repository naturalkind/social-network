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

### Пример работы
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.1/media/skr1.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.1/media/skr2.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.1/media/skr3.png)
![Иллюстрация к проекту](https://github.com/evilsadko/social-network/blob/v0.1/media/skr4.png)