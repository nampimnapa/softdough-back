'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Ingredient_Used_detail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Ingredient_Used_detail.init({
        indU_id: DataTypes.INTEGER,
        indlde_id: DataTypes.INTEGER,
        qty_used_sum: DataTypes.INTEGER,
        scrap: DataTypes.INTEGER,
        qtyusesum: DataTypes.INTEGER,

    }, {
        sequelize,
        modelName: 'Ingredient_Used_detail',
    });
    return Ingredient_Used_detail;
};
