'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('salesMenu', {
            sm_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sm_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            smt_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesMenuType',
                    key: 'smt_id'
                }
            },
            sm_price: {
                type: Sequelize.FLOAT
            },
            status: {
                type: Sequelize.STRING(1)
            },
            fix: {
                type: Sequelize.STRING(1)
            },
            picture: {
                type: Sequelize.TEXT
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
        await queryInterface.dropTable('salesMenu');
    }
};
