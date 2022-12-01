import { ArtGobblersMintDecoder } from "./art-gobblers";
import { CometSupplyDecoder } from "./comet";
import { CurveSwapDecoder } from "./curve";
import { ENSDecoder } from "./ens";
import { UniswapV2PairSwapDecoder, UniswapV2RouterSwapDecoder } from "./uniswapv2";
import { UniswapV3RouterSwapDecoder } from "./uniswapv3";
import { WrappedNativeTokenDecoder } from "./wrapped";
export declare const defaultDecoders: (ArtGobblersMintDecoder | CometSupplyDecoder | CurveSwapDecoder | ENSDecoder | UniswapV2RouterSwapDecoder | UniswapV2PairSwapDecoder | UniswapV3RouterSwapDecoder | WrappedNativeTokenDecoder)[];
