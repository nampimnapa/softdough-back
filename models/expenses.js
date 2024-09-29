'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Expenses extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Expenses.init({
        ep_sum: DataTypes.FLOAT,
        ep_note: DataTypes.STRING,
        ep_status: DataTypes.STRING(1),
        ept_id: DataTypes.INTEGER,
        user_id: DataTypes.INTEGER,
        ep_date: DataTypes.DATE

    }, {
        sequelize,
        modelName: 'Expenses',
    });
    return Expenses;
};