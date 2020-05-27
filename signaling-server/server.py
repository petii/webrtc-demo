import asyncio
import websockets

connections = [];

async def echo(websocket, path):
    print(f'{websocket}: {path}')
    connections.append(websocket)
    async for message in websocket:
        print(f'recieved {message} from {websocket}')
        for connection in connections:
            await connection.send(message)
        #await websocket.send(message)

start_server = websockets.serve(echo, "localhost", 8765)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
