import { verifyCredential } from "did-jwt-vc";
import { verifyAttributes } from "./verifyAttributes.js";

export const verifyCredentialsWithDisclosure = async (VP, DIDResolver) => {
    const credentials = VP.payload.vp.verifiableCredential;
    const verifiedCredentials = [];
    for( const credential of credentials ){
        let result = await verifyCredential(credential, DIDResolver);
        let verifiedVC = result.verifiableCredential;
        verifiedCredentials.push(verifiedVC);
    }
    const disclosureVerification = verifyAttributes(verifiedCredentials, VP.verifiablePresentation);
    return disclosureVerification;
}