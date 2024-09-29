'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('discount', {
            dc_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            dc_name: {
                type: Sequelize.STRING
            },
            dc_detail: {
                type: Sequelize.STRING
            },
            dc_diccountprice: {
                type: Sequelize.FLOAT
            },
            datestart: {
                type: Sequelize.DATE
            },
            dateend: {
                type: Sequelize.DATE
            },
            minimum:{
                type: Sequelize.FLOAT
            },
            created_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            updated_at: {
                allowNull: false,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
                onUpdate: Sequelize.literal('CURRENT_TIMESTAMP')
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }      

        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('discount');
    }
};