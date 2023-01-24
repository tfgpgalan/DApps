// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

 import "./Concensys_ERC20/IERC20.sol";

 contract AccionEmpresa is IERC20{
     //Básicas del ERC20
    uint256 public totalSupply;
    uint256 private constant MAX_UINT256 = 2**256 - 1;
    mapping(address => uint256) private _balance;
    mapping(address => mapping(address => uint256)) private _allowance;
    uint8 public decimals;
    string public name;

    //Para el uso especifico de las acciones para reparto de dividendos
    
    //Acumulado de dividendo por acción.
    uint256 dividendPerToken; 
    //Dividendos pendientes de retirar por accionista 
     mapping(address => uint256) public dividendbalanceOf; 
     //Dividendos por acción ya retirados por accionista
     mapping(address => uint256) public dividendCreditedTo;


    constructor (uint256 _initialAmount, string memory _tokenName, 
                uint8 _decimalUnits ) {
        _balance[msg.sender] = _initialAmount; 
        totalSupply = _initialAmount; 
        name = _tokenName; 
        decimals = _decimalUnits; 
    }

    //Actuliza el pte y el retirado
     function update(address _address) internal {
         uint256 debit=dividendPerToken - dividendCreditedTo[_address];
         dividendbalanceOf[_address] += balanceOf(_address) * debit;
         dividendCreditedTo[_address] = dividendPerToken;
     }
    //Retirada del acumulado de dividendos
     function withdraw() public {
         update(msg.sender);
         uint256 amount = dividendbalanceOf[msg.sender];
         dividendbalanceOf[msg.sender] = 0;
         payable(msg.sender).transfer(amount);
     }

    //Deposita el beneficio a repartir en el balance del contrato
     function deposit() public payable{
         dividendPerToken += msg.value / totalSupply;
     }

    //Transferencia de acciones
    function transfer(address _to, uint256 _value)  public  returns (bool success)
    {   
        require(_balance[msg.sender] >= _value, 'Valor a transferir superior al existente'); 
        update(msg.sender);
        update(_to);
        _balance[msg.sender] -= _value;
        _balance[_to] += _value;
        emit Transfer(msg.sender, _to, _value); 
        return true;
    }


    function transferFrom(address _from, address _to, uint256 _value) public returns (bool success) {
        uint256 _allowanced = _allowance[_from][msg.sender]; 
        require(_balance[_from] >= _value && _allowanced >= _value); 
        update(_from);
        update(_to);
        _balance[_to] += _value;
        _balance[_from] -= _value;
        if (_allowanced < MAX_UINT256) {
            _allowance[_from][msg.sender] -= _value;
        }
        emit Transfer(_from, _to, _value); 
        return true;
    }

    function balanceOf(address _owner) public view returns (uint256 balance) {
        return _balance[_owner];
    }

    function allowance(address _owner, address _spender) public view returns (uint256 remaining)
    {
        return _allowance[_owner][_spender];
    }

    function approve(address _spender, uint256 _value) public returns (bool success)
    {
        _allowance[msg.sender][_spender] = _value;
        emit Approval(msg.sender, _spender, _value); 
        return true;
    }
 }