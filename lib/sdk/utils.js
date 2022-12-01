"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getNodeId = exports.isDecoderInput = exports.flattenLogs = exports.getCalls = exports.hasTraceExt = exports.hasReceiptExt = exports.isEqualAddress = exports.hasTopic = exports.hasSelector = void 0;
const lib_1 = require("@ethersproject/abi/lib");
const ethers_1 = require("ethers");
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
