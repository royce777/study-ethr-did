import { EthrDID } from 'ethr-did'
import { EdDSASigner, ES256KSigner } from 'did-jwt'
import  nacl from 'tweetnacl';


export const changeSigner = async (didObj, signerType) => {
    if(signerType === 'EdDSA') {
        const oldSigner = didObj.signer;
        const keypair = nacl.sign.keyPair();
        // console.log(keypair.secretKey)
        // console.log(keypair.publicKey)
        await didObj.setAttribute('did/pub/Ed25519/veriKey/base64', keypair.publicKey);
        didObj.signer = EdDSASigner(keypair.secretKey);
        return oldSigner;
    }
    else if(signerType === 'ES256K-R'){
        const oldSigner = didObj.signer;
        const keypair = EthrDID.createKeyPair('0x539');
        await didObj.setAttribute('did/pub/Secp256k1/veriKey/base64', keypair.publicKey);
        didObj.signer = ES256KSigner(keypair.privateKey, true);
        return oldSigner;
    }
    else {
        throw new Error('Unknown signer type !');
    }
}