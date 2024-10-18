'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class notification extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    notification.init({
        pdod_id: DataTypes.STRING,
        qty: DataTypes.INTEGER,
        status: DataTypes.STRING(1),
        note: DataTypes.STRING,
       
    }, {
        sequelize,
        modelName: 'damageproduct',
    });
    return damageproduct;
};