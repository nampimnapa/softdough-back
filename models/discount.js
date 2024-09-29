'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Discount extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Discount.init({
        dc_name: DataTypes.STRING,
        dc_detail: DataTypes.STRING,
        dc_diccountprice: DataTypes.FLOAT,
        datestart: DataTypes.DATE,
        dateend: DataTypes.DATE,
        minimum: DataTypes.FLOAT

    }, {
        sequelize,
        modelName: 'Discount',
    });
    return Discount;
};