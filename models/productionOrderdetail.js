'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductionOrderdetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    ProductionOrderdetail.init({
        qty: DataTypes.INTEGER,
        status: DataTypes.STRING(1),
        pdo_id: DataTypes.INTEGER,
        pd_id: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'ProductionOrderdetail',
    });
    return ProductionOrderdetail;
};
