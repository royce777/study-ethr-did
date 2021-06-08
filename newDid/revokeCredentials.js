import { sign } from 'ethjs-signer'
import {getTrufflePrivateKey} from './networkSetup.js'
//SR: status registry 
import { EthrStatusRegistry, EthrCredentialRevoker } from 'ethr-status-registry'
import { Status } from 'credential-status'

//SR : status register interaction setup
export const getStatusRegistry = (networkName, rpcUrl) => new Status({
    ...new EthrStatusRegistry({networks: [
		{ name: networkName, rpcUrl: rpcUrl }]}).asStatusMethod,
})


export const createRevoker = (networkName, rpcUrl) => {
    const revoker = new EthrCredentialRevoker({networks: [
        { name: networkName, rpcUrl: rpcUrl }]})
    return revoker;
}

export const revokeCredential = async (mnemonic, accountIndex, revoker, credentialToken) => {
    var revokerPrivateKey = await getTrufflePrivateKey(mnemonic,accountIndex);
    revokerPrivateKey ='0x' + revokerPrivateKey.toString('hex')
    const ethSigner = (rawTx, cb) => cb(null, sign(rawTx, revokerPrivateKey))
    const txHash = await revoker.revoke(credentialToken, ethSigner)
    return txHash;
}

export const checkCredentialStatus = async (statusRegistry, credentialToken, did, didResolver)=> {
    const DIDdoc = await didResolver.resolve(did);
    const VCstatus = await statusRegistry.checkStatus(credentialToken, DIDdoc.didDocument);
    return VCstatus;
}
