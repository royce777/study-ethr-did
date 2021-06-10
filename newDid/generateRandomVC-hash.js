import {createVerifiableCredentialJwt} from 'did-jwt-vc';
import {hashAttributes} from './hashAttributes.js'


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
    if(number <=0 || claimLength <= 0 ) throw new Error('number of claims and their number MUST BE > 0');
    let claimsDisclosure = {
        credentialId: VC.vc.id,
        claims : []
    }
    for(let i =0; i< number; i++){
        let claimValue = randStr(claimLength);
        let hashedClaim = hashAttributes(claimValue);
        let disclosureInfo = {
            path : [i.toString()],
            clearValue : claimValue,
            nonce : hashedClaim.nonce
        }
        VC.vc.credentialSubject[i] = hashedClaim.res;
        claimsDisclosure.claims.push(disclosureInfo);
    }
    return {VC: VC, claimsDisclosure : claimsDisclosure };
}

// JWT headers for 2 algs used to create credential token
const optionsEdDSA = {
    header: {
        "typ": "JWT",
        "alg" : "EdDSA"
    },
}
const optionsES256K = {
    header: {
        "typ": "JWT",
        "alg": "ES256K-R"
    },
}
export const generateRandomVC = async (DIDObj, claimsNumber, claimLength, RevRegAddress, algorithm) => {
    let options;
    if(algorithm ===  'EdDSA'){
        options = optionsEdDSA
    }
    else if(algorithm === 'ES256K-R') {
        options = optionsES256K;
    }
    else throw new Error('Invalid algorithm ')
    const VCPayload = {
        sub: DIDObj.did, 
        //nbf: Defines the time before which the JWT MUST NOT be accepted for processing
        nbf: 1562950282,
        credentialStatus: {
            type: "EthrStatusRegistry2019",
            id: `development:${RevRegAddress}`,
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
    const hashedCredentialClaims = generateClaims(VCPayload, claimsNumber, claimLength);
    const jwt = await createVerifiableCredentialJwt(hashedCredentialClaims.VC, DIDObj, options);
    return {jwt: jwt, claimsDisclosure : hashedCredentialClaims.claimsDisclosure};
}

