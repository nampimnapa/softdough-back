'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SalesMenudetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    SalesMenudetail.init({
        sm_id: DataTypes.INTEGER,
        pd_id: DataTypes.INTEGER,
        qty: DataTypes.INTEGER,
    }, {
        sequelize,
        modelName: 'SalesMenudetail',
    });
    return SalesMenudetail;
};
