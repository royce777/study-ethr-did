import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import {EthrDID} from  'ethr-did'
import Web3  from'web3'
import DidRegistryContract  from 'ethr-did-registry'

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
console.log('Connecting to provider...');
var provider = new Web3.providers.HttpProvider('http://localhost:9545');
var web3 = new Web3(provider);

console.log('Connected');
const RegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';


//function where the creation of an identity will be tested
const test = async (accounts) => {
	did0 = createDid(RegAddress, accounts[0]);
	//await did0.setAttribute('did/pub/Ed25519/veriKey/base64', 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx');
	const ethrDidResolver = getResolver.getResolver(
		{
			name: 'test01',
			rpcUrl: 'http://localhost:9545',
			registry: RegAddress
		}
	);
	const didResolver = new Resolver.Resolver(ethrDidResolver);
	didResolver.resolve("did:ethr:test01:" + did0.address, ethrDidResolver).then((doc) => {
		console.log(doc);
		console.log(doc.didDocument.verificationMethod);
	});
	// const res = await did0.createSigningDelegate();
	// console.log('signingDelegate res : ' + res);
	//const verification = await did0.signJWT({claims: {name: 'Pippo Baudo'}})
	//console.log(verification);
	const jwt = 'eyJ0eXAiOiJKV1QiLCJhbGciOiJFUzI1NkstUiJ9.eyJpYXQiOjE2MTgyNjI0NDIsImNsYWltcyI6eyJuYW1lIjoiUGlwcG8gQmF1ZG8ifSwiaXNzIjoiZGlkOmV0aHI6MHg4RGQyMThERjU1ZDM4MmM4MzRDOTJFRDRGNWYxMjdhQzhBREMwNUZiIn0.ARnH8c-ikRRpzHoLpiDzuacvv4gdMMsG6VZ5Q7DgN3fwJEZ2uEbNbo2vpBtuVtvpL2CBzEEnLqwQcFY6fA9dgQE';

	did1 = createDid(RegAddress, accounts[1]);

	const { payload, issuer } = did1.verifyJWT(jwt, didResolver);
	console.log(` PAYLOAD :
	${payload}`)

	// Issuer contains the DID of the signing identity
	console.log('ISSUER : ');
	console.log(issuer)

}


const createDid = (RegAddress, account, didResolver, ethrDidResolver, accounts) => {
	//Create a new DID  
	// const keypair = EthrDID.createKeyPair()
	// //console.log(keypair);
	// console.log("address:" + keypair.address);
	// console.log("private key:" + keypair.privateKey);
	const ethrDid = new EthrDID({ identifier: account, registry: RegAddress, provider });
	// console.log(ethrDid);
	//Leggo owner del did
	// ethrDid.lookupOwner().then((res) => console.log('owner is: ' + res)).catch( (error) => {
	// 	console.log("error.." + error);
	// });
	return ethrDid;
	//
	// didResolver.resolve("did:ethr:test01:" + ethrDid.address, ethrDidResolver).then((doc) => console.log(doc));
}

web3.eth.getAccounts().then((accounts) => {
	//console.log(accounts);	  
	test(accounts).catch(error => console.log(error));
});
