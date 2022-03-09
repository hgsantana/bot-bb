import { Server } from 'http';
import ws, { WebSocketServer } from 'ws';

export const iniciarWebsocket = (server: Server) => {
    const websocketServer: WebSocketServer = new ws.Server({
        noServer: true,
        path: "/ws"
    });

    console.log("Servidor WebSocket configurado na rota /ws")

    server.on("upgrade", (request, socket, head) => {
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {
            console.log("Nova conexão via websocket de", request.socket.remoteAddress)

            websocket.send('Iniciando contador...');
            let contador = 1
            setInterval(() => {
                websocket.send('Mensagem ' + contador + ".");
                contador++
            }, 1000)

            websocket.on("close", () => console.log("Conexão de " + request.socket.remoteAddress + " encerrada."))
        });
    });

    return websocketServer;
}