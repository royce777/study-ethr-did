import { EthrDID } from 'ethr-did'
import { computePublicKey } from '@ethersproject/signing-key'
import { verifyCredential, verifyPresentation, createVerifiableCredentialJwt, createVerifiablePresentationJwt } from 'did-jwt-vc';
import {getTrufflePrivateKey} from './networkSetup.js'
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const { performance } = require('perf_hooks'); // performance suite for time measurement


//function to create and return the object used to manage a DID
export const createDid = async (DIDRegAddress, index, mnemonic, provider, chainId = '0x539') => {
	return getTrufflePrivateKey(mnemonic, index)
		.then(privateKey => {
			const publicKey = computePublicKey(privateKey, true);
			const identifier = `did:ethr:${chainId}:${publicKey}`;
			const signer = provider.getSigner(index);
			const conf = {
				txSigner: signer,
				privateKey: privateKey,
				identifier: identifier,
				registry: DIDRegAddress,
				chainNameOrId: chainId,
				provider
			};
			return new EthrDID(conf);
		})

}

export const createVCPerformance = async (payload, did, options) => {
	let start = performance.now();
	const jwt = await createVerifiableCredentialJwt(payload, did, options);
	let end = performance.now();
	const createVCtime = "Create VC took " + (end-start) + "ms"
	return {res : jwt, time : createVCtime};
}
export const createVPPerformance =  async (payload, did, options) => {
	let start = performance.now();
	const jwt = await createVerifiablePresentationJwt(payload, did, options);
	let end = performance.now();
	const createVPtime = "Create VP took " + (end-start) + "ms"
	return {res : jwt, time : createVPtime} ;
}

export const verifyPresentationPerformance = async (jwt, resolver) => {
	let start = performance.now();
	const result = await verifyPresentation(jwt, resolver);
	let end = performance.now();
	const verifyVPtime = "Verify VP took " + (end-start) + "ms"
	return {res : result, time : verifyVPtime};
}

export const verifyCredentialPerformance = async (jwt, resolver) => {
	let start = performance.now();
	const result = await verifyCredential(jwt, resolver);
	let end = performance.now();
	const verifyVCtime = "Verify VC took " + (end-start) + "ms"
	return {res : result, time : verifyVCtime} ;
}

export const createVP = async (VCs, claimsDisclosure, did, alg) => {
	let options = undefined;
	const vpPayload = {
		vp: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiablePresentation'],
			verifiableCredential: VCs,
			disclosedAttributes : claimsDisclosure 
		}
	}
	const optionsEdDSA = {
		header: {
			"typ": "JWT",
			"alg" : "EdDSA"
		},
	}
	const optionsES256K = {
		header: {
			"typ": "JWT",
			"alg": "ES256K-R"
		},
	}
	if(alg === 'EdDSA') options = optionsEdDSA
	else if(alg === 'ES256K-R') options = optionsES256K;
	else throw new Error('wrong algorithm');
	const result = await createVerifiablePresentationJwt(vpPayload, did, options);
	return result;
}
