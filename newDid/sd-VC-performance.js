import {hashAttributes} from './hashAttributes.js'
import { createRequire } from 'module';
import { getHeapSnapshot } from 'v8';

const require = createRequire(import.meta.url);
const performance = require('perf_hooks').performance;


const randStr= (length) => {
    let result           = '';
    let characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let charactersLength = characters.length;
    for ( let i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

const generateClaims = (VC, number , claimLength) => {1
    if(number <=0 || claimLength <= 0 ) throw new Error('number of claims and their number MUST BE >0');
    let claimsDisclosure = {
        credentialId: VC.vd.id,
        claims : []
    }
    for(let i =0; i< number; i++){
        let claimValue = randStr(claimLength);
        let hashedClaim = hashAttributes(claimValue);
        let disclosureInfo = {
            path : i.toString,
            clearValue : claimValue,
            nonce : hashedClaim.nonce
        }
        VC.vc.credentialSubject[i] = hashedClaim;
        claimsDisclosure.claims.push(disclosureInfo);
    }
    return {VC: VC, claimsDisclosure : claimsDisclosure };
}
const start = performance.now()
const VCPayload = {
    sub: 'did:ethr:0x539:0x032990f5cda17a6927bd843d785eae438264d95b79d6fbd33e98eeb75e63219dee', 
    //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
    nbf: 1562950282,
    credentialStatus: {
        type: "EthrStatusRegistry2019",
        id: 'development:0x1482aDFDC2A33983EE69F9F8e4F852c467688Ea0',
      },
    vc: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        id : 'http://unipi.it/fake-credentials/1',
        type: ['VerifiableCredential'],
        credentialSubject: {
           // all random generated claims will be placed here
        }
    }
}

const hashedCredentialClaims = generateClaims(VCPayload, 100, 100);

const end = performance.now();
console.log(hashedCredentialClaims.VC);
console.log(hashedCredentialClaims.claimsDisclosure);


