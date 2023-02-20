const addressContract = "0xf128EBE06396A5636230d3425873106C73491470";
const abi = [{ "inputs": [{ "internalType": "uint256", "name": "_initialAmount", "type": "uint256" }, { "internalType": "string", "name": "_tokenName", "type": "string" }, { "internalType": "uint8", "name": "_decimalUnits", "type": "uint8" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "remaining", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_spender", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "balance", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_addressDel", "type": "address" }], "name": "borraProductor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getAllProductores", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }]
const nodoUrl = 'HTTP://127.0.0.1:9545';



let web3;
let account;
let scProduccion;
let lProductores;
let decimales;

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-up',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: false
});

 function conctract() {
  web3 = new Web3(nodoUrl);
  scProduccion = new web3.eth.Contract(abi, addressContract);
  scProduccion.methods.name().call().then(nombreTk => document.getElementById('umedida').innerHTML = `${nombreTk}`);
  scProduccion.methods.decimals().call().then(dec => decimales=dec);
  Toast.fire({
    icon: 'success',
    title: 'Conexión realizada'
  });
  listaProductores();
  setInterval(listaProductores,10000);
  
}
const listaProductores = () => {
  scProduccion.methods.getAllProductores().call().then(l => {
    lProductores = [...l];
    lProductores.sort();
    tablaProductores = '';
    i = 0;
    lProductores.forEach(async function (productor) {
      const balance= await scProduccion.methods.balanceOf(productor).call();
      const balancecondecimales=(balance/10**decimales).toLocaleString(undefined, { minimumFractionDigits: decimales });
      tablaProductores += `<tr><th scope="row">${++i}</th><td>${productor}</td><td class="text-right">${balancecondecimales}</td></tr>`;
      document.getElementById('lProductores').innerHTML = tablaProductores;
    });
  });
}
  
window.onload = conctract();




