import os, time
from types import SimpleNamespace
import zmq
import zlib
import pickle
import torch.multiprocessing as mp
import threading
import cv2
from kandinsky2 import get_kandinsky2
import uuid

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

model = get_kandinsky2('cuda', task_type='text2img')

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
    # Выполнение дифузии
    #result = {"result": None}
    images = model.generate_text2img(str(body), 
                                batch_size=1, h=512, w=512, num_steps=75, 
                                denoised_type='dynamic_threshold', dynamic_threshold_v=99.5, 
                                sampler='ddim_sampler', ddim_eta=0.05, guidance_scale=10)
    result = {"result": images}

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
