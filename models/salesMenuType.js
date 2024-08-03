'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SalesMenuType extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    SalesMenuType.init({
        smt_name: DataTypes.STRING,
        un_id: DataTypes.INTEGER,
        qty_per_unit: DataTypes.INTEGER
    }, {
        sequelize,
        modelName: 'SalesMenuType',
    });
    return SalesMenuType;
};