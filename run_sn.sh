#!/bin/bash

cd /media/sadko/1b32d2c7-3fcf-4c94-ad20-4fb130a7a7d4/PLAYGROUND/Kandinsky_2.0/Kandinsky-2.0

source venv/bin/activate

cd social-network

python manage.py runserver 192.168.1.50:8888
