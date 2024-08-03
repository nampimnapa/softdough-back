'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Ingredient_Used extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Ingredient_Used.init({
        // ind_name: DataTypes.STRING,
        // qtyminimum: DataTypes.INTEGER,
        // qty_per_unit: DataTypes.INTEGER,
        // ind_stock: DataTypes.INTEGER,
        status: DataTypes.STRING(1),
        note: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'Ingredient_Used',
    });
    return Ingredient_Used;
};
