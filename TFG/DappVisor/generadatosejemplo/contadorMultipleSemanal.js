/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm run multiplesemanal.
 * Vamos a tomar varias address de varias cuentas para simular generación
 * en varios contadores.
 * La firma se hará con la clave privada de la address 
 * owner del del contrato ProduccionSemanalHora
 * 
 **/

process.title = "ProductorContador";

const fs = require("fs");

//Dir. del sc que hemos deployado el deploy de DappVisor
const contractAddress = "0xa26C28964db50486CA811cc45321985E165B6294";

const addressProductor = [];
const privateKeyFirmante = "230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b";
const addressFirmante = "0x24bB02397880147D1Fa245Dfc422Ad2322CC7A17";
const Web3 = require("web3");
const nodoUrl = "http://10.10.10.99:8545";
const web3 = new Web3(nodoUrl);
getAddress_Productores();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(
  fs.readFileSync(__dirname + "/../frontendSemanal/ProduccionSemanalHora.abi")
);

const MAX_POWER = 400 * 5; //5 paneles de 400W
const DIAS_SOL = 300;
const DiasNublados365 = 365 - DIAS_SOL;
const DiasNublados100 = (DiasNublados365 * 100) / 365;

var scProduccion;
var nombreTk;
grabaProduccionSemanal();

async function grabaProduccionSemanal() {
  scProduccion = new web3.eth.Contract(abi, contractAddress);
  //Llamamos al metodo name del sc ERC20, que al deployarlo le dimos la unidad de medida
  nombreTk = await scProduccion.methods.name().call();
  console.log(`Unidad de medida: ${nombreTk}`);
  //La primera cuenta se utilizará para firmar todas las transacciones, TIENE QUE TENER FONDOS

  let gas = -1;
  for (iProd = 0; iProd < addressProductor.length; iProd++) {
    const address = addressProductor[iProd];
    console.log(`Address[${iProd}]: ${address}`)
    const straddress = "".concat(address.slice(0, 5), "...", address.slice(-3));
    for (dow = 1; dow <= 7; dow++) {
      console.log(`Grabando día ${dow} address ${straddress}`);
      const energiaGenerada = generaProduccionDiaria();
      let grabaProduccionTx

      //Referencia al método llamado, la dir. 0x0 identifica en el sc que es una grabación de energía
      try {

        grabaProduccionTx = await scProduccion.methods.acumula_dia(address, dow, energiaGenerada);
        gas = await grabaProduccionTx.estimateGas({ from: addressFirmante });

        //Vamos a tomar la siguiente transacción de la address
        let nonce = await web3.eth.getTransactionCount(addressFirmante);
        //Creo objeto transacción firmada
        const createTx = await web3.eth.accounts.signTransaction(
          {
            //Dir del sc
            to: scProduccion.options.address,
            nonce: nonce,
            //Pto. de entrada al metodo a llamar del sc
            data: grabaProduccionTx.encodeABI(),
            gas: gas,
            value: "0",
          },
          privateKeyFirmante
        );

        //Envío la transacción firmada
        const recibo = await web3.eth.sendSignedTransaction(createTx.rawTransaction);
      }
      catch (err) {
        console.log('Catch error');
        console.log(err);
        process.exit(1);
      }
    }
  }
}

function generaProduccionDiaria() {
  const DiaNublado = Math.floor(Math.random() * 100) < DiasNublados100;
  pDiaria = [];
  for (hora = 0; hora < 24; hora++) {
    let energiaHora = 0;
    const HORAMAXSOL = 13;
    energiaHora = Math.E ** (-0.1 * (hora - HORAMAXSOL) ** 2) * MAX_POWER;
    const NUBE = DiaNublado ? Math.random() < 0.8 : Math.random() < 0.2;
    energiaHora = Math.floor(NUBE ? energiaHora * 0.8 : energiaHora);
    pDiaria.push(energiaHora);
  }
  console.log(pDiaria);
  return pDiaria;
}

function getAddress_Productores() {
  addressProductor[0] = "0x24bB02397880147D1Fa245Dfc422Ad2322CC7A17";
  addressProductor[1] = "0x1820D24352aDBDEf327d23Af9E6642B649618e96";
  addressProductor[2] = "0xD3007eddA70Acf65CA744BA8Eb17016B4f4759A9";
}
