import os, time
os.environ["CUDA_VISIBLE_DEVICES"] = "1"  # Теперь `cuda:0` будет указывать на физический GPU 1
from types import SimpleNamespace
import zmq
import zlib
import pickle
import torch
import torch.multiprocessing as mp
import threading
import cv2
from kandinsky2 import get_kandinsky2
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import uuid

# 1. Доступность CUDA вообще
print("CUDA доступно:", torch.cuda.is_available()) 

# 2. Количество доступных GPU
print("Число GPU:", torch.cuda.device_count())

# 3. Имена
if torch.cuda.device_count() > 1:
    for i in range (torch.cuda.device_count()):
        print(f"Имя устройства {i}:", torch.cuda.get_device_name(i))

# Проверка доступности CUDA и выбор устройства
device = torch.device("cuda:1" if torch.cuda.is_available() and torch.cuda.device_count() > 1 else "cuda:0" if torch.cuda.is_available() else "cpu")
print(f"Используем устройство: {device}")

QUEUE_SIZE = mp.Value('i', 0)

def compress(obj):
    p = pickle.dumps(obj)
    return zlib.compress(p)


def decompress(pickled):
    p = zlib.decompress(pickled)
    return pickle.loads(p)


TOPIC = 'snaptravel'
prediction_functions = {}

RECEIVE_PORT = 5556 #os.getenv("RECEIVE_PORT")
SEND_PORT = 5555 #os.getenv("SEND_PORT")

# генерация картинки
model = get_kandinsky2(device, task_type='text2img', model_version='2.1', use_flash_attention=False)

# переводчик
tokenizer = AutoTokenizer.from_pretrained("Helsinki-NLP/opus-mt-ru-en")
model_translater = AutoModelForSeq2SeqLM.from_pretrained("Helsinki-NLP/opus-mt-ru-en").to(device)

def _parse_recv_for_json(result, topic=TOPIC):
    compressed_json = result[len(topic) + 1:]
    return decompress(compressed_json)

def _decrease_queue():
    with QUEUE_SIZE.get_lock():
        QUEUE_SIZE.value -= 1

def _increase_queue():
    with QUEUE_SIZE.get_lock():
        QUEUE_SIZE.value += 1
    
def send_prediction(message, result_publisher, topic=TOPIC):
    _increase_queue()
    model_name = message['model']
    body = message['body']
    id = message['id']
    
    # Tokenize text
    tokenized_text = tokenizer([str(body).lower()], return_tensors='pt').to(device)

    # Perform translation and decode the output
    translation = model_translater.generate(**tokenized_text)
    body = tokenizer.batch_decode(translation, skip_special_tokens=True)[0]

    # Print translated text
    print(body)
    # Выполнение дифузии
    images = model.generate_text2img(
        str(body).lower(), 
        num_steps=70,
        batch_size=1, 
        guidance_scale=4,
        h=768, w=768,
        sampler='p_sampler', 
        prior_cf_scale=4,
        prior_steps="5"
    )
    result = {"result": images}

  #---------------------->

    if result.get('result') is None:
        time.sleep(1)
        compressed_message = compress({'error': True, 'error_msg': 'No result was given: ' + str(result), 'id': id})
        result_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
        _decrease_queue()
        return
  
  
    prediction = result['result']

    compressed_message = compress({'prediction': prediction, 'id': id})
    result_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
    _decrease_queue()
    print ("SERVER", message, f'{topic} '.encode('utf8'))

def queue_size():
    return QUEUE_SIZE.value

def load_models():
    models = SimpleNamespace()
    return models

def start():
    global prediction_functions

    models = load_models()
    prediction_functions = {
    'queue': queue_size
    }

    print(f'Connecting to {RECEIVE_PORT} in server', TOPIC.encode('utf8'))
    context = zmq.Context()
    work_subscriber = context.socket(zmq.SUB)
    work_subscriber.setsockopt(zmq.SUBSCRIBE, TOPIC.encode('utf8'))
    work_subscriber.bind(f'tcp://127.0.0.1:{RECEIVE_PORT}')

    # send work
    print(f'Connecting to {SEND_PORT} in server')
    result_publisher = context.socket(zmq.PUB)
    result_publisher.bind(f'tcp://127.0.0.1:{SEND_PORT}')

    print('Server started')
    while True:
        message = _parse_recv_for_json(work_subscriber.recv())
        threading.Thread(target=send_prediction, args=(message, result_publisher), kwargs={'topic': TOPIC}).start()

if __name__ == '__main__':
  start()


#----------------------------->




