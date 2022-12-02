import { Result } from '@ethersproject/abi';
import { SwapAction } from '../sdk/actions';
import { CallDecoder, DecoderInput, DecoderState } from '../sdk/types';
export declare class CurveSwapDecoder extends CallDecoder<SwapAction> {
    constructor();
    isTargetContract(state: DecoderState, address: string): Promise<boolean>;
    decodeExchange(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<SwapAction>;
    decodeExchangeWithEth(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<SwapAction>;
}
