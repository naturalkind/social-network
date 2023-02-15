import asyncio
import logging
import traceback

import zmq
import zmq.asyncio
from zmq.asyncio import Context
import uuid
import pickle
import zlib

async def compress(obj):
    p = pickle.dumps(obj)
    return zlib.compress(p)


async def decompress(pickled):
    p = zlib.decompress(pickled)
    return pickle.loads(p)

work_publisher = None
result_subscriber = None
TOPIC = 'snaptravel'

RECEIVE_PORT = 5555
SEND_PORT = 5556 






## set message based on language
#class HelloWorld:
#    def __init__(self) -> None:
#        self.lang = 'eng'
#        self.msg = "Hello World"

#    def change_language(self) -> None:
#        if self.lang == 'eng':
#            self.lang = 'jap'
#            self.msg = "Hello Sekai"

#        else:
#            self.lang = 'eng'
#            self.msg = "Hello World"

#    def msg_pub(self) -> str:
#        return self.msg


## receives "Hello World" from topic 'world'
## changes "World" to "Sekai" and returns message 'sekai'
#class HelloWorldPrinter:
#    # process received message
#    def msg_sub(self, msg: str) -> None:
#        print(f"message received world: {msg}")


## manages message flow between publishers and subscribers
#class HelloWorldMessage:
#    def __init__(self, url: str = '127.0.0.1', port: int = 5555):
#        # get ZeroMQ version
#        print("Current libzmq version is %s" % zmq.zmq_version())
#        print("Current  pyzmq version is %s" % zmq.__version__)

#        self.url = f"tcp://{url}:{port}"
#        # pub/sub and dealer/router
#        self.ctx = Context.instance()

#        # init hello world publisher obj
#        self.hello_world = HelloWorld()

#    def main(self) -> None:
#        # activate publishers / subscribers
#        asyncio.run(
#            asyncio.wait(
#                [
#                    self.hello_world_pub(),
#                    self.hello_world_sub(),
#                    self.lang_changer_router(),  # less restrictions than REP
#                    self.lang_changer_dealer(),  # less restrictions than REQ
#                ]
#            )
#        )

#    # generates message "Hello World" and publish to topic 'world'
#    async def hello_world_pub(self) -> None:
#        pub = self.ctx.socket(zmq.PUB)
#        pub.connect(self.url)

#        # give time to subscribers to initialize; wait time >.2 sec
#        await asyncio.sleep(0.3)
#        # send setup connection message
#        # await pub.send_multipart([b'world', "init".encode('utf-8')])
#        # await pub.send_json([b'world', "init".encode('utf-8')])

#        # without try statement, no error output
#        try:
#            # keep sending messages
#            while True:
#                # ask for message
#                msg = self.hello_world.msg_pub()
#                print(f"world pub: {msg}")

#                # slow down message publication
#                await asyncio.sleep(0.5)

#                # publish message to topic 'world'
#                # multipart: topic, message; async always needs `send_multipart()`?
#                await pub.send_multipart([b'world', msg.encode('utf-8')])

#        except Exception as e:
#            print("Error with pub world")
#            # print(e)
#            logging.error(traceback.format_exc())
#            print()

#        finally:
#            # TODO disconnect pub/sub
#            pass

#    # processes message topic 'world'; "Hello World" or "Hello Sekai"
#    async def hello_world_sub(self) -> None:
#        print("Setting up world sub")
#        obj = HelloWorldPrinter()
#        # setup subscriber
#        sub = self.ctx.socket(zmq.SUB)
#        sub.bind(self.url)
#        sub.setsockopt(zmq.SUBSCRIBE, b'world')
#        print("World sub initialized")

#        # without try statement, no error output
#        try:
#            # keep listening to all published message on topic 'world'
#            while True:
#                [topic, msg] = await sub.recv_multipart()
#                print(f"world sub; topic: {topic.decode()}\tmessage: {msg.decode()}")
#                # process message
#                obj.msg_sub(msg.decode('utf-8'))

#                # await asyncio.sleep(.2)

#                # publish message to topic 'sekai'
#                # async always needs `send_multipart()`
#                # await pub.send_multipart([b'sekai', msg_publish.encode('ascii')])

