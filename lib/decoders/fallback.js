"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TransferDecoder = void 0;
const actions_1 = require("../sdk/actions");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
class TransferDecoder extends types_1.Decoder {
    async decodeCall(state, node) {
        if (state.isConsumed(node))
            return null;
        if (node.value.isZero())
            return null;
        return {
            type: 'transfer',
            operator: node.from,
            from: node.from,
            to: node.to,
            token: actions_1.NATIVE_TOKEN,
            amount: node.value.toBigInt(),
        };
    }
    async decodeLog(state, node, log) {
        if (state.isConsumed(log))
            return null;
        if (!(0, utils_1.hasTopic)(log, `Transfer(address,address,uint256)`))
            return null;
        if (node.abi) {
            const decodedEvent = node.abi.parseLog(log);
            state.requestTokenMetadata(log.address);
            if (decodedEvent.args[0] === '0x0000000000000000000000000000000000000000') {
                return {
                    type: 'mint-erc20',
                    operator: node.from,
                    token: log.address,
                    to: decodedEvent.args[1],
                    amount: decodedEvent.args[2].toBigInt(),
                };
            }
            else if (decodedEvent.args[1] === "0x0000000000000000000000000000000000000000") {
                return {
                    type: 'burn-erc20',
                    operator: node.from,
                    token: log.address,
                    from: decodedEvent.args[0],
                    amount: decodedEvent.args[2].toBigInt(),
                };
            }
            return {
                type: 'transfer',
                operator: node.from,
                token: log.address,
                from: decodedEvent.args[0],
                to: decodedEvent.args[1],
                amount: decodedEvent.args[2].toBigInt(),
            };
        }
        return null;
    }
}
exports.TransferDecoder = TransferDecoder;
