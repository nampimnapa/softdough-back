'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Recipe extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Recipe.init({
        qtylifetime: DataTypes.INTEGER,
        produced_qty: DataTypes.INTEGER,
        un_id: DataTypes.INTEGER,
        pd_id: DataTypes.INTEGER,

    }, {
        sequelize,
        modelName: 'Recipe',
    });
    return Recipe;
};
