import { EventFragment, FunctionFragment, Result } from '@ethersproject/abi/lib';
import { JsonFragment } from '@ethersproject/abi';
import { Log, Provider, TransactionRequest } from '@ethersproject/abstract-provider';
import { BigNumber, BytesLike, ethers } from 'ethers';
import { LogDescription, ParamType } from 'ethers/lib/utils';
import { Action, BaseAction } from './actions';
export interface DecoderChainAccess {
    getStorageAt(address: string, slot: string): Promise<string>;
    call(tx: TransactionRequest): Promise<string>;
}
export interface DecoderInput {
    id: string;
    abi?: ethers.utils.Interface;
    type: 'call' | 'staticcall' | 'callcode' | 'delegatecall' | 'create' | 'create2' | 'selfdestruct';
    from: string;
    to: string;
    value: BigNumber;
    calldata: BytesLike;
}
export interface DecoderInputReceiptExt extends DecoderInput {
    failed: boolean;
    logs: Array<Log>;
}
export interface DecoderInputTraceExt extends DecoderInputReceiptExt {
    returndata: BytesLike;
    children: Array<DecoderInputTraceExt>;
    childOrder: Array<['log' | 'call', number]>;
}
export type DecoderOutput = {
    node: DecoderInput | Log;
    results: Action[];
    children: DecoderOutput[];
};
export type MetadataRequest = {
    tokens: Set<string>;
};
export declare class ProviderDecoderChainAccess implements DecoderChainAccess {
    private provider;
    private cache;
    constructor(provider: Provider);
    call(transaction: TransactionRequest): Promise<string>;
    getStorageAt(address: string, slot: string): Promise<string>;
}
export declare class DecoderState {
    access: DecoderChainAccess;
    consumed: Set<string>;
    root: DecoderInput;
    decoded: Map<DecoderInput | Log, DecoderOutput>;
    decodeOrder: DecoderOutput[];
    requestedMetadata: MetadataRequest;
    constructor(root: DecoderInput, access: DecoderChainAccess);
    getOutputFor(input: DecoderInput | Log): DecoderOutput;
    call(signature: string, address: string, args: any[]): Promise<Result>;
    requestTokenMetadata(token: string): void;
    isConsumed(node: DecoderInput | Log): boolean;
    consume(node: DecoderInput | Log): void;
    consumeAll(node: DecoderInput): void;
    consumeAllRecursively(node: DecoderInput): void;
    consumeTransfer(node: DecoderInput, params?: Array<ParamType>): void;
    consumeTransferFrom(node: DecoderInput, params?: Array<ParamType>): void;
    consumeTransferCommon(node: DecoderInput, from: string, to: string): void;
}
export declare abstract class Decoder<T extends BaseAction> {
    decodeCall(state: DecoderState, node: DecoderInput): Promise<T | null>;
    decodeLog(state: DecoderState, node: DecoderInput, log: Log): Promise<T | null>;
    decodeFunctionWithFragment(node: DecoderInput, functionFragment: FunctionFragment): [Result, Result | null];
    decodeEventWithFragment(log: Log, eventFragment: string | EventFragment): LogDescription;
}
export declare abstract class CallDecoder<T extends BaseAction> extends Decoder<T> {
    functions: Record<string, (state: DecoderState, node: DecoderInput, inputs: Result, outputs: Result | null) => Promise<T>>;
    constructor();
    decodeCall(state: DecoderState, node: DecoderInput): Promise<T | null>;
    abstract isTargetContract(state: DecoderState, address: string): Promise<boolean>;
}
export type TraceEntryCall = {
    path: string;
    type: 'call';
    variant: 'call' | 'callcode' | 'staticcall' | 'delegatecall' | 'create' | 'create2' | 'selfdestruct';
    gas: number;
    isPrecompile: boolean;
    from: string;
    to: string;
    input: string;
    output: string;
    gasUsed: number;
    value: string;
    status: number;
    codehash: string;
    children: TraceEntry[];
};
export type TraceEntryLog = {
    path: string;
    type: 'log';
    topics: string[];
    data: string;
};
export type TraceEntrySload = {
    path: string;
    type: 'sload';
    slot: string;
    value: string;
};
export type TraceEntrySstore = {
    path: string;
    type: 'sstore';
    slot: string;
    oldValue: string;
    newValue: string;
};
export type TraceEntry = TraceEntryCall | TraceEntryLog | TraceEntrySload | TraceEntrySstore;
export type TraceMetadata = {
    abis: Record<string, Record<string, ethers.utils.Interface>>;
    nodesByPath: Record<string, TraceEntry>;
};
export type TraceResponse = {
    chain: string;
    txhash: string;
    preimages: Record<string, string>;
    addresses: Record<string, Record<string, AddressInfo>>;
    entrypoint: TraceEntryCall;
};
export type AddressInfo = {
    label: string;
    functions: Record<string, JsonFragment>;
    events: Record<string, JsonFragment>;
    errors: Record<string, JsonFragment>;
};
export type LogWithPath = Log & {
    path: string;
};
