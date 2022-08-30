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


