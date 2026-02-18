#!/bin/bash

# Переходим в папку social-network
#cd social-network

# Активируем виртуальное окружение Python
#source venv/bin/activate

# Запускаем скрипты Python
python manage.py runserver 192.168.1.60:8888 &
python manage.py runworker nnapp &

# Создаем новую вкладку в окне терминала
#gnome-terminal --tab -e "bash -c 'cd /media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/PLAYGROUND/Kandinsky_2.1/Kandinsky-2 && source venv/bin/activate && python serv_2.py'"

## Функция завершения запущенных скриптов python при нажатии control + c
#function cleanup() {
#    pkill -P $$
#    exit 0
#}

## Запускаем функцию завершения скриптов при нажатии control + c
#trap cleanup SIGINT

# Функция для безопасного завершения скриптов при нажатии Ctrl+C
trap 'kill $(jobs -p)' SIGINT

# Ожидаем завершения выполнения всех скриптов
wait
