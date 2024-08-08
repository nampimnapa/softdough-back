'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Order extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Order.init({
        od_date: DataTypes.DATE,
        od_qtytotal: DataTypes.INTEGER,
        od_sumdetail: DataTypes.FLOAT,
        od_discounttotal: DataTypes.FLOAT,
        od_net: DataTypes.FLOAT,
        od_paytype: DataTypes.STRING(1),
        od_pay: DataTypes.FLOAT,
        od_change: DataTypes.FLOAT,
        od_status: DataTypes.STRING(1),
        note: DataTypes.STRING,
        sh_id: DataTypes.INTEGER,
        odt_id: DataTypes.INTEGER,
        dc_id:DataTypes.INTEGER,
        user_id: DataTypes.INTEGER
       

    }, {
        sequelize,
        modelName: 'Order',
    });
    return Order;
};