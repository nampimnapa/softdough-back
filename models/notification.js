'use strict';
const { Model } = require('sequelize');
module.exports = (sequelize, DataTypes) => {
    class notification extends Model {
        static associate(models) {
            // No need to define association here
        }
        
    }
    notification.init({
        pd_id: DataTypes.INTEGER,
        ind_id: DataTypes.INTEGER,
        user_id: DataTypes.STRING,
        read_id: DataTypes.STRING,
        type: DataTypes.STRING(1)
    }, {
        sequelize,
        modelName: 'notification',
    });
    return notification;
};