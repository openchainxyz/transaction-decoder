"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurveSwapDecoder = void 0;
const abi_1 = require("@ethersproject/abi");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
const curveContracts = {
    ethereum: [
        '0xB576491F1E6e5E62f1d8F26062Ee822B40B0E0d4',
        '0x8301AE4fc9c624d1D396cbDAa1ed877821D7C511',
    ]
};
const coinsSignature = 'function coins(uint256) returns (address coin)';
const tokenExchangeSignature = 'event TokenExchange(address indexed buyer, uint256 sold_id, uint256 tokens_sold, uint256 bought_id, uint256 tokens_bought)';
class CurveSwapDecoder extends types_1.CallDecoder {
    constructor() {
        super();
        this.functions['exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy, bool use_eth)'] = this.decodeExchangeWithEth;
        this.functions['exchange(uint256 i, uint256 j, uint256 dx, uint256 min_dy)'] = this.decodeExchange;
    }
    async isTargetContract(state, address) {
        return !!curveContracts['ethereum'].find(addr => (0, utils_1.isEqualAddress)(addr, address));
    }
    async decodeExchange(state, node, input, output) {
        const i = input['i'];
        const j = input['j'];
        const [tokenIn] = await state.call(coinsSignature, node.to, [i]);
        const [tokenOut] = await state.call(coinsSignature, node.to, [i]);
        const result = {
            type: 'swap',
            exchange: 'curve',
            operator: node.from,
            recipient: node.from,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: input['dx'].toBigInt(),
            amountOutMin: input['min_dy'].toBigInt(),
        };
        if ((0, utils_1.hasReceiptExt)(node)) {
            const exchangeLog = this.decodeEventWithFragment(node.logs[node.logs.length - 1], tokenExchangeSignature);
            result.amountOut = exchangeLog.args['tokens_bought'].toBigInt();
        }
        return result;
    }
    async decodeExchangeWithEth(state, node, input, output) {
        const i = input['i'];
        const j = input['j'];
        const useEth = input['use_eth'];
        const intf = new abi_1.Interface([
            'function coins(uint256) returns (address coin)',
        ]);
        const tokenIn = intf.decodeFunctionResult(intf.getFunction('coins'), await state.access.call({
            to: node.to,
            data: intf.encodeFunctionData(intf.getFunction('coins'), [i]),
        }))['coin'];
        const tokenOut = intf.decodeFunctionResult(intf.getFunction('coins'), await state.access.call({
            to: node.to,
            data: intf.encodeFunctionData(intf.getFunction('coins'), [j]),
        }))['coin'];
        const result = {
            type: 'swap',
            exchange: 'curve',
            operator: node.from,
            recipient: node.from,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: input['dx'].toBigInt(),
            amountOutMin: input['min_dy'].toBigInt(),
        };
        if ((0, utils_1.hasReceiptExt)(node)) {
            const exchangeLog = this.decodeEventWithFragment(node.logs[node.logs.length - 1], 'event TokenExchange(address indexed buyer, uint256 sold_id, uint256 tokens_sold, uint256 bought_id, uint256 tokens_bought)');
            result.amountOut = exchangeLog.args['tokens_bought'].toBigInt();
        }
        return result;
    }
}
exports.CurveSwapDecoder = CurveSwapDecoder;
