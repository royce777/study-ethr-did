//import {default as getResolver} from 'ethr-did-resolver.js';
const Resolver = require('did-resolver')
const getResolver = require('ethr-did-resolver')

const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}


//console.log("getResolver:"+getResolver);
//console.log(getMethods(getResolver));

var EthrDID = require('ethr-did')
var Web3 = require('web3')
const DidRegistryContract = require('ethr-did-registry')

Web3.providers.HttpProvider.prototype.sendAsync = Web3.providers.HttpProvider.prototype.send
console.log('Connecting to provider...');
var provider = new Web3.providers.HttpProvider('http://localhost:7545');
var web3 = new Web3(provider);

console.log('Connected');

web3.eth.getAccounts().then(function(accounts){
	console.log(accounts);	  
	createRegistry(accounts);
});


//Create the registry and estimates the gas to deploy it
function createRegistry(accounts){
  console.log('DidRegistryContract..');
  var contractRegistry = new web3.eth.Contract(DidRegistryContract.abi);
  //console.log(DidRegistryContract);
  contractRegistry.deploy({data: DidRegistryContract.bytecode}).estimateGas({from: accounts[2]}).then(function(gasAmount){
    console.log("Gas consumed to deploy the registry: "+gasAmount);
    deployRegistry(contractRegistry,gasAmount,accounts);
  }).catch(function(error){
   console.log("Estimate gas error.."+error);
  });
}

//Deploy the registry
function deployRegistry(contractRegistry,gasAmount,accounts){
   //Deploy the Did registry
   contractRegistry.deploy({data: DidRegistryContract.bytecode}).send({
    from: accounts[2],
    gas: gasAmount,
    gasPrice: '30000000000000'})
	.on('error', function(error){console.log("error:"+error);})
	.on('transactionHash', function(transactionHash){console.log("transactionHash:"+transactionHash);})
	.on('receipt', function(receipt){
   	console.log("receipt:"+receipt.gasUsed); // contains the new contract address
}).then(function(newContractInstance){
    console.log(newContractInstance.options.address); // instance with the new contract address
    const ethrDidResolver = getResolver.getResolver({name:'test01', rpcUrl: 'http://localhost:7545', registry: newContractInstance.options.address});
    const didResolver = new Resolver.Resolver(ethrDidResolver);
    createDid(newContractInstance,didResolver,ethrDidResolver);
    //createDidFrom(newContractInstance,accounts[0])
});
}


function createDid(newContractInstance,didResolver,ethrDidResolver){
  //Create a new DID
  console.log('Create did')
  const keypair = EthrDID.createKeyPair()
  //console.log(keypair);
  console.log("address:"+keypair.address);
  console.log("private key:"+keypair.privateKey);
  const ethrDid = new EthrDID({address: keypair.address, privateKey: keypair.privateKey, registry: newContractInstance.options.address, provider});
  console.log(ethrDid);
  //Leggo owner del did
  ethrDid.lookupOwner().then((res) => console.log(res)).catch(function(error){
   console.log("error.."+error);
  });
 //
  didResolver.resolve("did:ethr:test01:"+ethrDid.address,ethrDidResolver).then((doc) => console.log(doc))
}


function createDidFrom(newContractInstance,account){
//Use an existing addresses as your identity
 const ethrDid = new EthrDID({address: account, privateKey: 'f4df57ba527f8e60542b91948a587214e8a1f780ac0a674a538f14f3576bf86f',registry: newContractInstance.options.address, provider});
 console.log(ethrDid);
}




