'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Orderdetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Orderdetail.init({
        odde_qty: DataTypes.INTEGER,
        odde_sum: DataTypes.FLOAT,
        sm_id: DataTypes.INTEGER,
        od_id: DataTypes.INTEGER,
        

    }, {
        sequelize,
        modelName: 'Orderdetail',
    });
    return Orderdetail;
};