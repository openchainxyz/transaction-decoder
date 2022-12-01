import { ethers, BytesLike, BigNumber } from "ethers";
import { EventFragment, FunctionFragment } from '@ethersproject/abi/lib';
import { Interface } from '@ethersproject/abi';
import { Log } from '@ethersproject/abstract-provider';

import {
    DecoderInput,
    DecoderInputReceiptExt,
    DecoderInputTraceExt,
    LogWithPath,
    TraceEntry,
    TraceEntryCall,
    TraceEntryLog,
    TraceMetadata,
    TraceResponse,
} from '../sdk/types';

export const hasSelector = (calldata: BytesLike, selector: string | FunctionFragment) => {
    return (
        ethers.utils.hexlify(ethers.utils.arrayify(calldata).slice(0, 4)) ===
        ethers.utils.id(FunctionFragment.from(selector).format()).substring(0, 10)
    );
};

export const hasTopic = (log: Log, selector: string | EventFragment) => {
    return log.topics.length > 0 && log.topics[0] == ethers.utils.id(EventFragment.from(selector).format());
};

export const isEqualAddress = (a: string, b: string): boolean => {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase();
}

export const hasReceiptExt = (node: DecoderInput): node is DecoderInputReceiptExt => {
    return (node as DecoderInputReceiptExt).logs !== undefined;
}

export const hasTraceExt = (node: DecoderInput): node is DecoderInputTraceExt => {
    return (node as DecoderInputTraceExt).returndata !== undefined;
}

export const getCalls = (node: DecoderInputTraceExt): DecoderInputTraceExt[] => {
    return node.children.filter(node => node.type === 'call');
}

export const flattenLogs = (node: DecoderInputReceiptExt): Log[] => {
    if (!hasTraceExt(node)) {
        return node.logs;
    }
    const result: Log[] = [];

    const visit = (node: DecoderInputTraceExt) => {
        node.childOrder.forEach(([type, val]) => {
            if (type === 'log') {
                result.push(node.logs[val]);
            } else {
                visit(node.children[val]);
            }
        });
    };

    visit(node);

    return result;
}

export const isDecoderInput = (node: DecoderInput | Log): node is DecoderInput => {
    return (node as DecoderInput).id !== undefined;
};

export const getNodeId = (node: DecoderInput | Log) => {
    if (isDecoderInput(node)) {
        return 'node:' + node.id;
    } else {
        return 'log:' + node.transactionHash + '.' + node.logIndex;
    }
};

export const findAffectedContract = (metadata: TraceMetadata, node: TraceEntry): [TraceEntryCall, TraceEntryCall[]] => {
    let path: TraceEntryCall[] = [];

    let parents = node.path.split('.');

    while (parents.length > 0) {
        parents.pop();

        let parentNode = metadata.nodesByPath[parents.join('.')];
        if (parentNode.type === 'call') {
            path.push(parentNode);

            if (parentNode.variant !== 'delegatecall') {
                path.reverse();

                return [parentNode, path];
            }
        }
    }

    throw new Error("strange, didn't find parent node");
};

const flattenTraceLogs = (node: TraceEntryCall, traceResult: TraceResponse, traceMetadata: TraceMetadata, recursive: boolean): Array<LogWithPath> => {
    const ourLogs = node.children
        .filter((node): node is TraceEntryLog => node.type === 'log')
        .map((logNode) => {
            const [affected] = findAffectedContract(traceMetadata, logNode);
            const log: LogWithPath = {
                address: ethers.utils.getAddress(affected.to),
                blockHash: '',
                blockNumber: 0,
                data: logNode.data,
                logIndex: 0,
                path: logNode.path,
                removed: false,
                topics: logNode.topics,
                transactionHash: traceResult.txhash,
                transactionIndex: 0,
            };
            return log;
        });
    if (!recursive) {
        return ourLogs;
    }

    node.children
        .filter((node): node is TraceEntryCall => node.type === 'call')
        .forEach((v) => {
            ourLogs.push(...flattenTraceLogs(v, traceResult, traceMetadata, true));
        });

    return ourLogs;
};

const remap = (node: TraceEntryCall, traceResult: TraceResponse, traceMetadata: TraceMetadata, parentAbi?: Interface): DecoderInputTraceExt => {
    let thisAbi = new Interface([
        ...traceMetadata.abis[node.to][node.codehash].fragments,
        ...(parentAbi?.fragments || []),
    ]);

    const logs = flattenTraceLogs(node, traceResult, traceMetadata, false);
    const children = node.children
        .filter((node): node is TraceEntryCall => node.type === 'call')
        .map((v) => {
            if (v.variant === 'delegatecall') {
                return remap(v, traceResult, traceMetadata, thisAbi);
            } else {
                return remap(v, traceResult, traceMetadata, undefined);
            }
        });

    return {
        id: node.path,
        type: node.variant,
        from: ethers.utils.getAddress(node.from),
        to: ethers.utils.getAddress(node.to),
        value: BigNumber.from(node.value),
        calldata: ethers.utils.arrayify(node.input),

        failed: node.status !== 1,
        logs: logs,

        returndata: ethers.utils.arrayify(node.output),
        children: children,

        childOrder: node.children
            .filter((node): node is TraceEntryLog | TraceEntryCall => node.type === 'log' || node.type === 'call')
            .map((v) => {
                if (v.type === 'log') {
                    return ['log', logs.findIndex((log) => log.path === v.path)];
                } else {
                    return ['call', children.findIndex((child) => child.id === v.path)];
                }
            }),

        abi: thisAbi,
    };
};
