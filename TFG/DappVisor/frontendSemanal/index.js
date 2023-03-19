const addressContract = "0x9aC37CE0f34b83010dC0C2dC5Ee70fDE60b1ecad";
const nodoUrl = 'HTTP://127.0.0.1:9545';

let web3;
let scProduccion;
let decimales;
let semanaUnProductor;
let abi = '';

async function empieza() {
  await fetch('/ProduccionSemanal.abi').then(async (response) => {
    abi = await response.json();
    conctract();
  });

}

function conctract() {
  web3 = new Web3(nodoUrl);
  web3.eth.net.getId()
    .then(() => {
      scProduccion = new web3.eth.Contract(abi, addressContract);
      scProduccion.methods.name().call().then(nombreTk => document.getElementById('umedida').innerHTML = `${nombreTk}`);
      scProduccion.methods.decimals().call().then(dec => decimales = dec);
      Swal.mixin({
        toast: true, position: 'bottom-up', showConfirmButton: false, timer: 2000,
        timerProgressBar: false, icon: 'success', title: 'Conexión realizada',
      }).fire();;
      listaProductores();
    }
    )
    .catch(e => {
      Swal.mixin({
        toast: true, icon: 'error', position: 'bottom-up',
        title: 'Algo va mal, la red no responde', showConfirmButton: true,
      }).fire();
    });
}


const listaProductores = () => {
  scProduccion.methods.getAllProductores().call().then(l => {
    let lProductores = [...l];
    if (lProductores.length == 0)
      Swal.mixin({ toast: true, icon: 'info', title: 'No hay productores' }).fire();
    else {
      lProductores.sort();

      let tablaProductores = '';
      i = 0;
      lProductores.forEach(async function (productor) {
        const balance = await scProduccion.methods.balanceOf(productor).call();
        const balancecondecimales = (balance / 10 ** decimales).toLocaleString(undefined, { minimumFractionDigits: decimales });
        tablaProductores += `<tr><th scope="row">${++i}</th><td>${productor}</td>`;
        tablaProductores += `<td class="text-right">${balancecondecimales}</td>`;
        tablaProductores += `<td class="text-right"><button type="button" class="btn btn-link" style='padding:0px' onclick="muestraGrafica('${productor}')">`;
        tablaProductores += `<span class="bi bi-bar-chart"></span></button></td></tr>`;
        document.getElementById('lProductores').innerHTML = tablaProductores;
      });
    }
  });

}

function muestraGrafica(productorx) {
  let prodProductor = [];
  getProduccionSemanal(productorx).then(l => {
    semanaUnProductor = l;
    console.log(semanaUnProductor);
    Swal.fire({
      toast: true,
      width: '50%', position: 'top',
      title: `<div style="text-align:center"> Producción semanal de ${productorx}</div>`,
      html: `<div id="container" style="display: block; width: 40em; height: 25em;"></div>`,
      didOpen: () => {

        const ctx = Swal.getHtmlContainer().querySelector('#container');
        muestraGraficaSemanal(ctx);

      }
    })

  });
}


function muestraGraficaSemanal(ctx) {
  let data = [];

  for (let proddia of semanaUnProductor.produccionSemanal) {
    const label = getFormattedDate(proddia.fecha);
    data.push([label, proddia.produccionDia]);

  }
  // create data
  data = anychart.data.set(data);
  // map the data
  var dataMapping = data.mapAs({ x: 0, value: 1 });

  // create a column chart
  var chart = anychart.column();

  // set the data
  var column = chart.column(dataMapping);

  // set the chart title
  chart.title().useHtml(true);
  chart.title("<span style='font-style:italic'>Producción diaria última semana</span>");
  chart.xAxis().title('Día');
  chart.yAxis().title('kWh');
  chart.yGrid().enabled(true);
  // configure tooltips
  let tooltip = chart.tooltip();
  tooltip.useHtml(true);
  tooltip.separator(false);
  tooltip.title(false);

  var tooltipChart = null;

  chart.listen("pointMouseOver", function (e) {
    var index = e.pointIndex;
    if (tooltipChart == null) tooltipChart = createChart();
    let prodDia = semanaUnProductor.produccionSemanal[index];
    let detalleDia = prodDia.detalleDiario;

    let dataDia = [];
    for (var hora = 0; hora < detalleDia.length; hora++) {
      dataDia.push({ x: hora, value: detalleDia[hora] });
    }
    tooltipChart.data(dataDia);
    let totalDia = (prodDia.produccionDia).toLocaleString(undefined, { minimumFractionDigits: decimales });
    tooltipChart.title(`Producción día: ${getFormattedDate(prodDia.fecha)} - ${totalDia} kWh, distribución por horas<br>`);
    tooltipChart.xAxis().title('Hora del día');
    tooltipChart.yAxis().title('Wh');
    tooltipChart.yGrid().enabled(true);
  });

  chart.tooltip().onDomReady(function () {
    this.contentElement.style.width = "400px";
    this.contentElement.style.height = "300px";
    tooltipChart.container(this.contentElement);
    tooltipChart.draw();
  });

  chart.tooltip().onBeforeContentChange(function () {
    return false;
  });

  chart.container(ctx);

  chart.draw();


}

function createChart() {

  // create a bar chart
  var chart = anychart.column();

  // configure axes and labels
  chart.xAxis().stroke(null).ticks(false);
  chart.xAxis().labels().fontSize(10);
  chart.yAxis().labels().fontSize(10);

  chart.title().useHtml(true).fontSize(12);

  return chart;
}



function getProduccionSemanal(unProductor) {
  return scProduccion.methods.getBalanceOfDaysOfWeek(unProductor).call().then(respuesta => {
    let produccionSemanal = respuesta.produccion;
    let diasSemana = [];
    for (i = 0; i < respuesta.dias.length; i++) {
      const diax = respuesta.dias[i];
      let sumProdDia = 0;
      produccionSemanal[i].forEach(valor => sumProdDia += parseInt(valor));
      diasSemana.push({ fecha: new Date(diax * 1000), produccionDia: sumProdDia/ (10 ** decimales), detalleDiario: produccionSemanal[i] });
    }

    let salida = { productor: unProductor, produccionSemanal: diasSemana };
    return salida;
  }
  );
}


function getFormattedDate(date) {
  let year = date.getFullYear();
  let month = (1 + date.getMonth()).toString().padStart(2, '0');
  let day = date.getDate().toString().padStart(2, '0');
  return day + '/' + month;// + '/' + year;
}

window.onload = empieza();

