
const fs = require("fs");
const path = require("path")
const solc = require('solc');
const contractName=process.argv[2];//"ProduccionSemanalHora";
const contractFile=`${contractName}.sol`;
const contractAbiFile=`${contractName}.abi`;
const contractFilePath=path.join(__dirname,`../${contractFile}`);
const contractAbiFilePath=path.join(__dirname,`../${contractAbiFile}`);

const code=fs.readFileSync(contractFilePath,'utf8');
var objectSolc = {
    language: 'Solidity',
    sources: {
        'contrato': {
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

//La salida de la compilación tendrá el bytecode y el abi del contrato
const output = JSON.parse(solc.compile(JSON.stringify(objectSolc), { import: findImports }));
//console.log(output);
const abi = JSON.stringify(output.contracts.contrato[contractName].abi);
fs.writeFile(contractAbiFilePath, abi, (err) => {msgFichero(err,contractAbiFilePath)});

module.exports={
    abi:output.contracts.contrato[contractName].abi,
    bytecode: output.contracts.contrato[contractName].evm.bytecode.object
}

//Suponemos que los imports del contrato principal están en su mismo path
function findImports(relativePath) {
    //console.log(relativePath)
    const absolutePath = path.join(__dirname,`../${relativePath}`);
    //path.resolve(process.cwd(), './contracts', relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}
function msgFichero(err,nomfi){
    if (err)
      console.log(err);
    else { console.log(`Fichero generado: ${nomfi}`) }
}