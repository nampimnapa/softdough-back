'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class IngredientLot extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    IngredientLot.init({
        // ind_name: DataTypes.STRING,
        // qtyminimum: DataTypes.INTEGER,
        // qty_per_unit: DataTypes.INTEGER,
        // ind_stock: DataTypes.INTEGER,
        status: DataTypes.STRING(1)
    }, {
        sequelize,
        modelName: 'IngredientLot',
    });
    return IngredientLot;
};
