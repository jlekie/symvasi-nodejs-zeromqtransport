import Zmq from 'zmq';
import Deasync from 'deasync';

import { TcpEndpoint } from './endpoint';

export class EndpointFactory {
    load(data) {
        let decodedData = data.toString('utf8');

        let facets = decodedData.split('|');

        switch (facets[0]) {
            case 'tcp': return new TcpEndpoint(facets[1], parseInt(facets[2], 10));
            default: throw new Error(`Unknown endpoint type "${facets[0]}"`);
        }
    }
}