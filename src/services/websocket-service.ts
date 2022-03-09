import { Server } from 'http';
import qs from 'qs';
import ws, { WebSocket, WebSocketServer } from 'ws';
import { WebSocketsAbertos } from '../models/websockets-abertos';

const websocketsAbertos: WebSocketsAbertos = { ti: [], comercial: [] }

export const iniciarWebsocket = (server: Server) => {
    const websocketServer: WebSocketServer = new ws.Server({
        noServer: true,
        path: "/ws"
    });

    console.log("Servidor WebSocket configurado na rota /ws")

    server.on("upgrade", (request, socket, head) => {
        websocketServer.handleUpgrade(request, socket, head, (websocket) => {

            const [_path, paramsString] = request.url?.split("?") || []
            const params = qs.parse(paramsString)
            console.log("Params recebidos:", params)
            let arrayWebsocketsAbertos: WebSocket[] = []
            let tipoConexao = "SEM TIPO"
            if (params.tipo == "ti") {
                tipoConexao = "TI"
                arrayWebsocketsAbertos = websocketsAbertos.ti
            } else if (params.tipo == "comercial") {
                tipoConexao = "COMERCIAL"
                arrayWebsocketsAbertos = websocketsAbertos.comercial
            } else {
                websocket.send("Tipo não informado. Informe o tipo nos parâmetos da conexão, ex.: /ws?tipo=ti ou /ws?tipo=comercial. Encerrando conexão...")
                websocket.terminate()
            }
            console.log(`Nova conexão ${tipoConexao} via websocket de ${request.socket.remoteAddress}`)
            arrayWebsocketsAbertos.push(websocket)

            websocket.send('Iniciando contador...');
            let contador = 1
            setInterval(() => {
                websocket.send('Mensagem ' + contador + ".");
                contador++
            }, 1000)

            websocket.on("close", () => {
                console.log(`Conexão ${tipoConexao} de ${request.socket.remoteAddress} encerrada.`)
                const indiceWebsocket = arrayWebsocketsAbertos.indexOf(websocket)
                arrayWebsocketsAbertos.splice(indiceWebsocket, 1)
            })
        });
    });

    return websocketServer;
}