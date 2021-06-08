import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import { EthrDID } from 'ethr-did'
import { computePublicKey } from '@ethersproject/signing-key'
import { EdDSASigner } from 'did-jwt'
import pkg, { verifyCredential } from 'did-jwt-vc';
const { createVerifiableCredentialJwt, createVerifiablePresentationJwt, verifyPresentation } = pkg;
import { createRequire } from 'module';
import {hashAttributes} from './hashAttributes.js'
import {verifyAttributes} from './verifyAttributes.js'
import  nacl from 'tweetnacl';
import {getTrufflePrivateKey, connect} from './networkSetup.js'
import { getStatusRegistry, createRevoker, revokeCredential, checkCredentialStatus} from './revokeCredentials.js'


const require = createRequire(import.meta.url);

const { performance } = require('perf_hooks'); // performance suite for time measurement

const mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';

// connect to the local Ethereum network
const provider = connect();

//contract address of the DID registry
const DIDRegAddress = '0x2130c40ECCeF70DfA76645436c04dbA54dCeabad';

//contract address of the Revocation Registry
const RevRegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';

//function where the creation of an identity will be tested
const test = async (accounts) => {
	// create DID of the interacting subjects
	const uni = await createDid(DIDRegAddress, accounts[0], 0);
	
	// university wants to add a new signing key and publish it to its attributes on the EthrDIDRegistry by creating a signingDelegate

	// first save old signer function
	// const oldSigner = uni.signer;
	//create new keypair and publish it to EthrDIDRegistry
	//  const keypair = EthrDID.createKeyPair('0x539');
    // const keypair = nacl.sign.keyPair();
    // console.log(keypair.secretKey)
    // console.log(keypair.publicKey)
    // await uni.setAttribute('did/pub/Ed25519/veriKey/base64', keypair.publicKey);
	// uni.signer = EdDSASigner(keypair.secretKey);


	//now university tries to update its signer function to be able to sign the V-Credential with its new key

	//creating holder and verifier DIDs
	const PaoloMori = await createDid(DIDRegAddress, accounts[1], 1);
	const library = await createDid(DIDRegAddress, accounts[2], 2);

	// create the DID resolver 
	const ethrDidResolver = getResolver.getResolver(
		{
			rpcUrl: 'http://localhost:7545',
			registry: DIDRegAddress,
			chainId: '0x539',
			provider
		}
	);
	const didResolver = new Resolver.Resolver(ethrDidResolver);

	// create VC issued by university to Paolo Mori

	// hash claims 
	const hashedDegreeType = hashAttributes('MastersDegree');
	const hashedDegreeName = hashAttributes('Laurea Magistrale in Informatica');
	const hashedProfessorClass = hashAttributes('Cryptography');
	const hashedProfessorDepartment = hashAttributes('Computer Science');
	const hashedProfessorYear = hashAttributes('3');

	// issuer provides holder with data necessary to verify and selectively disclose attributes
	// that have been hashed
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
	const professorClassDisclosure = {
		path : ['professor', 'class'],
		clearValue : 'Cryptography',
		nonce : hashedProfessorClass.nonce
	}
	const professorDepartmentDisclosure = {
		path : ['professor', 'department'],
		clearValue : 'Computer Science',
		nonce : hashedProfessorDepartment.nonce
	}
	const professorYearDisclosure = {
		path : ['professor', 'year'],
		clearValue : '3',
		nonce : hashedProfessorYear.nonce
	}
	
	// this object contains attributes that holder wants to reveal inside the credential
	// with reference to the credential id, which is useful in case a single presentation (VP)
	// contains multiple verifiable credentials, in this case Paolo Mori wants to reveal 
	// only the fact that he is a Professor of Cryptography at the department of Computer Science
	const professorDisclosure = {
		credentialID : 'http://unipi.it/fake-credentials/1',
		attributes : [professorClassDisclosure, professorDepartmentDisclosure]
	}

	// verifiable credentials with all claims hashed
	const VCPayload = {
		sub: PaoloMori.did, //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
		nbf: 1562950282,
		credentialStatus: {
			type: "EthrStatusRegistry2019",
			id: `development:${RevRegAddress}`,
		  },
		vc: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			id : 'http://unipi.it/fake-credentials/1',
			type: ['VerifiableCredential','ProfessorCredential'],
			credentialSubject: {
				degree: {
					type: hashedDegreeType.res,
					name: hashedDegreeName.res
				},
				professor: {
					class: hashedProfessorClass.res,
					department: hashedProfessorDepartment.res,
					year : hashedProfessorYear.res
				},
			}
		}
	}


	const optionsEdDSA = {
		header: {
			"typ": "JWT",
			//"alg": "ES256K-R"
            "alg" : "EdDSA"
		},
	}
    const optionsES256K = {
		header: {
			"typ": "JWT",
			"alg": "ES256K-R"
		},
	}
	const signedVC = await createVCPerformance(VCPayload, uni, optionsES256K);
	//const resResearch = await createVCPerformance(researchVCPayload, uni, options);
	// const verifiedVC = await verifyCredential(vcJwt, didResolver);
	 console.log(signedVC.res);


	// Paolo Mori must create a Verifiable Presentation in order to present the claim to the library
	const vpPayload = {
		vp: {
			'@context': ['https://www.w3.org/2018/credentials/v1'],
			type: ['VerifiablePresentation'],
			verifiableCredential: [signedVC.res],
			disclosedAttributes : [professorDisclosure] 
		}
	}

	const resCreateVP = await createVPPerformance(vpPayload, PaoloMori, optionsES256K)
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

	// verify whether the credential is revoked 
	const statusRegistry = getStatusRegistry('development', 'http://localhost:7545');
	const revoker = createRevoker('development', 'http://localhost:7545');
	const revocationTxHash = await revokeCredential(mnemonic,0,revoker, signedVC.res);
	const credentialStatus = await checkCredentialStatus(statusRegistry, resVerifyVC.res.jwt, uni.did, didResolver);
	console.log(credentialStatus);
	 console.log(resVerifyVC.res.didResolutionResult.didDocument.verificationMethod);
	const disclosedAttributeVerification = verifyAttributes(verifiedVCs, verifiedVP);
	// PRINT PERFORMANCE RESULTS
	console.log(signedVC.time);
	//  console.log(resResearch.time);
	 console.log(resCreateVP.time);
	 console.log(resVerifyVP.time);
	 console.log(resVerifyVC.time);




}

//function to create and return the object used to manage a DID
const createDid = async (DIDRegAddress, accountAddress, index, chainId = '0x539') => {
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
