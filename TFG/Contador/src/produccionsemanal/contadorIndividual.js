
/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm start <Directorio del nodo>
 * Tienen que exitir los ficheros:
 *   <Directorio del nodo>/keystore/<Unico fichero>: donde están las credenciales
 *          de la dirección que firma las transacciones en este nodo.
 *   <Directorio del nodo>/password.txt: password para desencriptar las credenciales
 * 
 * Este script se pondría en cada nodo de la red para simular contador de producción de electricidad.
**/



process.title = "ProductorContador";

const fs = require("fs");
var address = '';
var privateKey = '';

const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync(__dirname + "/ProduccionSemanalHora.abi"));
//Dir. del sc que hemos deployado
const contractAddress ='0xf323f006bAE4717d88988CFa306ff6273D20108b';

const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
//Cada cuantos segundos se hace una grabación de la lectura del contador
const SEG_GRABACION=20;
//Potencia máxima de la instalación en W
const MAX_POWER=400*5;  //5 paneles de 400W 
//En una hora al máx de generación esta instalación produciría 2000Wh o 2kWh
//Potencia máxima generada en SEG_GRABACION segundos
const MAX_POWER_PERIODO=(MAX_POWER*SEG_GRABACION)/(60*60);
const DIAS_SOL = 300;
const DiasNublados365 = 365 - DIAS_SOL;
const DiasNublados100 = (DiasNublados365 * 100) / 365;

var scProduccion;
var nombreTk;
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
    scProduccion.methods.name().call().then(nombretk => {nombreTk=nombretk;console.log(`Unidad de medida: ${nombreTk}`)});
    //Cada SEG_GRABACION segundos crea una grabación
    intervalProduccionId = setInterval(grabaProduccion, SEG_GRABACION*1000);
}

async function grabaProduccion() {
    const straddress=''.concat(address.slice(0,5),'...',address.slice(-3));
    //Comprobamos balance de la cuenta antes de transferir
    const b=await scProduccion.methods.balanceOf(address).call();

    console.log(`Producción acumulada de ${straddress} ANTES de transacción: ${b}${nombreTk}.`);
    
    const energiaGenerada=calculaEnergiaGenerada();
    //Referencia al método llamado, la dir. 0x0 identifica en el sc que es una grabación de energía
    let grabaProduccionTx = scProduccion.methods.transfer(ZERO_ADDRESS, energiaGenerada);
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
        .once('receipt', async (recibo) => {
            const b=await scProduccion.methods.balanceOf(address).call();
            console.log(`Producción acumulada de ${straddress} DESPUÉS de transacción: ${b}${nombreTk} (Blq. ${recibo.blockNumber}).`);
        })
        .on('error', (errx) => console.log(`Error al grabar dato ${errx}`))

};

function calculaEnergiaGenerada(){

    
}

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