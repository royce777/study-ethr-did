var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import * as EthrDID from 'ethr-did';
import * as Resolver from 'did-resolver';
import * as getResolver from 'ethr-did-resolver';
import { ethers } from 'ethers';
import { computePublicKey } from '@ethersproject/signing-key';
import { createVerifiableCredentialJwt, verifyCredential } from 'did-jwt-vc';
//import { createRequire } from 'module';
import * as bip39 from 'bip39';
// type Issuer = typeof Issuer;
// type JwtCredentialPayload = typeof JwtCredentialPayload
var createRequire = require('module').createRequire;
var req = createRequire(import.meta.url); // require is not okay
var hdkey = req('ethereumjs-wallet/hdkey');
//import wallet from 'ethereumjs-wallet'
var mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';
//function that retrieves private keys of Truffle accounts
// return value : Promise
var getTrufflePrivateKey = function (mnemonic, index) {
    if (index < 0 || index > 9)
        throw new Error('please provide correct truffle account index');
    return bip39.mnemonicToSeed(mnemonic).then(function (seed) {
        var hdk = hdkey.fromMasterSeed(seed);
        var addr_node = hdk.derivePath("m/44'/60'/0'/0/" + index); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
        //const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
        var privKey = addr_node.getWallet().getPrivateKey();
        return privKey;
    })["catch"](function (error) { return console.log('getTrufflePrivateKey ERROR : ' + error); });
};
//setup the provider 
console.log('Connecting to provider...');
var Web3HttpProvider = req('web3-providers-http');
// ...
var web3provider = new Web3HttpProvider('http://localhost:9545');
var provider = new ethers.providers.Web3Provider(web3provider);
//const provider = new ethers.providers.JsonRpcProvider('http://localhost:9545');
// get accounts provided by Truffle, with respective private keys
console.log('Connected to the provider');
//contract address of the registry
var RegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';
//function where the creation of an identity will be tested
var test = function () { return __awaiter(void 0, void 0, void 0, function () {
    var uni, PaoloMori, library, ethrDidResolver, didResolver, vcPayload, vcJwt, verifiedVC;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, createDid(RegAddress, 0)];
            case 1:
                uni = _a.sent();
                return [4 /*yield*/, createDid(RegAddress, 1)];
            case 2:
                PaoloMori = _a.sent();
                return [4 /*yield*/, createDid(RegAddress, 2)];
            case 3:
                library = _a.sent();
                ethrDidResolver = getResolver.getResolver({
                    rpcUrl: 'http://localhost:9545',
                    registry: RegAddress,
                    chainId: '0x539',
                    provider: provider
                });
                didResolver = new Resolver.Resolver(ethrDidResolver);
                vcPayload = {
                    sub: 'did:ethr:0x435df3eda57154cf8cf7926079881f2912f54db4',
                    nbf: 1562950282,
                    vc: {
                        '@context': ['https://www.w3.org/2018/credentials/v1'],
                        type: ['VerifiableCredential'],
                        credentialSubject: {
                            degree: {
                                type: 'BachelorDegree',
                                name: 'Baccalauréat en musiques numériques'
                            }
                        }
                    }
                };
                return [4 /*yield*/, createVerifiableCredentialJwt(vcPayload, uni)];
            case 4:
                vcJwt = _a.sent();
                console.log(vcJwt);
                console.log('\n');
                console.log('Verifying');
                console.log('\n');
                return [4 /*yield*/, verifyCredential(vcJwt, didResolver)];
            case 5:
                verifiedVC = _a.sent();
                console.log(verifiedVC);
                return [2 /*return*/];
        }
    });
}); };
//function to create and return the object used to manage a DID
var createDid = function (RegAddress, index, chainId) {
    if (chainId === void 0) { chainId = '0x539'; }
    return __awaiter(void 0, void 0, void 0, function () {
        return __generator(this, function (_a) {
            return [2 /*return*/, getTrufflePrivateKey(mnemonic, index)
                    .then(function (privateKey) {
                    var publicKey = computePublicKey(privateKey, true);
                    var identifier = "did:ethr:" + chainId + ":" + publicKey;
                    var signer = provider.getSigner(index);
                    var conf = {
                        txSigner: signer,
                        privateKey: privateKey,
                        identifier: identifier,
                        registry: RegAddress,
                        chainNameOrId: chainId,
                        provider: provider
                    };
                    return new EthrDID(conf);
                })];
        });
    });
};
//actual function that starts executing and this will invoke all the other pieces of code
provider.listAccounts().then(function (accounts) {
    test()["catch"](function (error) { return console.log(error); });
    //getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
