"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ArtGobblersMintDecoder = void 0;
const ethers_1 = require("ethers");
const types_1 = require("../sdk/types");
const utils_1 = require("../sdk/utils");
const gobblerPurchasedEventSignature = 'event GobblerPurchased(address indexed user, uint256 indexed gobblerId, uint256 price)';
class ArtGobblersMintDecoder extends types_1.CallDecoder {
    constructor() {
        super();
        this.functions['mintFromGoo(uint256 maxPrice, bool useVirtualBalance) external returns (uint256 gobblerId)'] = this.decodeMintFromGoo;
    }
    async isTargetContract(state, address) {
        return (0, utils_1.isEqualAddress)(address, '0x60bb1e2AA1c9ACAfB4d34F71585D7e959f387769');
    }
    async decodeMintFromGoo(state, node, input, output) {
        const result = {
            type: 'nft-mint',
            operator: node.from,
            recipient: node.from,
            collection: node.to,
            buyToken: ethers_1.ethers.utils.getAddress('0x600000000a36F3cD48407e35eB7C5c910dc1f7a8'),
            buyAmount: input['maxPrice'].toBigInt(),
        };
        // Can only get tokenId if transaction was successful...
        if ((0, utils_1.hasReceiptExt)(node)) {
            const logs = (0, utils_1.flattenLogs)(node);
            // Second to last log is GobblerPurchased event
            const gobblerPurchasedLog = this.decodeEventWithFragment(logs[logs.length - 2], gobblerPurchasedEventSignature);
            result.tokenId = gobblerPurchasedLog.args['gobblerId'].toBigInt();
            result.buyAmount = gobblerPurchasedLog.args['price'].toBigInt();
        }
        return result;
    }
}
exports.ArtGobblersMintDecoder = ArtGobblersMintDecoder;
