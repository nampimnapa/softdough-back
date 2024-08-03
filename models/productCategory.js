'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class ProductCategory extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    ProductCategory.init({
        pdc_name: DataTypes.STRING,
    }, {
        sequelize,
        modelName: 'ProductCategory',
    });
    return ProductCategory;
};