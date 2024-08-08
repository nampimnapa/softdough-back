'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class Promotiondetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    Promotiondetail.init({
        pm_id: DataTypes.STRING,
        smbuy_id: DataTypes.STRING,
        smfree_id: DataTypes.STRING,

    }, {
        sequelize,
        modelName: 'Promotiondetail',
    });
    return Promotiondetail;
};