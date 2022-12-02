import { Decoder, DecoderState, DecoderInput } from "../sdk/types";
import { SupplyAction } from "../sdk/actions";
export declare class CometSupplyDecoder extends Decoder<SupplyAction> {
    functions: string[];
    decodeCall(state: DecoderState, node: DecoderInput): Promise<SupplyAction | null>;
}
