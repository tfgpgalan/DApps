/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm run multiple.
 * Vamos a tomar varias address de varias cuentas para simular generación
 * en varios contadores.
 * La firma se hará con la clave privada de la primera address de la matriz privateKeys
 * que tiene que ser del owner del contrato ProduccionSemanalHora
 * 
 **/

process.title = "ProductorContador";

const fs = require("fs");

const addressProductor = [];
const privateKeyFirmante = "230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b";
const addressFirmante="0x24bB02397880147D1Fa245Dfc422Ad2322CC7A17"; 
const Web3 = require("web3");
const nodoUrl = "HTTP://127.0.0.1:9545";
const web3 = new Web3(nodoUrl);
getAddress_Productores();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(
  fs.readFileSync(__dirname + "/ProduccionSemanalHora.abi")
);
//Dir. del sc que hemos deployado el deploy de DappVisor
<<<<<<< HEAD
const contractAddress = '0x616f690B7D54006A9aeb34D36cDFAA309D2f73A7';
=======
const contractAddress = "0xf323f006bAE4717d88988CFa306ff6273D20108b";
>>>>>>> 2e2cac88e1ace8fc36623b0f08721bb77684f991

const MAX_POWER = 400 * 5; //5 paneles de 400W
const DIAS_SOL = 300;
const DiasNublados365 = 365 - DIAS_SOL;
const DiasNublados100 = (DiasNublados365 * 100) / 365;

var scProduccion;
var nombreTk;
grabaProduccionSemanal();

async function grabaProduccionSemanal() {
<<<<<<< HEAD
    scProduccion = new web3.eth.Contract(abi, contractAddress);
    //Llamamos al metodo name del sc ERC20, que al deployarlo le dimos la unidad de medida 
    nombreTk=await scProduccion.methods.name().call();
    console.log(`Unidad de medida: ${nombreTk}`);
    //La primera cuenta se utilizará para firmar todas las transacciones, TIENE QUE TENER FONDOS
    const privateKeyFirmante = privateKeys[1];
    //console.log(privateKeyFirmante)
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
            console.log(recibo);
            console.log(await scProduccion.methods.ultimosender().call());
            //Envío la transacción firmada
/*             web3.eth.sendSignedTransaction(createTx.rawTransaction)
                .once('receipt', async (recibo) => {
                    const b = await scProduccion.methods.balanceOf(address).call();
                    console.log(`Producción acumulada de ${straddress} DESPUÉS de transacción: ${b}${nombreTk} (Blq. ${recibo.blockNumber}).`);
                    //console.log(`Balance: ${await web3.eth.getBalance(address)}`);
                })
                .on('error', (errx) => console.log(`Error al grabar dato ${errx}`)) */
        }
=======
  scProduccion = new web3.eth.Contract(abi, contractAddress);
  //Llamamos al metodo name del sc ERC20, que al deployarlo le dimos la unidad de medida
  nombreTk = await scProduccion.methods.name().call();
  console.log(`Unidad de medida: ${nombreTk}`);
  //La primera cuenta se utilizará para firmar todas las transacciones, TIENE QUE TENER FONDOS

  let gas=-1;
  for (ipk = 0; ipk < addressProductor.length; ipk++) {
    const address = addressProductor[ipk];
    console.log(`Address[${ipk}]: ${address}`)
    const straddress = "".concat(address.slice(0, 5), "...", address.slice(-3));
    for (dow = 1; dow <= 7; dow++) {
        console.log(`Grabando día ${dow} address ${straddress}`);        
        const energiaGenerada = generaProduccionDiaria();
        let grabaProduccionTx
        
        //Referencia al método llamado, la dir. 0x0 identifica en el sc que es una grabación de energía
        try {
console.log('Antes de Acumula');            
         grabaProduccionTx = await scProduccion.methods.acumula_dia(address,dow,energiaGenerada);
console.log('Antes de estimateGas'); 
        if (gas==-1) { gas = await grabaProduccionTx.estimateGas({ from: addressFirmante });}
console.log('Antes de nonce');         
        //Vamos a tomar la siguiente transacción de la address
        let nonce = await web3.eth.getTransactionCount(addressFirmante);
console.log('Antes de firmar');         
        //Creo objeto transacción firmada
        const createTx = await web3.eth.accounts.signTransaction(
        {
          //Dir del sc
          to: scProduccion.options.address,
          nonce: nonce,
          //Pto. de entrada al metodo a llamar del sc
          data: grabaProduccionTx.encodeABI(),
          gas: gas,//await grabaProduccionTx.estimateGas({ value: "0" }),
          value: "0",
        },
        privateKeyFirmante
      );
console.log('Antes de enviar');        
      //Envío la transacción firmada
      const recibo = await web3.eth.sendSignedTransaction(createTx.rawTransaction);
>>>>>>> 2e2cac88e1ace8fc36623b0f08721bb77684f991
    }
    catch(err) {
console.log('Catch error');
        console.log(err);
        process.exit(1);
    }
    }
  }
}

function generaProduccionDiaria() {
  const DiaNublado = Math.floor(Math.random() * 100) < DiasNublados100;
  //console.log(DiaNublado)
  pDiaria = [];
  for (hora = 0; hora < 24; hora++) {
    let energiaHora = 0;
    const HORAMAXSOL = 13;
    //if (hora >= 9 && hora <= 21) energiaHora =(1/(1+(16-hora)**4))*MAX_POWER;
    energiaHora = Math.E ** (-0.1 * (hora - HORAMAXSOL) ** 2) * MAX_POWER;
    /*         if (hora >= 9 && hora <= 14) energiaHora = (hora - 9) * (MAX_POWER / (14 - 9));
        if (hora > 14 && hora <= 18) energiaHora = MAX_POWER;
        if (hora > 18 && hora <= 21) energiaHora = (-(hora - 21) * (MAX_POWER / (21 - 18))); */
    const NUBE = DiaNublado ? Math.random() < 0.8 : Math.random() < 0.2;
    //console.log(NUBE)
    energiaHora = Math.floor(NUBE ? energiaHora * 0.8 : energiaHora);
    pDiaria.push(energiaHora);
  }
  console.log(pDiaria);
  return pDiaria;
}

<<<<<<< HEAD

function getPKs_Firmantes() {
    //La primera cuenta es la que se va a utilizar para firmar las transacciones
    //TIENE QUE TERNER FONDOS Y TIENE QUE SER LA QUE DEPLOYO EL SC
    privateKeys.push( 
    '230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b',
    '8745762b223bf426829b2909f5d954db8f776a12b8836fb74790384a676fc9d8',
    'b352eb0fdcae639ecad63c28dda9e1c1b16617de719455abfa4dd6f5ca7a1b7f'
    
    )
    for (let i=0;i<privateKeys.length;i++){
        addresses[i]= web3.eth.accounts.privateKeyToAccount(privateKeys[i]).address
        console.log(addresses)

    }
    //privateKeys.forEach(pk => addresses.push(web3.eth.accounts.privateKeyToAccount(pk).address));
=======
function getAddress_Productores() {
    addressProductor[0]="0x24bB02397880147D1Fa245Dfc422Ad2322CC7A17";
    addressProductor[1]="0x8628b9F3f125d889cA6a08C61E70Cc34B4B604a0";
    addressProductor[2]="0xD3007eddA70Acf65CA744BA8Eb17016B4f4759A9";
>>>>>>> 2e2cac88e1ace8fc36623b0f08721bb77684f991
}
