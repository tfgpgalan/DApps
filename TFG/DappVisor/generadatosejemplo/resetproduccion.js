/**
 * TFG Pablo Galan
 * Script para borrar todos los datos de produccion del sc
 * Se ejecuta con npm run resetproduccion.
 * La firma se hará con la clave privada de la address 
 * owner del del contrato ProduccionSemanalHora
 **/

const fs = require("fs");
const contractAddress = "0xa26C28964db50486CA811cc45321985E165B6294";
const privateKeyFirmante = "230bcd8db487f554310d367d9d0f1ca7b1c420feb48fe0baaf34b11c212f523b";
const addressFirmante = "0x24bB02397880147D1Fa245Dfc422Ad2322CC7A17";
const Web3 = require("web3");
const nodoUrl = "http://10.10.10.10:8545";
const web3 = new Web3(nodoUrl);
//Leemos el descriptor del sc Produccion
const abi = JSON.parse(
    fs.readFileSync(__dirname + "/../frontendSemanal/ProduccionSemanalHora.abi")
  );
var scProduccion;
scProduccion = new web3.eth.Contract(abi, contractAddress);
(async () => {
    try {

        var resetprod = await scProduccion.methods.borrarProductores();
        //Solo se estima gas una vez
        var gas = await resetprod.estimateGas({ from: addressFirmante }); 
        //Vamos a tomar la siguiente transacción de la address
        let nonce = await web3.eth.getTransactionCount(addressFirmante);
        //Creo objeto transacción firmada
        const createTx = await web3.eth.accounts.signTransaction(
            {
                //Dir del sc
                to: scProduccion.options.address,
                nonce: nonce,
                //Pto. de entrada al metodo a llamar del sc
                data: resetprod.encodeABI(),
                gas: gas,//await grabaProduccionTx.estimateGas({ value: "0" }),
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
})();