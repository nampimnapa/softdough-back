'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Products extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Products.init({
        pd_name: DataTypes.STRING,
        qtyminimum: DataTypes.INTEGER,
        picture: DataTypes.TEXT,
        pdc_id: DataTypes.INTEGER,
        rc_id: DataTypes.INTEGER,
        status: DataTypes.STRING(1)
    }, {
        sequelize,
        modelName: 'Products',
    });
    return Products;
};
