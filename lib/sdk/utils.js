"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.findAffectedContract = exports.getNodeId = exports.isDecoderInput = exports.flattenLogs = exports.getCalls = exports.hasTraceExt = exports.hasReceiptExt = exports.isEqualAddress = exports.hasTopic = exports.hasSelector = void 0;
const ethers_1 = require("ethers");
const lib_1 = require("@ethersproject/abi/lib");
const abi_1 = require("@ethersproject/abi");
const hasSelector = (calldata, selector) => {
    return (ethers_1.ethers.utils.hexlify(ethers_1.ethers.utils.arrayify(calldata).slice(0, 4)) ===
        ethers_1.ethers.utils.id(lib_1.FunctionFragment.from(selector).format()).substring(0, 10));
};
exports.hasSelector = hasSelector;
const hasTopic = (log, selector) => {
    return log.topics.length > 0 && log.topics[0] == ethers_1.ethers.utils.id(lib_1.EventFragment.from(selector).format());
};
exports.hasTopic = hasTopic;
const isEqualAddress = (a, b) => {
    return a.toLocaleLowerCase() === b.toLocaleLowerCase();
};
exports.isEqualAddress = isEqualAddress;
const hasReceiptExt = (node) => {
    return node.logs !== undefined;
};
exports.hasReceiptExt = hasReceiptExt;
const hasTraceExt = (node) => {
    return node.returndata !== undefined;
};
exports.hasTraceExt = hasTraceExt;
const getCalls = (node) => {
    return node.children.filter(node => node.type === 'call');
};
exports.getCalls = getCalls;
const flattenLogs = (node) => {
    if (!(0, exports.hasTraceExt)(node)) {
        return node.logs;
    }
    const result = [];
    const visit = (node) => {
        node.childOrder.forEach(([type, val]) => {
            if (type === 'log') {
                result.push(node.logs[val]);
            }
            else {
                visit(node.children[val]);
            }
        });
    };
    visit(node);
    return result;
};
exports.flattenLogs = flattenLogs;
const isDecoderInput = (node) => {
    return node.id !== undefined;
};
exports.isDecoderInput = isDecoderInput;
const getNodeId = (node) => {
    if ((0, exports.isDecoderInput)(node)) {
        return 'node:' + node.id;
    }
    else {
        return 'log:' + node.transactionHash + '.' + node.logIndex;
    }
};
exports.getNodeId = getNodeId;
const findAffectedContract = (metadata, node) => {
    let path = [];
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
exports.findAffectedContract = findAffectedContract;
const flattenTraceLogs = (node, traceResult, traceMetadata, recursive) => {
    const ourLogs = node.children
        .filter((node) => node.type === 'log')
        .map((logNode) => {
        const [affected] = (0, exports.findAffectedContract)(traceMetadata, logNode);
        const log = {
            address: ethers_1.ethers.utils.getAddress(affected.to),
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
        .filter((node) => node.type === 'call')
        .forEach((v) => {
        ourLogs.push(...flattenTraceLogs(v, traceResult, traceMetadata, true));
    });
    return ourLogs;
};
const remap = (node, traceResult, traceMetadata, parentAbi) => {
    let thisAbi = new abi_1.Interface([
        ...traceMetadata.abis[node.to][node.codehash].fragments,
        ...(parentAbi?.fragments || []),
    ]);
    const logs = flattenTraceLogs(node, traceResult, traceMetadata, false);
    const children = node.children
        .filter((node) => node.type === 'call')
        .map((v) => {
        if (v.variant === 'delegatecall') {
            return remap(v, traceResult, traceMetadata, thisAbi);
        }
        else {
            return remap(v, traceResult, traceMetadata, undefined);
        }
    });
    return {
        id: node.path,
        type: node.variant,
        from: ethers_1.ethers.utils.getAddress(node.from),
        to: ethers_1.ethers.utils.getAddress(node.to),
        value: ethers_1.BigNumber.from(node.value),
        calldata: ethers_1.ethers.utils.arrayify(node.input),
        failed: node.status !== 1,
        logs: logs,
        returndata: ethers_1.ethers.utils.arrayify(node.output),
        children: children,
        childOrder: node.children
            .filter((node) => node.type === 'log' || node.type === 'call')
            .map((v) => {
            if (v.type === 'log') {
                return ['log', logs.findIndex((log) => log.path === v.path)];
            }
            else {
                return ['call', children.findIndex((child) => child.id === v.path)];
            }
        }),
        abi: thisAbi,
    };
};