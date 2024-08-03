// unit.js
'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('unit', {
            un_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            un_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            type:{
                type: Sequelize.STRING(1)
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('unit');
    }
};
