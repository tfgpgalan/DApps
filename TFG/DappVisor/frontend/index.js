const addressContract = "0x539E1276851C584300B34a27f8FFEE71B1a9a757";
const abi = [{ "inputs": [{ "internalType": "uint256", "name": "_initialAmount", "type": "uint256" }, { "internalType": "string", "name": "_tokenName", "type": "string" }, { "internalType": "uint8", "name": "_decimalUnits", "type": "uint8" }], "stateMutability": "nonpayable", "type": "constructor" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_owner", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_spender", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "Approval", "type": "event" }, { "anonymous": false, "inputs": [{ "indexed": true, "internalType": "address", "name": "_from", "type": "address" }, { "indexed": true, "internalType": "address", "name": "_to", "type": "address" }, { "indexed": false, "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "Transfer", "type": "event" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }, { "internalType": "address", "name": "_spender", "type": "address" }], "name": "allowance", "outputs": [{ "internalType": "uint256", "name": "remaining", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_spender", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "approve", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "internalType": "uint256", "name": "balance", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_addressDel", "type": "address" }], "name": "borraProductor", "outputs": [], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [], "name": "decimals", "outputs": [{ "internalType": "uint8", "name": "", "type": "uint8" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "getAllProductores", "outputs": [{ "internalType": "address[]", "name": "", "type": "address[]" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "name", "outputs": [{ "internalType": "string", "name": "", "type": "string" }], "stateMutability": "view", "type": "function" }, { "inputs": [], "name": "totalSupply", "outputs": [{ "internalType": "uint256", "name": "", "type": "uint256" }], "stateMutability": "view", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }, { "inputs": [{ "internalType": "address", "name": "_from", "type": "address" }, { "internalType": "address", "name": "_to", "type": "address" }, { "internalType": "uint256", "name": "_value", "type": "uint256" }], "name": "transferFrom", "outputs": [{ "internalType": "bool", "name": "success", "type": "bool" }], "stateMutability": "nonpayable", "type": "function" }]
const nodoUrl = 'HTTP://127.0.0.1:9545';

const Toast = Swal.mixin({
  toast: true,
  position: 'bottom-end',
  showConfirmButton: false,
  timer: 2000,
  timerProgressBar: false
});

let web3;
let account;
let MyCoin;
let scProduccion;
let lProductores;



 function conctract() {
  web3 = new Web3(nodoUrl);
  scProduccion = new web3.eth.Contract(abi, addressContract);
  scProduccion.methods.name().call().then(nombreTk => document.getElementById('umedida').innerHTML = `${nombreTk}`);
  listaProductores();
  setInterval(listaProductores,10000);
  
}
const listaProductores = () => {
  scProduccion.methods.getAllProductores().call().then(l => {
    lProductores = l;
    ulProductores = '';
    i = 0;
    lProductores.forEach(async function (productor) {
      const balance= await scProduccion.methods.balanceOf(productor).call();
      ulProductores += `<tr><th scope="row">${++i}</th><td>${productor}</td><td class="text-right">${balance}</td></tr>`;
      document.getElementById('lProductores').innerHTML = ulProductores;
    });
  });
}
  

function interact() {
  const btnGetBalance = document.getElementById('btnGetBalance');
  btnGetBalance.addEventListener('click', () => {
    const address = document.getElementById('addressGetBalance');
    const value = address.value;
    MyCoin.methods.balanceOf(value).call().then(res => {
      const amount = web3.utils.fromWei(res, 'ether');
      const valueSpan = document.getElementById('balance');
      valueSpan.innerHTML = amount;
    });
  });

  const transfer = document.getElementById('transferir');
  transfer.addEventListener('click', () => {
    const address = document.getElementById('addressBeneficiaria');
    const addressValue = address.value;
    const amount = document.getElementById('amount');
    const amountString = amount.value.toString();
    const amountTransfer = web3.utils.toWei(amountString, 'ether');
    MyCoin.methods.transfer(addressValue, amountTransfer).send({ from: account }).then(res => {
      address.value = '';
      amount.value = 0;
      Toast.fire({
        icon: 'success',
        title: 'Transferencia realizada'
      });
    });
  });
}




window.onload = conctract();


function init() {
  if (typeof window.ethereum !== 'undefined') {
    const mmBtn = document.getElementById('enableEthereumButton');
    mmBtn.classList.remove('d-none');
    mmBtn.addEventListener('click', async () => {
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      account = accounts[0];
      mmBtn.classList.add('d-none');
      document.getElementById('accountSelected').innerHTML = account;
      document.getElementById('accountSelected').classList.add('border');
      Toast.fire({
        icon: 'success',
        DataTransferItemList: 'Cuenta conectada'
      });

      detectChangeAccount();
      conctract();
      document.getElementById('login').style.display = 'none';
      document.getElementById('main').classList.remove('d-none');

    });

  }
}

function detectChangeAccount() {
  window.ethereum.on('accountsChanged', function (accounts) {
    console.log(accounts);
    account = accounts[0];
    document.getElementById('accountSelected').innerHTML = account;
    Toast.fire({
      icon: 'success',
      DataTransferItemList: 'Cuenta conectada'
    });

  })
}