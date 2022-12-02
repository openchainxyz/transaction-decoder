"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UniswapV3RouterSwapDecoder = void 0;
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
const swapEventSignature = `event Swap(
    address indexed sender,
    address indexed recipient,
    int256 amount0,
    int256 amount1,
    uint160 sqrtPriceX96,
    uint128 liquidity,
    int24 tick
);`;
class UniswapV3RouterSwapDecoder extends types_1.CallDecoder {
    constructor() {
        super();
        this.functions['exactInput(tuple(bytes path, address recipient, uint256 deadline, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)'] = this.decodeExactInput;
    }
    async isTargetContract(state, address) {
        return (0, utils_1.isEqualAddress)(address, '0xE592427A0AEce92De3Edee1F18E0157C05861564');
    }
    async decodeExactInput(state, node, input, output) {
        const path = input['params']['path'];
        const amountIn = input['params']['amountIn'];
        const amountOutMin = input['params']['amountOutMinimum'];
        const recipient = input['params']['recipient'];
        const tokenIn = "0x" + path.substring(2, 42);
        const tokenOut = "0x" + path.substring(path.length - 40);
        const result = {
            type: 'swap',
            exchange: 'uniswap-v3',
            operator: node.from,
            recipient: recipient,
            tokenIn: tokenIn,
            tokenOut: tokenOut,
            amountIn: amountIn,
            amountOutMin: amountOutMin,
        };
        if ((0, utils_1.hasReceiptExt)(node)) {
            const logs = (0, utils_1.flattenLogs)(node);
            const swapLog = this.decodeEventWithFragment(logs[logs.length - 1], swapEventSignature);
            const amount0 = swapLog.args['amount0'].toBigInt();
            const amount1 = swapLog.args['amount1'].toBigInt();
            result.amountOut = amount0 < 0n ? amount0 : amount1;
        }
        return result;
    }
}
exports.UniswapV3RouterSwapDecoder = UniswapV3RouterSwapDecoder;
