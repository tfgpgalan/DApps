
/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm run multiple.
 * Vamos a tomar varias pks de varias cuentas para simular generación
 * en varios contadores.
 * 
 * 
**/



process.title = "ProductorContador";

const fs = require("fs");

const privateKeys = [];
const addresses = [];


const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPKs_Firmantes();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync("./ProduccionSemanal.abi"));
//Dir. del sc que hemos deployado con Remix
const contractAddress = '0x6A676121D0F40cDf42F49aaE47882dA509a81dD1';
//'0xE694db2e2c827A8DB5D251c1ca4C2532Ace6E5EF';
//'0xf128EBE06396A5636230d3425873106C73491470';
const MAX_POWER = 400 * 5;  //5 paneles de 400W 
const DIAS_SOL_SEVILLA = 300;
const DiasNublados365 = 365- DIAS_SOL_SEVILLA;
const DiasNublados100=(DiasNublados365*100)/365;



var scProduccion;
var nombreTk;
grabaProduccionSemanal();




async function grabaProduccionSemanal() {
    scProduccion = new web3.eth.Contract(abi, contractAddress);
    //Llamamos al metodo name del sc ERC20, que al deployarlo le dimos la unidad de medida 
    nombreTk=await scProduccion.methods.name().call();
    console.log(`Unidad de medida: ${nombreTk}`);
    //La primera cuenta se utilizará para firmar todas las transacciones, TIENE QUE TENER FONDOS
    const privateKeyFirmante = privateKeys[0];
    for (ipk = 0; ipk < privateKeys.length; ipk++) {
        
        const address = addresses[ipk];
        const straddress = ''.concat(address.slice(0, 5), '...', address.slice(-3));
        for (dow = 1; dow <= 7; dow++) {
            console.log(`Grabando día ${dow} address ${straddress}`);
            const energiaGenerada = generaProduccionDiaria();
            //Referencia al método llamado, la dir. 0x0 identifica en el sc que es una grabación de energía
            let grabaProduccionTx = scProduccion.methods.acumula_dia(address, dow, energiaGenerada);

            //Creo objeto transacción firmada
            const createTx = await web3.eth.accounts.signTransaction(
                {   //Dir del sc
                    to: scProduccion.options.address,
                    //Pto. de entrada al metodo a llamar del sc
                    data: grabaProduccionTx.encodeABI(),
                    gas: await grabaProduccionTx.estimateGas({ value: '0' }),
                    value: '0'
                },
                privateKeyFirmante
            );

            const recibo=await web3.eth.sendSignedTransaction(createTx.rawTransaction);
            //Envío la transacción firmada
/*             web3.eth.sendSignedTransaction(createTx.rawTransaction)
                .once('receipt', async (recibo) => {
                    const b = await scProduccion.methods.balanceOf(address).call();
                    console.log(`Producción acumulada de ${straddress} DESPUÉS de transacción: ${b}${nombreTk} (Blq. ${recibo.blockNumber}).`);
                    //console.log(`Balance: ${await web3.eth.getBalance(address)}`);
                })
                .on('error', (errx) => console.log(`Error al grabar dato ${errx}`)) */
        }
    }
};



function generaProduccionDiaria() {
    const DiaNublado=Math.floor(Math.random()*100)<DiasNublados100;
    pDiaria = [];
    for (hora = 0; hora < 24; hora++) {
        let energiaHora = 0;
        if (hora >= 9 && hora <= 14) energiaHora = (hora - 9) * (MAX_POWER / (14 - 9));
        if (hora > 14 && hora <= 18) energiaHora = MAX_POWER;
        if (hora > 18 && hora <= 21) energiaHora = (-(hora - 21) * (MAX_POWER / (21 - 18)));
        energiaHora=Math.floor(DiaNublado?energiaHora*0.5:energiaHora);
        pDiaria.push(energiaHora);
        
    } 
    return pDiaria;
}


function getPKs_Firmantes() {
    //La primera cuenta es la que se va a utilizar para firmar las transacciones
    //TIENE QUE TERNER FONDOS.
    privateKeys.push( '230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b',
    '8745762b223bf426829b2909f5d954db8f776a12b8836fb74790384a676fc9d8',
    'b352eb0fdcae639ecad63c28dda9e1c1b16617de719455abfa4dd6f5ca7a1b7f'
    
    )
    privateKeys.forEach(pk => addresses.push(web3.eth.accounts.privateKeyToAccount(pk).address));
}

