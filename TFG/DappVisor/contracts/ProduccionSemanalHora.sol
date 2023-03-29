// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./IERC20.sol";
import "./MapIterLib.sol";
import "./BokkyPooBahsDateTimeLibrary.sol";
 
 
contract ProduccionSemanalHora is IERC20 {
    //Básicas del ERC20
    uint256 public totalSupply;
    mapping(address => uint256) private _balance;
    mapping(address => mapping(address => uint256)) private _allowance;
    //Balance de cada address por día de la semana y dentro de este por cada hora del día
    struct ProducccionDia {
       uint timestamp;
       mapping (uint => uint256) produccionXhora;
    }
    //Cada address tendrá un mapping de 7 dias y cada uno de 24 horas 
    //y cada hora acumulará la producción que mande el contador en esa hora.
    mapping(address => mapping(uint => ProducccionDia )) private _balanceHoraDayofWeek;
    uint8 public decimals;
    string public name;
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    //Propietario del contrato
    address public owner;
    uint fechaInicio;
    //Utiles para mantener la lista de productores iterable,
    //Productor que alguna vez haya producido o recibido se registrará
    //en _productores.
    using MapIterableLib for MapIterableLib.MapIterable;
    MapIterableLib.MapIterable private _productores;
    //Libreria utilitaria para tratar fechas
    using BokkyPooBahsDateTimeLibrary for uint;

    //Evento que se emitirá cada vez que se grabe producción
    event GrabaHora(address indexed from, uint dia, uint hora, uint produccion);

    //En principio se llamará con los valores 0,'kWh', 3
    //No se han establecido por mantener IERC20
    constructor(uint256 _initialAmount, string memory _tokenName, uint8 _decimalUnits) {
        _balance[msg.sender] = _initialAmount;
        totalSupply = _initialAmount;
        name = _tokenName;
        decimals = _decimalUnits;
        _productores.inicia();
        owner = msg.sender;
        fechaInicio=block.timestamp;
        
    }

    //Si _to es 0x0 se supone que es producción de watios
    function transfer(address _to, uint256 _value) public override returns (bool success)
    {
        if (_to == address(0)) {
            if (!_productores.isInList(msg.sender)){
                _productores.addElemento(msg.sender);
                inicia_balance_productor_nuevo(msg.sender);
            }
            //Producción acumulada desde el inicio del contrato
            _balance[msg.sender] += _value;
            uint dayofWeek=block.timestamp.getDayOfWeek();
            uint horadeldia=block.timestamp.getHour();
            ProducccionDia storage prodDia=_balanceHoraDayofWeek[msg.sender][dayofWeek-1];
            //Inicio de día con posibilidad de corte de lecturas
            if (prodDia.timestamp==0 || (horadeldia<=22 && prodDia.produccionXhora[horadeldia+1]!=0))
               iniciaDia(dayofWeek,msg.sender,block.timestamp);
            emit GrabaHora(msg.sender, dayofWeek-1, horadeldia,_value);
            //Acumula las lecturas que mande el contador en la hora en curso 
            prodDia.produccionXhora[horadeldia]+=_value;
            totalSupply+=_value;

        } else {
            require(_balance[msg.sender] >= _value, "Valor a transferir superior al existente");
            _balance[msg.sender] -= _value;
            _balance[_to] += _value;
            totalSupply-=_value;
        }
        emit Transfer(msg.sender, _to, _value);
        return true;
    }

    function inicia_balance_productor_nuevo(address _address) internal{
        for (uint dia=1; dia<=7;dia++){
           iniciaDia(dia,_address,0);
        }
    }
//Función para generar valores demo, quitar en producción
//Graba simulación de producción de un día completo de un productor
//Solo la puede ejecutar el owner del contrato.
    function acumula_dia(address _address,uint _dayOfWeek,uint[] memory _produccion_hora) public {
        require(owner == msg.sender,unicode"Solo puede utilizar función demo el owner del contrato.");
        require(_dayOfWeek>=1 && _dayOfWeek<=7 && _produccion_hora.length==24,unicode"Día o matriz de horas(24) error");
        if (!_productores.isInList(_address)){
            _productores.addElemento(_address);
            inicia_balance_productor_nuevo(_address);
        }
        iniciaDia(_dayOfWeek,_address,block.timestamp.subDays(_dayOfWeek-1));
        ProducccionDia storage prodDia=_balanceHoraDayofWeek[_address][_dayOfWeek-1];
        for(uint i = 0; i<24; i++) { 
            prodDia.produccionXhora[i]+=_produccion_hora[i];
            _balance[_address] += _produccion_hora[i];
        }
    }

//Al iniciar día se rellena todas las horas con producción 0
    function iniciaDia(uint _dia,address _address, uint _timestamp) internal{
        ProducccionDia storage prodDia=_balanceHoraDayofWeek[_address][_dia-1];
        prodDia.timestamp=_timestamp;
        for(uint i = 0; i<24; i++) { 
            prodDia.produccionXhora[i]=0;
        }
    }

//Devuelve la matriz de producción semanal de un productor y
//los días a que corresponde 
    function getBalanceOfDaysOfWeek(address _productor) public view returns(uint256[24][7] memory produccion, uint[7] memory dias) {
        
        for (uint dia=0; dia<=6;dia++){
            ProducccionDia storage prodDia=_balanceHoraDayofWeek[_productor][dia];
            dias[dia]=prodDia.timestamp;
            for (uint hora=0; hora <=23; hora++){
                produccion[dia][hora]= prodDia.produccionXhora[hora];
            }
        }
    }


    
    
    function transferFrom(address _from, address _to,uint256 _value) public override returns (bool success) {
        uint256 _allowanced = _allowance[_from][msg.sender];
        require(_balance[_from] >= _value && _allowanced >= _value);
        _balance[_to] += _value;
        _balance[_from] -= _value;
        _productores.addElemento(_to);
        if (_allowanced < MAX_UINT256) {
            _allowance[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value);
        return true;
    }

    function balanceOf(address _owner) public view virtual returns (uint256 balance)
    {
        return _balance[_owner];
    }

    function allowance(address _owner, address _spender) public view override returns (uint256 remaining)
    {
        return _allowance[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) public override returns (bool success)
    {
        _allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value);
        return true;
    }

     function borraProductor(address _addressDel) public{
        require(msg.sender==owner,'Solo el owner puede borrar productores.');
        _productores.removeElemento(_addressDel);
        borra_balances(_addressDel);
    }

    function reseteaProductores() public {
        require(owner == msg.sender,"Solo puede resetear el owner del contrato");
        address[] memory elementosArray = getAllProductores();
        for (uint i=0;i<=elementosArray.length;i++){
            borra_balances(elementosArray[i]);
        }
        _productores.removeAllElementos();
       
    }

    function borra_balances(address sender) internal{
        delete _balance[sender];
        for (uint dia=1; dia<=7;dia++){
            ProducccionDia storage prodDia=_balanceHoraDayofWeek[sender][dia];
            for(uint hora = 0; hora<24; hora++) { 
                delete prodDia.produccionXhora[hora];
            }
            delete _balanceHoraDayofWeek[sender][dia];
        } 
    }
    function getAllProductores() public view returns(address[] memory){
        return _productores.getAllElementos();
    }

}
