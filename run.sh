#!/bin/bash

# Переходим в папку social-network
#cd social-network

# Активируем виртуальное окружение Python
source venv/bin/activate

# Запускаем скрипты Python
python manage.py runserver 192.168.1.50:8888 &
python manage.py runworker nnapp &

# Переходим в папку media
cd /media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/PLAYGROUND/Kandinsky_2.1/Kandinsky-2

# Активируем второе виртуальное окружение Python
source venv/bin/activate

# Запускаем функцию server.py в новом потоке
python serv_2.py &

# Функция завершения запущенных скриптов python при нажатии control + c
function cleanup() {
    pkill -P $$
    exit 0
}

# Запускаем функцию завершения скриптов при нажатии control + c
trap cleanup SIGINT

# Ожидаем завершения всех процессов
wait
