import { ArtGobblersMintDecoder } from "./art-gobblers";
import { CometSupplyDecoder } from "./comet";
import { CurveSwapDecoder } from "./curve";
import { ENSDecoder } from "./ens";
import { UniswapV2PairSwapDecoder, UniswapV2RouterSwapDecoder } from "./uniswapv2";
import { UniswapV3RouterSwapDecoder } from "./uniswapv3";
import { WrappedNativeTokenDecoder } from "./wrapped";

export const defaultDecoders = [
    new ArtGobblersMintDecoder(),
    new CometSupplyDecoder(),
    new CurveSwapDecoder(),
    new ENSDecoder(),
    new UniswapV2RouterSwapDecoder(),
    new UniswapV2PairSwapDecoder(),
    new UniswapV3RouterSwapDecoder(),
    new WrappedNativeTokenDecoder(),
];