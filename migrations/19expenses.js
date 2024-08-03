'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('expenses', {
            ep_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            ep_sum: {
                type: Sequelize.FLOAT
            },
            ep_note: {
                type: Sequelize.STRING
            },
            ep_status: {
                type: Sequelize.STRING(1)
            },
            ept_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'expensesType',
                    key: 'ept_id'
                }
            },
            user_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'staff',
                    key: 'st_id'
                }
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
        await queryInterface.dropTable('expenses');
    }
};
