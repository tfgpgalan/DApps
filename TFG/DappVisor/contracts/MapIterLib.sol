
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.15;

library MapIterableLib {
    struct MapIterable {
        mapping(address => address)  _mapping;
        uint contadorElementos;
    }
    address constant internal FIRST_ADDRESS= address(1);
    function inicia(MapIterable storage _self) internal{ 
        _self._mapping[FIRST_ADDRESS] = FIRST_ADDRESS;
        _self.contadorElementos=0;
    }
    function isInList(MapIterable storage _self, address _address) internal view returns(bool) {
        return _self._mapping[_address] != address(0);
    }

    function addElemento(MapIterable storage _self,address _address) internal {
        if (!isInList(_self, _address)){
            _self._mapping[_address] = _self._mapping[FIRST_ADDRESS];
            _self._mapping[FIRST_ADDRESS] = _address;
            _self.contadorElementos++;
        } 
    }
    
    function getAllElementos(MapIterable storage _self) internal view returns(address[] memory) {
        address[] memory elementosArray = new address[](_self.contadorElementos);
        address currentAddress = _self._mapping[FIRST_ADDRESS];
        for(uint256 i = 0; currentAddress != FIRST_ADDRESS; i++) {
            elementosArray[i] = currentAddress;
            currentAddress = _self._mapping[currentAddress];
        }
        return elementosArray;
    }
   function getPrevElemento(MapIterable storage _self,address _address) internal view returns(address) {
        address currentAddress = FIRST_ADDRESS;
        while(_self._mapping[currentAddress] != FIRST_ADDRESS) {
            if(_self._mapping[currentAddress] == _address) {
                return currentAddress;
            }
            currentAddress = _self._mapping[currentAddress];
        }
        return FIRST_ADDRESS;
    }

    function removeElemento(MapIterable storage _self,address _address) internal {
        require(_address!=FIRST_ADDRESS,'Address reservada');
        require(isInList(_self,_address), 'El usuario no existe');
        address prevElemento = getPrevElemento(_self,_address);
        _self._mapping[prevElemento] = _self._mapping[_address];
        _self._mapping[_address] = address(0);
        _self.contadorElementos--;
    }

    function removeAllElementos(MapIterable storage _self) internal {
        address currentAddress =_self._mapping[FIRST_ADDRESS];
        address auxAddress;
        while(currentAddress != FIRST_ADDRESS) {
            auxAddress=_self._mapping[currentAddress];
            _self._mapping[currentAddress]=address(0);
            currentAddress=auxAddress;
        }
        inicia(_self);
    }



    }