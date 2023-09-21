
// import { AbstractMessageReader, AbstractMessageWriter, DataCallback, Message, Disposable } from 'vscode-languageclient/node.js';
import {  AbstractMessageReader, AbstractMessageWriter, DataCallback, Message, Disposable, createConnection } from 'vscode-languageserver/node.js';
import { createHelloWorldServices } from '../language/hello-world-module.js';
import { DefaultSharedModuleContext, EmptyFileSystemProvider, startLanguageServer } from 'langium';
// import express from 'express';
// import http from 'http'
import { WebSocketServer, WebSocket } from 'ws'

//const app = express();

// initialize a simple http server
//const server = http.createServer(app);

// initialize the WebSocket server instance



// TODO maybe use https://github.com/TypeFox/monaco-languageclient/blob/60a39f2bdf33281940c4697af2481aeab1276aa8/packages/vscode-ws-jsonrpc/src/socket/reader.ts#L10g
// That one also mentions the possibility to forward to separate process:
// https://github.com/TypeFox/monaco-languageclient/blob/60a39f2bdf33281940c4697af2481aeab1276aa8/packages/vscode-ws-jsonrpc/README.md?plain=1#L30
class WebSocketMessageWriter extends AbstractMessageWriter {
    private readonly ws: WebSocket;

    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
    }

    write(msg: Message): Promise<void> {
        return new Promise((resolve, reject) => {
            const content = JSON.stringify(msg);
            this.ws.send(content, err => {
                if (err) {
                    reject(err);
                } else {
                    resolve();
                }
            });
        });
    }

    end(): void {}
}

class WebSocketMessageReader extends AbstractMessageReader {
    private readonly ws: WebSocket;

    constructor(ws: WebSocket) {
        super();
        this.ws = ws;
    }

    listen(callback: DataCallback): Disposable {
        const messageListener = (rawMessage: Message) => {
            const message = JSON.parse(rawMessage.toString()) as Message;
            callback(message);
        };
        const closeListener = () => this.fireClose()

        this.ws.on('message', messageListener);
        this.ws.on('close', closeListener);

        const d: Disposable = {
            dispose: () => {
                this.ws.removeListener('message', messageListener);
                this.ws.removeListener('close', closeListener);
            }
        }
        return d;
    }
}

// const app = express();
// const server = http.createServer(app);

const wsServer = new WebSocketServer({ port: 3033 });;
//const websocketServer = new ws.WebSocket.Server({ port: 3033 });
wsServer.on('connection', (ws, request) => {
    const reader = new WebSocketMessageReader(ws);
    const writer = new WebSocketMessageWriter(ws);
    const connection = createConnection(reader, writer);

    const ctx: DefaultSharedModuleContext = { connection, fileSystemProvider: () => new EmptyFileSystemProvider() };
    const services = createHelloWorldServices(ctx);
    startLanguageServer(services.shared);
});
// server.listen(process.env.PORT || 8080, () =>{
//      console.log('Server started');});