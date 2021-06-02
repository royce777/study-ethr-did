import {hashAttributes} from './hashAttributes.js'

export const verifyAttributes = (VC,VP) => {
    const disclosedAttributes = VP.vp.disclosedAttributes;
    const claims = VC.credentialSubject;
    var verified = 0;
    if(claims && disclosedAttributes){
        disclosedAttributes.forEach(element => {
            var propToVerify = checkPath(element.path, claims);
            if (propToVerify) {
                var rehashedAttribute = hashAttributes(element.clearValue, element.nonce)
                if(rehashedAttribute.res === propToVerify)
                    verified ++ ;
                else
                    throw new Error('Unable to verify '+ propToVerify + ' hashing failed !')
            }
        });
        return 0;
    }
    else 
        throw new Error('Claims or disclosedAttributes parameters are undefined !')
}

const checkPath = (path, claims) => {
    var finalProp = undefined;
    path.forEach(element => {
        if(finalProp === undefined )
            finalProp = claims[element];
        else 
            finalProp = finalProp[element];
    });
    return finalProp;
}
