//Este script se tiene que ejectuar en el dir padre al nodo
const dirNodo="C:/Users/P/Documents/PabloT/ethereum/RaspBerry/nodePC";
const fs = require("fs");
var address = ''; //'0x8628b9F3f125d889cA6a08C61E70Cc34B4B604a0'
var privateKey = '';//'8745762b223bf426829b2909f5d954db8f776a12b8836fb74790384a676fc9d8'

const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
const abi = JSON.parse(fs.readFileSync("./Produccion.abi"));
const contractAddress = '0x19798FAA22095716258068830d48a4E287699420';
const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000';

var scProduccion;
var intervalProduccionId = null;
var conectado = false;



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

setInterval(checkActive, 2000);

function iniciaGrabacion() {
    console.log('Inicia grabación');
    if (intervalProduccionId) clearInterval(intervalProduccionId);
    scProduccion = new web3.eth.Contract(abi, contractAddress);
    scProduccion.methods.name().call().then(console.log);
    intervalProduccionId = setInterval(grabaProduccion, 20000);
}

async function grabaProduccion() {
    //Comprobamos balance de la cuenta antes de transferir
    scProduccion.methods.balanceOf(address).call().then(b => {
        console.log('Balance de ' + address + ' antes de transacción: ' + b);
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
                console.log('Balance de ' + address + ' despues de la transacción: ' + b);
            })
        })
        .on('error', (errx) => console.log('Error al grabar dato ' + errx))

};


function getPK_Firmante_Nodo(){
  let dirKeyStore=dirNodo+'/keystore';
  let files = fs.readdirSync(dirKeyStore);
  let file=files[0];
  let encrypted_key=JSON.parse(fs.readFileSync(dirKeyStore+'/'+file));
  let passw=fs.readFileSync(dirNodo+'/password.txt',{encoding:'utf8', flag:'r'});
  let pKStore = web3.eth.accounts.decrypt(encrypted_key,passw );
  privateKey=pKStore.privateKey;
  address=pKStore.address;


}