'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OrdersType extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    OrdersType.init({
        odt_name: DataTypes.STRING,
        odt_per: DataTypes.FLOAT,
        odt_price: DataTypes.FLOAT,

    }, {
        sequelize,
        modelName: 'OrdersType',
    });
    return OrdersType;
};