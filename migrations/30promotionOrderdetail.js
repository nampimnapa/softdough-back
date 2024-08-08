'use strict';
module.exports = {
    async up(queryInterface, Sequelize) {
        await queryInterface.createTable('promotionOrderDetail', {
            pmod_id : {
                allowNull: false,
                autoIncrement: true,
                primaryKey: true,
                type: Sequelize.INTEGER
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
                    model: 'productionOrderdetail',
                    key: 'pdod_id'
                }
            }
            
                
        });
    },
    async down(queryInterface, Sequelize) {
        await queryInterface.dropTable('promotionOrderDetail');
    }
};