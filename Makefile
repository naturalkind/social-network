redis:
   redis-server --port 6380 --slaveof 127.0.0.1 6379
app:
   python manage.py starttornadoapp
comment:
   python manage.py tornadocommentS
wallpost:
   python manage.py tornadowallS
serv:
   gunicorn app.wsgi:application --bind 192.168.1.50:8888

добавить в сайт возможность переключать видео фото на лету с ютуба
# social-network - очередная реализация социальной сети на python

При создании, учитывал возможность использовать в проектах с высокой нагрузкой

#### Для запуска нужно:
* Django - работа с БД
* Tornado - websocket
* Redis - нереляционная высокопроизводительная СУБД
#### Пуск:
***./start***


