'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class Staff extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  Staff.init({
    ind_name: DataTypes.STRING,
    st_password: DataTypes.STRING,
    st_name: DataTypes.STRING,
    st_tel:DataTypes.STRING(10),
    st_start:DataTypes.DATE,
    st_end:DataTypes.DATE,
    st_type:DataTypes.STRING(1),
    st_status:DataTypes.STRING(1)
  }, {
    sequelize,
    modelName: 'Staff',
  });
  return Staff;
};