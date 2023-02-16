
const fs = require("fs");
var address = '';
var privateKey = '';

const Web3 = require('web3');
const nodoUrl = 'HTTP://127.0.0.1:9545';
const web3 = new Web3(nodoUrl);
getPK_Firmante_Nodo();
web3.extend({
    property: 'clique',
    methods: [{
        name: 'getSigners',
        call: 'getSigners',
        params: 1
    ]
    });

