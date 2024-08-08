'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('ordersTypedetail', {
            odto_id : {
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
            odt_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'ordersType',
                    key: 'odt_id'
                }
            },
            odtd_price:{
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
        await queryInterface.dropTable('ordersTypedetail');
    }
};