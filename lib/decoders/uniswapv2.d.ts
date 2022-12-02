import { Result } from '@ethersproject/abi';
import { SwapAction } from '../sdk/actions';
import { CallDecoder, Decoder, DecoderInput, DecoderState } from '../sdk/types';
type UniswapDeployment = {
    name: string;
    factory: string;
    initcodeHash: string;
    routers: string[];
};
export declare class UniswapV2RouterSwapDecoder extends Decoder<SwapAction> {
    functions: {
        'swapExactTokensForTokens(uint256 amountIn,uint256 amountOutMin,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapTokensForExactTokens(uint256 amountOut,uint256 amountInMax,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapExactETHForTokens(uint256 amountOutMin,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapTokensForExactETH(uint256 amountOut,uint256 amountInMax,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapExactTokensForETH(uint256 amountIn,uint256 amountOutMin,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapETHForExactTokens(uint256 amountOut,address[] memory path,address to,uint256 deadline) returns (uint[] memory amounts)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] memory path,address to,uint256 deadline)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin,address[] memory path,address to,uint256 deadline)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
        'swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn,uint256 amountOutMin,address[] memory path,address to,uint256 deadline)': {
            exactIn: boolean;
            input: string;
            output: string;
            fee: boolean;
        };
    };
    decodeCall(state: DecoderState, node: DecoderInput): Promise<SwapAction | null>;
    consumeSwaps(state: DecoderState, node: DecoderInput): void;
    consumeTokenInputSwap(state: DecoderState, node: DecoderInput): void;
    consumeETHInputSwap(state: DecoderState, node: DecoderInput): void;
    consumeETHOutputSwap(state: DecoderState, node: DecoderInput): void;
}
export declare class UniswapV2PairSwapDecoder extends CallDecoder<SwapAction> {
    constructor();
    getDeploymentForPair(state: DecoderState, address: string): Promise<[string, string, UniswapDeployment] | null>;
    isTargetContract(state: DecoderState, address: string): Promise<boolean>;
    decodeSwap(state: DecoderState, node: DecoderInput, inputs: Result, outputs: Result | null): Promise<SwapAction>;
}
export {};
