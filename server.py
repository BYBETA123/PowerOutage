import asyncio
import json
import http.server
import threading
import websockets
from RPS import RPSGame
clients = []
currentGrid = []
inGame = "" # "" is false, otherwise populated with game name
currentRPSGame = None
identifier = 0

def broadcast(message): # broadcast a message to all clients

    json_msg = json.dumps(message)

    for entry in clients:
        asyncio.run_coroutine_threadsafe(
            entry["ws"].send(json_msg),
            entry["loop"]
        )

async def game_loop():
    msg = ""
    while msg != "end":
        broadcast({
            "type": "updateGrid",
            "g": currentRPSGame.iconList,
        })
        msg = currentRPSGame.tick()
        await asyncio.sleep(0.025)

async def main():
    async with websockets.serve(ws_handler, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()  # run forever

async def ws_handler(ws):
    global inGame
    loop = asyncio.get_event_loop()
    client = {"ws": ws, "name": "REMOVEME", "loop": loop, "host": False}
    clients.append(client)

    await ws.send(json.dumps({
        "type": "setName"
    }))

    try:
        async for raw in ws:
            msg = json.loads(raw)
            print(msg) # debug

            if msg["type"] == "starting": # starting the game
                broadcast({
                    "type": "starting",
                    "game": msg["game"],
                })
                continue

            if msg["type"] == "setName":
                n = msg["name"]
                # check the name is unique
                if any(c["name"] == n for c in clients):
                    await ws.send(json.dumps({
                        "type": "nameFailed",
                        "reason": f"The name \"{n}\" is already taken. Please choose another name.",
                    }))
                    continue
                client["name"] = n
                # if the name has begins with the "\" character, make them host, prioritising the \beta name"
                if n[0] == "\\" or n[0] == "a":
                    client["host"] = True
                    # if the name is \beta, make them host regardless of other clients
                    if n == "\\beta":
                        for c in clients:
                            c["host"] = False
                        client["host"] = True
                    # cut the "\" character from the name for display purposes
                    if n[0] == "\\":
                        client["name"] = n[1:]


                await ws.send(json.dumps({
                    "type": "nameSet",
                    "host": client["host"],
                    "name": client["name"],
                }))
                print(f"{client['name']} connected, total clients: {clients}")
                # broadcast the new client list to all clients
                broadcast({
                    "type": "playerJoined",
                    "namelist" : [c["name"] if c["name"] != "REMOVEME" else None for c in clients],
                })

                # if we are in a game, fast track them into the room
                print(inGame)
                if inGame != "":
                    await ws.send(json.dumps({
                        "type": "starting",
                        "game": inGame,
                    }))

                
            if msg["type"] == "foundGame":
                broadcast({
                    "type": "gameFound",
                    "game": msg["game"],
                })
                identifier = 0 # reset the identifier for the grid icons, so they are consistent across clients
                print(inGame)
                inGame = msg["game"]
                print(inGame)

            if msg["type"] == "buzz in":
                # find the host client
                host_client = next((c for c in clients if c["host"]), None)
                if host_client: # we found the host
                    # send a message to the host client with the name of the player who buzzed in
                    asyncio.run_coroutine_threadsafe(
                        host_client["ws"].send(json.dumps({
                            "type": "buzz in",
                            "name": client["name"],
                        })),
                        host_client["loop"]
                    )

            if msg["type"] == "lock buzzers":
                broadcast({
                    "type": "lock buzzers",
                })

            if msg["type"] == "unlock buzzers":
                broadcast({
                    "type": "unlock buzzers",
                })

            if msg["type"] == "clear buzzers":
                broadcast({
                    "type": "clear buzzers",
                })

            if msg["type"] == "unbuzz":
                broadcast({
                    "type": "unbuzz",
                    "name": msg["name"],
                })

            if msg["type"] == "summon":
                currentGrid.append([msg["x"]*50, msg["y"]*50, msg["img"], msg["target"], identifier])
                identifier += 1
                broadcast({
                    "type": "updateGrid",
                    "g": currentGrid,
                })

            if msg["type"] == "startRPS":
                global currentRPSGame
                currentRPSGame = RPSGame(currentGrid)
                asyncio.create_task(game_loop())

    except websockets.exceptions.ConnectionClosed:
        pass
    finally:
        clients.remove(client)

        # if is_host and clients:
        #     clients[0]["isHost"] = True
        #     await clients[0]["ws"].send(json.dumps({
        #         "type": "roleChange",
        #         "role": "host",
        #         "state": dict(state),
        #     }))

# --- HTTP Server (serves public/ folder) ---
def run_http():
    import os
    os.chdir("public")
    handler = http.server.SimpleHTTPRequestHandler
    httpd = http.server.HTTPServer(("localhost", 3000), handler)
    print("HTTP server running on http://localhost:3000")
    httpd.serve_forever()


threading.Thread(target=run_http, daemon=True).start()
asyncio.run(main())