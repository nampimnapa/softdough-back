'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class SalesMenu extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    SalesMenu.init({
        sm_name: DataTypes.STRING,
        smt_id: DataTypes.INTEGER,
        sm_price: DataTypes.FLOAT,
        status: DataTypes.STRING(1),
        fix: DataTypes.STRING(1),
        picture: DataTypes.TEXT
    }, {
        sequelize,
        modelName: 'SalesMenu',
    });
    return SalesMenu;
};
