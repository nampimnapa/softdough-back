'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('productionorderdetail', {
            pdod_id: {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            qty: {
                type: Sequelize.INTEGER
            },
            status: {
                type: Sequelize.STRING(1)
            },
            pdo_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'productionorder',
                    key: 'pdo_id'
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
            // ผลิตเสียเกิน
            broken:{
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            over:{
                type: Sequelize.INTEGER,
                allowNull: true,
            },
            pdod_stock:{
                type: Sequelize.INTEGER,
                allowNull: true,
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
        await queryInterface.dropTable('productionorderdetail');
    }
};