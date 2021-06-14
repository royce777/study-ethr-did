import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import {connect} from './networkSetup.js'
import {generateRandomVC} from './generateRandomVC-hash.js'
import {createDid, createVP} from './DID-VC-utils.js'
import { createRequire } from 'module'
import { verifyPresentation } from 'did-jwt-vc'
import { verifyCredentialsWithDisclosure} from './verifyCredentials.js'
const require = createRequire(import.meta.url);

// performance suite for time measurement
const { performance } = require('perf_hooks');

const mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';

// connect to the local Ethereum network
const provider = connect();

//contract address of the DID registry
const DIDRegAddress = '0x2130c40ECCeF70DfA76645436c04dbA54dCeabad';

//contract address of the Revocation Registry
const RevRegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';

const test = async (accounts) => {
	// create DID of the interacting subjects
	const DIDObj = await createDid(DIDRegAddress, 0, mnemonic, provider);

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
    
    let start = performance.now();
    const credential = await generateRandomVC(DIDObj,100,100,RevRegAddress, 'ES256K-R');
    let end = performance.now();
    let actionTime = end - start;
    console.log('randomVC generation time :  '  + actionTime +  ' ms');

    let credentials = [credential.jwt];
    let claimsDisclosure = [credential.claimsDisclosure]
    start = performance.now();
    const presentationJWT = await createVP(credentials, claimsDisclosure, DIDObj, 'ES256K-R');
    end = performance.now();
    actionTime = end - start;
    console.log('VP generation time :  '  + actionTime +  ' ms');

    start = performance.now();
    const verifiedVP = await verifyPresentation(presentationJWT,didResolver);
    end = performance.now()
    actionTime = end - start;
    console.log('VP verification time : ' + actionTime + ' ms');

    start = performance.now();
    const res = await verifyCredentialsWithDisclosure(verifiedVP, didResolver);
    end = performance.now();
    actionTime = end - start;
    console.log('VC verification time : ' + actionTime + ' ms');
}
provider.listAccounts().then((accounts) => {
	test(accounts).catch(error => console.log(error));
});
