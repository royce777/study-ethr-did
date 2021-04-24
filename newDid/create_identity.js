import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import {EthrDID} from 'ethr-did'
import {ethers} from 'ethers'
import { computePublicKey } from '@ethersproject/signing-key'

import bip39  from 'bip39'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
var hdkey = require('ethereumjs-wallet/hdkey')
//import wallet from 'ethereumjs-wallet'

const mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';

//function that retrieves private keys of Truffle accounts
// return value : Promise
const getTrufflePrivateKey =  (mnemonic, index) => {
	if(index < 0 || index > 9) throw new Error('please provide correct truffle account index')
	return bip39.mnemonicToSeed(mnemonic).then(seed => {
		const hdk = hdkey.fromMasterSeed(seed);
		const addr_node = hdk.derivePath(`m/44'/60'/0'/0/${index}`); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
		//const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
		const privKey = addr_node.getWallet().getPrivateKey();
		return privKey;
	}).catch(error => console.log('getTrufflePrivateKey ERROR : ' + error));
}



//setup the provider 
console.log('Connecting to provider...');
const Web3HttpProvider = require('web3-providers-http')
// ...
const web3provider = new Web3HttpProvider('http://localhost:9545')
const provider = new ethers.providers.Web3Provider(web3provider)
//const provider = new ethers.providers.JsonRpcProvider('http://localhost:9545');

// get accounts provided by Truffle, with respective private keys


console.log('Connected to the provider');
//contract address of the registry
const RegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';

//function where the creation of an identity will be tested
const test = async (accounts) => {
	const ethrDid = await createDid(RegAddress, accounts[0], 0);
	const ethrDidResolver = getResolver.getResolver(
		{
			rpcUrl: 'http://localhost:9545',
			registry: RegAddress,
			chainId: '0x539',
			provider
		}
	);
	//create signing delegate valid for 1 day
	//await did0.createSigningDelegate();
	const didResolver = new Resolver.Resolver(ethrDidResolver);
	didResolver.resolve(ethrDid.did, ethrDidResolver).then((doc) => {
		console.log(doc);
		console.log(doc.didDocument.verificationMethod)
	});
	await ethrDid.createSigningDelegate();
	didResolver.resolve(ethrDid.did, ethrDidResolver).then((doc) => {
		console.log(doc);
		console.log(doc.didDocument.verificationMethod)
	});
	//trying to sign a JWT
	// const verification = await did0.signJWT({claims: {name: 'Pippo Baudo'}});
	// console.log(verification);

	// // verify a JWT
	// const jwt = verification;

	// const verificationResponse = await did0.verifyJWT(jwt, didResolver)
	// // payload contains the JavaScript object that was signed together with a few JWT specific attributes
	// console.log(verificationResponse)

	// Issuer contains the DID of the signing identity
	//console.log(issuer)

}

//function to create and return the object used to manage a DID
const createDid = async (RegAddress, accountAddress, index, chainId = '0x539') => {
	return getTrufflePrivateKey(mnemonic, index)
	.then(privateKey => {
		const publicKey = computePublicKey(privateKey, true);
		const identifier = `did:ethr:${chainId}:${publicKey}`;
		const signer = provider.getSigner(index);
		const conf = { 
			txSigner : signer,
			privateKey : privateKey,
			identifier : identifier,
			registry: RegAddress,
			chainNameOrId : chainId,
			provider
		};
		return new EthrDID(conf);
	})
	
}

//actual function that starts executing and this will invoke all the other pieces of code

provider.listAccounts().then((accounts) => { 
	test(accounts).catch(error => console.log(error));
	//getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
