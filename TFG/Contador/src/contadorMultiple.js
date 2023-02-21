
/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm start <Directorio del nodo>
 * Vamos a tomar varias pks de varias cuentas para simular generación
 * en varios contadores.
 * 
**/



process.title = "ProductorContador";

const fs = require("fs");

const privateKeys=[];
const addresses=[];


const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPKs_Firmantes();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync("./src/Produccion.abi"));
//Dir. del sc que hemos deployado con Remix
const contractAddress = '0xf128EBE06396A5636230d3425873106C73491470';
const ZERO_ADDRESS = `0x${'0'.repeat(40)}`;
//Cada cuantos segundos se hace una grabación de la lectura del contador
const SEG_GRABACION=10;
//Potencia máxima de la instalación en W
const MAX_POWER=400*5;  //5 paneles de 400W 
//En una hora al máx de generación esta instalación produciría 2000Wh o 2kWh
//Potencia máxima generada en SEG_GRABACION segundos
const MAX_POWER_PERIODO=(MAX_POWER*SEG_GRABACION)/(60*60);

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
    const ialeatorio=Math.floor(Math.random() * privateKeys.length);
    const privateKey=privateKeys[ialeatorio];
    const address=addresses[ialeatorio];
    //Comprobamos balance de la cuenta antes de transferir
    scProduccion.methods.balanceOf(address).call().then(b => {
        console.log(`Balance de ${address} antes de transacción: ${b}`);
    });
    
    const energiaGenerada=Math.floor(Math.random() * MAX_POWER_PERIODO+1);
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
        .once('receipt', (recibo) => {
            scProduccion.methods.balanceOf(address).call().then(b => {
                console.log(`Balance de ${address}  después de la transacción: ${b} (Blq. ${recibo.blockNumber})`);
            })
        })
        .on('error', (errx) => console.log(`Error al grabar dato ${errx}`))

};


function getPKs_Firmantes() {
    privateKeys.push('8745762b223bf426829b2909f5d954db8f776a12b8836fb74790384a676fc9d8',
    '230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b',
    'b352eb0fdcae639ecad63c28dda9e1c1b16617de719455abfa4dd6f5ca7a1b7f'
    )
    privateKeys.forEach(pk=>addresses.push(web3.eth.accounts.privateKeyToAccount(pk).address));
}