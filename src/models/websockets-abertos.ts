import { WebSocket } from "ws"

export type WebSocketsAbertos = {
    ti: WebSocket[]
    comercial: WebSocket[]
}