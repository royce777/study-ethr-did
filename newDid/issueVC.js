import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import { EthrDID } from 'ethr-did'
import { ethers } from 'ethers'
import { computePublicKey } from '@ethersproject/signing-key'
import { ES256KSigner } from 'did-jwt'
import pkg, { verifyCredential } from 'did-jwt-vc';
const { createVerifiableCredentialJwt, createVerifiablePresentationJwt, verifyPresentation } = pkg;
import bip39 from 'bip39'
import { createRequire } from 'module';
import {hashAttributes} from './hashAttributes.js'
import {verifyAttributes} from './verifyAttributes.js'

const require = createRequire(import.meta.url);
const hdkey = require('ethereumjs-wallet/hdkey')
//import wallet from 'ethereumjs-wallet'

const { performance } = require('perf_hooks'); // performance suite for time measurement


const mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';

//function that retrieves private keys of Truffle accounts
// return value : Promise
const getTrufflePrivateKey = (mnemonic, index) => {
	if (index < 0 || index > 9) throw new Error('please provide correct truffle account index')
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
const web3provider = new Web3HttpProvider('http://localhost:7545')
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
	
	// university wants to add a new signing key and publish it to its attributes on the EthrDIDRegistry by creating a signingDelegate

	// first save old signer function
	// const oldSigner = uni.signer;
	//create new keypair and publish it to EthrDIDRegistry
	//  const keypair = EthrDID.createKeyPair('0x539');
	//  await uni.setAttribute('did/pub/Secp256k1/veriKey/hex', keypair.publicKey);
	//  uni.signer = ES256KSigner(keypair.privateKey, true);


	//now university tries to update its signer function to be able to sign the V-Credential with its new key

	//creating holder and verifier DIDs
	const PaoloMori = await createDid(RegAddress, accounts[1], 1);
	const library = await createDid(RegAddress, accounts[2], 2);

	// create the DID resolver 
	const ethrDidResolver = getResolver.getResolver(
		{
			rpcUrl: 'http://localhost:7545',
			registry: RegAddress,
			chainId: '0x539',
			provider
		}
	);
	const didResolver = new Resolver.Resolver(ethrDidResolver);

	// create VC issued by university to Paolo Mori
	const hashedDegreeType = hashAttributes('MastersDegree');
	const hashedDegreeName = hashAttributes('Laurea Magistrale in Informatica');
	const degreeTypeDisclosure = {
		path : ['degree','type'],
		clearValue : 'MastersDegree',
		nonce : hashedDegreeType.nonce
	}
	const degreeNameDisclosure = {
		path : ['degree', 'name'],
		clearValue : 'Laurea Magistrale in Informatica',
		nonce : hashedDegreeName.nonce
	}
	const degreeDisclosure = {
		credentialID : 'http://unipi.it/fake-credentials/1',
		attributes : [degreeNameDisclosure, degreeTypeDisclosure]
	}
	const degreeVCPayload = {
		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
		nbf: 1562950282,
		vc: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			id : 'http://unipi.it/fake-credentials/1',
			type: ['VerifiableCredential','ProfessorCredential'],
			credentialSubject: {
				degree: {
					type: hashedDegreeType.res,
					name: hashedDegreeName.res
				},
				researcherAt: {
					organization: 'CNR',
					branch: 'SelfSovereignIdentity'
				}

			}
		}
	}

	
