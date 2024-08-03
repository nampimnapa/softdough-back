'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionOrder extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    ProductionOrder.init({
        cost_pricesum: DataTypes.FLOAT,
        pdo_status: DataTypes.STRING(1)
    }, {
        sequelize,
        modelName: 'ProductionOrder',
    });
    return ProductionOrder;
};
