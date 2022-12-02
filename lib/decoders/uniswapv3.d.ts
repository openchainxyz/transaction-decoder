import { Result } from '@ethersproject/abi/lib';
import { SwapAction } from '../sdk/actions';
import { CallDecoder, DecoderInput, DecoderState } from '../sdk/types';
export declare class UniswapV3RouterSwapDecoder extends CallDecoder<SwapAction> {
    constructor();
    isTargetContract(state: DecoderState, address: string): Promise<boolean>;
    decodeExactInput(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<SwapAction>;
}
