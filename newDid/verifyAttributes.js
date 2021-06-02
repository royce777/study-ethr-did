import {hashAttributes} from './hashAttributes.js'

export const verifyAttributes = (VCs,VP) => {
    const disclosedAttributes = VP.vp.disclosedAttributes;
    VCs.forEach(credential => {
        var claims = credential.credentialSubject;
        var verified = 0;
        if(claims && disclosedAttributes){
            disclosedAttributes.forEach(element => {
                if(element.credentialID === credential.vc.id) {
                    console.log('=== VERIFYING DISCLOSED ATTRIBUTES OF ' + credential.vc.id);
                    var attributes = element.attributes;
                    attributes.forEach(element => {
                        var propToVerify = checkPath(element.path, claims);
                        if (propToVerify) {
                            var rehashedAttribute = hashAttributes(element.clearValue, element.nonce)
                            if(rehashedAttribute.res === propToVerify)
                                verified ++ ;
                            else
                                throw new Error('Unable to verify '+ propToVerify + ' hashing failed !')
                        }
                        else {
                            var propertyPath = element.path.join('->');
                            throw new Error('cannot find such claim : ' + propertyPath);
                        }
                    })
                    
                }
            });
        }
        else 
            throw new Error('Claims or disclosedAttributes parameters are undefined !')
    })
    return 0;
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
