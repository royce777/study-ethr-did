import { createRequire } from 'module'
import {connect} from './networkSetup.js'
const require = createRequire(import.meta.url);
const inquirer = require('inquirer')

console.log ('Welcome to ethr-did testing CLI tool .... \nTrying to connect to default Ganache network ');
const provider = connect();
console.log('CONNECTED')
provider.listAccounts().then((accounts) => {
	main(accounts).catch(error => console.log(error));
});

const DIDs = []
const VCs = []
const VPs = []

const main = async (accounts) => {
    inquirer.prompt([
    {
      type: 'list',
      name: 'command',
      message: 'Please select the action you want to perform: ',
      choises : ['Create a new DID', 'List DIDs', 'Create a new VC', 'List VCs', 'Create a new VP', 'List VPs', 'Revoke a VC', 'Check VC revocation status']
    },
  ])
  .then(answers => {
    switch(answers.command) {
        case 'Create a new DID':
          createDIDHandler(accounts);
          break;
        default:
          // code block
      } 
});
}
const createDIDHandler = (accounts) => {
    inquirer.prompt([
        {
          type: 'list',
          name: 'command',
          message: 'Please select the action you want to perform: ',
          choises : ['Create a new DID', 'List DIDs', 'Create a new VC', 'List VCs', 'Create a new VP', 'List VPs', 'Revoke a VC', 'Check VC revocation status']
        },
}