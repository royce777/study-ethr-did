import { ethers } from 'ethers'
import bip39 from 'bip39'
import { createRequire } from 'module';


const require = createRequire(import.meta.url);
const hdkey = require('ethereumjs-wallet/hdkey')
//import wallet from 'ethereumjs-wallet'

//function that retrieves private keys of Truffle accounts
// return value : Promise

export const getTrufflePrivateKey = async (mnemonic, index) => {
	if (index < 0 || index > 9) throw new Error('please provide correct truffle account index')
	return bip39.mnemonicToSeed(mnemonic).then(seed => {
		const hdk = hdkey.fromMasterSeed(seed);
		const addr_node = hdk.derivePath(`m/44'/60'/0'/0/${index}`); //m/44'/60'/0'/0/0 is derivation path for the first account. m/44'/60'/0'/0/1 is the derivation path for the second account and so on
		//const addr = addr_node.getWallet().getAddressString(); //check that this is the same with the address that ganache list for the first account to make sure the derivation is correct
		const privKey = addr_node.getWallet().getPrivateKey();
		return privKey;
	}).catch(error => console.log('getTrufflePrivateKey ERROR : ' + error));
}


export const connect = () => {
    //setup the provider 
    console.log('Connecting to provider...');
    const Web3HttpProvider = require('web3-providers-http')
    // ...
    const web3provider = new Web3HttpProvider('http://localhost:7545')
    const provider = new ethers.providers.Web3Provider(web3provider)
    console.log('Connected to the provider');
    return provider;

}