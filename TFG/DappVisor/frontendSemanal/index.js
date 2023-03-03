const addressContract ="0x6A676121D0F40cDf42F49aaE47882dA509a81dD1";// "0x2A94dE578d3461E8941459F7204DA4be1A106eFC";

var abi= ''; 

async function getAbi(url = '') {
  // Opciones por defecto estan marcadas con un *
  const response = await fetch(url);
  return response.json(); // parses JSON response into native JavaScript objects
}

async function  empieza(){
  await fetch('./ProduccionSemanal.abi').then(async (response) =>{
  abi= await response.json();
  conctract();
 } );

}

const nodoUrl = 'HTTP://127.0.0.1:9545';

let web3;
let account;
let scProduccion;
let lProductores;
let decimales;
let diasSemana=[];
let produccionSemanal;

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
 // setInterval(listaProductores,10000);
  
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
      tablaProductores += `<tr><th scope="row">${++i}</th><td>${productor}</td>`;
      tablaProductores += `<td class="text-right">${balancecondecimales}</td></tr>`;
      tablaProductores += `<td class="text-right">${balancecondecimales}</td></tr>`;
      document.getElementById('lProductores').innerHTML = tablaProductores;
    });
    getProduccionSemanal (lProductores[0]).then(x=>console.log(x));
  });
}

function getProduccionSemanal (unProductor) {
 return scProduccion.methods.getBalanceOfDaysOfWeek(unProductor).call().then(respuesta=>{
    produccionSemanal=respuesta.produccion;
    for (i=0;i<respuesta.dias.length;i++){
      const diax=respuesta.dias[i];
      let sumProdDia=0;
      produccionSemanal[i].forEach(valor=>sumProdDia+=parseInt(valor));
      diasSemana.push({fecha:new Date(diax*1000),produccionDia:sumProdDia,detalleDiario:produccionSemanal[i]});
    }
   
    let salida={productor:unProductor,produccionSemanal:diasSemana};
    return salida;
  }
  );
}


function getFormattedDate(date) {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  return day + '/' + month + '/' + year;
}
  
window.onload = empieza();




