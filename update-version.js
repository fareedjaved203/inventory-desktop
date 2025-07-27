const fs = require('fs');
const path = require('path');

// Read version from package.json
const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
const version = packageJson.version;

// Update frontend version file
const versionFileContent = `// Auto-generated version file
export const VERSION = '${version}';`;

fs.writeFileSync(path.join('frontend', 'src', 'version.js'), versionFileContent);

console.log(`Updated version to ${version}`);