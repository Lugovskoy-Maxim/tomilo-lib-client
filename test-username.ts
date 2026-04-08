import { formatUsernameDisplay } from './src/lib/username-display';

console.log('Testing formatUsernameDisplay with length > 16:');
const longName = 'VeryLongUsernameThatExceedsSixteen';
const result = formatUsernameDisplay(longName);
console.log('Input:', longName);
console.log('Output:', result);
console.log('Length:', result.length);
console.log('Expected length <= 16:', result.length <= 16);

console.log('\nTesting with normal name:');
const normal = 'User123';
console.log('Input:', normal);
console.log('Output:', formatUsernameDisplay(normal));

console.log('\nTesting with special characters:');
const special = 'UserName';
console.log('Input:', special);
console.log('Output:', formatUsernameDisplay(special));

console.log('\nTesting with null/undefined:');
console.log('null ->', formatUsernameDisplay(null));
console.log('undefined ->', formatUsernameDisplay(undefined));
console.log('empty string ->', formatUsernameDisplay(''));