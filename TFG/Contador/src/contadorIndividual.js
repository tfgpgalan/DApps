
/**
 * TFG Pablo Galan
 * Script simulador grabación de producción de energía en la bc.
 * Se ejecuta con npm run contador <Directorio del nodo>
 * Tienen que exitir los ficheros:
 *   <Directorio del nodo>/keystore/<Unico fichero>: donde están las credenciales
 *          de la dirección que firma las transacciones en este nodo.
 *   <Directorio del nodo>/password.txt: password para desencriptar las credenciales
 * 
 * Este script se pondría en cada nodo de la red para simular contador de producción de electricidad.
 * En nuestro caso la ejecución más probable será:
 *  npm run contador /home/pi/geth/nodePi
**/



process.title = "ProductorContador";
const os = require('os');
const fs = require("fs");
//Dir. del sc  que hemos deployado viene como tercer argumento de llamada
const contractAddress = getSc_Address();//'0x216177464B0D494569d9e691C075A00D75fe9fc1';
var address = '';
var privateKey = '';

const eth0Ip= dirIp();

const Web3 = require('web3');
const nodoUrl = `http://${eth0Ip}:8545`;
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(fs.readFileSync(__dirname + "/ProduccionSemanalHora.abi"));


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
const HORAMAXSOL = 13;

var scProduccion;
var nombreTk;
var decimales;
var intervalProduccionId = null;
var conectado = false;
var dia_ultima_grabacion=0;
var DiaNublado;
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
    //Método decimals para presentar las cantidades en la unidad de medida
    scProduccion.methods.decimals().call().then(dec => decimales = dec);
    //Cada SEG_GRABACION segundos crea una grabación
    intervalProduccionId = setInterval(grabaProduccion, SEG_GRABACION*1000);
}

async function grabaProduccion() {
    const straddress=''.concat(address.slice(0,5),'...',address.slice(-3));
    //Comprobamos balance de la cuenta antes de transferir
    let balance=await scProduccion.methods.balanceOf(address).call();
    balance =(balance / 10 ** decimales).toLocaleString(undefined, { minimumFractionDigits: decimales });
    console.log(`Producción acumulada de ${straddress} ANTES de transacción: ${balance}${nombreTk}.`);
    
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
            let balance=await scProduccion.methods.balanceOf(address).call();
            balance =(balance / 10 ** decimales).toLocaleString(undefined, { minimumFractionDigits: decimales });
            console.log(`Producción acumulada de ${straddress} DESPUÉS de transacción: ${balance} ${nombreTk} (Blq. ${recibo.blockNumber}).`);
        })
        .on('error', (errx) => console.log(`Error al grabar dato ${errx}`))

};

function calculaEnergiaGenerada() {
    let hoy = new Date();
    //Caso de nuevo día o inicio grabación
    if (date_diff_indays(dia_ultima_grabacion, hoy) != 0) {
        dia_ultima_grabacion = hoy;
        DiaNublado = Math.floor(Math.random() * 100) < DiasNublados100;
    }
    const hora = hoy.getHours();
    //Simula gauss con máxima producción en HORAMAXSOL
    let energia = Math.E ** (-0.1 * (hora - HORAMAXSOL) ** 2) * MAX_POWER;
    //Paso de una nube cuando es día nublado
    const NUBE = DiaNublado ? Math.random() < 0.8 : Math.random() < 0.2;
    energia = Math.floor(NUBE ? energia * 0.8 : energia);
    return energia;
}


//Toma la private key del almacen de claves en dir keystore y lo desencripta con la password
//que está en el fichero password.txt. Se obtendrá la clave privada y pública del usuario
//firmante del nodo donde se está corriendo el script
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



//Obtiene la ip ethernet del equipo
function dirIp(){
  let interfaces = os.networkInterfaces();
  
  let eth =interfaces['eth0'] || interfaces['Ethernet'] || interfaces['Ethernet 2'] || interfaces['Local Area Connection'];
  let ipObj = eth.find(i => i.family === 'IPv4');
  let ip= ipObj ? ipObj.address : null;
  if (ip==null){
    console.log("No encontrada dirección Ip Ethernet");
    process.exit(1);
  }
  return ip;
}

function getSc_Address(){
    const a=process.argv[3];
    if (a==null){
        console.log("No especificada la dirección del smartcontract ProduccionSemanal");
        process.exit(1);
    }
    return a;
}

var date_diff_indays = function(date1, date2) {
    dt1 = new Date(date1);
    dt2 = new Date(date2);
    return Math.floor((Date.UTC(dt2.getFullYear(), dt2.getMonth(), dt2.getDate()) - Date.UTC(dt1.getFullYear(), dt1.getMonth(), dt1.getDate()) ) /(1000 * 60 * 60 * 24));
    }