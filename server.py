import asyncio
import json
import http.server
import threading
import websockets

clients = []

def broadcast(message): # broadcast a message to all clients
    json_msg = json.dumps(message)
    for entry in clients:
        asyncio.run_coroutine_threadsafe(
            entry["ws"].send(json_msg),
            entry["loop"]
        )


async def main():
    async with websockets.serve(ws_handler, "localhost", 8765):
        print("WebSocket server running on ws://localhost:8765")
        await asyncio.Future()  # run forever

async def ws_handler(ws):
    # is_host = len(clients) == 0
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
                
            if msg["type"] == "foundGame":
                broadcast({
                    "type": "gameFound",
                    "game": msg["game"],
                })

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