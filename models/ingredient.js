'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Ingredient extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Ingredient.init({
        ind_name: DataTypes.STRING,
        qtyminimum: DataTypes.INTEGER,
        qty_per_unit: DataTypes.INTEGER,
        ind_stock: DataTypes.INTEGER,
        status: DataTypes.STRING(1),
        un_purchased: DataTypes.INTEGER,
        un_ind: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'Ingredient',
    });
    return Ingredient;
};
