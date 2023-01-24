const Web3 = require("web3");
const fs = require('fs')
const nodoUrl = 'HTTP://127.0.0.1:8545';
const web3 = new Web3(nodoUrl);
//Cargamos el abi generado con CompilarSC.js
const  abi  = JSON.parse(fs.readFileSync("./SCs/ERC20/AccionEmpresa.abi"));
//Dirección del contrato
const addressCochesSc='0x9187BA05a44772499aA7f268D5Fcc6ab8C096BD2'
const CochesSc=new web3.eth.Contract(abi,addressCochesSc)
//Comprobamos que hay conexión
CochesSc.methods.name().call().then(console.log)
//allEvents recogerá todos los eventos, 'Tranfer' para que coja solo los eventos Tranfer
CochesSc.getPastEvents('allEvents', {
    //Todos los bloques del primero al último
    fromBlock: 0,
    toBlock: 'latest'
}, function(error, events){ console.log(events); })

CochesSc.getPastEvents('Approval', {
    //Todos los bloques del primero al último
    fromBlock: 0,
    toBlock: 'latest'
}, function(error, events){ console.log('Eventos Approve: '+ events.length); })

CochesSc.getPastEvents('Transfer', {
    //Filtro el origen de las Transfer
    filter: {_from: '0x7845C446AeeAf79ecF1b0Fb61DACADee89E58804'},
    //Todos los bloques del primero al último
    fromBlock: 0,
    toBlock: 'latest'
}, function(error, events){ 
    var totalTransfer=0;
    events.forEach(event => totalTransfer+=+event.returnValues._value);
    console.log('Transfers de 0x7845...04: '+ events.length + ' Acciones transferidas: ' + totalTransfer); })