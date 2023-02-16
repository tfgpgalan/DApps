//Script simulador grabación de contador en la bc.
//Este script se tiene que ejectuar en el dir padre al nodo
//Suponemos un y solo un fichero keystore en ./keystore/ donde está
//las credenciales de la dir. que firma en el minado del nodo.
//La password para obtener la pk del keystore está en el dir. donde está el script
//y se llama password.txt

const fs = require("fs");
var address = '';
var privateKey = '';

const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync("./Produccion.abi"));
const contractAddress = '0x19798FAA22095716258068830d48a4E287699420';
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;

var scProduccion;
var intervalProduccionId = null;
var conectado = false;
isConectedDaemon();

function isConectedDaemon() {
    const checkActive = () => {
        web3.eth.net.getId()
            .then(() => {
                if (!conectado) {
                    conectado = true;
                    iniciaGrabacion();
                }
            })
            .catch(e => {
                console.log('Wow. Something went wrong: ' + e);
                conectado = false;
                if (intervalProduccionId) clearInterval(intervalProduccionId);
                web3.setProvider(nodoUrl);
            });
    }
    //Cada dos segundos poll al nodo
    setInterval(checkActive, 2000);
}



function iniciaGrabacion() {
    console.log('Inicia grabación');
    if (intervalProduccionId) clearInterval(intervalProduccionId);
    scProduccion = new web3.eth.Contract(abi, contractAddress);
    scProduccion.methods.name().call().then(nombreTk => console.log(`Unidad de medida: ${nombreTk}`));
    intervalProduccionId = setInterval(grabaProduccion, 20000);
}

async function grabaProduccion() {
    //Comprobamos balance de la cuenta antes de transferir
    scProduccion.methods.balanceOf(address).call().then(b => {
        console.log(`Balance de ${address} antes de transacción: ${b}`);
    });
    //Referencia al metodo llamado
    let grabaProduccionTx = scProduccion.methods.transfer(ZERO_ADDRESS, 10);
    //Creo objeto transaccion firmada
    const createTx = await web3.eth.accounts.signTransaction(
        {   //Dir del sc
            to: scProduccion.options.address,
            //Pto. de entrada al metodo a llamar del sc
            data: grabaProduccionTx.encodeABI(),
            gas: await grabaProduccionTx.estimateGas({ value: '0' }),
            value: '0'
        },
        privateKey
    );

    //Envío la transacción firmada
    web3.eth.sendSignedTransaction(createTx.rawTransaction)
        .once('receipt', (recibo) => {
            scProduccion.methods.balanceOf(address).call().then(b => {
                console.log(`Balance de ${address}  despues de la transacción: ${b} (Blq. ${recibo.blockNumber})`);
            })
        })
        .on('error', (errx) => console.log(`Error al grabar dato ${errx}`))

};


function getPK_Firmante_Nodo() {
    const dirNodo = process.argv[2];
    if (dirNodo=='' || !fs.existsSync(dirNodo)) throw Error(`No existe el directorio ${dirNodo}`)
    let dirKeyStore = `${dirNodo}/keystore`;
    let files = fs.readdirSync(dirKeyStore);
    let file = files[0];
    let encrypted_key = JSON.parse(fs.readFileSync(dirKeyStore + '/' + file));
    let passw = fs.readFileSync(`${dirNodo}/password.txt`, { encoding: 'utf8', flag: 'r' });
    let pKStore = web3.eth.accounts.decrypt(encrypted_key, passw);
    privateKey = pKStore.privateKey;
    address = pKStore.address;


}