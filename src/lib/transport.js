import Zmq from 'zmq';
import Deasync from 'deasync';

import { Model, ServerTransport, ClientTransport } from 'symvasi-runtime';

export class ZeroMQServerTransport extends ServerTransport {
    constructor(endpoint) {
        super(endpoint);
    }
    
    async listenAsync() {
        let connectionString = this.endpoint.toServerConnectionString();
        
        let socket = this.socket = Zmq.socket('rep');
        socket.monitor(500, 0);
        socket.bindSync(connectionString);
        
        this.messageBuffer = [];
        socket.on('message', (...frames) => {
            console.log(`[Server ${connectionString}] Received data...`);
            this.messageBuffer.push(frames);
        });

        return new Promise((resolve, reject) => {
            socket.once('listen', () => {
                socket.unmonitor();

                resolve();
            });
        });
    }
    
    getReceivePromise() {
        return new Promise((resolve, reject) => {
            if (this.messageBuffer.length > 0) {
                resolve(this.messageBuffer.shift());
            }
            else {
                this.socket.once('message', () => {
                    resolve(this.messageBuffer.shift());
                });
            }
        });
    }
    
    send(data) {
        let signalBuffer = Buffer.allocUnsafe(8);
        signalBuffer.writeInt32BE(0);
        
        let frames = [
            signalBuffer,
            null,
            data
        ];
        
        this.socket.send(frames);
    }
    receive() {
        let message;
        this.getReceivePromise().then((d) => {
            message = d;
        });
        Deasync.loopWhile(() => !message);
        if (message.length < 3) {
            throw new Error('Invalid frame count');
        }

        let signal = message[0].readUInt32BE();
        
        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[2]}"`);
        }
        
        return message[2];
    }
    async receiveAsync() {
        let message = await this.getReceivePromise();
        if (message.length < 3) {
            throw new Error('Invalid frame count');
        }
        
        let signal = message[0].readUInt32BE();

        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[2]}"`);
        }
        
        return message[2];
    }
}
export class ZeroMQRequestServerTransport extends ServerTransport {
    constructor(endpoint) {
        super(endpoint);
    }
    
    listen() {
        let connectionString = this.endpoint.toClientConnectionString();
        
        let socket = this.socket = Zmq.socket('req');
        socket.connect(connectionString);
        
        this.messageBuffer = [];
        socket.on('message', (...frames) => {
            console.log(`[ReqServer ${connectionString}] Received data...`);
            this.messageBuffer.push(frames);
        });
        
        console.log('Sending registration request...');
        socket.send();
        
        console.log('Waiting for registration request...');
        let data;
        this.getReceivePromise().then((d) => {
            data = d;
        });
        Deasync.loopWhile(() => !data);
        
        console.log('Sending all clear...');
        socket.send();
    }
    
    getReceivePromise() {
        return new Promise((resolve, reject) => {
            if (this.messageBuffer.length > 0) {
                resolve(this.messageBuffer.shift());
            }
            else {
                this.socket.once('message', () => {
                    resolve(this.messageBuffer.shift());
                });
            }
        });
    }
    
    send(data) {
        let signalBuffer = Buffer.allocUnsafe(8);
        signalBuffer.writeInt32BE(0);

        let frames = [
            this.clientAddress,
            null,
            signalBuffer,
            null,
            data
        ];
        
        this.socket.send(frames);
    }
    receive() {
        let message;
        this.getReceivePromise().then((d) => {
            message = d;
        });
        Deasync.loopWhile(() => !message);
        if (message.length < 5) {
            throw new Error('Invalid frame count');
        }

        this.clientAddress = message[0];

        let signal = message[2].readUInt32BE();
        
        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[4]}"`);
        }
        
        return message[4];
    }
    async receiveAsync() {
        let message = await this.getReceivePromise();
        if (message.length < 5) {
            throw new Error('Invalid frame count');
        }

        this.clientAddress = message[0];

        let signal = message[2].readUInt32BE();
        
        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[4]}"`);
        }
        
        return message[4];
    }
}

export class ZeroMQClientTransport extends ClientTransport {
    constructor(endpoint) {
        super(endpoint);
    }
    
    async connectAsync() {
        let connectionString = this.endpoint.toClientConnectionString();
        
        let socket = this.socket = Zmq.socket('req');
        socket.monitor(500, 0);
        socket.connect(connectionString);
        
        this.messageBuffer = [];
        socket.on('message', (...frames) => {
            console.log(`[Client ${connectionString}] Received data...`);
            this.messageBuffer.push(frames);
        });

        return new Promise((resolve, reject) => {
            socket.once('connect', () => {
                socket.unmonitor();

                resolve();
            });
        });
    }
    
    getReceivePromise() {
        return new Promise((resolve, reject) => {
            if (this.messageBuffer.length > 0) {
                resolve(this.messageBuffer.shift());
            }
            else {
                this.socket.once('message', () => {
                    resolve(this.messageBuffer.shift());
                });
            }
        });
    }
    
    send(data) {
        let signalBuffer = Buffer.allocUnsafe(8);
        signalBuffer.writeInt32BE(0);

        let frames = [
            signalBuffer,
            null,
            data
        ];
        
        this.socket.send(frames);
    }
    receive() {
        let message;
        this.getReceivePromise().then((d) => {
            message = d;
        });
        Deasync.loopWhile(() => !message);
        if (message.length < 3) {
            throw new Error('Invalid frame count');
        }

        let signal = message[0].readUInt32BE();
        
        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[2]}"`);
        }
        
        return message[2];
    }
    async receiveAsync() {
        let message = await this.getReceivePromise();
        if (message.length < 3) {
            throw new Error('Invalid frame count');
        }

        let signal = message[0].readUInt32BE();
        
        if (signal !== 0) {
            throw new Error(`Server responded with (${signal}) "${message[2]}"`);
        }
        
        return message[2];
    }
}