// const researchVCPayload = {
// 		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
// 		nbf: 1562950282,
// 		vc: {
// 			'@context': ['https://www.w3.org/2018/credentials/v1'],
// 			type: ['VerifiableCredential'],
// 			credentialSubject: {
// 				researcherAt: {
// 					organization: 'CNR',
// 					branch: 'SelfSovereignIdentity'
// 				}
// 			}
// 		}
// 	}

	const options = {
		header: {
			"typ": "JWT",
			"alg": "ES256K-R"
		},
	}
	const resDegree = await createVCPerformance(degreeVCPayload, uni, options);
	//const resResearch = await createVCPerformance(researchVCPayload, uni, options);
	// const verifiedVC = await verifyCredential(vcJwt, didResolver);
	 console.log(resDegree.res);


	// Paolo Mori must create a Verifiable Presentation in order to present the claim to the library
	const vpPayload = {
		vp: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiablePresentation'],
			verifiableCredential: [resDegree.res],
			disclosedAttributes : [degreeDisclosure] 
		}
	}

	const resCreateVP = await createVPPerformance(vpPayload, PaoloMori, options)
	console.log('\n');
	console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI =====");
	console.log('\n');
	console.log(resCreateVP.res);

	// at this point Paolo Mori receives a VP request from library, so he provides the presentation of his VC and the library verifies it
	const resVerifyVP = await verifyPresentationPerformance(resCreateVP.res, didResolver);
	console.log('\n');
	console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI IS BEING VERIFIED BY LIBRARY =====");
	console.log('\n');
	const verifiedVP = resVerifyVP.res.verifiablePresentation;
	console.log(resVerifyVP.res)

	console.log('\n');
	console.log("==== VERIFIABLE CREDENTIAL ISSUED BY UNIVERSITY TO PAOLO MORI IS BEING VERIFIED BY LIBRARY =====");
	console.log('\n');
	const unverifiedVC = resVerifyVP.res.payload.vp.verifiableCredential[0];
	console.log('\n');
	console.log("==== UNVERIFIED VC =====");
	console.log('\n');
	console.log(unverifiedVC);
	console.log('\n');
	console.log("==== VERIFIED VC =====");
	console.log('\n');
	const resVerifyVC = await verifyCredentialPerformance(unverifiedVC, didResolver);
	const verifiedVC = resVerifyVC.res.verifiableCredential;
	const verifiedVCs = [verifiedVC];
	console.log(resVerifyVC.res);
	// console.log(resVerifyVC.res.didResolutionResult.didDocument.verificationMethod);
	const disclosedAttributeVerification = verifyAttributes(verifiedVCs, verifiedVP);
	// PRINT PERFORMANCE RESULTS
	console.log(resDegree.time);
	//  console.log(resResearch.time);
	 console.log(resCreateVP.time);
	 console.log(resVerifyVP.time);
	 console.log(resVerifyVC.time);




}

//function to create and return the object used to manage a DID
const createDid = async (RegAddress, accountAddress, index, chainId = '0x539') => {
	return getTrufflePrivateKey(mnemonic, index)
		.then(privateKey => {
			const publicKey = computePublicKey(privateKey, true);
			const identifier = `did:ethr:${chainId}:${publicKey}`;
			const signer = provider.getSigner(index);
			const conf = {
				txSigner: signer,
				privateKey: privateKey,
				identifier: identifier,
				registry: RegAddress,
				chainNameOrId: chainId,
				provider
			};
			return new EthrDID(conf);
		})

}

const createVCPerformance = async (payload, did, options) => {
	let start = performance.now();
	const jwt = await createVerifiableCredentialJwt(payload, did, options);
	let end = performance.now();
	const createVCtime = "Create VC took " + (end-start) + "ms"
	return {res : jwt, time : createVCtime};
}
const createVPPerformance =  async (payload, did, options) => {
	let start = performance.now();
	const jwt = await createVerifiablePresentationJwt(payload, did, options);
	let end = performance.now();
	const createVPtime = "Create VP took " + (end-start) + "ms"
	return {res : jwt, time : createVPtime} ;
}

const verifyPresentationPerformance = async (jwt, resolver) => {
	let start = performance.now();
	const result = await verifyPresentation(jwt, resolver);
	let end = performance.now();
	const verifyVPtime = "Verify VP took " + (end-start) + "ms"
	return {res : result, time : verifyVPtime};
}

const verifyCredentialPerformance = async (jwt, resolver) => {
	let start = performance.now();
	const result = await verifyCredential(jwt, resolver);
	let end = performance.now();
	const verifyVCtime = "Verify VC took " + (end-start) + "ms"
	return {res : result, time : verifyVCtime} ;
}


//actual function that starts executing and this will invoke all the other pieces of code

provider.listAccounts().then((accounts) => {
	test(accounts).catch(error => console.log(error));
	//getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
