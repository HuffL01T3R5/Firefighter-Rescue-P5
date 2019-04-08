class FirefighterCorporation extends House {
    static ALGORITHM_A_STAR = 0;
    static ALGORITHM_IDA_STAR = 1;
    static STATUS_RECEIVING_CALLS = 0;
    static STATUS_EXCHANGING_INFORMATION = 1;
    static STATUS_SHARING_SCORES = 2;
    static STATUS_ON_RESCUE = 3;

    constructor(block, side, algorithm) {
        super(block, side);
        this.truck = null;
        this.paths = {};
        this.privateQueue = [];
        this.queue = [];
        this.algorithm = algorithm;
        this.status = FirefighterCorporation.STATUS_RECEIVING_CALLS;
    }

    draw() {
        this.drawWithImage(corporationImg);
    }

    sendTrucks() {
        const house = this.getNextHouse();
        if (house) {
            this.truck = new FirefighterTruck(this.paths[house.block.id], city.graph);
            this.truck.target = house;
            this.truck.send();
        } else {
            this.queue.length = 0;
            this.status = FirefighterCorporation.STATUS_RECEIVING_CALLS;
            this.emitLog('Now accepting calls');
            enableBtnStart();
        }
    }

    callbackTruckGarage() {
        this.sendTrucks();
    }

    call(house) {
        this.emitLog('Receiving call from house ' + house.block.id);

        const ret = this.findPath(house);
        this.paths[house.block.id] = ret['path'];
        this.privateQueue.push({
            house, 'score': ret.score, 'corpId': this.id
        });
    }

    findPath(house) {
        if (this.algorithm === FirefighterCorporation.ALGORITHM_A_STAR) {
            return aStar(city.graph, house, this.id);
        } else if (this.algorithm === FirefighterCorporation.ALGORITHM_IDA_STAR) {
            return aStar(city.graph, house, this.id);
        }

        return -1;
    }

    getNextHouse() {
        for (let i = 0; i < this.queue.length; i++) {
            if (this.queue[i].corpId === this.id) {
                return this.queue.splice(i, 1)[0].house;
            }
        }
        return undefined;
    }

    shareInfo(corporations) {
        for (const corp of corporations) {
            this.emitLog('Houses on fire: ' + this.queueToString(this.privateQueue),corp.id);
            corp.receiveInfo(this.privateQueue);
        }
    }

    receiveInfo(info) {
        for (const e of info) {
            const ret = this.findPath(e.house);
            this.queue.push({'house': e.house, 'score': ret.score, 'corpId': this.id});
        }
    }

    shareScores(corporations) {
        for (const corp of corporations) {
            this.emitLog('My scores: ' + this.queueScoresToString(this.privateQueue),corp.id);
            corp.receiveScores(this.privateQueue);
        }
    }

    receiveScores(info) {
        this.queue = this.queue.concat(info);
    }

    emitLog(message, dest) {
        if (dest) {
            console.log('[' + this.id + '] -> [' + dest + '] ' + message);
        } else {
            console.log('[' + this.id + '] ' + message);
        }
    }

    queueToString(queue) {
        let str = '[', first = true;
        for (const info of queue) {
            str += (first ? '' : ', ') + info.house.block.id;
            first = false;
        }
        str += ']';
        return str;
    }

    queueScoresToString(queue) {
        let str = '[', first = true;
        for (const info of queue) {
            str += (first ? '' : ', ') + '(h: ' + info.house.block.id + '; score: ' + info.score + ')';
            first = false;
        }
        str += ']';
        return str;
    }

    fillPrivateQueue() {
        this.privateQueue = this.privateQueue.concat(this.queue);
        this.queue.length = 0;
    }

    fillAndSortQueue() {
        this.queue = this.queue.concat(this.privateQueue);
        this.privateQueue.length = 0;

        this.queue.sort((a, b) => {
            if (a.score === b.score)
                return 0;
            if (a.score > b.score)
                return -1;
            return 1;
        });

        const finalQueue = [];
        for (const info of this.queue) {
            if (!this.isOnQueue(info.house, finalQueue)) {
                finalQueue.push(info);
            }
        }

        this.queue = finalQueue;
    }

    isOnQueue(house, queue) {
        for (let i = 0; i < queue.length; i++) {
            if (queue[i].house.block.id === house.block.id) {
                return true;
            }
        }
        return false;
    }
}
