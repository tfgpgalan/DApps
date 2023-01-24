// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

 import "./Concensys_ERC20/IERC20.sol";
contract TokenSale {
      address owner;
      uint256 precio;
      IERC20 myToken;
      uint256 tokensSold; 
      //Evento que se emitirá cuando alguien compre tokens
      event Sold(address buyer, uint256 amount);

    constructor (uint256 _price, address _addressMyToken ){
        owner=msg.sender;
        precio=_price;
        myToken= IERC20(_addressMyToken);

    }

    function buy(uint256 _numTokens) public payable{
        require(msg.value==precio*_numTokens,unicode'Intento de compra con value erróneo');
        //Cambiado del video.
       // uint256 scaledAmount = _numTokens * (uint256(10) ** myToken.decimals());
        require(myToken.balanceOf(address(this)) >= _numTokens,'No hay tokens suficientes');
        tokensSold+=_numTokens;
        require(myToken.transfer(msg.sender,_numTokens));
        emit Sold(msg.sender, _numTokens);
    }
    //Finalización de venta. Todos los tokens ERC20 no vendidos por este sc pasan de nuevo al propietario 
    //Todo el saldo en ether de este contrato conseguido por la venta de los ERC20 pasan al balance del propietario
    function endSold() public {
        require(owner==msg.sender);
        //Devolución de los tokens ERC20 no vendidos al owner
        require(myToken.transfer(owner,myToken.balanceOf(address(this))));
        //Ethers de la venta al owner
        payable(msg.sender).transfer(address(this).balance);
    }
}