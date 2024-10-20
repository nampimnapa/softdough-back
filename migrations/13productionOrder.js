'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('productionorder', {
            pdo_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            cost_pricesum: {
                type: Sequelize.FLOAT
            },
            pdo_status: {
                type: Sequelize.STRING(1)
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
            }
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('productionorder');
    }
};
