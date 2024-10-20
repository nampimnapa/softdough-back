'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('salesmenutype', {
            smt_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            smt_name: {
                type: Sequelize.STRING,
                allowNull: false
            },
            un_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'unit',
                    key: 'un_id'
                }
            },
            qty_per_unit: {
                type: Sequelize.INTEGER
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
        await queryInterface.dropTable('salesmenutype');
    }
};
