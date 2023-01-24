// SPDX-License-Identifier: MIT
pragma solidity >=0.7.0 <0.9.0;

contract  Coches {
   address owner;
   uint256 public precio; //Precio que paga el que usa este sc para guardar su coche.
   uint256[] identificadores; //registro de todos los identificadores de los coches.
   mapping(address => Coche) coches;//Mapeo de address de los usuarios a los coches a los que hace referencia.
   //Los structs se empaquetan y se intentan ajustar a 256bits para consumir menos gas.
   struct Coche {
       uint256 identificador;
       string marca;
       uint32 caballos;  //uint32 consumen menos gas y tienen que ir consecutivos
       uint32 kilometros;
   }
   
   modifier precioFiltro(uint256 _precio){
       require(_precio == precio );
       _;
   }
   constructor(uint256 _precio)  payable {
       owner=msg.sender;
       precio=_precio;
   }

   function addCoche(uint256 _id, string memory marca, uint32 caballos, uint32 kilometros) external precioFiltro(msg.value) payable {
       identificadores.push(_id);
       coches[msg.sender].identificador=_id;
       coches[msg.sender].marca=marca;
       coches[msg.sender].caballos=caballos;
       coches[msg.sender].kilometros=kilometros;
   }

    function getIdentificadores() view external returns(uint256) {
        return identificadores.length;
    }

    function getCoche() external view returns(string memory marca, uint32 caballos, uint32 kilometros){
        marca=coches[msg.sender].marca;
        caballos=coches[msg.sender].caballos;
        kilometros=coches[msg.sender].kilometros;
    }
    function getCoche2() external view returns(Coche memory){
        return coches[msg.sender];
    }
}