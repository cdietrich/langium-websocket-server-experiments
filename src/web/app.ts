// import { AbstractMessageReader, AbstractMessageWriter, DataCallback, Message, Disposable } from 'vscode-languageclient/node.js';
import {
  IWebSocket,
  WebSocketMessageReader,
  WebSocketMessageWriter,
} from "vscode-ws-jsonrpc";
import {
  IConnection,
  createConnection,
  createServerProcess,
  forward,
} from "vscode-ws-jsonrpc/server";
import { Message } from "vscode-languageserver";
import express from "express";
// import http from 'http'
import { WebSocketServer } from "ws";

import { dirname } from "path";
import { fileURLToPath } from "url";
import { IncomingMessage } from "http";
import { Socket } from "net";

/**
 * Solves: __dirname is not defined in ES module scope
 */
export const getLocalDirectory = (referenceUrl: string | URL) => {
  const __filename = fileURLToPath(referenceUrl);
  return dirname(__filename);
};
//const app = express();

// initialize a simple http server
//const server = http.createServer(app);

// initialize the WebSocket server instance

// TODO maybe use https://github.com/TypeFox/monaco-languageclient/blob/60a39f2bdf33281940c4697af2481aeab1276aa8/packages/vscode-ws-jsonrpc/src/socket/reader.ts#L10g
// That one also mentions the possibility to forward to separate process:
// https://github.com/TypeFox/monaco-languageclient/blob/60a39f2bdf33281940c4697af2481aeab1276aa8/packages/vscode-ws-jsonrpc/README.md?plain=1#L30

// const app = express();
// const server = http.createServer(app);

const launchLanguageServer = (socket: IWebSocket) => {
  const reader = new WebSocketMessageReader(socket);
  const writer = new WebSocketMessageWriter(socket);
  const socketConnection = createConnection(reader, writer, () =>
    socket.dispose()
  );
  const serverConnection: IConnection = createServerProcess("Example", "node", [
    "./out/language/main.cjs", "--stdio"
  ])!;

  forward(socketConnection, serverConnection, (message) => {
    if (Message.isNotification(message)) {
      if (message.method === "testNotification") {
        // handle the test notification
      }
    }
    return message;
  });
  // const connection = createConnection(reader, writer);
  // const ctx: DefaultSharedModuleContext = { connection, fileSystemProvider: () => new EmptyFileSystemProvider() };
  // const services = createHelloWorldServices(ctx);
  // startLanguageServer(services.shared);
};

export const runServer = () => {
  process.on("uncaughtException", function (err: any) {
    console.error("Uncaught Exception: ", err.toString());
    if (err.stack) {
      console.error(err.stack);
    }
  });

  // create the express application
  const app = express();
  // server the static content, i.e. index.html
  const dir = getLocalDirectory(import.meta.url);
  app.use(express.static(dir));
  // start the server
  const server = app.listen(3033);
  // create the web socket
  const wss = new WebSocketServer({
    noServer: true,
    perMessageDeflate: false,
  });
  server.on(
    "upgrade",
    (request: IncomingMessage, socket: Socket, head: Buffer) => {
      const baseURL = `http://${request.headers.host}/`;
      const pathname = request.url
        ? new URL(request.url, baseURL).pathname
        : undefined;
      if (pathname === "/sampleServer") {
        wss.handleUpgrade(request, socket, head, (webSocket) => {
          const socket: IWebSocket = {
            send: (content) =>
              webSocket.send(content, (error) => {
                if (error) {
                  throw error;
                }
              }),
            onMessage: (cb) =>
              webSocket.on("message", (data) => {
                console.log(data.toString());
                cb(data);
              }),
            onError: (cb) => webSocket.on("error", cb),
            onClose: (cb) => webSocket.on("close", cb),
            dispose: () => webSocket.close(),
          };
          // launch the server when the web socket is opened
          if (webSocket.readyState === webSocket.OPEN) {
            launchLanguageServer(socket);
          } else {
            webSocket.on("open", () => launchLanguageServer(socket));
          }
        });
      }
    }
  );
};

runServer();

// const wsServer = new WebSocketServer({ port: 3033 });;
// //const websocketServer = new ws.WebSocket.Server({ port: 3033 });
// wsServer.on('connection', (ws: IWebSocket, request) => {
//     const reader = new WebSocketMessageReader(ws);
//     const writer = new WebSocketMessageWriter(ws);
//     const connection = createConnection(reader, writer);

// });
// server.listen(process.env.PORT || 8080, () =>{
//      console.log('Server started');});
