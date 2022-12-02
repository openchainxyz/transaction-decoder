import { Decoder, DecoderChainAccess, DecoderInput, DecoderOutput, MetadataRequest } from './types';
export declare class DecoderManager {
    decoders: Decoder<any>[];
    fallbackDecoder: Decoder<any>;
    constructor(decoders: Decoder<any>[], fallbackDecoder: Decoder<any>);
    addDecoder: (decoder: Decoder<any>) => void;
    decode: (input: DecoderInput, access: DecoderChainAccess) => Promise<[DecoderOutput, MetadataRequest]>;
}
