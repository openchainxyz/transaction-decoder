"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ENSDecoder = void 0;
const lib_1 = require("@ethersproject/abi/lib");
const ethers_1 = require("ethers");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
class ENSDecoder extends types_1.Decoder {
    constructor() {
        super(...arguments);
        this.functions = {
            'register(string name, address owner, uint256 duration, bytes32 secret)': {
                hasResolver: false,
            },
            'registerWithConfig(string name, address owner, uint256 duration, bytes32 secret, address resolver, address addr)': {
                hasResolver: true,
            },
        };
    }
    async decodeCall(state, node) {
        if (state.isConsumed(node))
            return null;
        if (node.to.toLowerCase() !== '0x283Af0B28c62C092C9727F1Ee09c02CA627EB7F5'.toLowerCase())
            return null;
        const functionInfo = Object.entries(this.functions).find(([name, func]) => {
            return (0, utils_1.hasSelector)(node.calldata, name);
        });
        if (!functionInfo)
            return null;
        // todo: don't consume if we have a resolver set because that makes an external call
        state.consumeAllRecursively(node);
        const [inputs] = this.decodeFunctionWithFragment(node, lib_1.FunctionFragment.from(functionInfo[0]));
        const functionMetadata = functionInfo[1];
        let cost = node.value.toBigInt();
        if ((0, utils_1.hasReceiptExt)(node)) {
            const registeredFragment = lib_1.EventFragment.from(`NameRegistered(string name, bytes32 indexed label, address indexed owner, uint cost, uint expires)`);
            const lastLog = node.logs.reverse().find((log) => (0, utils_1.hasTopic)(log, registeredFragment));
            if (lastLog) {
                const abi = new ethers_1.ethers.utils.Interface([registeredFragment]);
                const parsedEvent = abi.parseLog(lastLog);
                cost = parsedEvent.args['cost'].toBigInt();
            }
        }
        const result = {
            type: 'ens-register',
            operator: node.from,
            owner: inputs['owner'],
            name: inputs['name'] + '.eth',
            duration: inputs['duration'].toNumber(),
            cost: cost,
        };
        if (functionMetadata.hasResolver) {
            result.resolver = inputs['resolver'];
            result.addr = inputs['addr'];
        }
        return result;
    }
}
exports.ENSDecoder = ENSDecoder;
