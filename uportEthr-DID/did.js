const Resolver = require('did-resolver')
const getResolver = require('ethr-did-resolver')

var EthrDID = require('ethr-did')
var Web3 = require('web3')
const DidRegistryContract = require('ethr-did-registry')

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
console.log('Connecting to provider...');
var provider = new Web3.providers.HttpProvider('http://localhost:9545');
var web3 = new Web3(provider);

console.log('Connected');

// const createRegistry = accounts => {
// 	var contractRegistry = new web3.eth.Contract(DidRegistryContract.abi);
// 	contractRegistry
// 		.deploy({ data: DidRegistryContract.bytecode })
// 		.estimateGas({ from: accounts[0] }).then((gasAmount) => {
// 			console.log("Gas consumed to deploy the registry: " + gasAmount);
// 			deployRegistry(contractRegistry, gasAmount, accounts);
// 		})
// 		.catch((error) => {
// 			console.log("Estimate gas error.." + error);
// 		});
// }

// const deployRegistry = (contractRegistry, gasAmount, accounts) => {
// 	//Deploy the Did registry
// 	contractRegistry.deploy({ data: DidRegistryContract.bytecode }).send({
// 		from: accounts[0],
// 		gas: gasAmount,
// 		gasPrice: '30000000000'
// 	})
// 		.on('error', (error) => {
// 			console.log("error:" + error);
// 		})
// 		.on('transactionHash', (transactionHash) => {
// 			console.log("transactionHash:" + transactionHash);
// 		})
// 		.on('receipt', (receipt) => {
// 			console.log("receipt:" + receipt.gasUsed); // contains the new contract address
// 		})
// 		.then(async (newContractInstance) => {
// 			console.log(newContractInstance.options.address); // instance with the new contract address
// 			const ethrDidResolver = getResolver.getResolver(
// 				{
// 					name: 'test01',
// 					rpcUrl: 'http://localhost:7545',
// 					registry: newContractInstance.options.address
// 				}
// 			);
// 			const didResolver = new Resolver.Resolver(ethrDidResolver);
// 			// create first DID
// 			const did1 = createDid(newContractInstance, didResolver, ethrDidResolver, accounts);
// 			// create second DID
// 			const did2 = createDid(newContractInstance, didResolver, ethrDidResolver, accounts);
// 			const did3 = createDid(newContractInstance, didResolver, ethrDidResolver, accounts);
// 			const DIDs = [did1, did2, did3];
// 			const promises = DIDs.map((item) => item.lookupOwner());
// 			const owners = await Promise.all(promises);
// 			console.log('owner1 :' + owners[0]);
// 			console.log('owner2 :' + owners[1]);
// 			console.log('owner3 :' + owners[2]);
// 			did3.changeOwner(accounts[2])
// 				.then(async txHash => {
// 					console.log('transactionHash :' +txHash);
// 					return did1.lookupOwner();
// 				})
// 				.then( (owner) => {
// 					console.log('did1 owner :' + owner);
// 					return did2.lookupOwner();
// 				})
// 				.then((owner) => {
// 					console.log('did2 owner :' + owner);
// 				})
// 				.catch(err => console.log(err));

// 			// did1.lookupOwner().then((res) => {
// 			// 	console.log('owner of did1 is: ' + res);
// 			// 	const owner1 = res;
// 			// 	return did2.lookupOwner();
// 			// })
// 			// .then((res) => {
// 			// 	const owner2 = res;
// 			// })
// 			// .catch( (error) => {
// 			// 	console.log("error.." + error);
// 			// });
// 			// try to change owner of a DID


// 			//createDidFrom(newContractInstance,accounts[0])
// 		});
// }
const test = async (accounts) => {
	did0 = createDid('0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0', accounts[0]);
	//await did0.setAttribute('did/pub/Ed25519/veriKey/base64', 'Arl8MN52fwhM4wgBaO4pMFO6M7I11xFqMmPSnxRQk2tx');
	const ethrDidResolver = getResolver.getResolver(
		{
			name: 'test01',
			rpcUrl: 'http://localhost:9545',
			registry: '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0'
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

	did1 = createDid('0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0', accounts[1]);

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
	const ethrDid = new EthrDID({ address: account, registry: RegAddress, provider });
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
	test(accounts);
});
