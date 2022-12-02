"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DecoderManager = void 0;
const types_1 = require("./types");
const utils_1 = require("./utils");
class DecoderManager {
    constructor(decoders, fallbackDecoder) {
        this.decoders = [];
        this.addDecoder = (decoder) => {
            this.decoders.push(decoder);
        };
        this.decode = async (input, access) => {
            const allDecodersArray = [...this.decoders, this.fallbackDecoder];
            const state = new types_1.DecoderState(input, access);
            const visit = async (node) => {
                if ((0, utils_1.hasReceiptExt)(node) && node.failed) {
                    // we don't decode anything that failed, because there should be no reason
                    // to care about something that had no effect
                    return state.getOutputFor(node);
                }
                const decodeLog = async (child, log) => {
                    const output = state.getOutputFor(log);
                    await Promise.all(allDecodersArray.map(async (v) => {
                        try {
                            const results = await v.decodeLog(state, node, log);
                            if (!results)
                                return;
                            if (Array.isArray(results)) {
                                output.results.push(...results);
                            }
                            else {
                                output.results.push(results);
                            }
                        }
                        catch (e) {
                            console.log('decoder failed to decode log', v, node, log, e);
                        }
                    }));
                    return output;
                };
                const output = state.getOutputFor(node);
                for (const decoder of allDecodersArray) {
                    try {
                        const result = await decoder.decodeCall(state, node);
                        if (result) {
                            output.results.push(result);
                        }
                    }
                    catch (e) {
                        console.log('decoder failed to decode call', decoder, node, e);
                    }
                }
                if ((0, utils_1.hasTraceExt)(node)) {
                    for (let child of node.childOrder) {
                        let result;
                        if (child[0] === 'log') {
                            result = await decodeLog(node, node.logs[child[1]]);
                        }
                        else {
                            result = await visit(node.children[child[1]]);
                        }
                        output.children.push(result);
                    }
                }
                else if ((0, utils_1.hasReceiptExt)(node)) {
                    if (node.logs) {
                        for (let log of node.logs) {
                            output.children.push(await decodeLog(node, log));
                        }
                    }
                }
                return output;
            };
            return [await visit(input), state.requestedMetadata];
        };
        this.decoders = decoders;
        this.fallbackDecoder = fallbackDecoder;
    }
}
exports.DecoderManager = DecoderManager;
