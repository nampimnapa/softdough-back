'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Circulating_money extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Circulating_money.init({
        change: DataTypes.FLOAT,
        deposit: DataTypes.FLOAT,
        scrap: DataTypes.FLOAT,
        note: DataTypes.STRING,
        status: DataTypes.STRING(1),
        user_id: DataTypes.INTEGER,

    }, {
        sequelize,
        modelName: 'Circulating_money',
    });
    return Circulating_money;
};