
/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con node contador.js <Directorio del nodo>
 * Tienen que exitir los ficheros:
 *   <Directorio del nodo>/keystore/<Unico fichero>: donde están las credenciales
 *          de la dirección que firma las transacciones en este nodo.
 *   <Directorio del nodo>/password.txt: password para desencriptar las credenciales
 *   
**/


"use strict";

process.title = "ProductorContador";

const fs = require("fs");
var address = '';
var privateKey = '';

const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync("./Produccion.abi"));
//Dir. del sc que hemos deployado con Remix
const contractAddress = '0x539E1276851C584300B34a27f8FFEE71B1a9a757';
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
//Cada cuantos segundos se hace una grabación de la lectura del contador
const SEG_GRABACION=20;

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
                console.log('Algo va mal: ' + e);
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
    //Identificamos el contrato con el abi y su dir en la bc.
    scProduccion = new web3.eth.Contract(abi, contractAddress);
    //Llamamos al metodo name del sc ERC20, que al deployarlo le dimos la unidad de medida 
    scProduccion.methods.name().call().then(nombreTk => console.log(`Unidad de medida: ${nombreTk}`));
    //Cada SEG_GRABACION segundos crea una grabación
    intervalProduccionId = setInterval(grabaProduccion, SEG_GRABACION*1000);
}

async function grabaProduccion() {
    //Comprobamos balance de la cuenta antes de transferir
    scProduccion.methods.balanceOf(address).call().then(b => {
        console.log(`Balance de ${address} antes de transacción: ${b}`);
    });
    //Referencia al método llamado, la dir. 0x0 identifica en el sc que es una grabación
    let grabaProduccionTx = scProduccion.methods.transfer(ZERO_ADDRESS, 10);
    //Creo objeto transacción firmada
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
    privateKey = '8745762b223bf426829b2909f5d954db8f776a12b8836fb74790384a676fc9d8';
    address = '0x8628b9F3f125d889cA6a08C61E70Cc34B4B604a0';


}