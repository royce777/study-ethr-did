import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import { EthrDID } from 'ethr-did'
import { ethers } from 'ethers'
import { computePublicKey } from '@ethersproject/signing-key'
import { ES256KSigner, verifyJWT } from 'did-jwt'
import pkg, { verifyCredential } from 'did-jwt-vc';
const { JwtCredentialPayload, createVerifiableCredentialJwt, JwtPresentationPayload, createVerifiablePresentationJwt, verifyPresentation } = pkg;
import bip39 from 'bip39'
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
var hdkey = require('ethereumjs-wallet/hdkey')
//import wallet from 'ethereumjs-wallet'

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
	
	// university wants to add a new signing key and publish it to its attributes on the EthrDIDRegistry by creating a signingDelegate

	// first save old signer function
	const oldSigner = uni.signer;
	//create new keypair and publish it to EthrDIDRegistry
	const keypair = await uni.createSigningDelegate();


	//now university tries to update its signer function to be able to sign the V-Credential with its new key
	// uni.signer = ES256KSigner(newKeys.privateKey, true);

	//creating holder and verifier DIDs
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
	const degreeVCPayload = {
		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
		nbf: 1562950282,
		vc: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiableCredential'],
			credentialSubject: {
				degree: {
					type: 'MastersDegree',
					name: 'Laurea Magistrale in Informatica'
				}
			}
		}
	}

	
const researchVCPayload = {
		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
		nbf: 1562950282,
		vc: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiableCredential'],
			credentialSubject: {
				researcherAt: {
					organization: 'CNR',
					branch: 'SelfSovereignIdentity'
				}
			}
		}
	}

	const options = {
		header: {
			"typ": "JWT",
			"alg": "ES256K-R"
		},
	}
	const vcJwt1 = await createVerifiableCredentialJwt(degreeVCPayload, uni, options);
	const vcJwt2 = await createVerifiableCredentialJwt(researchVCPayload, uni, options);
	console.log(vcJwt1);
	// const verifiedVC = await verifyCredential(vcJwt, didResolver);
	// console.log(verifiedVC);


	// Paolo Mori must create a Verifiable Presentation in order to present the claim to the library
	const vpPayload = {
		vp: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiablePresentation'],
			verifiableCredential: [vcJwt1]
		}
	}

	const vpJwt = await createVerifiablePresentationJwt(vpPayload, PaoloMori, options)
	console.log('\n');
	console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI =====");
	console.log('\n');
	console.log(vpJwt);

	// at this point Paolo Mori receives a VP request from library, so he provides the presentation of his VC and the library verifies it
	const verifiedVP = await verifyPresentation(vpJwt, didResolver)
	console.log('\n');
	console.log("==== VERIFIABLE PRESENTATION CREATED BY PAOLO MORI IS BEING VERIFIED BY LIBRARY =====");
	console.log('\n');
	console.log(verifiedVP)

	console.log('\n');
	console.log("==== VERIFIABLE CREDENTIAL ISSUED BY UNIVERSITY TO PAOLO MORI IS BEING VERIFIED BY LIBRARY =====");
	console.log('\n');
	const unverifiedVC = verifiedVP.payload.vp.verifiableCredential[0];
	console.log('\n');
	console.log("==== UNVERIFIED VC =====");
	console.log('\n');
	console.log(unverifiedVC);
	console.log('\n');
	console.log("==== VERIFIED VC =====");
	console.log('\n');
	const verifiedVC = await verifyCredential(unverifiedVC, didResolver);
	console.log(verifiedVC);
	 console.log(verifiedVC.didResolutionResult.didDocument.verificationMethod);




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

//actual function that starts executing and this will invoke all the other pieces of code

provider.listAccounts().then((accounts) => {
	test(accounts).catch(error => console.log(error));
	//getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
