"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WrappedNativeTokenDecoder = void 0;
const actions_1 = require("../sdk/actions");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
const wrappedNativeTokens = {
    ethereum: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
};
class WrappedNativeTokenDecoder extends types_1.CallDecoder {
    constructor() {
        super();
        this.functions[''] = this.decodeWrap;
        this.functions['deposit()'] = this.decodeWrap;
        this.functions['withdraw(uint256 amount)'] = this.decodeUnwrap;
    }
    async isTargetContract(state, address) {
        return (0, utils_1.isEqualAddress)(wrappedNativeTokens['ethereum'], address);
    }
    async decodeWrap(state, node, input, output) {
        if ((0, utils_1.hasTraceExt)(node)) {
            state.consumeAll(node);
        }
        state.requestTokenMetadata(node.to);
        return {
            type: 'wrap-native-token',
            token: actions_1.NATIVE_TOKEN,
            operator: node.from,
            amount: node.value.toBigInt(),
        };
    }
    async decodeUnwrap(state, node, input, output) {
        if ((0, utils_1.hasTraceExt)(node)) {
            state.consumeAllRecursively(node);
        }
        state.requestTokenMetadata(node.to);
        return {
            type: 'unwrap-native-token',
            token: actions_1.NATIVE_TOKEN,
            operator: node.from,
            amount: input['amount'].toBigInt(),
        };
    }
}
exports.WrappedNativeTokenDecoder = WrappedNativeTokenDecoder;
