// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

import "./IERC20.sol";

contract ERC20 is IERC20 {
    // El compilador genera los getter de las variables públicas
    // Total de tokens que se van a emitir
    uint256 public totalSupply;
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) private _balance; //Tokens que tiene cada dirección
    //De cada dueño de token, la lista de los permitidos a gestionar parte de sus tokens
    //Devuelve la cantidad de token que la primera dir autoriza a la segunda dir a gestionar
    mapping(address => mapping(address => uint256)) private _allowance;

    string public name; //fancy name: eg Simon Bucks
    //En sc no hay números con decimales. El valor de esto indica que la cantidad de que se trate
    //se le ha aplicado * 10^decimals. O sea si digo 1000 y decimals es 2, realmente estoy tratando
    //con 10 tokens.
    uint8 public decimals; //How many decimals to show.
    string public symbol; //An identifier: eg SBX

    constructor (uint256 _initialAmount, string memory _tokenName, 
                uint8 _decimalUnits, string memory _tokenSymbol)  {
        _balance[msg.sender] = _initialAmount; // Give the creator all initial tokens
        totalSupply = _initialAmount; // Update total supply
        name = _tokenName; // Set the name for display purposes
        decimals = _decimalUnits; // Amount of decimals for display purposes
        symbol = _tokenSymbol; // Set the symbol for display purposes
    }

    function transfer(address _to, uint256 _value) public returns (bool success)
    {   //Comprobar que el emisor tiene la cantidad de tokens que quiere transferir.
        require(_balance[msg.sender] >= _value, 'Valor a transferir superior al existente'); 
        _balance[msg.sender] -= _value;
        _balance[_to] += _value;
        emit Transfer(msg.sender, _to, _value); //Emite el evento
        return true;
    }

    //Un autorizado transfiere value tokens del autorizador (from) a otra persona (to)
    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 _allowanced = _allowance[_from][msg.sender]; //Cantidad permitida
        //Que el origen tiene y que la cantidad permitida sea mayor a la cantidad
        require(_balance[_from] >= _value && _allowanced >= _value); 
        _balance[_to] += _value;
        _balance[_from] -= _value;
        if (_allowanced < MAX_UINT256) {
            _allowance[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balance[_owner];
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining)
    {
        return _allowance[_owner][_spender];
    }

    //Permite a otras personas gestionar un número de tokens mios
    //spender es el autorizado, value es la cantidad de token que puede gestionar
    function approve(address _spender, uint256 _value) public returns (bool success)
    {
        _allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value); //solhint-disable-line indent, no-unused-vars
        return true;
    }
}
