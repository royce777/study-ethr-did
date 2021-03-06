import * as EthrDID from 'ethr-did'
import { Issuer } from 'did-jwt-vc'
import * as Resolver from 'did-resolver'
import * as getResolver from 'ethr-did-resolver'
import {ethers} from 'ethers'
import { computePublicKey } from '@ethersproject/signing-key'
import { JwtCredentialPayload, createVerifiableCredentialJwt, JwtPresentationPayload, createVerifiablePresentationJwt, verifyPresentation, verifyCredential } from 'did-jwt-vc'
//import { createRequire } from 'module';
import * as bip39  from 'bip39'

// type Issuer = typeof Issuer;
// type JwtCredentialPayload = typeof JwtCredentialPayload

const { createRequire } = require('module');
const req = createRequire(import.meta.url); // require is not okay
var hdkey = req('ethereumjs-wallet/hdkey')
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
const Web3HttpProvider = req('web3-providers-http')
// ...
const web3provider = new Web3HttpProvider('http://localhost:9545')
const provider = new ethers.providers.Web3Provider(web3provider)
//const provider = new ethers.providers.JsonRpcProvider('http://localhost:9545');

// get accounts provided by Truffle, with respective private keys

console.log('Connected to the provider');
//contract address of the registry
const RegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';

//function where the creation of an identity will be tested
const test = async () => {
	// create DID of the interacting subjects
	const uni : Issuer = await createDid(RegAddress, 0);
	const PaoloMori = await createDid(RegAddress, 1);
	const library = await createDid(RegAddress, 2);

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


  const vcPayload: JwtCredentialPayload = {
      sub: 'did:ethr:0x435df3eda57154cf8cf7926079881f2912f54db4',
      nbf: 1562950282,
      vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: {
          degree: {
            type: 'BachelorDegree',
            name: 'Baccalaur??at en musiques num??riques'
          }
        }
      }
    };
  const vcJwt = await createVerifiableCredentialJwt(vcPayload, uni)
  console.log(vcJwt);

  console.log('\n');
  console.log('Verifying');
  console.log('\n');

  const verifiedVC = await verifyCredential(vcJwt, didResolver)
  console.log(verifiedVC)
}


//function to create and return the object used to manage a DID
const createDid = async (RegAddress, index, chainId = '0x539') => {
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
	test().catch(error => console.log(error));
	//getTrufflePrivateKey(mnemonic,0).then(res => console.log(res.toString('hex')));
});
