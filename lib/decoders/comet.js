"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CometSupplyDecoder = void 0;
const lib_1 = require("@ethersproject/abi/lib");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
const cTokenAddresses = new Set([
    '0xc3d688B66703497DAA19211EEdff47f25384cdc3',
]);
class CometSupplyDecoder extends types_1.Decoder {
    constructor() {
        super(...arguments);
        // Have to make sure that we're only picking up supply calls for cTokens
        this.functions = [
            'supply(address asset,uint amount)',
            'supplyTo(address dst,address asset,uint amount)',
            'supplyFrom(address from,address dst,address asset,uint amount)',
        ];
    }
    async decodeCall(state, node) {
        if (state.isConsumed(node))
            return null;
        if (node.type !== 'call')
            return null;
        if (!cTokenAddresses.has(node.to))
            return null;
        const functionName = this.functions.find((name) => {
            return (0, utils_1.hasSelector)(node.calldata, name);
        });
        if (functionName === undefined)
            return null;
        const [inputs] = this.decodeFunctionWithFragment(node, lib_1.FunctionFragment.from(functionName));
        state.consume(node);
        // Supply implies downstream transfer call, need to consume
        if ((0, utils_1.hasTraceExt)(node)) {
            // We know that the first external call from cToken supply is a delegatecall to Comet supply
            const cometSupplyDelegateCall = node.children[0];
            const transferFromCall = cometSupplyDelegateCall.children.filter((v) => v.type === 'call')[0];
            // First external call made from supply function is a transferFrom
            state.consumeTransferFrom(transferFromCall);
            // Consume last log from delegate call (also a transfer event)
            if (cometSupplyDelegateCall.logs) {
                state.consume(cometSupplyDelegateCall.logs[cometSupplyDelegateCall.logs.length - 1]);
            }
        }
        const supplyResult = {
            type: 'supply',
            operator: node.from,
            supplier: functionName === 'supplyFrom(address from,address dst,address asset,uint amount)'
                ? inputs['from']
                : node.from,
            supplyToken: inputs['asset'],
            amount: inputs['amount'].toBigInt(),
        };
        // Metadata for cToken
        state.requestTokenMetadata(node.to);
        // Metadata for underlying token
        state.requestTokenMetadata(supplyResult.supplyToken);
        return supplyResult;
    }
}
exports.CometSupplyDecoder = CometSupplyDecoder;
