import { Result } from '@ethersproject/abi';
import { UnwrapNativeTokenAction, WrapNativeTokenAction } from '../sdk/actions';
import { CallDecoder, DecoderInput, DecoderState } from '../sdk/types';
export declare class WrappedNativeTokenDecoder extends CallDecoder<WrapNativeTokenAction | UnwrapNativeTokenAction> {
    constructor();
    isTargetContract(state: DecoderState, address: string): Promise<boolean>;
    decodeWrap(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<WrapNativeTokenAction>;
    decodeUnwrap(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<UnwrapNativeTokenAction>;
}
