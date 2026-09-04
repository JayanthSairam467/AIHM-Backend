const fs = require('fs');
const path = require('path');

const srcDir = path.join('c:', 'Users', 'test', 'Desktop', 'Gowthum workspace', 'files for use', 'cts hackathon', 'omniscribe-backend', 'apps', 'fhir-formatter-service', 'src');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function (file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) {
            results = results.concat(walk(file));
        } else {
            if (file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const files = walk(srcDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    // regex to match `import ... from './something'` or `import ... from '../something'`
    // we want to append .js if it doesn't have it
    const newContent = content.replace(/(import\s+.*?from\s+['"]\.\/.*?)(['"])/g, (match, p1, p2) => {
        if (!p1.endsWith('.js')) {
            return p1 + '.js' + p2;
        }
        return match;
    }).replace(/(import\s+.*?from\s+['"]\.\.\/.*?)(['"])/g, (match, p1, p2) => {
        if (!p1.endsWith('.js')) {
            return p1 + '.js' + p2;
        }
        return match;
    });

    if (content !== newContent) {
        fs.writeFileSync(file, newContent, 'utf8');
        console.log(`Updated ${file}`);
    }
});
