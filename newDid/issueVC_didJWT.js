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
	// create DID of the interacting subjects
	const uni = await createDid(RegAddress, accounts[0], 0);
	const PaoloMori = await createDid(RegAddress, accounts[1], 1);
	const library = await createDid(RegAddress, accounts[2], 2);

	// create the DID resolver 
	const ethrDidResolver = getResolver.getResolver(
		{
			rpcUrl: 'http://localhost:9545',
			registry: RegAddress,
			chainId: '0x539',
			provider
		}
	);
	const didResolver = new Resolver.Resolver(ethrDidResolver);

	// create VC issued by university to Paolo Mori
	const vcPayload = {
		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
		nbf: 1562950282,
		vc: {
		'@context': ['https://www.w3.org/2018/credentials/v1'],
		type: ['VerifiableCredential'],
		credentialSubject: {
			degree: {
			type: 'MastersDegree',
			name: 'Laurea Magistrale in Informatica'
			},
			role : 'Professor'
		}
		}
	}
    const vcJwt = await uni.signJWT(vcPayload);
	// const vcJwt = await createVerifiableCredentialJwt(vcPayload, uni);
	console.log(vcJwt);

	// Paolo Mori must create a Verifiable Presentation in order to present the claim to the library
	const vpPayload = {
		vp: {
		  '@context': ['https://www.w3.org/2018/credentials/v1'],
		  type: ['VerifiablePresentation'],
		  verifiableCredential: [vcJwt]
		}
	  }
	  
	//   const vpJwt = await createVerifiablePresentationJwt(vpPayload, PaoloMori)
	  const vpJwt = await PaoloMori.signJWT(vpPayload);
	  console.log('\n');
	  console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI =====");
	  console.log('\n');
	  console.log(vpJwt);

	  // at this point Paolo Mori receives a VP request from library, so he provides the presentation of his VC and the library verifies it
	//   const verifiedVP = await verifyPresentation(vpJwt, didResolver)
	  console.log('\n');
	  console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI IS BEING VERIFIED BY LIBRARY =====");
	  console.log('\n');
	  const vpVerified = await library.verifyJWT(vpJwt, didResolver)
		// payload contains the JavaScript object that was signed together with a few JWT specific attributes

	console.log(vpVerified);
	console.log('\n');
	console.log("==== VERIFIABLE CREDENTIAL GIVEN TO PAOLO MORI FROM UNIVERSITY IS  =====");
	console.log('\n');
	  const vcUnverified = getVC(vpVerified);
	  const vcVerified = await library.verifyJWT(vcUnverified, didResolver);
	  console.log(JSON.stringify(vcVerified, null, 4));
	//const vcVerified = await library.verifyJWT(jwt, didResolver)


	//   console.log(verifiedVP)


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

const getVC = (response) => {
	if (response.payload.vp.verifiableCredential.length > 0) {
		return response.payload.vp.verifiableCredential[0];
	}
}

//actual function that starts executing and this will invoke all the other pieces of code

provider.listAccounts().then((accounts) => { 
	test(accounts).catch(error => console.log(error));
	//getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
