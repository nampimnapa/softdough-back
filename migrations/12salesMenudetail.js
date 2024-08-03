'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('salesMenudetail', {
            smde_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            sm_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesMenu',
                    key: 'sm_id'
                }
            },
            pd_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'products',
                    key: 'pd_id'
                }
            },
            qty: {
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
            },
            deleted_at: {
                allowNull: true,
                type: Sequelize.DATE,
                defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
            }  
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('salesMenudetail');
    }
};
