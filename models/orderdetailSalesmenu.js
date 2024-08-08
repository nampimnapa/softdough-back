'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class OrderdetailSalesMenu extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    OrderdetailSalesMenu.init({
        smde_id: DataTypes.INTEGER,
        odde_id: DataTypes.INTEGER,
        pdod_id: DataTypes.INTEGER,
        
        

    }, {
        sequelize,
        modelName: 'OrderdetailSalesMenu',
    });
    return OrderdetailSalesMenu;
};