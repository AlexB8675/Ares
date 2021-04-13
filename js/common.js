const epoch     = 1609459200000;
const node_bits = 10;
const seq_bits  = 12;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function timestamp_from_id(id) {
    return new Date(Number((id >> (BigInt(node_bits + seq_bits))) + BigInt(epoch)));
}

function storage() {
    return window.localStorage;
}

let next_id = (function () {
    const max_node = (2 ** node_bits) - 1;
    const max_seq  = (2 ** seq_bits) - 1;

    let last = -1;
    let node = random(0, max_node);
    let seq  = random(0, max_seq);

    function timestamp() {
        return Date.now() - epoch;
    }

    function wait_next(time) {
        while (time === last) {
            time = timestamp();
        }
        return time;
    }

    return function () {
        let current = timestamp();
        if (current === last) {
            seq = (seq + 1) & max_seq;
            if (seq === 0) {
                current = wait_next(current);
            }
        } else {
            seq = 0;
        }

        last = current;
        return (BigInt(current) << BigInt(node_bits + seq_bits) |
                BigInt(node)    << BigInt(seq_bits) |
                BigInt(seq)).toString();
    }
})();