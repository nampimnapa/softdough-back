'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('promotion', {
            pm_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            pm_name: {
                type: Sequelize.STRING
            },
            pm_datestart: {
                type: Sequelize.DATE
            },
            pm_dateend: {
                type: Sequelize.DATE
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
        await queryInterface.dropTable('promotion');
    }
};