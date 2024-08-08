'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Shop extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Shop.init({
        sh_name: DataTypes.STRING,
        sh_address: DataTypes.STRING,
        sh_tel: DataTypes.STRING(10),
        sh_province: DataTypes.STRING,
        sh_district: DataTypes.STRING,
        sh_ampher: DataTypes.STRING,
        sh_zipcode: DataTypes.STRING(5),


    }, {
        sequelize,
        modelName: 'Shop',
    });
    return Shop;
};