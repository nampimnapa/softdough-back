'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orderstype', {
            odt_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            odt_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            odt_per:{
                type: Sequelize.FLOAT,
                allowNull: false
            },
            odt_price:{
                type: Sequelize.FLOAT,
                allowNull: false
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
        await queryInterface.dropTable('orderstype');
    }
};