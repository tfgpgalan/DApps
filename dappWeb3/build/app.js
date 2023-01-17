"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const tx_1 = require("@ethereumjs/tx");
const web3_1 = __importDefault(require("web3"));
//Entrando en Ganache tomo la clave privada de la segunda cuenta
const strprivateKeyAddress2 = 'dd8d3bbe8d3f8555c58a964230cc8b10f87f9c0d71099b08939077864551a0fc';
//var Web3 = require('web3');
//var EthereumTx = require('@ethereumjs/tx');
//var EthereumUtil = require('@ethereumjs/util')
var nodoUrl = 'HTTP://127.0.0.1:8545';
var web3 = new web3_1.default(nodoUrl);
const privateKeyAddress2 = Buffer.from(strprivateKeyAddress2, 'hex'); //Para guardar datos binarios
var address1, address2; //Contendrán la clave pública de las dos primeras cuentas
web3.eth.getAccounts().then(a => {
    address1 = a[0];
    address2 = a[1];
    web3.eth.getBalance(address1)
        .then(valor => {
        console.log('Saldo cuenta1: ' + web3.utils.fromWei(valor, 'ether'));
        web3.eth.getBalance(address2)
            .then(valor => {
            console.log('Saldo cuenta2: ' + web3.utils.fromWei(valor, 'ether'));
            traspaso();
        });
    });
});
//Traspaso de address2 a address1
//Con etherumjs-tx firmamos la transacción y con web3 enviamos la transacción firmada
function traspaso() {
    //Devuelve el número de transacciones firmadas desde una address cuando se ingresa en un bloque
    //Envolvemos el método web3 para enviar una transacción firmada en la siguiente función para menor gasto de gas.
    //Doc https://web3js.readthedocs.io/en/v1.8.1/web3-eth.html#gettransactioncount
    web3.eth.getTransactionCount(address2, (err, txCount) => {
        //Construimos y enviamos la transacción: https://web3js.readthedocs.io/en/v1.8.1/web3-eth.html#sendsignedtransaction
        var rawTx = {
            //Número de transacción de address2
            nonce: web3.utils.toHex(txCount),
            //Más precio más prioridad te darán los mineros. Precio medio: https://ethgasstation.info/
            //Suponiendo 2 GWeis
            gasPrice: web3.utils.toHex(web3.utils.toWei('2', 'gwei')),
            gasLimit: web3.utils.toHex(21000),
            to: address1,
            //Mandamos 1 Ether
            value: web3.utils.toHex(web3.utils.toWei('1', 'ether')),
            //Para llamar o deployar un contrato (no es nuestro caso ahora)
            //data: '0x7f7465737432000000000000000000000000000000000000000000000000000000600057'
        };
        //Creamos la transacción y la firmamos
        var tx = tx_1.Transaction.fromTxData(rawTx);
        const signedTx = tx.sign(privateKeyAddress2);
        //Serializamos la transacción
        var serializedTx = signedTx.serialize().toString('hex');
        //Enviamos la transacción
        web3.eth.sendSignedTransaction('0x' + serializedTx).on('receipt', console.log);
    });
}
