'use strict';
/** @type {import('sequelize-cli').Migration} */
//ไม่อัปเดตตอนตารางเปลี่ยนแปลง
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('staff', {
        st_id : {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      st_username: {
        type: Sequelize.STRING
      },
      st_password: {
        type: Sequelize.STRING
      },
      st_name: {
        type: Sequelize.STRING
      },
      st_tel: {
        type: Sequelize.STRING(10)
      },
      st_start:{
        type: Sequelize.DATE
      },
      st_end:{
        type: Sequelize.DATE
      },
      st_type:{
        type: Sequelize.STRING(1)
      },
      st_status:{
        type: Sequelize.STRING(1)
      },
    //   createdAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
    //   },
    //   updatedAt: {
    //     allowNull: false,
    //     type: Sequelize.DATE,
    //     defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
    //     onUpdate : Sequelize.literal('CURRENT_TIMESTAMP')
    //   }
      
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('staff');
  }
};