import OS from 'os';

import _ from 'lodash';
import Bluebird from 'bluebird';
import Zmq from 'zmq';
import Deasync from 'deasync';
import Portfinder from 'portfinder';

import { Endpoint } from 'symvasi-runtime';

function findIPv4Address(ifaceName) {
    let ifaces = OS.networkInterfaces();

    let iface = ifaces[ifaceName];
    if (!iface) {
        throw new Error(`Interface "${ifaceName}" does not exist`);
    }

    let ipv4 = _.find(iface, dev => dev.family === 'IPv4');
    if (!ipv4) {
        throw new Error(`Interface "${ifaceName}" does not support IPv4`);
    }

    return ipv4.address;
}
async function findPortAsync() {
    let port = await Bluebird.promisify(Portfinder.getPort)();
    Portfinder.basePort = port + 1;

    return port;
}

export class TcpEndpoint extends Endpoint {
    static async allocateAsync(iface, port = 0) {
        let address = findIPv4Address(iface);

        if (port === 0) {
            port = await findPortAsync();
        }

        return new TcpEndpoint(address, port);
    }

    constructor(address, port) {
        super();

        this.address = address;
        this.port = port;
    }

    toServerConnectionString() {
        return `tcp://*:${this.port}`;
    }
    toClientConnectionString() {
        return `tcp://${this.address}:${this.port}`;
    }

    save() {
        return {
            id: `tcp:${this.address}:${this.port}`,
            data: new Buffer(`tcp|${this.address}|${this.port}`)
        };
    }

    equals(endpoint) {
        if (endpoint instanceof TcpEndpoint) {
            return this.address === endpoint.address && this.port === endpoint.port;
        }

        return false;
    }
}
export class DiscoveryEndpoint extends Endpoint {
    constructor(discoverer) {
        super();

        this.discoverer = discoverer;
    }

    toServerConnectionString() {
        let endpoint = this.discoverer.getEndpoint();

        return endpoint.toServerConnectionString();
    }
    toClientConnectionString() {
        let endpoint = this.discoverer.getEndpoint();

        return endpoint.toClientConnectionString();
    }
}