'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class PromotionOrderDetail extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    PromotionOrderDetail.init({
        odde_id: DataTypes.INTEGER,
        pdod_id: DataTypes.INTEGER,
        
        

    }, {
        sequelize,
        modelName: 'PromotionOrderDetail',
    });
    return PromotionOrderDetail;
};