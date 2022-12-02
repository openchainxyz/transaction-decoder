"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CallDecoder = exports.Decoder = exports.DecoderState = exports.ProviderDecoderChainAccess = void 0;
const lib_1 = require("@ethersproject/abi/lib");
const ethers_1 = require("ethers");
const utils_1 = require("ethers/lib/utils");
const utils_2 = require("./utils");
class ProviderDecoderChainAccess {
    constructor(provider) {
        this.provider = provider;
        this.cache = {};
    }
    async call(transaction) {
        return await this.provider.call(transaction);
    }
    async getStorageAt(address, slot) {
        if (!this.cache[address]) {
            this.cache[address] = {};
        }
        if (!this.cache[address][slot]) {
            this.cache[address][slot] = await this.provider.getStorageAt(address, slot);
        }
        return this.cache[address][slot];
    }
}
exports.ProviderDecoderChainAccess = ProviderDecoderChainAccess;
class DecoderState {
    constructor(root, access) {
        this.root = root;
        this.access = access;
        this.consumed = new Set();
        this.decoded = new Map();
        this.decodeOrder = [];
        this.requestedMetadata = {
            tokens: new Set(),
        };
    }
    getOutputFor(input) {
        if (!this.decoded.has(input)) {
            this.decoded.set(input, {
                node: input,
                results: [],
                children: [],
            });
            this.decodeOrder.push(this.decoded.get(input));
        }
        return this.decoded.get(input);
    }
    async call(signature, address, args) {
        const fragment = lib_1.Fragment.from(signature);
        const intf = new lib_1.Interface([
            fragment,
        ]);
        return intf.decodeFunctionResult(fragment.name, await this.access.call({
            to: address,
            data: intf.encodeFunctionData(fragment.name, args),
        }));
    }
    requestTokenMetadata(token) {
        this.requestedMetadata.tokens.add(token.toLowerCase());
    }
    // check if a node is consumed - most decoders should ignore consumed nodes
    isConsumed(node) {
        return this.consumed.has((0, utils_2.getNodeId)(node));
    }
    // mark the node as consumed
    consume(node) {
        this.consumed.add((0, utils_2.getNodeId)(node));
    }
    // consume the node and all logs in it
    consumeAll(node) {
        this.consume(node);
        if ((0, utils_2.hasReceiptExt)(node)) {
            node.logs.forEach(this.consume.bind(this));
        }
    }
    // consume the node and all logs in it, including all child calls
    consumeAllRecursively(node) {
        this.consumeAll(node);
        if ((0, utils_2.hasTraceExt)(node)) {
            node.children?.forEach(this.consumeAllRecursively.bind(this));
        }
    }
    // assuming the input node is a call with `transfer`-like semantics (i.e. it causes a transfer from the caller
    // to an address specified in the calldata), consume the node and any Transfer events which correspond to the
    // transfer
    consumeTransfer(node, params) {
        if (!params) {
            params = [utils_1.ParamType.from('address to'), utils_1.ParamType.from('uint256 amount')];
        }
        let inputs = lib_1.defaultAbiCoder.decode(params, ethers_1.ethers.utils.arrayify(node.calldata).slice(4));
        this.consumeTransferCommon(node, ethers_1.ethers.utils.getAddress(node.from), inputs['to']);
    }
    // assuming the input node is a call with `transferFrom`-like semantics (i.e. it causes a transfer from one address
    // to another address specified in the calldata), consume the node and any Transfer events which correspond to the
    // transfer
    consumeTransferFrom(node, params) {
        if (!params) {
            params = [utils_1.ParamType.from('address from'), utils_1.ParamType.from('address to'), utils_1.ParamType.from('uint256 amount')];
        }
        let inputs = lib_1.defaultAbiCoder.decode(params, ethers_1.ethers.utils.arrayify(node.calldata).slice(4));
        this.consumeTransferCommon(node, inputs['from'], inputs['to']);
    }
    consumeTransferCommon(node, from, to) {
        // consume the current node
        this.consume(node);
        if (!(0, utils_2.hasTraceExt)(node))
            return;
        const visit = (node) => {
            // handle any transfer events we might find, must be a match on from and to, because it might take fees
            node.logs
                .filter((v) => v.topics.length > 0 &&
                v.topics[0] === '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef')
                .forEach((v) => {
                let abi = node.abi;
                if (!abi) {
                    abi = new ethers_1.ethers.utils.Interface([
                        lib_1.EventFragment.from('Transfer(address indexed from, address indexed to, uint amount)'),
                    ]);
                }
                try {
                    let values = abi.parseLog(v);
                    if (values.args[0] === from && values.args[1] === to) {
                        this.consume(v);
                    }
                }
                catch { }
            });
            // if we have a delegatecall, we need to recurse because it will emit the log in the context of the
            // current contract
            node.children.filter((v) => v.type === 'delegatecall').forEach(visit);
        };
        visit(node);
    }
}
exports.DecoderState = DecoderState;
class Decoder {
    async decodeCall(state, node) {
        return null;
    }
    async decodeLog(state, node, log) {
        return null;
    }
    decodeFunctionWithFragment(node, functionFragment) {
        return [
            lib_1.defaultAbiCoder.decode(functionFragment.inputs, ethers_1.ethers.utils.arrayify(node.calldata).slice(4)),
            (0, utils_2.hasTraceExt)(node) && functionFragment.outputs
                ? lib_1.defaultAbiCoder.decode(functionFragment.outputs, ethers_1.ethers.utils.arrayify(node.returndata))
                : null,
        ];
    }
    decodeEventWithFragment(log, eventFragment) {
        const abi = new ethers_1.ethers.utils.Interface([eventFragment]);
        return abi.parseLog(log);
    }
}
exports.Decoder = Decoder;
class CallDecoder extends Decoder {
    constructor() {
        super();
        this.functions = {};
    }
    async decodeCall(state, node) {
        if (state.isConsumed(node))
            return null;
        if (node.type !== 'call')
            return null;
        const functionInfo = Object.entries(this.functions).find(([name, func]) => {
            return (name === '' && node.calldata.length === 0) || (name !== '' && (0, utils_2.hasSelector)(node.calldata, name));
        });
        if (!functionInfo)
            return null;
        if (!await this.isTargetContract(state, node.to))
            return null;
        state.consume(node);
        const [inputs, outputs] = this.decodeFunctionWithFragment(node, lib_1.FunctionFragment.from(functionInfo[0]));
        const functionMetadata = functionInfo[1];
        return functionMetadata.bind(this)(state, node, inputs, outputs);
    }
}
exports.CallDecoder = CallDecoder;
