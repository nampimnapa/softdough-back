'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Promotion extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Promotion.init({
        pm_name: DataTypes.STRING,
        pm_datestart: DataTypes.DATE,
        pm_dateend: DataTypes.DATE,

    }, {
        sequelize,
        modelName: 'Promotion',
    });
    return Promotion;
};