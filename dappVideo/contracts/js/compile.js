const fs = require("fs");
const path = require("path")
const solc = require('solc');
const contractName="MyCoin";
const MyCoinPath=path.join(__dirname,'../MyCoin.sol');
const code=fs.readFileSync(MyCoinPath,'utf8');
var objectSolc = {
    language: 'Solidity',
    sources: {
        'MyCoin.sol': {
            content: code
        }
    },
    settings: {
        outputSelection: {
            '*': {
                '*': ['*']
            }
        }
    }
}

const output = JSON.parse(solc.compile(JSON.stringify(objectSolc), { import: findImports }));
console.log(output);
const abi = JSON.stringify(output.contracts['MyCoin.sol'].MyCoin.abi);
fs.writeFile(`MyCoin.abi`, abi, (err) => {msgFichero(err,`MyCoin.abi`)});
module.exports={
    abi:output.contracts['MyCoin.sol'].MyCoin.abi,
    bytecode: output.contracts['MyCoin.sol'].MyCoin.evm.bytecode.object
}

function findImports(relativePath) {
    const absolutePath = path.resolve(process.cwd(), './contracts', relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}
function msgFichero(err,nomfi){
    if (err)
      console.log(err);
    else { console.log(`Fichero generado: ${nomfi}`) }
}