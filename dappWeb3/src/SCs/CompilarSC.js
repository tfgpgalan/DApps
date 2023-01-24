//Compila y saca ficheros con el abi y el bytecode del contrato
//El script tiene dos parámetros el fichero .sol y el nombre del contrato
const contractName = process.argv[2];
let ficheroSol = process.argv[3];

const fs = require("fs");
const path = require("path")
const Web3 = require("web3");
const solc = require('solc');
if (!fs.existsSync(ficheroSol)) throw Error(`No existe el fichero ${ficheroSol}`)
//Cambiamos el dir al del fichero sol
process.chdir(path.dirname(fs.realpathSync(ficheroSol)));
ficheroSol = path.basename(ficheroSol)
const contentSc = fs.readFileSync(ficheroSol).toString()
//Especifica las entradas y las salidas al compilador
var objectSolc = {
    language: 'Solidity',
    sources: {
        'contrato': {
            content: contentSc
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
const output = JSON.parse(solc.compile(JSON.stringify(objectSolc), { import: findImports }))

const bytecodeContract = output.contracts.contrato[contractName].evm.bytecode.object
const abi = JSON.stringify(output.contracts.contrato[contractName].abi);
//module.exports=output.contracts.contrato[contractName]
fs.writeFile(`${contractName}.bin`, bytecodeContract, (err) => {msgFichero(err,`${contractName}.bin`)});
fs.writeFile(`${contractName}.abi`, abi, (err) => {msgFichero(err,`${contractName}.abi`)});

function findImports(relativePath) {
    const absolutePath = path.resolve(process.cwd(), '.', relativePath);
    const source = fs.readFileSync(absolutePath, 'utf8');
    return { contents: source };
}

function msgFichero(err,nomfi){
    if (err)
      console.log(err);
    else { console.log(`Fichero generado: ${nomfi}`) }
}