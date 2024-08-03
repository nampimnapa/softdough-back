'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Unit extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Unit.init({
        un_name: DataTypes.STRING,
        type: DataTypes.STRING(1)
    }, {
        sequelize,
        modelName: 'Unit',
    });
    return Unit;
};