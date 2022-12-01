"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultDecoders = void 0;
const art_gobblers_1 = require("./art-gobblers");
const comet_1 = require("./comet");
const curve_1 = require("./curve");
const ens_1 = require("./ens");
const uniswapv2_1 = require("./uniswapv2");
const uniswapv3_1 = require("./uniswapv3");
const wrapped_1 = require("./wrapped");
exports.defaultDecoders = [
    new art_gobblers_1.ArtGobblersMintDecoder(),
    new comet_1.CometSupplyDecoder(),
    new curve_1.CurveSwapDecoder(),
    new ens_1.ENSDecoder(),
    new uniswapv2_1.UniswapV2RouterSwapDecoder(),
    new uniswapv2_1.UniswapV2PairSwapDecoder(),
    new uniswapv3_1.UniswapV3RouterSwapDecoder(),
    new wrapped_1.WrappedNativeTokenDecoder(),
];
