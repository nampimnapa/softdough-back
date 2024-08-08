'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OrdersTypedetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    OrdersTypedetail.init({
        sm_id: DataTypes.INTEGER,
        odt_id: DataTypes.INTEGER,
        odtd_price: DataTypes.FLOAT,

    }, {
        sequelize,
        modelName: 'OrdersTypedetail',
    });
    return OrdersTypedetail;
};