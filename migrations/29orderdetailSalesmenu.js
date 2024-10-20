'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('orderdetailsalesmenu', {
            odde_sm_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
            },
            smde_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'salesmenudetail',
                    key: 'smde_id'
                }
            },
            odde_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'orderdetail',
                    key: 'odde_id'
                }
            },
            pdod_id: {
                type: Sequelize.INTEGER,
                allowNull: false,
                references: {
                    model: 'productionorderdetail',
                    key: 'pdod_id'
                }
            },
            qty: {
                type: Sequelize.INTEGER
            },
            
                
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('orderdetailsalesmenu');
    }
};