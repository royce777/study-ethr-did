import { EthrDID } from 'ethr-did'
import { EdDSASigner, ES256KSigner } from 'did-jwt'
import  nacl from 'tweetnacl';


export const changeSignerCLI = async (didObj, signerType) => {
    if(signerType === 'EdDSA') {
        const keypair = nacl.sign.keyPair();
        await didObj.setAttribute('did/pub/Ed25519/veriKey/base64', keypair.publicKey);
        let newSigner = {
            type : signerType,
            signer : EdDSASigner(keypair.secretKey)
        }

        didObj.signers.push(newSigner);
    }
    else if(signerType === 'ES256K-R'){
        const keypair = EthrDID.createKeyPair('0x539');
        await didObj.setAttribute('did/pub/Secp256k1/veriKey/base64', keypair.publicKey);
        let newSigner = {
            type : signerType,
            signer : ES256KSigner(keypair.privateKey, true)
        }
    }
    else {
        throw new Error('Unknown signer type !');
    }
}