#        except Exception as e:
#            print("Error with sub world")
#            # print(e)
#            logging.error(traceback.format_exc())
#            print()

#        finally:
#            # TODO disconnect pub/sub
#            pass

#    # Deal a message to topic 'lang' that language should be changed
#    async def lang_changer_dealer(self) -> None:
#        # setup dealer
#        deal = self.ctx.socket(zmq.DEALER)
#        deal.setsockopt(zmq.IDENTITY, b'lang_dealer')
#        deal.connect(self.url[:-1] + f"{int(self.url[-1]) + 1}")
#        print("Command dealer initialized")

#        # give time to router to initialize; wait time >.2 sec
#        await asyncio.sleep(0.3)
#        msg = "Change that language!"

#        # without try statement, no error output
#        try:
#            # keep sending messages
#            while True:
#                print(f"Command deal: {msg}")

#                # slow down message publication
#                await asyncio.sleep(2.0)

#                # publish message to topic 'world'
#                # multipart: topic, message; async always needs `send_multipart()`?
#                await deal.send_multipart([msg.encode('utf-8')])

#        except Exception as e:
#            print("Error with pub world")
#            # print(e)
#            logging.error(traceback.format_exc())
#            print()

#        finally:
#            # TODO disconnect dealer/router
#            pass

#    # changes Hello xxx message when a command is received from topic 'lang'; keeps listening for commands
#    async def lang_changer_router(self) -> None:
#        # setup router
#        rout = self.ctx.socket(zmq.ROUTER)
#        rout.bind(self.url[:-1] + f"{int(self.url[-1]) + 1}")
#        # rout.setsockopt(zmq.SUBSCRIBE, b'')
#        print("Command router initialized")

#        # without try statement, no error output
#        try:
#            # keep listening to all published message on topic 'world'
#            while True:
#                [id_dealer, msg] = await rout.recv_multipart()
#                print(
#                    f"Command rout; Sender ID: {id_dealer!r};\tmessage: {msg.decode()}"
#                )

#                self.hello_world.change_language()
#                print(
#                    "Changed language! New language is: {}\n".format(
#                        self.hello_world.lang
#                    )
#                )

#        except Exception as e:
#            print("Error with sub world")
#            # print(e)
#            logging.error(traceback.format_exc())
#            print()

#        finally:
#            # TODO disconnect dealer/router
#            pass


#def main() -> None:
#    hello_world = HelloWorldMessage()
#    hello_world.main()


#if __name__ == '__main__':
#    main()


def start():
    global work_publisher, result_subscriber
    context = Context()
    work_publisher = context.socket(zmq.PUB)
    work_publisher.connect(f'tcp://127.0.0.1:{SEND_PORT}') 

async def _parse_recv_for_json(result, topic=TOPIC):
    compressed_json = result[len(topic) + 1:]
    return await decompress(compressed_json)

async def send(model=None, topic=TOPIC):
    id = str(uuid.uuid4())
    message = {'body': "TEST", 'model': model, 'id': id}
    compressed_message = await compress(message)
#    work_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
    await asyncio.sleep(0.5)
    await work_publisher.send(f'{topic} '.encode('utf8') + compressed_message)
    return id

async def get(id, topic=TOPIC):
    context = Context()
    result_subscriber = context.socket(zmq.SUB)
    #result_subscriber.bind(f'tcp://127.0.0.1:{RECEIVE_PORT}')
    result_subscriber.setsockopt(zmq.SUBSCRIBE, topic.encode('utf8'))
    result_subscriber.connect(f'tcp://127.0.0.1:{RECEIVE_PORT}')
    msg = await result_subscriber.recv()
    result = await _parse_recv_for_json(msg)
    
    while result['id'] != id:
        msg = await result_subscriber.recv()
        result = await _parse_recv_for_json(msg)

    result_subscriber.close()

    if result.get('error'):
        raise Exception(result['error_msg'])
    return result

async def send_and_get():
    id = await send()
    res = await get(id)
    print ("SEND_AND_GET------------>", res)    

start()
    
asyncio.run(
    asyncio.wait(
        [
            send_and_get(),
        ]
    )
)    
