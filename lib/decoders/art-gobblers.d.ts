import { Result } from '@ethersproject/abi/lib';
import { MintNFTAction } from "../sdk/actions";
import { CallDecoder, DecoderInput, DecoderState } from "../sdk/types";
export declare class ArtGobblersMintDecoder extends CallDecoder<MintNFTAction> {
    constructor();
    isTargetContract(state: DecoderState, address: string): Promise<boolean>;
    decodeMintFromGoo(state: DecoderState, node: DecoderInput, input: Result, output: Result | null): Promise<MintNFTAction>;
}
