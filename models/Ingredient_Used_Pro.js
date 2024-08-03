'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Ingredient_Used_Pro extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Ingredient_Used_Pro.init({
        pdod_id: DataTypes.INTEGER,
        indlde_id: DataTypes.INTEGER,
        qty_used_sum: DataTypes.INTEGER,
        status: DataTypes.STRING(1),
        scrap: DataTypes.INTEGER,
        qtyusesum: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'Ingredient_Used_Pro',
    });
    return Ingredient_Used_Pro;
};
