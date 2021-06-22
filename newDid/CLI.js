import Resolver from 'did-resolver'
import getResolver from 'ethr-did-resolver'
import { createRequire } from 'module'
import { createDid } from './DID-VC-utils.js';
import {connect} from './networkSetup.js'
import { changeSignerCLI } from './changeSignerCLI.js';
const require = createRequire(import.meta.url);
const inquirer = require('inquirer')

const mnemonic = 'family dress industry stage bike shrimp replace design author amateur reopen script';
const DIDRegAddress = '0x2130c40ECCeF70DfA76645436c04dbA54dCeabad';
const RevRegAddress = '0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0';

console.log ('Welcome to ethr-did testing CLI tool .... \nTrying to connect to default Ganache network ');
const provider = connect();
console.log('CONNECTED')
console.log('Setting up DID resolver');
const ethrDidResolver = getResolver.getResolver(
  {
    rpcUrl: 'http://localhost:7545',
    registry: DIDRegAddress,
    chainId: '0x539',
    provider
  }
);
const didResolver = new Resolver.Resolver(ethrDidResolver);

provider.listAccounts().then((accounts) => {
	main(accounts).catch(error => console.log(error));
});

const DIDs = []
const VCs = []
const VPs = []

const main = async (accounts) => {
  let iterate = true;
  while(iterate){
    await inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Please select the action you want to perform: ',
      choices : ['Create a new DID', 'List DIDs', 'Get a DID Document', 'Manage DID Signers', 'Create a new VC', 'List VCs', 'Create a new VP', 'List VPs', 'Revoke a VC', 'Check VC revocation status']
    },
  ])
  .then(async answers => {
    switch(answers.command) {
        case 'Create a new DID':
          await createDIDHandler(accounts);
          break;
        case 'List DIDs' :
          listDIDsHandler();
          break;
        case 'Get a DID Document' :
          await didResolverHandler();
          break;
        case 'Manage DID Signers' :
          await didSignersHandler();
        default:
          // code block
      } 
   });
  }
}
const createDIDHandler = async (accounts) => {
    await inquirer.prompt([
        {
          type: 'list',
          name: 'account',
          message: 'Please select Ganache account you want to refer the new DID to: ',
          choices : [...accounts]
        },
        {
          type : 'input',
          name : 'DIDName',
          message : 'Please provide a name ( it will be used to distinguish between different DID objects)',
          
        }
    ]).then(async answers => {
        let alreadyExistent = DIDs.find(x => x.value.address);
        if(alreadyExistent != undefined){
          console.log('You have already created a DID using this address !');
          return;
        }
        let did = await createDid(DIDRegAddress, accounts.indexOf(answers.account), mnemonic, provider, '0x539');
        //add signers property to contain all signers ( keys ) that are created during execution
        did.signers = [];
        let myDid = {
          name : answers.DIDName,
          value : did
        }
        DIDs.push(myDid);
        console.log('New DID has been created with success');
    })
}

const listDIDsHandler = () => {
  if(DIDs.length === 0) console.log('You have no active DID objects !')
  else {
    DIDs.forEach( (element, index) => {
      console.log(index + ') ' +element.name + '\t' + element.value.did+ '\n');
    })
  }
}

const didResolverHandler = async () => {
  if(DIDs.length < 1 ) {
    console.log('No DIDs created so far !');
    return;
  }
  await inquirer.prompt([
    {
      type: 'list',
      name: 'did',
      message: 'Please select DID you want to resolve',
      choices : [...DIDs]
    }
  ]).then ( async answers => {
    let doc = await didResolver.resolve(answers.did.did);
    console.log(doc);
  })
}

const didSignersHandler = async () => {
  if(DIDs.length === 0) console.log('You have no active DID objects !');
  else {
    await inquirer.prompt([
      {
        type: 'list',
        name: 'did',
        message: 'Please select DID',
        choices : [...DIDs]
      }
    ]).then ( async answ => {
      await inquirer.prompt([
        {
          type: 'list',
          name: 'action',
          message: 'Please select action you want to perform',
          choices : ['New signer', 'Switch signer', 'List signers']
        },
        {
          type : 'list',
          name : 'signerType',
          message : 'Select the signer you want to add ',
          choices : ['ES256K-R', 'EdDSA'], 
          when : (answers) => answers.action === 'New signer'
        },
        {
          type : 'list',
          name : 'signerToUse',
          message : 'Select the signer you want to use',
          choices : [answ.did.signers],
          when : (answers) => answers.action === 'Switch signer' && answ.signers.length > 0
        }
      ]).then( async answers => {
        if(answers.action === 'New signer') {
          await changeSignerCLI(answ.did, answers.signerType);
        }
        else if (answers.action === 'Switch signer') {
          if(answ.did.signers.length > 0) {
            console.log('The signer should be changed here !')
            }
          }
        else if (answers.action === 'List signers'){
          answ.did.signers.forEach(element => {
            console.log(element);
          })
        }
        })
    })
  }
}

