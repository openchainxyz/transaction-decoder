import { ENSRegisterAction } from '../sdk/actions';
import { Decoder, DecoderInput, DecoderState } from '../sdk/types';
export declare class ENSDecoder extends Decoder<ENSRegisterAction> {
    functions: {
        'register(string name, address owner, uint256 duration, bytes32 secret)': {
            hasResolver: boolean;
        };
        'registerWithConfig(string name, address owner, uint256 duration, bytes32 secret, address resolver, address addr)': {
            hasResolver: boolean;
        };
    };
    decodeCall(state: DecoderState, node: DecoderInput): Promise<ENSRegisterAction | null>;
}
