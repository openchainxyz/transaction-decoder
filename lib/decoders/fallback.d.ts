import { Log } from '@ethersproject/abstract-provider';
import { BurnERC20Action, MintERC20Action, TransferAction } from '../sdk/actions';
import { Decoder, DecoderInput, DecoderState } from '../sdk/types';
export declare class TransferDecoder extends Decoder<TransferAction | BurnERC20Action | MintERC20Action> {
    decodeCall(state: DecoderState, node: DecoderInput): Promise<TransferAction | null>;
    decodeLog(state: DecoderState, node: DecoderInput, log: Log): Promise<MintERC20Action | BurnERC20Action | TransferAction | null>;
}
