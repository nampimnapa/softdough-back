'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Recipedetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Recipedetail.init({
        ingredients_qty: DataTypes.FLOAT,
        rc_id: DataTypes.INTEGER,
        un_id: DataTypes.INTEGER,
        ind_id: DataTypes.INTEGER,

    }, {
        sequelize,
        modelName: 'Recipedetail',
    });
    return Recipedetail;
};
