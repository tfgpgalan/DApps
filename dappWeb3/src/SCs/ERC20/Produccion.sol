// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

import "./IERC20.sol";
import "./MapIterLib.sol";

//Los productores solo pueden ser los que están en la lista del clique
contract Produccion is IERC20 {
    //Básicas del ERC20
    uint256 public totalSupply;
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) private _balance;
    mapping(address => mapping(address => uint256)) private _allowance;
    uint8 public decimals;
    string public name;
    address owner;
    //Utiles para mantener la lista de productores iterable,
    //Todo productor que alguna vez haya producido o recibido se registrará
    //en _productores.
    using MapIterableLib for MapIterableLib.MapIterable;
    MapIterableLib.MapIterable private _productores;



    constructor(uint256 _initialAmount, string memory _tokenName, uint8 _decimalUnits
    ) {
        _balance[msg.sender] = _initialAmount;
        totalSupply = _initialAmount;
        name = _tokenName;
        decimals = _decimalUnits;
        _productores.inicia();
        owner = msg.sender;
    }

    //Si _to es 0x0 se supone que es producción de watios
    function transfer(address _to, uint256 _value) public override returns (bool success)
    {
        if (_to == address(0)) {
            _balance[msg.sender] += _value;
            totalSupply+=_value;
            _productores.addElemento(msg.sender);
        } else {
            require(_balance[msg.sender] >= _value, "Valor a transferir superior al existente");
            _balance[msg.sender] -= _value;
            _balance[_to] += _value;
            totalSupply-=_value;
        }
        emit Transfer(msg.sender, _to, _value);
        return true;
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
    }

    function getAllProductores() public view returns(address[] memory){
        return _productores.getAllElementos();
    }

}
