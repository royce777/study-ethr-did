import crypto from 'crypto'
import eol from 'eol'

const keypair = crypto.generateKeyPairSync(
    'ed25519', 
    {
      privateKeyEncoding: { format: 'pem', type: 'pkcs8' }, 
      publicKeyEncoding: { format: 'pem', type: 'spki' }
    }
  );

  let lines = eol.split(keypair.privateKey)
  const privateKey = lines[1];

  lines = eol.split(keypair.publicKey);
  const publicKey = lines[1];
  
  console.log(privateKey)
  console.log(publicKey);
