'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ExpensesType extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    ExpensesType.init({
        ept_name: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'ExpensesType',
    });
    return ExpensesType;
};