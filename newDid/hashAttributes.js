import { createRequire } from 'module';

const require = createRequire(import.meta.url);

const md5 = require('md5');
// function to generate nonce string for hashing
/*
  Generate a random string of a given length.
  @params:
    length: *required* - length of string to generate 
    kind:   *optional* - character set or sets to use for string generation  (default: 'aA#')
      Available options
        'a' => for lowercase alphabets [a-z]
        'A' => for uppercase alphabets [A-Z]
        '#' => numbers [0-9]
        '!' => special character as defined
        '*' => all of the above
      
      Default charset is AlphaNumeric - equivalent to 'aA#'
  Typical Usage
    console.log(randomString(10));        // alphanumeric strings. Uses 'aA#'
    console.log(randomString(10, 'a'));   // downcase alpha
    console.log(randomString(10, 'A'));   // downcase alpha
    console.log(randomString(19, '#aA')); // case-insensitive AlphaNumric
    console.log(randomString(24, '#A!')); // numbers && upcase alpha && special characters
    console.log(randomString(100, '*'));  // Everything: case-insensitive AlphaNumric && special characters
*/
const randomString = (length, kind) => {
	var i,
		str = '', 
		opts = kind || 'aA#',
		possibleChars = '';
  
	if (kind.indexOf('*') > -1) opts = 'aA#!'; // use all possible charsets
  
	// Collate charset to use
	if (opts.indexOf('#') > -1) possibleChars += '0123456789';
	if (opts.indexOf('a') > -1) possibleChars += 'abcdefghijklmnopqrstuvwxyz';
	if (opts.indexOf('A') > -1) possibleChars += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
	if (opts.indexOf('!') > -1) possibleChars += '~`!@#$%^&*()_+-={}[]:";\'<>?,./|\\';
  
	for(i = 0; i < length; i++) {
	  str += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
	}
	return str;
  }

  // in order to implement the possibility of selective disclosure
	// the issuer provides the VC with hashed values of all the claims
	// for each claim the issuer uses a different nonce during hashing
export const hashAttributes = (attribute, nonce = undefined ) => {
	var tmp = md5(attribute);
    console.log('######################################################################################### '+nonce);
    if(!nonce)
	    nonce = randomString(8,'#aA');
	tmp = tmp + ':' + nonce;
	const result = md5(tmp);
    return { nonce: nonce, res: result};
}